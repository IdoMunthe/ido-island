// Family: five clay figures in the middle of the island, labelled by role
// only. The mother and sister have long hair; everyone wears trousers. By
// day they stand together by the picnic blanket. As the lamps come on,
// one of them gets up and walks over to the fire, the others follow over
// a couple of seconds at their own pace; each turns to face the flames
// and sits down — knees bending, hips lowering, a little settle at the
// bottom, hands to the knees. At dawn they push up, straighten, turn and
// walk back. The walk is the same one the user's figure uses (gait.js).
//
// Some of them also go visiting (VISITS in the config): when a place is
// selected, the members it names get up, walk there — round the fire ring
// and round each other — and do something: the father and a brother sit at
// the chess table and play, a move at a time, each lean and reach moving a
// piece on the board (the table listens on the bus); the mother and sister
// stand at the washing line looking at the photographs, pointing, leaning
// in, turning to each other, a small laugh. When the place is left they
// walk back. Night has priority: at night everyone is round the fire and
// nobody goes visiting, and night falling while they are away calls them
// back. Every move runs to its end before the next can be ordered — the
// campfire rule — so leaving a place mid-walk, or night falling mid-walk,
// still ends in a clean rest, and nobody is ever in two places at once.
// The group copes with members away: the wave-back goes only to those
// present, and the fire circle simply has empty seats.
// Card: family.
import { useContext, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Landmark } from "./Landmark.jsx";
import { FigureRig, FIGURE } from "../life/Figure.jsx";
import { Campfire } from "../life/Campfire.jsx";
import { walkPose, advancePhase, sitAngle, angleTowards, damp } from "../life/gait.js";
import { familyLayout, visitPlan, visitRoute } from "./familyLayout.js";
import { PALETTE, FIRE } from "../island.config.js";
import { IslandContext } from "../islandContext.js";
import { useDay } from "../sky/DayNight.jsx";
import { content } from "../../content.js";
import { seeded } from "../springs.js";

const MOVE = FIRE.move;
const ease = (p) => p * p * (3 - 2 * p);
const rest = (s) => s === "stand" || s === "seated";
const between = (rnd, [a, b]) => a + rnd() * (b - a);

