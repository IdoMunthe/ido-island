// Draws the owl's flight (the same maths the scene runs, src/three/life/
// flight.js) from the overview camera: a top-down view and a side
// elevation with the island, the perch, the camera and speed ticks along
// the path, plus graphs of bank, pitch, flap amplitude and speed over
// time, for the way in and the way out. Warns if it dives into the ground
// or through a place, or leaves the camera's view.
// Run:  node scripts/flightplot.mjs   (writes scripts/flight.svg)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { ISLAND, LANDMARKS, CAMERA, OWL } from "../src/three/island.config.js";
import { makeFlight } from "../src/three/life/flight.js";

const lm = LANDMARKS.find((l) => l.id === OWL.perch.landmark);
const [lx, ly, lz] = OWL.perch.local;
const c = Math.cos(lm.rotation || 0);
const s = Math.sin(lm.rotation || 0);
const perch = new THREE.Vector3(lm.at[0] + lx * c + lz * s, lm.at[1] + ly, lm.at[2] - lx * s + lz * c);
const ov = CAMERA.overview;
const target = new THREE.Vector3(...ov.target);
const camPos = new THREE.Vector3(target.x + ov.distance * Math.sin(ov.polar) * Math.sin(ov.azimuth), target.y + ov.distance * Math.cos(ov.polar), target.z + ov.distance * Math.sin(ov.polar) * Math.cos(ov.azimuth));
const cam = new THREE.PerspectiveCamera(CAMERA.fov, 16 / 9, 0.1, 120);
cam.position.copy(camPos);
cam.lookAt(target);
cam.updateMatrixWorld();
cam.updateProjectionMatrix();
const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));

const warn = [];
const runs = ["in", "out"].map((mode) => {
  const f = makeFlight({ camPos, perch, mode });
  const rows = [];
  for (let t = 0; t <= f.duration + 1e-6; t += 0.05) rows.push({ t, ...f.sample(t, {}) , pos: f.sample(t, {}).pos.clone() });
  let acc = 0;
  rows.forEach((r, i) => {
    if (i) acc += r.pos.distanceTo(rows[i - 1].pos);
    r.dist = acc;
  });
  const minY = Math.min(...rows.map((r) => r.pos.y));
  const maxRoll = Math.max(...rows.map((r) => Math.abs(r.roll)));
  const glide = rows.filter((r) => r.flapAmp < 0.02).length / rows.length;
  const outOfView = rows.filter((r) => !frustum.containsPoint(r.pos)).length / rows.length;
  if (minY < 0.6) warn.push(`${mode}: dives to y ${minY.toFixed(2)} m — that's the ground`);
  for (const l of LANDMARKS) {
    if (l.id === OWL.perch.landmark) continue;
    let worst = null;
    for (const r of rows) {
      const d = Math.hypot(r.pos.x - l.at[0], r.pos.z - l.at[2]);
      // below the top of what stands there (the torii is the only tall thing)
      const top = l.id === "heading" ? 3.0 : 2.3;
      if (r.pos.y < top && d < 1.5 && (!worst || d < worst.d)) worst = { d, r };
    }
    if (worst) warn.push(`${mode}: passes ${worst.d.toFixed(1)} m from ${l.id} at ${worst.r.pos.y.toFixed(1)} m up (t ${worst.r.t.toFixed(1)} s)`);
  }
  if (outOfView > 0.1) warn.push(`${mode}: ${(outOfView * 100).toFixed(0)}% of the flight is outside the overview camera's view`);
  console.log(`${mode}: ${f.duration} s, ${f.length.toFixed(1)} m, avg ${(f.length / f.duration).toFixed(1)} m/s, max bank ${((maxRoll * 180) / Math.PI).toFixed(0)}°, gliding ${(glide * 100).toFixed(0)}% of the time, lowest ${minY.toFixed(2)} m, ${(outOfView * 100).toFixed(0)}% out of view`);
  return { mode, f, rows, color: mode === "in" ? "#c8452b" : "#2b4bc2" };
});

