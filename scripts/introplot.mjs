// Draws the arrival shot — the camera's path (src/three/intro.js, the very
// code the scene plays) and the figure's walk (the real routing in
// src/three/life/routing.js) — top-down and side-on with time ticks, so
// the two can be checked against each other and against the island
// without a browser. Warns if the camera goes through the ground, the
// water or a place, or if he arrives long before or after the camera
// settles. Run:  node scripts/introplot.mjs   (writes scripts/intro.svg)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { ISLAND, LANDMARKS, AVATAR, INTRO } from "../src/three/island.config.js";
import { makeIntroCamera } from "../src/three/introPath.js";
import { buildRoute, routeLength, pointAt } from "../src/three/life/routing.js";

const warn = [];
const R = ISLAND.radius;

// ---- the camera
const cam = makeIntroCamera(1);
const camRows = [];
for (let t = 0; t <= cam.duration + 1e-6; t += 0.1) {
  const s = cam.sample(t, {});
  camRows.push({ t, p: s.position.clone(), q: s.target.clone() });
}
for (const r of camRows) {
  const d = Math.hypot(r.p.x, r.p.z);
  if (d < R + 0.6 && r.p.y < 0.6) {
    warn.push(`camera goes through the island at t ${r.t.toFixed(1)} s (y ${r.p.y.toFixed(2)})`);
    break;
  }
}
for (const r of camRows) {
  if (r.p.y < 0.25) {
    warn.push(`camera goes into the water at t ${r.t.toFixed(1)} s (y ${r.p.y.toFixed(2)})`);
    break;
  }
}
// every footprint circle (posts, pillars, buildings), in world space
for (const l of LANDMARKS) {
  const cs = Math.cos(l.rotation || 0);
  const sn = Math.sin(l.rotation || 0);
  const top = l.id === "heading" ? 3.0 : 2.3;
  let worst = null;
  for (const [dx, dz, rad] of l.footprint || []) {
    const fx = l.at[0] + dx * cs + dz * sn;
    const fz = l.at[2] - dx * sn + dz * cs;
    for (const r of camRows) {
      const d = Math.hypot(r.p.x - fx, r.p.z - fz) - rad;
      if (d < 0.5 && r.p.y < top && (!worst || d < worst.d)) worst = { d, r };
    }
  }
  if (worst) warn.push(`camera passes ${Math.max(0, worst.d).toFixed(2)} m from ${l.id} at ${worst.r.p.y.toFixed(1)} m up (t ${worst.r.t.toFixed(1)} s)`);
}

// ---- the walk: from the end of the jetty, out through the gate, up the
// path to home — the same routing the figure uses
const gate = LANDMARKS.find((l) => l.id === "gate");
const start = new THREE.Vector2(INTRO.walk.from[0], INTRO.walk.from[1]);
const outVia = [...(gate.stand.via || [])].reverse().map(([x, z]) => new THREE.Vector2(x, z));
const home = new THREE.Vector2(AVATAR.home.at[0], AVATAR.home.at[1]);
const mid = buildRoute(outVia.length ? outVia[outVia.length - 1] : start, home, "gate", null);
const route = [start, ...outVia, ...mid];
const walkLen = routeLength(route);
const walkSeconds = walkLen / INTRO.walk.speed;
const arrival = INTRO.walk.delay + walkSeconds;
const walkRows = [];
const tmp = new THREE.Vector2();
for (let t = 0; t <= arrival + 1e-6; t += 0.1) {
  const d = Math.max(0, Math.min(walkLen, (t - INTRO.walk.delay) * INTRO.walk.speed));
  pointAt(route, d, tmp, null);
  walkRows.push({ t, x: tmp.x, z: tmp.y });
}
if (Math.abs(arrival - cam.duration) > 1.5) warn.push(`he arrives at ${arrival.toFixed(1)} s but the camera settles at ${cam.duration.toFixed(1)} s`);
console.log(`camera: ${cam.duration} s over ${camRows.reduce((a, r, i) => (i ? a + r.p.distanceTo(camRows[i - 1].p) : 0), 0).toFixed(1)} m, from (${camRows[0].p.toArray().map((v) => v.toFixed(1)).join(", ")}) to (${camRows[camRows.length - 1].p.toArray().map((v) => v.toFixed(1)).join(", ")})`);
console.log(`walk: ${walkLen.toFixed(1)} m at ${INTRO.walk.speed} m/s, sets off at ${INTRO.walk.delay} s, home at ${arrival.toFixed(1)} s (${route.length} route points)`);

