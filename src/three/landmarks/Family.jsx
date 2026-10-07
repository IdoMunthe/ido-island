// Family: five clay figures in the middle of the island, labelled by role
// only. The mother and sister have long hair; everyone wears trousers. By
// day they stand together by the picnic blanket. As the lamps come on,
// one of them gets up and walks over to the fire, the others follow over
// a couple of seconds at their own pace; each turns to face the flames
// and sits down — knees bending, hips lowering, a little settle at the
// bottom, hands to the knees. At dawn they push up, straighten, turn and
// walk back. The walk is the same one the user's figure uses (gait.js).
// The move starts when the lamps' curve crosses FIRE.move.threshold (with
// hysteresis) and always runs to the end before it can turn round, so a
// wobbling light never leaves anyone half-way. Their small life — a sway,
// a glance — carries on standing or seated, and when the user's figure
// comes over they turn toward it and one at a time gesture back.
// Card: family.
import { useContext, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Landmark } from "./Landmark.jsx";
import { FigureRig, FIGURE } from "../life/Figure.jsx";
import { Campfire } from "../life/Campfire.jsx";
import { walkPose, advancePhase, sitAngle, angleTowards, damp } from "../life/gait.js";
import { familyLayout } from "./familyLayout.js";
import { PALETTE, FIRE } from "../island.config.js";
import { IslandContext } from "../islandContext.js";
import { useDay } from "../sky/DayNight.jsx";
import { content } from "../../content.js";

const MOVE = FIRE.move;
const ease = (p) => p * p * (3 - 2 * p);

