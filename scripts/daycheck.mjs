// Steps the automatic day over simulated time and prints the hour, the
// sun's elevation and its colour, so the cycle can be proven to advance
// without a browser.   Run:  node scripts/daycheck.mjs
import * as THREE from "three";
import { DAY } from "../src/three/island.config.js";
import { autoHour, sunFor, sample, makeFrame } from "../src/three/sky/daymath.js";

const start = 14.0;
const dir = new THREE.Vector3();
const frame = makeFrame();
const rows = [];
let prevHour = null;
let stuck = 0;
for (let s = 0; s <= DAY.cycleMinutes * 60; s += 10) {
  const h = autoHour(start, s);
  const el = sunFor(h, dir);
  sample(h, frame);
  if (prevHour !== null && Math.abs(h - prevHour) < 1e-6) stuck++;
  prevHour = h;
  rows.push(`${String(s).padStart(4)} s  hour ${h.toFixed(2).padStart(5)}  sun elev ${((el * 180) / Math.PI).toFixed(1).padStart(6)}°  dir (${dir.x.toFixed(2)}, ${dir.y.toFixed(2)}, ${dir.z.toFixed(2)})  sun #${frame.sun.getHexString()}  night ${frame.night.toFixed(2)}`);
}
console.log(`cycle: ${DAY.cycleMinutes} min per day = ${(24 / (DAY.cycleMinutes * 60) * 60).toFixed(1)} minutes of daylight per real second`);
console.log(rows.filter((_, i) => i % 3 === 0).join("\n"));
// per-second change at noon: how far the sun moves in 10 s
const h0 = autoHour(11.5, 0);
const h1 = autoHour(11.5, 10);
const d0 = new THREE.Vector3();
const d1 = new THREE.Vector3();
sunFor(h0, d0);
sunFor(h1, d1);
console.log(`over 10 s around noon the sun direction turns ${((Math.acos(Math.min(1, d0.dot(d1))) * 180) / Math.PI).toFixed(1)}°`);
// how long the two transitions people actually watch take in real seconds
const secPerHour = (DAY.cycleMinutes * 60) / 24;
const span = (a, b) => ((b - a) * secPerHour).toFixed(1);
console.log(`per real second: ${(1 / secPerHour).toFixed(2)} h of day, sun turns ${((Math.acos(Math.min(1, d0.dot(d1))) * 180) / Math.PI / 10).toFixed(1)}°`);
console.log(`dawn (05:00→08:00) takes ${span(5, 8)} s, its pink core (05:00→06:18) ${span(5, 6.3)} s; dusk (16:30→20:18) takes ${span(16.5, 20.3)} s, golden hour to violet (17:54→19:00) ${span(17.9, 19.0)} s, violet to night (19:00→20:18) ${span(19.0, 20.3)} s`);
console.log(stuck ? `FAIL: hour did not advance on ${stuck} steps` : "OK: the hour advances every step and wraps at 24");