export function Family({ config }) {
  const { selected, tier, bus } = useContext(IslandContext);
  const day = useDay();
  const members = useMemo(() => (content.family?.members || []).slice(0, 8), []);
  const layout = useMemo(() => familyLayout(members), [members]);
  const plan = useMemo(() => visitPlan(members), [members]);
  const rigs = useRef(members.map(() => ({})));
  const group = useRef({
    arrangement: "day",
    night: false,
    rnd: seeded(91),
    // the game at the chess table: whose move, thinking or reaching
    chess: { on: false, turn: 0, phase: "think", t: 0, len: 3, seq: 0, fired: false },
  });
  const people = useRef(
    layout.map((L) => ({
      state: "stand", // stand | walk | turn | sit | seated | rise
      at: "day", // where it is resting: "day" | "night" | "visit:<place>"
      goal: "day", // where it is meant to be
      x: L.x,
      z: L.z,
      facing: L.turn,
      phase: 0,
      t: 0, // seconds into the current state
      due: 0, // seconds still to wait before setting off
      sitP: 0, // 0 standing … 1 seated
      seatH: FIRE.seatHeight,
      dest: null,
      route: null,
      ri: 0,
      walkPose: {},
      cue: null, // a small bit of business at the washing line
      cueAt: 1.5,
    }))
  );

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt || 0.016, 1 / 30);
    const t = state.clock.elapsedTime;
    const talking = selected === "family";
    const lights = day?.current.lights ?? 0;
    const G = group.current;
    const P = people.current;
    const rnd = G.rnd;

    // ---- which arrangement the light wants, with hysteresis; the switch
    // waits until nobody is mid-move, and then every move runs to its end
    if (!G.night && lights > MOVE.threshold + MOVE.hysteresis) G.night = true;
    else if (G.night && lights < MOVE.threshold - MOVE.hysteresis) G.night = false;
    const wantedArr = G.night ? "night" : "day";
    const busy = P.some((p) => !rest(p.state));
    if (!busy && wantedArr !== G.arrangement) G.arrangement = wantedArr;

    // ---- where each person is meant to be: visiting, if their place is
    // selected and it is day; otherwise with the group. A new goal is only
    // taken at rest, with a stagger so nobody sets off in lockstep.
    const visit = (goal) => (goal.startsWith("visit:") ? plan[goal.slice(6)] : null);
    P.forEach((p, i) => {
      let want = G.arrangement;
      if (G.arrangement === "day" && selected && plan[selected]?.members.includes(i)) want = "visit:" + selected;
      if (want !== p.goal && rest(p.state)) {
        p.goal = want;
        const v = visit(want) || visit(p.at);
        p.due = v ? v.members.indexOf(i) * (v.stagger ?? 1.2) + rnd() * 0.3 : layout[i].delay;
      }
    });
    // where a goal is, in the family's metres, and what to do there
    const destFor = (i, goal) => {
      const L = layout[i];
      if (goal === "night") return { x: L.seat.x, z: L.seat.z, turn: L.seat.turn, seat: FIRE.seatHeight, act: "fire" };
      const v = visit(goal);
      const s = v?.spots.find((sp) => sp.member === i);
      if (s) return { x: s.x, z: s.z, turn: s.turn, seat: v.seat ?? null, act: v.act || "stand", place: goal.slice(6) };
      return { x: L.x, z: L.z, turn: L.turn, seat: null, act: "day" };
    };
    // the walk: out to a visit the way visitRoute lays it (out of the row
    // or the fire circle, round, then in), back the same way reversed,
    // and a straight line between the row and the seats
    const routeFor = (i, p, dest) => {
      const out = visit(p.goal);
      const back = visit(p.at);
      if (out) return visitRoute(layout, i, p.at === "night" ? "night" : "day", [dest.x, dest.z], out.viaLocal);
      if (back) return visitRoute(layout, i, p.goal === "night" ? "night" : "day", [p.x, p.z], back.viaLocal).reverse();
      return [
        [p.x, p.z],
        [dest.x, dest.z],
      ];
    };

    // ---- the chess game: on while both players are seated at the table.
    // Think, then reach; half-way through the reach a move is announced on
    // the bus and the table slides a piece. Then the other's turn.
    const C = G.chess;
    const hv = plan.hobbies;
    const playing = !!hv && hv.members.length === 2 && hv.members.every((j) => P[j].at === "visit:hobbies" && P[j].state === "seated" && P[j].goal === P[j].at);
    if (!playing) {
      if (C.on) {
        C.on = false;
        C.phase = "think";
        C.t = 0;
        C.fired = false;
      }
    } else {
      if (!C.on) {
        C.on = true;
        C.t = 0;
        C.len = between(rnd, hv.think || [2.5, 6]);
      }
      C.t += dt;
      if (C.phase === "think" && C.t >= C.len) {
        C.phase = "reach";
        C.t = 0;
        C.len = hv.reach ?? 1.2;
        C.fired = false;
      } else if (C.phase === "reach") {
        if (!C.fired && C.t >= C.len * 0.5) {
          C.fired = true;
          C.seq++;
          if (bus) bus.chess = { seq: C.seq, side: C.turn };
        }
        if (C.t >= C.len) {
          C.turn = 1 - C.turn;
          C.phase = "think";
          C.t = 0;
          C.len = between(rnd, hv.think || [2.5, 6]);
        }
      }
    }

    P.forEach((p, i) => {
      const r = rigs.current[i];
      const L = layout[i];
      if (!r.body || !r.kneeL) return;
      const legs = L.h * FIGURE.legs;
      const thigh = legs * FIGURE.thigh;
      const shin = legs - thigh;
      const knee = sitAngle(p.seatH, thigh, shin);
      const here = destFor(i, p.at);
      const restFacing = p.at === "day" ? (talking ? L.turn * 0.3 : L.turn) : here.turn;

      // ---- the per-person state machine
      if (rest(p.state) && p.goal !== p.at) {
        // a move has been ordered: wait our turn, then get going
        p.due -= dt;
        if (p.due <= 0) {
          p.t = 0;
          p.dest = destFor(i, p.goal);
          p.route = routeFor(i, p, p.dest);
          p.ri = 1;
          p.cue = null;
          p.state = p.state === "seated" ? "rise" : "walk";
        }
      }
      let legL = 0, legR = 0, kneeL = 0, kneeR = 0, armL = 0, armR = 0, bodyY = 0, bodyRx = 0, bodyRz = 0, rootY = 0;
      let headX = 0, headZ = 0;
      let wobble = 0;
      let faceTarget = restFacing;
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
        const goal = p.route[Math.min(p.ri, p.route.length - 1)];
        const dx = goal[0] - p.x;
        const dz = goal[1] - p.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.03) {
          if (p.ri < p.route.length - 1) p.ri++;
          else {
            p.x = p.dest.x;
            p.z = p.dest.z;
            p.state = "turn";
            p.t = 0;
          }
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
        // arrived: turn to face the fire, the board, the line, or the group
        p.t += dt;
        const want = p.dest.turn;
        p.facing = angleTowards(p.facing, want, 1 - Math.exp(-dt * MOVE.turnRate));
        const left = Math.abs(Math.atan2(Math.sin(want - p.facing), Math.cos(want - p.facing)));
        if (left < 0.08 || p.t > 1.2) {
          p.facing = want;
          p.at = p.goal;
          p.seatH = p.dest.seat ?? FIRE.seatHeight;
          p.state = p.dest.seat != null ? "sit" : "stand";
          p.t = 0;
          p.cueAt = 1 + rnd() * 2;
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
      } else {
        p.sitP = 0;
      }

      // ---- pose from the state
      const sp = p.sitP;
      rootY = (p.seatH - legs) * sp;
      if (p.state !== "walk") {
        legL += -knee * sp;
        legR += -knee * sp;
        kneeL += knee * sp;
        kneeR += knee * sp;
        armL += -0.75 * sp + Math.sin(t * 1.1 + i * 0.7) * 0.05;
        armR += -0.75 * sp + Math.sin(t * 1.3 + i) * 0.08;
        bodyRx += 0.08 * sp;
        headX = 0.12 * sp;
        const settled = rest(p.state) && p.goal === p.at;
        if (settled && p.at === "day") {
          // a wave back at the user's figure, one of those present at a time
          const present = P.map((q, j) => j).filter((j) => P[j].at === "day" && rest(P[j].state));
          if (talking && present.length && i === present[Math.floor(t / 4) % present.length]) {
            armR = -1.1 + Math.sin(t * 6) * 0.35;
            headX = Math.sin(t * 3) * 0.08;
          }
        } else if (settled && here.act === "chess") {
          // at the board: the mover leans in and reaches over it; the other
          // considers, a hand near the chin, a slight lean, a small tilt
          const side = hv ? hv.members.indexOf(i) : 0;
          headX = 0.28;
          if (C.on && C.phase === "reach" && C.turn === side) {
            const lean = Math.sin(Math.min(1, C.t / C.len) * Math.PI);
            bodyRx += 0.42 * lean;
            armR = -0.75 - 1.15 * lean;
            headX = 0.28 + 0.12 * lean;
          } else {
            armR = -1.78 + Math.sin(t * 0.9 + i) * 0.05;
            bodyRx += 0.14 + Math.sin(t * 0.35 + i * 2) * 0.04;
            headZ = Math.sin(t * 0.5 + i * 1.7) * 0.14;
          }
        } else if (settled && here.act === "look") {
          // at the line: looking at the photographs together, out of phase
          const v = plan[here.place];
          const other = v?.members.find((j) => j !== i);
          const q = other != null ? P[other] : null;
          if (!p.cue) {
            p.cueAt -= dt;
            if (p.cueAt <= 0) {
              const kinds = ["point", "lean", "turn", "laugh"];
              p.cue = { kind: kinds[Math.floor(rnd() * kinds.length)], t: 0, len: between(rnd, v?.cue || [1.2, 2.4]) };
            }
          }
          headX = -0.12 + Math.sin(t * 0.4 + i) * 0.04; // looking up a little at the line
          if (p.cue) {
            p.cue.t += dt;
            const k = Math.min(1, p.cue.t / p.cue.len);
            const env = Math.sin(k * Math.PI);
            if (p.cue.kind === "point") {
              armR = -0.1 - 2.3 * env;
              headX = -0.38 * env;
            } else if (p.cue.kind === "lean") {
              bodyRx += 0.22 * env;
              headX = -0.2 * env;
            } else if (p.cue.kind === "turn" && q) {
              if (env > 0.3) faceTarget = Math.atan2(q.x - p.x, q.z - p.z);
              headZ = 0.08 * env;
            } else if (p.cue.kind === "laugh") {
              bodyRz += 0.07 * Math.sin(t * 9) * env;
              headZ = 0.18 * env;
              bodyY += 0.012 * Math.abs(Math.sin(t * 9)) * env;
            }
            if (k >= 1) {
              p.cue = null;
              p.cueAt = between(rnd, v?.gap || [2.5, 6]);
            }
          }
        }
        if (rest(p.state)) p.facing = angleTowards(p.facing, faceTarget, 1 - Math.exp(-dt * 3));
      } else headX = 0.05;
      bodyRz += Math.sin(t * 0.7 + i * 1.9) * 0.02 + wobble * Math.sin(t * 9);

      const k = 1 - Math.exp(-dt * 12);
      r.root.position.set(p.x, damp(r.root.position.y, rootY, k), p.z);
      r.root.rotation.y = p.facing;
      r.body.position.y = damp(r.body.position.y, legs + bodyY, k);
      r.body.rotation.x = damp(r.body.rotation.x, bodyRx, k);
      r.body.rotation.z = damp(r.body.rotation.z, bodyRz, k);
      r.head.rotation.y = Math.sin(t * 0.45 + i * 2.3) * 0.25;
      r.head.rotation.x = damp(r.head.rotation.x, headX, k);
      r.head.rotation.z = damp(r.head.rotation.z, headZ, k);
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
