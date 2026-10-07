// The user's figure. Walks along the sand path to whichever place is
// selected and does something there; idles otherwise. Routes are chosen
// on a small graph (path vertices + start + destination) where every edge
// is checked against the footprints in the config with the figure's own
// radius, so it walks around things instead of through them.
// Everything here is decoration — the content is complete without it.
import { useContext, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FigureRig, FIGURE } from "./Figure.jsx";
import { IslandContext } from "../islandContext.js";
import { ISLAND, LANDMARKS, AVATAR, OBSTACLES, LAMPS, FIRE } from "../island.config.js";
import { content } from "../../content.js";
import { useDay } from "../sky/DayNight.jsx";
import { walkPose, advancePhase, sitAngle, angleTowards, damp } from "./gait.js";
import { buildRoute, routeLength, pointAt } from "./routing.js";
import { intro, introStarted, introFinished } from "../intro.js";
import { INTRO } from "../island.config.js";

export function Avatar() {
  const { selected, bus } = useContext(IslandContext);
  const day = useDay();
  const rig = useRef({});
  const a = content.avatar || {};
  const st = useRef({
    pos: new THREE.Vector2(AVATAR.home.at[0], AVATAR.home.at[1]),
    facing: AVATAR.home.face,
    mode: "idle",
    route: null,
    len: 0,
    prog: 0,
    dur: 1,
    action: "idle",
    face: AVATAR.home.face,
    standY: 0,
    fromY: 0, // deck height at the start of the current walk
    stepDownAt: 0, // distance along the route where it steps down off it
    seat: null,
    via: [], // the way in to where it is now (walked back out in reverse)
    owner: null, // which place the figure is currently at (for routing)
    variant: "day", // which of a place's stands it went to (stand / standNight)
    stepAt: 0,
    phase: 0,
    since: 0,
  });
  const tmp = useMemo(() => ({ p: new THREE.Vector2(), d: new THREE.Vector2(), walk: {} }), []);
  // What other objects may read each frame (the workshop door watches it).
  const report = useMemo(() => ({ x: AVATAR.home.at[0], z: AVATAR.home.at[1], walking: false }), []);
  useEffect(() => {
    if (!bus) return;
    bus.avatar = report;
    return () => {
      if (bus.avatar === report) delete bus.avatar;
    };
  }, [bus, report]);

  const walkTo = (stand, owner, variant = "day", seconds = null) => {
    const s = st.current;
    s.variant = variant;
    const to = new THREE.Vector2(stand.at[0], stand.at[1]);
    // back out the way it came in, then along the path, then in via the
    // new place's own way in
    const outVia = [...s.via].reverse().map(([x, z]) => new THREE.Vector2(x, z));
    const inVia = (stand.via || []).map(([x, z]) => new THREE.Vector2(x, z));
    const start = outVia.length ? outVia[outVia.length - 1] : s.pos;
    const goal = inVia.length ? inVia[0] : to;
    const mid = buildRoute(start, goal, s.owner, owner);
    const route = [s.pos.clone(), ...outVia, ...mid, ...inVia.slice(1), to];
    s.route = [route[0]];
    for (let k = 1; k < route.length; k++) if (route[k].distanceTo(s.route[s.route.length - 1]) > 0.05) s.route.push(route[k].clone());
    s.len = routeLength(s.route);
    // where the floor changes height: at the first via point if there is one
    // (the foot of the jetty), otherwise just before the end
    s.stepAt = Math.max(0, s.len - 0.4);
    if (inVia.length) {
      let acc = 0;
      for (let k = 1; k < s.route.length; k++) {
        acc += s.route[k].distanceTo(s.route[k - 1]);
        if (s.route[k].distanceTo(inVia[0]) < 0.05) {
          s.stepAt = acc;
          break;
        }
      }
    }
    // Where the floor drops on the way OUT: at the last of the old place's
    // via points — the foot of the jetty — so it walks the decking at deck
    // height and only steps down when it reaches land. Without this it drops
    // to ground level on the first frame of the walk and its feet sink
    // through the planks.
    s.fromY = s.standY;
    s.stepDownAt = 0;
    if (s.fromY && outVia.length) {
      const last = outVia[outVia.length - 1];
      let acc = 0;
      for (let k = 1; k < s.route.length; k++) {
        acc += s.route[k].distanceTo(s.route[k - 1]);
        if (s.route[k].distanceTo(last) < 0.05) {
          s.stepDownAt = acc;
          break;
        }
      }
    }
    s.dur = seconds ?? THREE.MathUtils.clamp(s.len / AVATAR.maxSpeed, AVATAR.minSeconds, AVATAR.maxSeconds);
    s.prog = 0;
    s.mode = s.len < 0.05 ? "act" : "walk";
    s.action = stand.action || "idle";
    s.face = stand.face;
    s.standY = stand.y || 0;
    s.seat = stand.seat ?? null;
    s.via = stand.via || [];
    s.owner = owner;
    s.since = 0;
  };

  // A place may have a night arrangement (standNight): used when the lamps
  // are more than half on, both when it sets off and if night falls or
  // lifts while it is there.
  const nightRef = useRef(false);
  const isNight = () => {
    const l = day?.current.lights ?? 0;
    const M = FIRE.move;
    if (!nightRef.current && l > M.threshold + M.hysteresis) nightRef.current = true;
    else if (nightRef.current && l < M.threshold - M.hysteresis) nightRef.current = false;
    return nightRef.current;
  };
  const standFor = (lm) => (lm.standNight && isNight() ? [lm.standNight, "night"] : [lm.stand, "day"]);
  // The arrival: if the shot is going to play, it starts out on the jetty
  // (as if it came in off the water) and only walks in once the camera is
  // rolling; if the shot is skipped it is simply placed at home.
  const arriving = useRef(intro.status === "waiting");
  // `intro.status` stays "skipped" for the rest of the session, so the
  // skip handling below has to be consumed once — otherwise every later
  // walk home matches it and the figure is teleported instead of walking.
  const skipHandled = useRef(false);
  useEffect(() => {
    if (!arriving.current) return;
    const gate = LANDMARKS.find((l) => l.id === "gate");
    const s = st.current;
    s.pos.set(INTRO.walk.from[0], INTRO.walk.from[1]);
    s.facing = INTRO.walk.face;
    s.face = INTRO.walk.face;
    s.standY = gate?.stand?.y || 0;
    s.via = gate?.stand?.via || [];
    s.owner = "gate";
    s.mode = "act";
    s.action = "idle";
    if (rig.current.root) rig.current.root.position.set(s.pos.x, s.standY, s.pos.y);
  }, []);
  useEffect(() => {
    const lm = selected ? LANDMARKS.find((l) => l.id === selected) : null;
    if (lm?.stand) {
      const [stand, variant] = standFor(lm);
      walkTo(stand, lm.id, variant);
    } else if (!arriving.current) walkTo({ at: AVATAR.home.at, face: AVATAR.home.face, action: "idle" }, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useFrame((state, rawDt) => {
    const r = rig.current;
    if (!r.root) return;
    const dt = Math.min(rawDt || 0.016, 1 / 30);
    const t = state.clock.elapsedTime;
    const s = st.current;
    const k = 1 - Math.exp(-dt * 10);
    // the arrival shot: set off when the camera starts rolling (a beat
    // later), at a walking pace; if it's skipped, appear at home
    if (arriving.current) {
      if (intro.status === "playing") {
        if (t - intro.startedAt >= INTRO.walk.delay) {
          arriving.current = false;
          const home = { at: AVATAR.home.at, face: AVATAR.home.face, action: "idle" };
          walkTo(home, null, "day", 1);
          s.dur = Math.max(0.5, s.len / INTRO.walk.speed);
        }
      } else if (intro.status === "skipped" || intro.status === "done" || intro.status === "off") {
        arriving.current = false;
        skipHandled.current = true; // placed at home already; don't re-handle
        s.pos.set(AVATAR.home.at[0], AVATAR.home.at[1]);
        s.facing = AVATAR.home.face;
        s.via = [];
        s.owner = null;
        s.standY = 0;
        walkTo({ at: AVATAR.home.at, face: AVATAR.home.face, action: "idle" }, null);
      }
    } else if (intro.status === "skipped" && !skipHandled.current && s.owner === null && s.mode === "walk" && s.action === "idle" && !selected) {
      // The arrival was skipped while it was walking in: put it at home
      // rather than letting it finish the walk. Once only — after this it
      // walks everywhere like normal.
      skipHandled.current = true;
      s.pos.set(AVATAR.home.at[0], AVATAR.home.at[1]);
      s.facing = AVATAR.home.face;
      s.standY = 0;
      walkTo({ at: AVATAR.home.at, face: AVATAR.home.face, action: "idle" }, null);
    }
    if (intro.status === "playing" && !arriving.current && s.mode === "act" && s.owner === null) introFinished();
    // night fell (or lifted) while it was at a place with two arrangements
    if (s.mode === "act" && s.owner) {
      const lm = LANDMARKS.find((l) => l.id === s.owner);
      if (lm?.standNight) {
        const [stand, variant] = standFor(lm);
        if (variant !== s.variant) walkTo(stand, lm.id, variant);
      }
    }
    const H = AVATAR.height;
    const legs = H * FIGURE.legs;
    const thigh = legs * FIGURE.thigh;
    const shin = legs - thigh;

    let legL = 0, legR = 0, kneeL = 0, kneeR = 0, armL = 0, armR = 0, armLz = -0.12, armRz = 0.12;
    let bodyY = 0, bodyRx = 0, bodyRz = 0, bodyRy = 0, headRx = 0, headRy = 0, rootY = 0;

    const sitLegs = (h) => sitAngle(h, thigh, shin);

    if (s.mode === "walk" && s.route) {
      const f = s.prog / s.len;
      const ease = THREE.MathUtils.clamp(Math.min(f / 0.2, (1 - f) / 0.2), 0.25, 1);
      const v = (s.len / s.dur) * ease;
      s.prog = Math.min(s.len, s.prog + v * dt);
      pointAt(s.route, s.prog, tmp.p, tmp.d);
      s.pos.copy(tmp.p);
      const heading = Math.atan2(tmp.d.x, tmp.d.y);
      s.facing = angleTowards(s.facing, heading, 1 - Math.exp(-dt * AVATAR.turn));
      s.phase = advancePhase(s.phase, v * dt);
      const w = walkPose(s.phase, tmp.walk);
      legL = w.legL;
      legR = w.legR;
      kneeL = w.kneeL;
      kneeR = w.kneeR;
      armL = w.armL;
      armR = w.armR;
      bodyY = w.bodyY;
      bodyRx = w.bodyRx;
      // Height along the route. Two independent ramps, so a walk that both
      // leaves a raised surface and arrives at another one is handled: step
      // DOWN off whatever it was standing on (at the foot of the jetty, say)
      // and step UP onto whatever the new stand sits on. With fromY 0 this
      // is just the step up, as before.
      rootY = 0;
      if (s.fromY) rootY += s.fromY * (1 - THREE.MathUtils.clamp((s.prog - s.stepDownAt) / 0.3, 0, 1));
      if (s.standY) rootY += s.standY * THREE.MathUtils.clamp((s.prog - s.stepAt) / 0.3, 0, 1);
      if (s.prog >= s.len - 1e-4) {
        s.mode = "act";
        s.since = 0;
      }
    } else {
      s.since += dt;
      s.facing = angleTowards(s.facing, s.face, 1 - Math.exp(-dt * 6));
      const act = s.action;
      const e = Math.min(1, s.since / 0.6);
      rootY = s.standY;
      if (act === "idle") {
        bodyRz = Math.sin(t * 0.6) * 0.03;
        headRy = Math.sin(t * 0.35) * 0.55;
        const lookUp = (t % 11) < 2.2 ? Math.sin(((t % 11) / 2.2) * Math.PI) : 0;
        headRx = -0.45 * lookUp;
        armL = Math.sin(t * 0.9) * 0.05;
        armR = Math.sin(t * 0.9 + 1) * 0.05;
        legL = 0.03 * Math.sin(t * 0.6);
        legR = -0.03 * Math.sin(t * 0.6);
      } else if (act === "sit" || act === "piano" || act === "sitfire") {
        // hips on the seat; thighs forward, knees bent, feet on the floor
        const seat = s.seat ?? s.standY + 0.35;
        const hips = seat - s.standY;
        const a = sitLegs(hips);
        rootY = s.standY + (hips - legs) * e;
        legL = legR = -a * e;
        kneeL = kneeR = a * e;
        if (act === "sitfire") {
          // on the ground by the fire with the others: hands on the knees,
          // looking into the flames, the odd glance round
          armL = -0.8 * e;
          armR = -0.8 * e + Math.sin(t * 0.9) * 0.03;
          armLz = -0.05;
          armRz = 0.05;
          headRx = 0.14 + Math.sin(t * 0.3) * 0.04;
          headRy = Math.sin(t * 0.23) * 0.35;
          bodyRz = Math.sin(t * 0.5) * 0.02;
          bodyRx = 0.1;
        } else if (act === "sit") {
          // hands on the knees, looking around
          armL = -0.85 * e;
          armR = -0.85 * e + Math.sin(t * 1.1) * 0.04;
          armLz = -0.05;
          armRz = 0.05;
          headRy = Math.sin(t * 0.4) * 0.5;
          headRx = -0.05;
          bodyRz = Math.sin(t * 0.5) * 0.02;
          bodyRx = 0.06;
        } else {
          // hands on the keys
          armL = -1.15 + Math.sin(t * 8) * 0.12;
          armR = -1.15 + Math.cos(t * 8) * 0.12;
          armLz = -0.05;
          armRz = 0.05;
          bodyRz = Math.sin(t * 1.6) * 0.05;
          bodyRx = 0.1;
          headRx = 0.15;
        }
      } else if (act === "bow") {
        // a short bow from the waist: bend, hold, straighten — then stand
        // quietly, glancing over at the ema now and then
        const bend = THREE.MathUtils.smoothstep(s.since, 0.4, 1.0) - THREE.MathUtils.smoothstep(s.since, 2.2, 3.0);
        bodyRx = 0.62 * bend + 0.03;
        headRx = 0.18 * bend;
        armL = -0.05 + 0.1 * bend;
        armR = -0.05 + 0.1 * bend;
        armLz = -0.08;
        armRz = 0.08;
        const after = THREE.MathUtils.smoothstep(s.since, 3.0, 3.8);
        const glance = (t % 14) < 5 ? Math.sin(((t % 14) / 5) * Math.PI) : 0;
        headRy = after * (-0.75 * glance + Math.sin(t * 0.3) * 0.08);
        bodyRz = after * Math.sin(t * 0.5) * 0.02;
        legL = 0.02;
        legR = -0.02;
      } else if (act === "talk") {
        armR = -0.8 + Math.sin(t * 2.4) * 0.35;
        armRz = -0.35;
        armL = -0.25 + Math.sin(t * 1.7 + 2) * 0.2;
        headRx = Math.sin(t * 3) * 0.06;
        bodyRz = Math.sin(t * 1.2) * 0.03;
      } else if (act === "tend") {
        // a proper crouch: thighs up, knees folded, hips just above the heels
        const ta = 1.3;
        const kb = 2.0;
        const hips = shin * Math.cos(ta - kb) + thigh * Math.cos(ta);
        rootY = s.standY - (legs - hips) * e;
        legL = legR = -ta * e;
        kneeL = kneeR = kb * e;
        bodyRx = 0.5 * e;
        armR = -0.5 + Math.sin(t * 2.2) * 0.3;
        armRz = Math.sin(t * 2.2) * 0.3;
        armL = -0.6;
        headRx = 0.35;
      } else if (act === "work") {
        // at the bench: four seconds of sawing, then three of hammering
        const cyc = t % 7;
        legL = -0.22;
        legR = 0.18;
        kneeL = 0.15;
        if (cyc < 4) {
          const w = Math.sin(t * 5.5);
          armR = -1.0 + w * 0.5;
          armRz = 0.12;
          armL = -1.15;
          armLz = -0.3;
          bodyRx = 0.28 + w * 0.09;
          bodyY = Math.abs(w) * 0.012;
          headRx = 0.4;
        } else {
          // a slow lift and a fast drop, once a second
          const p = (cyc - 4) % 1;
          const lift = p < 0.4 ? Math.sin((p / 0.4) * Math.PI * 0.5) : p < 0.52 ? 1 - (p - 0.4) / 0.12 : 0;
          armR = -0.85 - lift * 1.35;
          armRz = 0.2;
          armL = -1.05;
          armLz = -0.25;
          bodyRx = 0.2 + (1 - lift) * 0.1;
          headRx = 0.35 - lift * 0.15;
        }
      } else if (act === "reach") {
        armR = -2.5 * e;
        armRz = 0.15;
        armL = -0.2;
        headRx = -0.5 * e;
        bodyRz = Math.sin(t * 0.8) * 0.02;
        bodyY = Math.max(0, Math.sin(t * 1.5)) * 0.015;
      } else if (act === "lookout") {
        armR = -2.1 * e;
        armRz = -0.5;
        headRy = Math.sin(t * 0.4) * 0.35;
        bodyRz = Math.sin(t * 0.5) * 0.03;
        legL = 0.15 * e;
        legR = -0.15 * e;
      } else if (act === "look") {
        // at the end of the pier, taking in the whole horizon: slow, broad
        // head turns that dwell at each side, gaze lifted, weight shifting
        // from foot to foot, the shoulders following the head a little.
        const sway = Math.sin(t * 0.35);
        bodyRz = sway * 0.035;
        legL = 0.05 + sway * 0.04;
        legR = -0.05 - sway * 0.04;
        const turn = Math.sin(t * 0.17);
        // flatten the curve near its ends so the look pauses at each side
        const dwell = Math.sign(turn) * Math.pow(Math.abs(turn), 0.55);
        headRy = dwell * 1.05 + Math.sin(t * 0.43) * 0.08;
        bodyRy = dwell * 0.18;
        headRx = -0.22 + Math.sin(t * 0.23) * 0.07;
        armL = Math.sin(t * 0.5) * 0.05;
        armR = Math.sin(t * 0.5 + 1) * 0.05;
      }
    }

    report.x = s.pos.x;
    report.z = s.pos.y;
    report.walking = s.mode === "walk";

    r.root.position.set(s.pos.x, damp(r.root.position.y, rootY, k), s.pos.y);
    r.root.rotation.y = s.facing;
    r.body.position.y = damp(r.body.position.y, legs + bodyY, k);
    r.body.rotation.x = damp(r.body.rotation.x, bodyRx, k);
    r.body.rotation.z = damp(r.body.rotation.z, bodyRz, k);
    r.body.rotation.y = damp(r.body.rotation.y, bodyRy, k);
    r.head.rotation.x = damp(r.head.rotation.x, headRx, k);
    r.head.rotation.y = damp(r.head.rotation.y, headRy, k);
    r.armL.rotation.x = damp(r.armL.rotation.x, armL, k);
    r.armR.rotation.x = damp(r.armR.rotation.x, armR, k);
    r.armL.rotation.z = damp(r.armL.rotation.z, armLz, k);
    r.armR.rotation.z = damp(r.armR.rotation.z, armRz, k);
    r.legL.rotation.x = damp(r.legL.rotation.x, legL, k);
    r.legR.rotation.x = damp(r.legR.rotation.x, legR, k);
    r.kneeL.rotation.x = damp(r.kneeL.rotation.x, kneeL, k);
    r.kneeR.rotation.x = damp(r.kneeR.rotation.x, kneeR, k);
  });

  return <FigureRig rig={rig} height={AVATAR.height} skin={a.skin} hair={a.hair} hairStyle={a.hairStyle || "short"} shirt={a.shirt} trousers={a.trousers} position={[AVATAR.home.at[0], 0, AVATAR.home.at[1]]} rotation={[0, AVATAR.home.face, 0]} />;
}
