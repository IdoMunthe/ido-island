// Top-down map of the island from island.config.js, as an ASCII grid on
// stdout and an SVG file, with warnings about the layout. Re-run after any
// change to positions:   node scripts/map.mjs   (writes scripts/map.svg)
import { writeFileSync } from "node:fs";
import { ISLAND, LANDMARKS, AVATAR, OBSTACLES, LAMPS, CAMERA, FIRE, NESTS, OWL, VISITS } from "../src/three/island.config.js";
import { nestPlacements, CANOPY } from "../src/three/life/nests.js";
import { content } from "../src/content.js";
import { familyLayout, visitPlan, visitRoute, segDist as famSegDist, segmentsCross } from "../src/three/landmarks/familyLayout.js";

const R = ISLAND.radius;
const FIG = AVATAR.radius;
const MIN_SEP = 2.4; // metres between place centres before it reads as crowded

// ---- geometry ---------------------------------------------------------
const rot = (lm, dx, dz) => {
  const c = Math.cos(lm.rotation || 0);
  const s = Math.sin(lm.rotation || 0);
  return [lm.at[0] + dx * c + dz * s, lm.at[2] - dx * s + dz * c];
};
const feet = [];
for (const lm of LANDMARKS) for (const [dx, dz, r] of lm.footprint || []) {
  const [x, z] = rot(lm, dx, dz);
  feet.push({ x, z, r, owner: lm.id });
}
const trees = ISLAND.trees.map(([x, z, sc]) => ({ x, z, r: 0.32 * sc, owner: "tree" }));
const lamps = LAMPS.posts.map((p) => ({ x: p.at[0], z: p.at[1], r: 0.14, owner: "lamp" }));
const extra = OBSTACLES.map(([x, z, r]) => ({ x, z, r, owner: "obstacle" }));
const all = [...feet, ...trees, ...lamps, ...extra];
const path = ISLAND.path;
const segs = [];
for (let i = 0; i < path.length; i++) {
  const j = (i + 1) % path.length;
  if (!ISLAND.pathClosed && j === 0) break;
  segs.push([path[i], path[j]]);
}
for (const spur of ISLAND.spurs || []) for (let i = 0; i < spur.length - 1; i++) segs.push([spur[i], spur[i + 1]]);
const segDist = (a, b, x, z) => {
  const abx = b[0] - a[0];
  const abz = b[1] - a[1];
  const l2 = abx * abx + abz * abz;
  let t = l2 > 0 ? ((x - a[0]) * abx + (z - a[1]) * abz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (a[0] + abx * t), z - (a[1] + abz * t));
};
const ov = CAMERA.overview;
const camXZ = [ov.target[0] + ov.distance * Math.sin(ov.polar) * Math.sin(ov.azimuth), ov.target[2] + ov.distance * Math.sin(ov.polar) * Math.cos(ov.azimuth)];

// ---- warnings ---------------------------------------------------------
const warn = [];
for (let i = 0; i < feet.length; i++)
  for (let j = i + 1; j < feet.length; j++) {
    const a = feet[i];
    const b = feet[j];
    if (a.owner === b.owner) continue;
    const d = Math.hypot(a.x - b.x, a.z - b.z);
    if (d < a.r + b.r) warn.push(`footprints overlap: ${a.owner} × ${b.owner} by ${(a.r + b.r - d).toFixed(2)} m`);
  }
for (const f of all) {
  if (Math.hypot(f.x, f.z) + f.r > R - 0.15 && f.owner !== "gate" && f.owner !== "heading") warn.push(`over the shore: ${f.owner} at (${f.x.toFixed(1)}, ${f.z.toFixed(1)}) r${f.r}`);
  for (const [a, b] of segs) {
    const d = segDist(a, b, f.x, f.z);
    if (d < f.r + ISLAND.pathWidth / 2) warn.push(`path crosses ${f.owner} at (${f.x.toFixed(1)}, ${f.z.toFixed(1)}) by ${(f.r + ISLAND.pathWidth / 2 - d).toFixed(2)} m`);
  }
}
for (const p of path) if (Math.hypot(p[0], p[1]) > R - ISLAND.pathWidth / 2 - 0.1) warn.push(`path vertex over the shore: [${p}]`);
for (let i = 0; i < LANDMARKS.length; i++)
  for (let j = i + 1; j < LANDMARKS.length; j++) {
    const a = LANDMARKS[i];
    const b = LANDMARKS[j];
    const d = Math.hypot(a.at[0] - b.at[0], a.at[2] - b.at[2]);
    if (d < MIN_SEP) warn.push(`crowded: ${a.id} and ${b.id} are ${d.toFixed(2)} m apart`);
  }
