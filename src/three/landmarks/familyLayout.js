// Where the family stands by day, where each sits by night, where the
// visitors go when a place is selected, and the walks between: pure, so
// scripts/map.mjs can check the routes as well as the scene using them.
// Everything is in the family landmark's own metres unless it says world.
import { FIRE, VISITS, LANDMARKS } from "../island.config.js";
import { seeded } from "../springs.js";

// Height and look by role keyword. Anything unrecognised is an adult with
// short hair.
export function lookFor(role) {
  const r = String(role || "").toLowerCase();
  const woman = /mum|mother|mama|mom|sister|daughter|aunt|grand(ma|mother)|wife|girlfriend/.test(r);
  let h = 0.88;
  let kid = false;
  if (/dad|father|papa/.test(r)) h = 1.0;
  else if (/mum|mother|mama|mom/.test(r)) h = 0.92;
  else if (/youngest|little/.test(r)) {
    h = 0.7;
    kid = true;
  } else if (/younger|brother|sister/.test(r)) {
    h = 0.82;
    kid = /younger|brother/.test(r);
  }
  return { h, woman, kid };
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// For n members: day spot (x, z, turn), night seat (x, z, turn — facing the
// fire), and the per-person timing that makes the move look unplanned.
export function familyLayout(members) {
  const n = members.length;
  const rnd = seeded(33);
  const [fx, , fz] = FIRE.local;
  const day = members.map((m, i) => ({ x: (i - (n - 1) / 2) * 0.5, z: (i % 2 ? 0.14 : -0.14) + (rnd() - 0.5) * 0.08, turn: (rnd() - 0.5) * 0.5, ...lookFor(m.role) }));
  // seats round the fire, leaving the slot nearest the path (angle 0, the
  // +z side) for the user's figure; handed out left to right so nobody has
  // to cross anyone else
  const seats = members
    .map((_, i) => {
      const a = Math.PI + (i - (n - 1) / 2) * ((Math.PI * 2) / (n + 1));
      return { x: fx + Math.sin(a) * FIRE.circleRadius, z: fz + Math.cos(a) * FIRE.circleRadius, turn: wrap(a + Math.PI) };
    })
    .sort((p, q) => p.x - q.x);
  const order = day.map((d, i) => i).sort((i, j) => day[i].x - day[j].x);
  const seatOf = new Array(n);
  order.forEach((memberIndex, rank) => (seatOf[memberIndex] = seats[rank]));
  // the stagger: a shuffled rank, spread over FIRE.move.stagger seconds
  const shuffled = members.map((_, i) => i).sort(() => rnd() - 0.5);
  const rnd2 = seeded(77);
  return members.map((m, i) => {
    const d = day[i];
    const rank = shuffled.indexOf(i);
    return {
      ...d,
      seat: seatOf[i],
      delay: (rank / Math.max(1, n - 1)) * FIRE.move.stagger + rnd2() * 0.3,
      speed: FIRE.move.walkSpeed[0] + rnd2() * (FIRE.move.walkSpeed[1] - FIRE.move.walkSpeed[0]),
      sitSeconds: (d.kid ? FIRE.move.sitSeconds[0] : FIRE.move.sitSeconds[1]) * (0.85 + rnd2() * 0.3),
      riseSeconds: (d.kid ? FIRE.move.riseSeconds[0] : FIRE.move.riseSeconds[1]) * (0.85 + rnd2() * 0.3),
    };
  });
}

// ---- frames: a landmark's own metres ↔ the world ------------------------
export function toWorld(lm, x, z) {
  const c = Math.cos(lm.rotation || 0);
  const s = Math.sin(lm.rotation || 0);
  return [lm.at[0] + x * c + z * s, lm.at[2] - x * s + z * c];
}
export function toLocal(lm, wx, wz) {
  const c = Math.cos(lm.rotation || 0);
  const s = Math.sin(lm.rotation || 0);
  const dx = wx - lm.at[0];
  const dz = wz - lm.at[2];
  return [dx * c - dz * s, dx * s + dz * c];
}

// ---- visitors ------------------------------------------------------------
// Who goes where when a place is selected (VISITS in the config): for each
// place, the members by role (a member is claimed by the first place that
// names it), and each one's spot — given in that place's own metres — in the
// family's metres and in the world, with the facing converted the same way.
export function visitPlan(members) {
  const fam = LANDMARKS.find((l) => l.id === "family");
  const out = {};
  const claimed = new Set();
  for (const [place, v] of Object.entries(VISITS || {})) {
    const lm = LANDMARKS.find((l) => l.id === place);
    if (!lm || !fam) continue;
    const who = [];
    for (const pat of v.who || []) {
      const re = new RegExp(pat, "i");
      const idx = members.findIndex((m, i) => !claimed.has(i) && re.test(String(m.role || "")));
      if (idx >= 0) {
        claimed.add(idx);
        who.push(idx);
      }
    }
    const spots = who.map((member, k) => {
      const at = v.at?.[k] || v.at?.[0] || [0, 0];
      const [wx, wz] = toWorld(lm, at[0], at[1]);
      const [x, z] = toLocal(fam, wx, wz);
      const turn = wrap((v.face?.[k] ?? 0) + (lm.rotation || 0) - (fam.rotation || 0));
      return { member, x, z, turn, world: [wx, wz] };
    });
    // the way in, if the place has one: points on the way, in its metres
    const viaLocal = (v.via || []).map(([x, z]) => toLocal(fam, ...toWorld(lm, x, z)));
    out[place] = { ...v, members: who, spots, viaLocal };
  }
  return out;
}

// The walk out to a visit, as points in the family's metres, from member
// i's rest spot to `to`. By day it leaves the row the way a person would:
// a step back out of the line (FIRE.move.rowBack), along behind it to the
// row's end on the side the place lies (rowEnd), then away — so nobody
// walks through anybody, and the fire ring in front is never crossed. By
// night it steps out of the fire circle (ringOut past the seats) and goes
// round the outside of the circle to the side the place lies, then away.
// Then any `via` points of the place, then the spot. The way back is the
// same walk reversed.
export function visitRoute(lay, i, mode, to, via = []) {
  const M = FIRE.move;
  const L = lay[i];
  const pts = [];
  const first = via[0] || to;
  if (mode === "night") {
    const [fx, , fz] = FIRE.local;
    const s = L.seat;
    const rr = FIRE.circleRadius + M.ringOut;
    const a0 = Math.atan2(s.x - fx, s.z - fz);
    const a1 = Math.atan2(first[0] - fx, first[1] - fz);
    const d = wrap(a1 - a0);
    const n = Math.max(1, Math.ceil(Math.abs(d) / 0.45));
    pts.push([s.x, s.z]);
    for (let k = 0; k <= n; k++) {
      const a = a0 + (d * k) / n;
      pts.push([fx + Math.sin(a) * rr, fz + Math.cos(a) * rr]);
    }
  } else {
    const end = (first[0] >= 0 ? 1 : -1) * M.rowEnd;
    pts.push([L.x, L.z], [L.x, M.rowBack], [end, M.rowBack]);
  }
  for (const v of via) pts.push(v);
  pts.push(to);
  return pts.filter((p, k) => k === 0 || Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) > 0.04);
}

// Distance from point (px, pz) to the segment a→b.
export function segDist(ax, az, bx, bz, px, pz) {
  const abx = bx - ax;
  const abz = bz - az;
  const l2 = abx * abx + abz * abz;
  let t = l2 > 0 ? ((px - ax) * abx + (pz - az) * abz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

// Do two segments cross?
export function segmentsCross(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}