// ---- SVG
const W = 1200;
const H = 900;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Menlo, Consolas, monospace" font-size="11">\n<rect width="${W}" height="${H}" fill="#f8f4ea"/>\n`;
const tx = (x) => 330 + x * 22;
const tz = (z) => 330 + z * 22;
svg += `<text x="20" y="24" font-size="14">arrival · top-down · blue = camera (○ start), green = his walk (● start) · ticks every second</text>\n`;
svg += `<circle cx="${tx(0)}" cy="${tz(0)}" r="${R * 22}" fill="#cfe0b8" stroke="#8fae8a"/>\n`;
for (const l of LANDMARKS) svg += `<circle cx="${tx(l.at[0])}" cy="${tz(l.at[2])}" r="4" fill="#8c6543"/><text x="${tx(l.at[0]) + 6}" y="${tz(l.at[2]) + 4}" fill="#4b5450">${l.id}</text>\n`;
svg += `<polyline fill="none" stroke="#2b4bc2" stroke-width="1.5" points="${camRows.map((r) => `${tx(r.p.x).toFixed(1)},${tz(r.p.z).toFixed(1)}`).join(" ")}"/>\n`;
svg += `<polyline fill="none" stroke="#2b4bc2" stroke-width="0.7" stroke-dasharray="3 3" points="${camRows.map((r) => `${tx(r.q.x).toFixed(1)},${tz(r.q.z).toFixed(1)}`).join(" ")}"/>\n`;
svg += `<circle cx="${tx(camRows[0].p.x)}" cy="${tz(camRows[0].p.z)}" r="6" fill="none" stroke="#2b4bc2" stroke-width="2"/>\n`;
svg += `<polyline fill="none" stroke="#2f8f4e" stroke-width="2" points="${walkRows.map((r) => `${tx(r.x).toFixed(1)},${tz(r.z).toFixed(1)}`).join(" ")}"/>\n`;
svg += `<circle cx="${tx(walkRows[0].x)}" cy="${tz(walkRows[0].z)}" r="5" fill="#2f8f4e"/>\n`;
for (const r of camRows) if (Math.abs(r.t - Math.round(r.t)) < 1e-6) svg += `<circle cx="${tx(r.p.x).toFixed(1)}" cy="${tz(r.p.z).toFixed(1)}" r="3" fill="#2b4bc2"/><text x="${tx(r.p.x) + 5}" y="${tz(r.p.z) - 4}" fill="#2b4bc2">${r.t}s</text>\n`;
for (const r of walkRows) if (Math.abs(r.t - Math.round(r.t)) < 1e-6) svg += `<circle cx="${tx(r.x).toFixed(1)}" cy="${tz(r.z).toFixed(1)}" r="3" fill="#2f8f4e"/><text x="${tx(r.x) + 5}" y="${tz(r.z) + 12}" fill="#2f8f4e">${r.t}s</text>\n`;
// side: time vs height (camera) with the island's ground and the camera's distance from the centre
const sx0 = 700;
const sy0 = 380;
svg += `<text x="${sx0}" y="24" font-size="14">camera height (solid) and distance from the island centre (dashed) over time</text>\n`;
svg += `<line x1="${sx0}" y1="${sy0}" x2="${W - 20}" y2="${sy0}" stroke="#8c6543"/><text x="${sx0}" y="${sy0 + 14}">ground / 0 m</text>\n`;
const px = (t) => sx0 + (t / cam.duration) * (W - 20 - sx0);
svg += `<polyline fill="none" stroke="#2b4bc2" stroke-width="1.5" points="${camRows.map((r) => `${px(r.t).toFixed(1)},${(sy0 - r.p.y * 22).toFixed(1)}`).join(" ")}"/>\n`;
svg += `<polyline fill="none" stroke="#2b4bc2" stroke-width="1" stroke-dasharray="4 3" points="${camRows.map((r) => `${px(r.t).toFixed(1)},${(sy0 - Math.hypot(r.p.x, r.p.z) * 12).toFixed(1)}`).join(" ")}"/>\n`;
svg += `<line x1="${px(arrival)}" y1="${sy0 - 300}" x2="${px(arrival)}" y2="${sy0}" stroke="#2f8f4e" stroke-dasharray="2 2"/><text x="${px(arrival) + 4}" y="${sy0 - 290}" fill="#2f8f4e">he is home</text>\n`;
for (let s = 0; s <= cam.duration; s++) svg += `<text x="${px(s)}" y="${sy0 + 28}" text-anchor="middle">${s}s</text>\n`;
svg += `<text x="20" y="${H - 12}" fill="#4b5450">${warn.length ? warn.join(" · ") : "no warnings"}</text>\n</svg>\n`;
const out = fileURLToPath(new URL("./intro.svg", import.meta.url));
writeFileSync(out, svg);
console.log(`wrote ${out}`);
if (warn.length) {
  console.log("WARNINGS:\n  " + warn.join("\n  "));
  process.exit(1);
}
console.log("intro: no warnings");