// balance: angular spacing of the places around the centre, and the centroid
const centre = LANDMARKS.find((l) => l.id === "family") || { at: [0, 0, 0] };
const ring = LANDMARKS.filter((l) => l !== centre).map((l) => ({ id: l.id, ang: Math.atan2(l.at[0] - centre.at[0], l.at[2] - centre.at[2]), d: Math.hypot(l.at[0] - centre.at[0], l.at[2] - centre.at[2]) })).sort((a, b) => a.ang - b.ang);
const gaps = ring.map((r, i) => {
  const n = ring[(i + 1) % ring.length];
  let g = n.ang - r.ang;
  if (g <= 0) g += Math.PI * 2;
  return { from: r.id, to: n.id, deg: (g * 180) / Math.PI };
});
const ideal = 360 / ring.length;
for (const g of gaps) if (g.deg < ideal * 0.55) warn.push(`lopsided: ${g.from} → ${g.to} only ${g.deg.toFixed(0)}° apart (ideal ${ideal.toFixed(0)}°)`);
for (const g of gaps) if (g.deg > ideal * 1.7) warn.push(`lopsided: ${g.from} → ${g.to} a ${g.deg.toFixed(0)}° gap (ideal ${ideal.toFixed(0)}°)`);
const cx = LANDMARKS.reduce((s, l) => s + l.at[0], 0) / LANDMARKS.length;
const cz = LANDMARKS.reduce((s, l) => s + l.at[2], 0) / LANDMARKS.length;
if (Math.hypot(cx, cz) > 0.9) warn.push(`lopsided: centroid of the places is (${cx.toFixed(1)}, ${cz.toFixed(1)}), ${Math.hypot(cx, cz).toFixed(1)} m off centre`);
// tall things stacking along the overview camera's line of sight
const tall = [
  ...LANDMARKS.filter((l) => ["house", "workshop", "heading", "washing"].includes(l.id)).map((l) => ({ id: l.id, x: l.at[0], z: l.at[2] })),
  ...ISLAND.trees.map(([x, z], i) => ({ id: `tree${i}`, x, z })),
];
for (let i = 0; i < tall.length; i++)
  for (let j = i + 1; j < tall.length; j++) {
    const a = tall[i];
    const b = tall[j];
    const aa = Math.atan2(a.x - camXZ[0], a.z - camXZ[1]);
    const ab = Math.atan2(b.x - camXZ[0], b.z - camXZ[1]);
    let dd = Math.abs(aa - ab);
    if (dd > Math.PI) dd = Math.PI * 2 - dd;
    const da = Math.hypot(a.x - camXZ[0], a.z - camXZ[1]);
    const db = Math.hypot(b.x - camXZ[0], b.z - camXZ[1]);
    // a tree hidden behind something is fine; a tree (or place) in front of a place is not
    const near = da < db ? a : b;
    const far = da < db ? b : a;
    if (far.id.startsWith("tree")) continue;
    if ((dd * 180) / Math.PI < 4 && Math.abs(da - db) > 1.5) warn.push(`stacked from the overview camera: ${near.id} in front of ${far.id} (${((dd * 180) / Math.PI).toFixed(1)}° apart)`);
  }
