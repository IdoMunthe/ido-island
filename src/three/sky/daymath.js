// The pure arithmetic of the day: hour → sun direction and the blended
// keyframe (colours, intensities). No React, no renderer, so Node can run
// it too (scripts/daycheck.mjs steps it over simulated time).
import * as THREE from "three";
import { DAY } from "../island.config.js";

const KF = DAY.keyframes;
const colorA = new THREE.Color();
const colorB = new THREE.Color();

function lerpColor(out, a, b, t) {
  colorA.set(a);
  colorB.set(b);
  out.lerpColors(colorA, colorB, t);
  return out;
}

export function makeFrame() {
  return {
    sunIntensity: 0,
    moonIntensity: 0,
    hemiIntensity: 1,
    ambient: 0.3,
    exposure: 1,
    turbidity: 3,
    rayleigh: 1,
    night: 0,
    sun: new THREE.Color(),
    hemiSky: new THREE.Color(),
    hemiGround: new THREE.Color(),
    fog: new THREE.Color(),
  };
}

// Interpolate the keyframes at `hour` into `frame` (mutates, returns it).
export function sample(hour, frame) {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KF.length - 2 && KF[i + 1].hour <= h) i++;
  const a = KF[i];
  const b = KF[i + 1];
  const t = THREE.MathUtils.clamp((h - a.hour) / Math.max(1e-4, b.hour - a.hour), 0, 1);
  const s = t * t * (3 - 2 * t);
  const num = (k) => a[k] + (b[k] - a[k]) * s;
  frame.sunIntensity = num("sunIntensity");
  frame.moonIntensity = num("moonIntensity");
  frame.hemiIntensity = num("hemiIntensity");
  frame.ambient = num("ambient");
  frame.exposure = num("exposure");
  frame.turbidity = num("turbidity");
  frame.rayleigh = num("rayleigh");
  frame.night = num("night");
  lerpColor(frame.sun, a.sun, b.sun, s);
  lerpColor(frame.hemiSky, a.hemiSky, b.hemiSky, s);
  lerpColor(frame.hemiGround, a.hemiGround, b.hemiGround, s);
  lerpColor(frame.fog, a.fog, b.fog, s);
  return frame;
}

// Where the sun is for a given hour: east at sunrise, west at sunset,
// below the horizon at night. Writes a unit direction into `dir` and
// returns the elevation (radians).
export function sunFor(hour, dir) {
  const dayLen = DAY.sunset - DAY.sunrise;
  const h = ((hour % 24) + 24) % 24;
  let f;
  let el;
  if (h >= DAY.sunrise && h <= DAY.sunset) {
    f = (h - DAY.sunrise) / dayLen;
    el = Math.sin(f * Math.PI) * (Math.PI / 2) * (1 - DAY.sunArcTilt);
  } else {
    const nightLen = 24 - dayLen;
    const since = h > DAY.sunset ? h - DAY.sunset : h + 24 - DAY.sunset;
    f = 1 + since / nightLen;
    el = -Math.sin((f - 1) * Math.PI) * 0.7;
  }
  const az = Math.PI * f; // 0 = east (+x), π = west (−x)
  const ce = Math.cos(el);
  dir.set(ce * Math.cos(az), Math.sin(el), ce * (0.35 + 0.45 * Math.abs(Math.sin(az)))).normalize();
  return el;
}

// The automatic day: starts at `startHour` and runs a full 24 hours every
// DAY.cycleMinutes real minutes. `elapsed` is seconds since the start.
export function autoHour(startHour, elapsed, cycleMinutes = DAY.cycleMinutes) {
  const perSecond = 24 / (cycleMinutes * 60);
  return (((startHour + elapsed * perSecond) % 24) + 24) % 24;
}

export function localHourNow(d = new Date()) {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}