// ---- SVG
const W = 1200;
const H = 1160;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Menlo, Consolas, monospace" font-size="11">\n<rect width="${W}" height="${H}" fill="#f8f4ea"/>\n`;
const R = ISLAND.radius;
// top-down: x right, z down, 26 px per metre, centred on the island
const tx = (x) => 320 + x * 24;
const tz = (z) => 300 + z * 24;
svg += `<text x="20" y="24" font-size="14">top-down · ticks every 0.5 s (longer = faster) · red = in, blue = out · ○ camera · ● perch</text>\n`;
svg += `<circle cx="${tx(0)}" cy="${tz(0)}" r="${R * 24}" fill="#cfe0b8" stroke="#8fae8a"/>\n`;
for (const l of LANDMARKS) svg += `<circle cx="${tx(l.at[0])}" cy="${tz(l.at[2])}" r="4" fill="#8c6543"/><text x="${tx(l.at[0]) + 6}" y="${tz(l.at[2]) + 4}" fill="#4b5450">${l.id}</text>\n`;
svg += `<circle cx="${tx(perch.x)}" cy="${tz(perch.z)}" r="5" fill="#18201d"/>\n`;
svg += `<circle cx="${tx(camPos.x)}" cy="${tz(camPos.z)}" r="6" fill="none" stroke="#18201d" stroke-width="2"/><text x="${tx(camPos.x) + 9}" y="${tz(camPos.z) + 4}">camera</text>\n`;
for (const run of runs) {
  svg += `<polyline fill="none" stroke="${run.color}" stroke-width="1.5" points="${run.rows.map((r) => `${tx(r.pos.x).toFixed(1)},${tz(r.pos.z).toFixed(1)}`).join(" ")}"/>\n`;
  for (const r of run.rows) {
    if (Math.abs((r.t / 0.5) - Math.round(r.t / 0.5)) > 1e-6) continue;
    const len = 3 + r.speed * 2.2;
    const nx = -Math.cos(r.yaw) * len; // perpendicular to heading (heading = (sin yaw, cos yaw))
    const nz = Math.sin(r.yaw) * len;
    svg += `<line x1="${(tx(r.pos.x) - nx / 2).toFixed(1)}" y1="${(tz(r.pos.z) - nz / 2).toFixed(1)}" x2="${(tx(r.pos.x) + nx / 2).toFixed(1)}" y2="${(tz(r.pos.z) + nz / 2).toFixed(1)}" stroke="${run.color}" stroke-width="${r.flapAmp > 0.02 ? 2.5 : 1}"/>\n`;
  }
  const p0 = run.rows[0].pos;
  svg += `<text x="${tx(p0.x) + 6}" y="${tz(p0.z) - 6}" fill="${run.color}">${run.mode} starts</text>\n`;
}
// side elevation: distance along the path vs height
const sx0 = 680;
const sy0 = 470;
const sScale = 22;
svg += `<text x="${sx0}" y="24" font-size="14">side elevation · distance along path vs height · thick = flapping</text>\n`;
svg += `<line x1="${sx0}" y1="${sy0}" x2="${W - 20}" y2="${sy0}" stroke="#8c6543"/><text x="${sx0}" y="${sy0 + 14}">ground</text>\n`;
svg += `<line x1="${sx0}" y1="${sy0 - perch.y * sScale}" x2="${W - 20}" y2="${sy0 - perch.y * sScale}" stroke="#18201d" stroke-dasharray="3 3"/><text x="${sx0}" y="${sy0 - perch.y * sScale - 4}">perch ${perch.y.toFixed(2)} m</text>\n`;
for (const run of runs) {
  const maxD = run.rows[run.rows.length - 1].dist;
  const px = (d) => sx0 + (d / maxD) * (W - 20 - sx0);
  for (let i = 1; i < run.rows.length; i++) {
    const a = run.rows[i - 1];
    const b = run.rows[i];
    svg += `<line x1="${px(a.dist).toFixed(1)}" y1="${(sy0 - a.pos.y * sScale).toFixed(1)}" x2="${px(b.dist).toFixed(1)}" y2="${(sy0 - b.pos.y * sScale).toFixed(1)}" stroke="${run.color}" stroke-width="${b.flapAmp > 0.02 ? 3 : 1.2}"/>\n`;
  }
}
// graphs
const graphs = [
  ["bank (°)", (r) => (r.roll * 180) / Math.PI, 60],
  ["pitch (°, − = nose up)", (r) => (r.pitch * 180) / Math.PI, 60],
  ["flap amplitude", (r) => r.flapAmp, 1],
  ["speed (m/s)", (r) => r.speed, 8],
];
graphs.forEach(([label, fn, range], gi) => {
  const gy = 640 + gi * 125;
  const gh = 100;
  svg += `<text x="20" y="${gy - 6}">${label}</text>\n<line x1="20" y1="${gy + gh / 2}" x2="${W - 20}" y2="${gy + gh / 2}" stroke="#ddd"/>\n<rect x="20" y="${gy}" width="${W - 40}" height="${gh}" fill="none" stroke="#ccc"/>\n`;
  for (const run of runs) {
    const maxT = Math.max(...runs.map((q) => q.f.duration));
    const pts = run.rows.map((r) => `${(20 + (r.t / maxT) * (W - 40)).toFixed(1)},${(gy + gh / 2 - (fn(r) / range) * (gh / 2)).toFixed(1)}`).join(" ");
    svg += `<polyline fill="none" stroke="${run.color}" stroke-width="1.5" points="${pts}"/>\n`;
  }
  for (let sec = 0; sec <= Math.max(...runs.map((q) => q.f.duration)); sec += 1) {
    const maxT = Math.max(...runs.map((q) => q.f.duration));
    const x = 20 + (sec / maxT) * (W - 40);
    svg += `<line x1="${x.toFixed(1)}" y1="${gy + gh}" x2="${x.toFixed(1)}" y2="${gy + gh + 4}" stroke="#888"/><text x="${x.toFixed(1)}" y="${gy + gh + 14}" text-anchor="middle">${sec}s</text>\n`;
  }
});
svg += `<text x="20" y="${H - 12}" fill="#4b5450">${warn.length ? warn.join(" · ") : "no warnings"}</text>\n</svg>\n`;
const out = fileURLToPath(new URL("./flight.svg", import.meta.url));
writeFileSync(out, svg);
console.log(`wrote ${out}`);
if (warn.length) {
  console.log("WARNINGS:\n  " + warn.join("\n  "));
  process.exit(1);
}
console.log("flight: no warnings");