// the nests: each seated in its tree's crown (floor inside the main blob, rim
// clear of every blob), not buried in another blob, not on the overview
// camera's line to a place, and well away from the owl's perch
const nests = nestPlacements();
{
  if (nests.length !== (NESTS.nests || []).length) warn.push(`nests: ${(NESTS.nests || []).length - nests.length} point at a tree that does not exist`);
  const perchLm = LANDMARKS.find((l) => l.id === OWL.perch.landmark);
  const perch = perchLm ? rot(perchLm, OWL.perch.local[0], OWL.perch.local[2]) : null;
  const perchY = OWL.perch.local[1];
  nests.forEach((n, i) => {
    const [tx, tz] = n.treeAt;
    const s = n.scale;
    const blob = (b) => ({ x: tx + s * (CANOPY.pivot[0] + b.c[0]), y: s * (CANOPY.pivot[1] + b.c[1]), z: tz + s * (CANOPY.pivot[2] + b.c[2]), r: s * b.r });
    const blobs = CANOPY.blobs.map(blob);
    const [nx, ny, nz] = n.world;
    // seated: the floor is in some foliage; open: the rim's centre and its far edge are out of all of it
    const inside = (p) => blobs.some((b) => Math.hypot(p[0] - b.x, p[1] - b.y, p[2] - b.z) < b.r);
    const ox = Math.sin(n.bearing);
    const oz = Math.cos(n.bearing);
    if (!inside([nx, ny, nz])) warn.push(`nest ${i} (tree ${n.tree}) floats beside its crown`);
    if (inside([nx, ny + NESTS.depth + 0.01, nz])) warn.push(`nest ${i} (tree ${n.tree}): its opening is buried in the foliage`);
    if (inside([nx + ox * NESTS.radius, ny + NESTS.depth, nz + oz * NESTS.radius])) warn.push(`nest ${i} (tree ${n.tree}): its rim is buried in the foliage`);
    if (Math.hypot(nx - tx, nz - tz) < CANOPY.trunk.r * s + NESTS.radius && ny < CANOPY.trunk.h * s) warn.push(`nest ${i} (tree ${n.tree}) is in the trunk`);
    // the overview camera's line to a place
    for (const lm of LANDMARKS) {
      const an = Math.atan2(nx - camXZ[0], nz - camXZ[1]);
      const al = Math.atan2(lm.at[0] - camXZ[0], lm.at[2] - camXZ[1]);
      let dd = Math.abs(an - al);
      if (dd > Math.PI) dd = Math.PI * 2 - dd;
      const dn = Math.hypot(nx - camXZ[0], nz - camXZ[1]);
      const dl = Math.hypot(lm.at[0] - camXZ[0], lm.at[2] - camXZ[1]);
      if ((dd * 180) / Math.PI < 1.2 && dn < dl - 0.5) warn.push(`nest ${i} (tree ${n.tree}) in front of ${lm.id} from the overview camera (${((dd * 180) / Math.PI).toFixed(1)}°)`);
    }
    if (perch) {
      const dp = Math.hypot(nx - perch[0], ny - perchY, nz - perch[1]);
      if (dp < 1.0) warn.push(`nest ${i} (tree ${n.tree}) is ${dp.toFixed(2)} m from the owl's perch`);
    }
  });
}
// the family's visitors: every role matched, each spot inside the island,
// clear of the figure's own stand there and of every other place's footprint,
// and the walks — by day out of the row, by night out of the fire circle,
// then away — clear of the fire, of the others at rest, and of every
// footprint, tree and lamp they pass
const visitors = [];
{
  const fam = LANDMARKS.find((l) => l.id === "family");
  const fmembers = (content.family?.members || []).slice(0, 8);
  const lay = familyLayout(fmembers);
  const plan = visitPlan(fmembers);
  for (const [place, v] of Object.entries(VISITS || {})) {
    const pl = plan[place];
    const lm = LANDMARKS.find((l) => l.id === place);
    if (!pl || !lm) {
      warn.push(`visitors: no place "${place}"`);
      continue;
    }
    if (pl.members.length < (v.who || []).length) warn.push(`visitors: ${place}: only ${pl.members.length} of ${v.who.length} roles matched (${v.who.join(", ")})`);
    pl.spots.forEach((s, k) => {
      const [wx, wz] = s.world;
      const who = fmembers[s.member]?.role || "?";
      visitors.push({ x: wx, z: wz, place, who });
      if (Math.hypot(wx, wz) > R - 0.3) warn.push(`visitors: ${who} at ${place} stands over the shore`);
      const st = lm.stand;
      const dStand = Math.min(Math.hypot(wx - st.at[0], wz - st.at[1]), ...(st.via || []).map(([x, z]) => Math.hypot(wx - x, wz - z)));
      if (dStand < 0.5) warn.push(`visitors: ${who} at ${place} is ${dStand.toFixed(2)} m from the figure's own spot`);
      for (const f of all) if (f.owner !== "family" && f.owner !== place && Math.hypot(wx - f.x, wz - f.z) < f.r + FIG) warn.push(`visitors: ${who} at ${place} stands on ${f.owner}`);
      pl.spots.forEach((o, j) => {
        if (j < k && Math.hypot(o.world[0] - wx, o.world[1] - wz) < 0.4) warn.push(`visitors: the two at ${place} stand on each other`);
      });
      for (const mode of ["day", "night"]) {
        const route = visitRoute(lay, s.member, mode, [s.x, s.z], pl.viaLocal);
        const others = lay.filter((_, i) => i !== s.member).map((o) => (mode === "day" ? [o.x, o.z] : [o.seat.x, o.seat.z]));
        for (let i = 0; i < route.length - 1; i++) {
          const [ax, az] = route[i];
          const [bx, bz] = route[i + 1];
          if (famSegDist(ax, az, bx, bz, FIRE.local[0], FIRE.local[2]) < FIRE.ringRadius + 0.16) warn.push(`visitors: ${who}'s ${mode} walk to ${place} crosses the fire`);
          for (const [ox, oz] of others) if (famSegDist(ax, az, bx, bz, ox, oz) < 0.22) warn.push(`visitors: ${who}'s ${mode} walk to ${place} walks through someone at (${ox.toFixed(2)}, ${oz.toFixed(2)}) in the family's metres`);
          const wa = rot(fam, ax, az);
          const wb = rot(fam, bx, bz);
          for (const f of all) {
            if (f.owner === "family") continue;
            if (f.owner === place && Math.hypot(wb[0] - f.x, wb[1] - f.z) < f.r + FIG) continue; // the stool is inside the table's own circle
            if (segDist(wa, wb, f.x, f.z) < f.r + FIG) warn.push(`visitors: ${who}'s ${mode} walk to ${place} crosses ${f.owner} at (${f.x.toFixed(1)}, ${f.z.toFixed(1)})`);
          }
        }
      }
    });
  }
}
// avatar routing: every path segment vs every circle with the figure's radius
let blocked = 0;
for (const [a, b] of segs) for (const f of all) if (segDist(a, b, f.x, f.z) < f.r + FIG) blocked++;
if (blocked) warn.push(`avatar: ${blocked} path segment/footprint pairs closer than the figure's radius`);
for (const lm of LANDMARKS) {
  // routing on the path ends at the first `via` point when there is one
  const st = lm.stand.via?.[0] || lm.stand.at;
  const ok = [...path, ...(ISLAND.spurs || []).flat()].some((v) => all.every((f) => f.owner === lm.id || segDist(v, st, f.x, f.z) >= f.r + FIG));
  if (!ok) warn.push(`avatar: no clear approach to the ${lm.id} stand`);
}

