// Where the family stands by day, where each sits by night, and the walk
// between: pure, so scripts/map.mjs can check the routes as well as the
// scene using them. Everything is in the family landmark's own metres.
import { FIRE } from "../island.config.js";
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
