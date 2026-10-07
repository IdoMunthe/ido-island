// A small clay owl that is only there at night. As the lamps come on
// (DAY.lightsOn) it appears far off, high and to one side of the view —
// worked out from wherever the camera is at that moment — crosses the sky
// as a silhouette, banks round, dips below the washing-line post and
// swoops up onto it: a flare, legs reaching, a brief hover, the drop, then
// the wings fold in stages. At dawn it hops off and climbs away the other
// way round. The flight maths is in flight.js (shared with
// scripts/flightplot.mjs, which draws it). Once per nightfall.
// Perched, it blinks now and then, turns its head sharply and holds, and
// settles. On the "off" tier it just appears and disappears on the perch.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE, LANDMARKS, OWL } from "../island.config.js";
import { useDay } from "../sky/DayNight.jsx";
import { makeFlight, wingPose, bodyResponse, foldAt } from "./flight.js";

const BODY = "#8c6543"; // PALETTE.woodDark: a barn-owl brown
const DARK = "#6f4f34";
const BELLY = PALETTE.cream;
const FACE = "#f8f4ea";
const EYE = "#18201d";
const GLINT = "#ffd27a";
const F = OWL.flight;

function perchWorld() {
  const lm = LANDMARKS.find((l) => l.id === OWL.perch.landmark);
  const [lx, ly, lz] = OWL.perch.local;
  if (!lm) return new THREE.Vector3(lx, ly, lz);
  const c = Math.cos(lm.rotation || 0);
  const s = Math.sin(lm.rotation || 0);
  return new THREE.Vector3(lm.at[0] + lx * c + lz * s, lm.at[1] + ly, lm.at[2] - lx * s + lz * c);
}

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = THREE.MathUtils.lerp;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function Owl({ tier }) {
  const day = useDay();
  const root = useRef();
  const head = useRef();
  const body = useRef();
  const legs = useRef();
  const tail = useRef();
  const wings = useRef({}); // shoulderL/R, wristL/R, outerL/R
  const lids = useRef([]);
  const eyes = useRef([]);
  const perch = useMemo(perchWorld, []);
  const st = useRef({
    phase: "away", // away | in | landing | perched | out
    t: 0,
    flight: null,
    sample: { pos: new THREE.Vector3() },
    since: 0, // seconds since touchdown
    nextBlink: rand(...OWL.blink),
    blink: 0,
    nextTurn: rand(...OWL.turn),
    turnTarget: 0,
    turn: 0,
    spread: 0,
    roll: 0,
    pitch: 0,
    yaw: OWL.face,
    legPose: 0, // -1 reaching … 0 perched … 1 tucked
    squash: 0,
  });
  const shadows = tier === "full";
  const set = (key) => (el) => {
    if (el) wings.current[key] = el;
  };

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt || 0.016, 1 / 30);
    const t = state.clock.elapsedTime;
    const s = st.current;
    const on = day?.current.lights ?? 0;
    const g = root.current;
    if (!g) return;
    const instant = tier === "off";

    // ---- phase changes, once per nightfall / dawn
    if (s.phase === "away" && on > 0.02) {
      if (instant) s.phase = "perched";
      else {
        s.flight = makeFlight({ camPos: state.camera.position, perch, mode: "in" });
        s.t = 0;
        s.phase = "in";
      }
    } else if (s.phase === "perched" && on < 0.01) {
      if (instant) s.phase = "away";
      else {
        s.flight = makeFlight({ camPos: state.camera.position, perch, mode: "out" });
        s.t = 0;
        s.phase = "out";
      }
    }
    if (s.phase === "away") {
      if (g.visible) g.visible = false;
      return;
    }
    if (!g.visible) g.visible = true;
    for (const e of eyes.current) e.material.emissiveIntensity = 0.35 * Math.max(on, 0.3);

    // ---- where it is and how it flies
    let spreadTarget = 0;
    let wing = null;
    let bodyBob = 0;
    let bodyPitch = 0;
    let rollTarget = 0;
    let pitchTarget = 0;
    let yawTarget = s.yaw;
    let legTarget = 0;
    let lookAtPerch = false;

    if (s.phase === "in" || s.phase === "out") {
      s.t += dt;
      const smp = s.flight.sample(s.t, s.sample);
      if (s.phase === "out" && s.t < F.takeoffSeconds) {
        // the hop off the perch: from the post up onto the path
        const k = THREE.MathUtils.smoothstep(s.t, 0, F.takeoffSeconds);
        g.position.lerpVectors(perch, smp.pos, k);
        s.squash = Math.sin(k * Math.PI) * 0.5;
      } else g.position.copy(smp.pos);
      yawTarget = smp.yaw;
      rollTarget = smp.roll;
      pitchTarget = smp.pitch;
      spreadTarget = 1;
      wing = wingPose(smp.phase, smp.flapAmp, smp.flare);
      const br = bodyResponse(smp.phase, smp.flapAmp);
      bodyBob = br.bob;
      bodyPitch = br.pitch;
      legTarget = smp.flare > 0 ? -smp.flare : 1; // reaching forward in the flare, else tucked
      lookAtPerch = s.phase === "in";
      if (smp.s >= 1) {
        if (s.phase === "in") {
          s.phase = "landing";
          s.t = 0;
        } else {
          s.phase = "away";
          g.visible = false;
          return;
        }
      }
    } else if (s.phase === "landing") {
      // the drop from the hover onto the post
      s.t += dt;
      const k = THREE.MathUtils.smoothstep(s.t, 0, F.dropSeconds);
      g.position.copy(perch).add(new THREE.Vector3(0, F.hoverHeight * (1 - k), 0));
      yawTarget = OWL.face;
      pitchTarget = -F.flarePitch * (1 - k);
      spreadTarget = 1;
      wing = wingPose(Math.PI * 0.5, 0.2, 1 - k * 0.5);
      legTarget = -1 + k;
      if (k >= 1) {
        s.phase = "perched";
        s.since = 0;
        s.squash = 1;
      }
    } else {
      // perched: the staged fold, a settle, a tail flick
      s.since += dt;
      g.position.copy(perch);
      yawTarget = OWL.face;
      spreadTarget = foldAt(s.since);
      wing = wingPose(0, 0, 0);
      s.squash = Math.max(0, s.squash - dt * 1.6);
      if (tail.current) tail.current.rotation.x = 0.9 + (s.since > 0.9 && s.since < 1.4 ? Math.sin(((s.since - 0.9) / 0.5) * Math.PI) * 0.5 : 0);
    }

    // ---- ease everything so nothing snaps
    s.yaw += wrap(yawTarget - s.yaw) * Math.min(1, dt * (s.phase === "perched" ? 4 : 9));
    s.roll += (rollTarget - s.roll) * Math.min(1, dt * 5);
    s.pitch += (pitchTarget - s.pitch) * Math.min(1, dt * 6);
    s.spread += (spreadTarget - s.spread) * Math.min(1, dt * (s.phase === "perched" ? 8 : 5));
    s.legPose += (legTarget - s.legPose) * Math.min(1, dt * 5);
    g.rotation.set(s.pitch + bodyPitch, s.yaw, s.roll);

    // wings: two segments, a wrist, folding along the body when perched
    const sp = s.spread;
    const w = wing || wingPose(0, 0, 0);
    for (const sgn of [-1, 1]) {
      const sh = wings.current[sgn < 0 ? "shoulderL" : "shoulderR"];
      const wr = wings.current[sgn < 0 ? "wristL" : "wristR"];
      const ou = wings.current[sgn < 0 ? "outerL" : "outerR"];
      if (!sh || !wr || !ou) continue;
      sh.rotation.z = lerp(-sgn * 1.35, sgn * w.elevation, sp);
      sh.rotation.y = lerp(sgn * 0.3, -sgn * w.sweep, sp);
      sh.rotation.x = lerp(0.1, 0, sp);
      wr.rotation.z = lerp(-sgn * 1.25, -sgn * w.fold * 1.1 + sgn * w.tipLag, sp);
      wr.rotation.y = lerp(sgn * 0.7, sgn * w.fold * 0.9, sp);
      ou.rotation.x = sp * sgn * w.twist;
    }
    // legs: tucked back in flight, reaching forward and down to land, straight on the post
    if (legs.current) legs.current.rotation.x = s.legPose > 0 ? 1.25 * s.legPose : -0.75 * -s.legPose;
    // the body answers the wings; landing squash
    if (body.current) {
      const sq = Math.sin(Math.min(1, s.squash) * Math.PI) * 0.12;
      body.current.position.y = 0.02 + bodyBob;
      body.current.scale.set(1 + sq * 0.6 + Math.sin(t * 0.7) * 0.012, 1 - sq - Math.sin(t * 0.7) * 0.02, 1 + sq * 0.6);
    }

    // ---- the head: held level against the body's pitch and roll, and
    // locked onto the perch on the way in; perched, its own life
    const perched = s.phase === "perched";
    s.nextBlink -= dt;
    if (s.nextBlink <= 0) {
      s.blink = 0.22;
      s.nextBlink = rand(...OWL.blink);
    }
    let lid = 0;
    if (s.blink > 0) {
      s.blink -= dt;
      const p = 1 - s.blink / 0.22;
      lid = p < 0.35 ? p / 0.35 : p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    }
    for (const l of lids.current) l.scale.y = Math.max(0.001, lid);
    if (perched) {
      s.nextTurn -= dt;
      if (s.nextTurn <= 0) {
        s.turnTarget = rand(-OWL.turnRange, OWL.turnRange) * (Math.random() < 0.3 ? 0.2 : 1);
        s.nextTurn = rand(...OWL.turn);
      }
    } else if (lookAtPerch) {
      const toPerch = Math.atan2(perch.x - g.position.x, perch.z - g.position.z);
      s.turnTarget = THREE.MathUtils.clamp(wrap(toPerch - s.yaw), -1.1, 1.1);
    } else s.turnTarget = 0;
    s.turn += (s.turnTarget - s.turn) * Math.min(1, dt * (perched ? 16 : 6));
    if (head.current) {
      const stab = perched ? 0 : 0.9;
      head.current.rotation.y = s.turn;
      head.current.rotation.x = -(s.pitch + bodyPitch) * stab + (perched ? Math.sin(t * 0.21) * 0.03 : 0);
      head.current.rotation.z = -s.roll * stab + (perched ? Math.sin(t * 0.3) * 0.04 + s.turn * 0.08 : 0);
    }
  });

  const mat = (color, extra = {}) => <meshStandardMaterial color={color} roughness={0.95} {...extra} />;

  return (
    <group ref={root} position={perch} rotation={[0, OWL.face, 0]} scale={OWL.scale} visible={false}>
      {/* legs and feet: pivot at the hip; toes grip the post cap when perched */}
      <group ref={legs} position={[0, 0.08, 0.01]}>
        {[-0.06, 0.06].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, -0.04, 0]} castShadow={shadows}>
              <capsuleGeometry args={[0.016, 0.05, 3, 6]} />
              {mat(PALETTE.terracotta)}
            </mesh>
            {[-0.3, 0, 0.3].map((a, k) => (
              <mesh key={k} position={[Math.sin(a) * 0.03, -0.07, Math.cos(a) * 0.035]} rotation={[Math.PI / 2 - 0.3, a, 0]} castShadow={shadows}>
                <capsuleGeometry args={[0.012, 0.05, 3, 6]} />
                {mat(PALETTE.terracotta)}
              </mesh>
            ))}
          </group>
        ))}
      </group>
      <group ref={body} position={[0, 0.02, 0]}>
        {/* body: an egg, leaning back a little */}
        <mesh position={[0, 0.2, 0]} rotation={[-0.15, 0, 0]} castShadow={shadows}>
          <sphereGeometry args={[0.17, 16, 14]} />
          {mat(BODY)}
        </mesh>
        <mesh position={[0, 0.17, 0.09]} rotation={[-0.15, 0, 0]} scale={[0.75, 1, 0.55]}>
          <sphereGeometry args={[0.15, 14, 12]} />
          {mat(BELLY)}
        </mesh>
        {/* wings: shoulder → inner segment → wrist → outer segment; each side
            extends along its own ±x */}
        {[-1, 1].map((sgn) => (
          <group key={sgn} ref={set(sgn < 0 ? "shoulderL" : "shoulderR")} position={[sgn * 0.13, 0.27, -0.02]}>
            <mesh position={[sgn * 0.1, 0, 0]} scale={[0.11, 0.045, 0.085]} castShadow={shadows}>
              <sphereGeometry args={[1, 12, 10]} />
              {mat(DARK)}
            </mesh>
            <group ref={set(sgn < 0 ? "wristL" : "wristR")} position={[sgn * 0.2, 0, 0]}>
              <mesh ref={set(sgn < 0 ? "outerL" : "outerR")} position={[sgn * 0.13, 0, -0.01]} scale={[0.14, 0.03, 0.07]} castShadow={shadows}>
                <sphereGeometry args={[1, 12, 10]} />
                {mat(DARK)}
              </mesh>
            </group>
          </group>
        ))}
        {/* tail */}
        <mesh ref={tail} position={[0, 0.06, -0.12]} rotation={[0.9, 0, 0]} scale={[0.6, 1, 0.3]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          {mat(DARK)}
        </mesh>
        {/* head */}
        <group ref={head} position={[0, 0.4, 0]}>
          <mesh castShadow={shadows}>
            <sphereGeometry args={[0.15, 16, 14]} />
            {mat(BODY)}
          </mesh>
          {/* facial disc: two overlapping pale dishes */}
          {[-1, 1].map((sgn) => (
            <mesh key={sgn} position={[sgn * 0.055, -0.01, 0.1]} rotation={[0, sgn * 0.35, 0]} scale={[1, 1.15, 0.45]}>
              <sphereGeometry args={[0.085, 14, 12]} />
              {mat(FACE)}
            </mesh>
          ))}
          {/* eyes, a lid over each, and a glint */}
          {[-1, 1].map((sgn, i) => (
            <group key={sgn} position={[sgn * 0.055, 0.005, 0.135]}>
              <mesh ref={(m) => m && (eyes.current[i] = m)}>
                <sphereGeometry args={[0.038, 12, 10]} />
                <meshStandardMaterial color={EYE} emissive={GLINT} emissiveIntensity={0} roughness={0.3} />
              </mesh>
              <mesh position={[sgn * 0.012, 0.014, 0.03]}>
                <sphereGeometry args={[0.009, 6, 5]} />
                {mat("#ffffff", { roughness: 0.2 })}
              </mesh>
              <mesh ref={(m) => m && (lids.current[i] = m)} position={[0, 0.002, 0.004]} scale={[1, 0.001, 1]}>
                <sphereGeometry args={[0.042, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                {mat(BODY)}
              </mesh>
            </group>
          ))}
          {/* beak */}
          <mesh position={[0, -0.04, 0.15]} rotation={[Math.PI / 2 + 0.3, 0, 0]}>
            <coneGeometry args={[0.016, 0.05, 6]} />
            {mat(PALETTE.terracotta)}
          </mesh>
          {/* ear tufts */}
          {[-1, 1].map((sgn) => (
            <mesh key={sgn} position={[sgn * 0.085, 0.13, -0.01]} rotation={[0.1, 0, sgn * -0.45]} castShadow={shadows}>
              <coneGeometry args={[0.03, 0.09, 7]} />
              {mat(DARK)}
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