// the family's walks to the fire: nobody through the stone ring or across
// anyone else's route (the stagger handles the rest)
{
  const fam = familyLayout((content.family?.members || []).slice(0, 8));
  const [fx, , fz] = FIRE.local;
  const body = 0.16; // half a figure, roughly
  fam.forEach((p, i) => {
    const d = famSegDist(p.x, p.z, p.seat.x, p.seat.z, fx, fz);
    if (d < FIRE.ringRadius + body) warn.push(`family: member ${i} walks ${d.toFixed(2)} m from the fire (ring ${FIRE.ringRadius})`);
    if (Math.hypot(p.seat.x - fx, p.seat.z - fz) < FIRE.ringRadius + 0.3) warn.push(`family: member ${i}'s seat is on the fire`);
    for (let j = i + 1; j < fam.length; j++) {
      const q = fam[j];
      if (segmentsCross([p.x, p.z], [p.seat.x, p.seat.z], [q.x, q.z], [q.seat.x, q.seat.z])) warn.push(`family: members ${i} and ${j} cross on the way to the fire`);
    }
  });
  const lm = LANDMARKS.find((l) => l.id === "family");
  if (lm?.standNight) {
    const c = Math.cos(lm.rotation || 0);
    const s = Math.sin(lm.rotation || 0);
    const sx = lm.standNight.at[0] - lm.at[0];
    const sz = lm.standNight.at[1] - lm.at[2];
    const lx = sx * c - sz * s;
    const lz = sx * s + sz * c;
    const dFire = Math.hypot(lx - fx, lz - fz);
    if (dFire < FIRE.ringRadius + 0.3) warn.push(`family: the figure's night seat is ${dFire.toFixed(2)} m from the fire`);
    for (const p of fam) if (Math.hypot(p.seat.x - lx, p.seat.z - lz) < 0.45) warn.push(`family: the figure's night seat sits on a family member`);
  }
}