export function Family({ config }) {
  const { selected, tier } = useContext(IslandContext);
  const day = useDay();
  const members = useMemo(() => (content.family?.members || []).slice(0, 8), []);
  const layout = useMemo(() => familyLayout(members), [members]);
  const rigs = useRef(members.map(() => ({})));
  const group = useRef({ arrangement: "day", target: "day", night: false });
  const people = useRef(
    layout.map((L) => ({
      state: "stand", // stand | walk | turn | sit | seated | rise
      x: L.x,
      z: L.z,
      facing: L.turn,
      phase: 0,
      t: 0, // seconds into the current state
      due: 0, // seconds still to wait before setting off
      sitP: 0, // 0 standing … 1 seated
      goal: "day",
      walkPose: {},
    }))
  );

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt || 0.016, 1 / 30);
    const t = state.clock.elapsedTime;
    const talking = selected === "family";
    const lights = day?.current.lights ?? 0;
    const G = group.current;
    const P = people.current;

    // ---- which arrangement the light wants, with hysteresis; a move only
    // starts when nobody is mid-move, and then runs to completion
    if (!G.night && lights > MOVE.threshold + MOVE.hysteresis) G.night = true;
    else if (G.night && lights < MOVE.threshold - MOVE.hysteresis) G.night = false;
    const wanted = G.night ? "night" : "day";
    const busy = P.some((p) => p.goal !== G.arrangement || (p.state !== "stand" && p.state !== "seated"));
    if (!busy && wanted !== G.arrangement) {
      G.arrangement = wanted;
      P.forEach((p, i) => {
        p.goal = wanted;
        p.due = layout[i].delay;
      });
    }

    P.forEach((p, i) => {
      const r = rigs.current[i];
      const L = layout[i];
      if (!r.body || !r.kneeL) return;
      const legs = L.h * FIGURE.legs;
      const thigh = legs * FIGURE.thigh;
      const shin = legs - thigh;
      const knee = sitAngle(FIRE.seatHeight, thigh, shin);
      const dest = p.goal === "night" ? L.seat : L;
      const restFacing = p.goal === "night" ? L.seat.turn : talking ? L.turn * 0.3 : L.turn;

      // ---- the per-person state machine
      const atRest = p.goal === "night" ? p.state === "seated" : p.state === "stand";
      if (!atRest && (p.state === "stand" || p.state === "seated")) {
        // a move has been ordered: wait our turn, then get going
        p.due -= dt;
        if (p.due <= 0) {
          p.t = 0;
          p.state = p.state === "seated" ? "rise" : "walk";
        }
      }
      let legL = 0, legR = 0, kneeL = 0, kneeR = 0, armL = 0, armR = 0, bodyY = 0, bodyRx = 0, bodyRz = 0, rootY = 0;
      let wobble = 0;
      if (p.state === "rise") {
        // push up: lean forward, then hips come up and the knees straighten
        p.t += dt;
        const k = Math.min(1, p.t / L.riseSeconds);
        p.sitP = 1 - ease(k);
        bodyRx = 0.35 * Math.sin(k * Math.PI);
        if (k >= 1) {
          p.state = "walk";
          p.t = 0;
        }
      } else if (p.state === "walk") {
        const dx = dest.x - p.x;
        const dz = dest.z - p.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.03) {
          p.x = dest.x;
          p.z = dest.z;
          p.state = "turn";
          p.t = 0;
        } else {
          const step = Math.min(d, L.speed * dt);
          p.x += (dx / d) * step;
          p.z += (dz / d) * step;
          p.facing = angleTowards(p.facing, Math.atan2(dx, dz), 1 - Math.exp(-dt * MOVE.turnRate));
          p.phase = advancePhase(p.phase, step);
          const w = walkPose(p.phase, p.walkPose);
          legL = w.legL;
          legR = w.legR;
          kneeL = w.kneeL;
          kneeR = w.kneeR;
          armL = w.armL;
          armR = w.armR;
          bodyY = w.bodyY;
          bodyRx = w.bodyRx;
        }
      } else if (p.state === "turn") {
        // arrived: turn to face the fire (or back to the group), then sit or stand
        p.t += dt;
        p.facing = angleTowards(p.facing, restFacing, 1 - Math.exp(-dt * MOVE.turnRate));
        const left = Math.abs(Math.atan2(Math.sin(restFacing - p.facing), Math.cos(restFacing - p.facing)));
        if (left < 0.08 || p.t > 1.2) {
          p.facing = restFacing;
          p.state = p.goal === "night" ? "sit" : "stand";
          p.t = 0;
        }
      } else if (p.state === "sit") {
        // sit down: hips lower as the knees bend, a small overshoot and a
        // weight shift at the bottom, hands to the knees
        p.t += dt;
        const k = Math.min(1, p.t / L.sitSeconds);
        const settle = k > 0.75 ? Math.sin(((k - 0.75) / 0.25) * Math.PI) * (L.kid ? 0.1 : 0.05) : 0;
        p.sitP = ease(k) + settle;
        wobble = settle * 0.5;
        bodyRx = 0.25 * Math.sin(k * Math.PI);
        if (k >= 1) {
          p.state = "seated";
          p.sitP = 1;
        }
      } else if (p.state === "seated") {
        p.sitP = 1;
        p.facing = angleTowards(p.facing, restFacing, 1 - Math.exp(-dt * 3));
      } else {
        // standing
        p.sitP = 0;
        p.facing = angleTowards(p.facing, restFacing, 1 - Math.exp(-dt * 3));
      }

      // ---- pose from the state
      const sp = p.sitP;
      rootY = (FIRE.seatHeight - legs) * sp;
      if (p.state !== "walk") {
        legL += -knee * sp;
        legR += -knee * sp;
        kneeL += knee * sp;
        kneeR += knee * sp;
        armL += -0.75 * sp + Math.sin(t * 1.1 + i * 0.7) * 0.05;
        armR += -0.75 * sp + Math.sin(t * 1.3 + i) * 0.08;
        bodyRx += 0.08 * sp;
        // a wave back at the user's figure, one person at a time
        if (talking && i === Math.floor(t / 4) % P.length) {
          armR = -1.1 + Math.sin(t * 6) * 0.35;
          r.head.rotation.x = Math.sin(t * 3) * 0.08 + 0.12 * sp;
        } else r.head.rotation.x = 0.12 * sp;
      } else r.head.rotation.x = 0.05;
      bodyRz += Math.sin(t * 0.7 + i * 1.9) * 0.02 + wobble * Math.sin(t * 9);

      const k = 1 - Math.exp(-dt * 12);
      r.root.position.set(p.x, damp(r.root.position.y, rootY, k), p.z);
      r.root.rotation.y = p.facing;
      r.body.position.y = damp(r.body.position.y, legs + bodyY, k);
      r.body.rotation.x = damp(r.body.rotation.x, bodyRx, k);
      r.body.rotation.z = damp(r.body.rotation.z, bodyRz, k);
      r.head.rotation.y = Math.sin(t * 0.45 + i * 2.3) * 0.25;
      r.armL.rotation.x = damp(r.armL.rotation.x, armL, k);
      r.armR.rotation.x = damp(r.armR.rotation.x, armR, k);
      r.legL.rotation.x = damp(r.legL.rotation.x, legL, k);
      r.legR.rotation.x = damp(r.legR.rotation.x, legR, k);
      r.kneeL.rotation.x = damp(r.kneeL.rotation.x, kneeL, k);
      r.kneeR.rotation.x = damp(r.kneeR.rotation.x, kneeR, k);
    });
  });

  return (
    <Landmark config={config} labelHeight={1.9} ringRadius={1.5}>
      {members.map((m, i) => (
        <FigureRig
          key={i}
          rig={{ current: rigs.current[i] }}
          height={layout[i].h}
          hairStyle={layout[i].woman ? "long" : "short"}
          shirt={PALETTE.clothes[i % PALETTE.clothes.length]}
          trousers={layout[i].woman ? PALETTE.clothes[(i + 2) % PALETTE.clothes.length] : i % 2 ? PALETTE.trousers : PALETTE.sage}
          position={[layout[i].x, 0, layout[i].z]}
          rotation={[0, layout[i].turn, 0]}
        />
      ))}
      {/* a picnic blanket in front of them */}
      <mesh position={[0, 0.02, 1.25]} rotation={[-Math.PI / 2, 0, 0.15]} receiveShadow>
        <planeGeometry args={[1.1, 0.8]} />
        <meshStandardMaterial color={PALETTE.flower[0]} roughness={1} />
      </mesh>
      <mesh position={[0.38, 0.07, 1.32]} castShadow>
        <cylinderGeometry args={[0.1, 0.09, 0.1, 12]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.8} />
      </mesh>
      {/* the campfire, only there at night */}
      <Campfire tier={tier} position={FIRE.local} />
    </Landmark>
  );
}