// ---- ASCII ------------------------------------------------------------
const W = 76;
const H = 38;
const ext = R + 1.2;
const grid = Array.from({ length: H }, () => Array(W).fill(" "));
const toCell = (x, z) => [Math.round(((x + ext) / (2 * ext)) * (W - 1)), Math.round(((z + ext) / (2 * ext)) * (H - 1))];
const put = (x, z, ch) => {
  const [cx2, cy] = toCell(x, z);
  if (cx2 >= 0 && cx2 < W && cy >= 0 && cy < H) grid[cy][cx2] = ch;
};
// island interior and shore
for (let cy = 0; cy < H; cy++)
  for (let cx2 = 0; cx2 < W; cx2++) {
    const x = (cx2 / (W - 1)) * 2 * ext - ext;
    const z = (cy / (H - 1)) * 2 * ext - ext;
    const d = Math.hypot(x, z);
    if (d <= R) grid[cy][cx2] = "·";
    else if (d <= R + 0.35) grid[cy][cx2] = "~";
  }
// footprints
for (const f of feet) {
  const steps = Math.max(12, Math.round(f.r * 20));
  for (let k = 0; k < steps; k++) {
    const a = (k / steps) * Math.PI * 2;
    put(f.x + Math.cos(a) * f.r, f.z + Math.sin(a) * f.r, "o");
  }
}
// path
for (const [a, b] of segs) {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.12);
  for (let k = 0; k <= n; k++) put(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n, "=");
}
for (const p of path) put(p[0], p[1], "+");
for (const t of trees) put(t.x, t.z, "T");
for (const l of lamps) put(l.x, l.z, "i");
for (const n of nests) put(n.world[0], n.world[2], "n");
for (const v of visitors) put(v.x, v.z, "@");
for (const lm of LANDMARKS) {
  for (const [x, z] of lm.stand.via || []) put(x, z, "v");
  put(lm.stand.at[0], lm.stand.at[1], "x");
}
put(AVATAR.home.at[0], AVATAR.home.at[1], "h");
const letters = { house: "H", family: "F", shrine: "S", workshop: "W", hobbies: "M", washing: "P", heading: "A", gate: "J" };
for (const lm of LANDMARKS) put(lm.at[0], lm.at[2], letters[lm.id] || "?");
put(camXZ[0], camXZ[1], "C");
console.log(`island radius ${R} m · path ${path.length} vertices${(ISLAND.spurs || []).length ? ` + ${ISLAND.spurs.length} spurs` : ""} · overview camera at (${camXZ[0].toFixed(1)}, ${camXZ[1].toFixed(1)}) [C]`);
console.log("H house  F family  S shrine  W workshop  M hobbies  P photos  A path-exit  J gate/jetty  T tree  i lamp  n nest  @ visitor's spot  x stand  v way in  h home  = path  + waypoint  o footprint");
console.log(grid.map((r) => r.join("")).join("\n"));
console.log("places (angle from centre, distance):");
for (const r of ring) console.log(`  ${r.id.padEnd(9)} ${(((r.ang * 180) / Math.PI + 360) % 360).toFixed(0).padStart(4)}°  ${r.d.toFixed(2)} m`);
console.log("angular gaps: " + gaps.map((g) => `${g.deg.toFixed(0)}°`).join("  "));
console.log(`visitors: ${visitors.map((v) => `${v.who} → ${v.place}`).join(", ")}`);
console.log(`nests: ${nests.length} in trees ${nests.map((n) => n.tree).join(", ")} at ${nests.map((n) => n.world[1].toFixed(2)).join("/")} m`);
console.log(warn.length ? "WARNINGS:\n  " + warn.join("\n  ") : "no warnings");

// ---- SVG --------------------------------------------------------------
const S = 800;
const sx = (x) => ((x + ext) / (2 * ext)) * S;
const sz = (z) => ((z + ext) / (2 * ext)) * S;
const sr = (r) => (r / (2 * ext)) * S;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" font-family="monospace" font-size="11">\n<rect width="${S}" height="${S}" fill="#8ec5d6"/>\n<circle cx="${sx(0)}" cy="${sz(0)}" r="${sr(R)}" fill="#a6c48a" stroke="#d9b48a" stroke-width="6"/>\n`;
svg += `<polyline points="${[...path, path[0]].map((p) => `${sx(p[0])},${sz(p[1])}`).join(" ")}" fill="none" stroke="#e6d3b1" stroke-width="${sr(ISLAND.pathWidth)}" stroke-linejoin="round"/>\n`;
for (const spur of ISLAND.spurs || []) svg += `<polyline points="${spur.map((p) => `${sx(p[0])},${sz(p[1])}`).join(" ")}" fill="none" stroke="#e6d3b1" stroke-width="${sr(ISLAND.pathWidth)}"/>\n`;
for (const f of feet) svg += `<circle cx="${sx(f.x)}" cy="${sz(f.z)}" r="${sr(f.r)}" fill="rgba(200,120,80,0.25)" stroke="#c2705a"/>\n`;
for (const t of trees) svg += `<circle cx="${sx(t.x)}" cy="${sz(t.z)}" r="${sr(t.r)}" fill="#7fb07a" stroke="#4a3324"/>\n`;
for (const l of lamps) svg += `<circle cx="${sx(l.x)}" cy="${sz(l.z)}" r="4" fill="#ffd27a" stroke="#4b5450"/>\n`;
for (const n of nests) svg += `<circle cx="${sx(n.world[0])}" cy="${sz(n.world[2])}" r="3" fill="#8c6543" stroke="#ffb347"/>\n`;
for (const v of visitors) svg += `<circle cx="${sx(v.x)}" cy="${sz(v.z)}" r="4" fill="none" stroke="#2b4bc2" stroke-width="1.5" stroke-dasharray="2 2"/>\n`;
for (const lm of LANDMARKS) {
  svg += `<text x="${sx(lm.at[0])}" y="${sz(lm.at[2]) - 6}" text-anchor="middle" font-weight="bold">${lm.id}</text>\n`;
  for (const [x, z] of lm.stand.via || []) svg += `<circle cx="${sx(x)}" cy="${sz(z)}" r="3.5" fill="none" stroke="#2b4bc2" stroke-width="1.5"/>\n`;
  svg += `<circle cx="${sx(lm.stand.at[0])}" cy="${sz(lm.stand.at[1])}" r="5" fill="#2b4bc2"/>\n`;
}
svg += `<circle cx="${sx(AVATAR.home.at[0])}" cy="${sz(AVATAR.home.at[1])}" r="5" fill="#2b4bc2" stroke="#fff"/>\n`;
svg += `<circle cx="${sx(camXZ[0])}" cy="${sz(camXZ[1])}" r="7" fill="#18201d"/><text x="${sx(camXZ[0]) + 10}" y="${sz(camXZ[1]) + 4}">camera</text>\n</svg>\n`;
writeFileSync(new URL("./map.svg", import.meta.url), svg);
