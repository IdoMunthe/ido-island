// The arrival camera path: keyframes in INTRO.camera.keys (spherical around
// a landmark, like the card cameras) then the overview, as one smooth eased
// curve. Pure three maths shared by the scene and scripts/introplot.mjs.
import * as THREE from "three";
import { INTRO, CAMERA, LANDMARKS } from "./island.config.js";

function poseOf(key, aspectPush = 1) {
  const lm = key.landmark ? LANDMARKS.find((l) => l.id === key.landmark) : null;
  const at = lm ? lm.at : [0, 0, 0];
  const target = new THREE.Vector3(at[0] + key.lookAt[0], at[1] + key.lookAt[1], at[2] + key.lookAt[2]);
  const d = key.distance * aspectPush;
  const position = new THREE.Vector3(target.x + d * Math.sin(key.polar) * Math.sin(key.azimuth), target.y + d * Math.cos(key.polar), target.z + d * Math.sin(key.polar) * Math.cos(key.azimuth));
  return { target, position };
}

// Builds the smooth camera move from the keyframes in INTRO.camera.keys to
// the overview; returns a sampler over 0…INTRO.camera.seconds.
export function makeIntroCamera(aspectPush = 1) {
  const keys = [...INTRO.camera.keys.map((k) => poseOf(k, 1)), poseOf({ ...CAMERA.overview, lookAt: CAMERA.overview.target }, aspectPush)];
  const positions = new THREE.CatmullRomCurve3(keys.map((k) => k.position), false, "centripetal", 0.5);
  const targets = new THREE.CatmullRomCurve3(keys.map((k) => k.target), false, "centripetal", 0.5);
  const duration = INTRO.camera.seconds;
  // ease in, then decelerate into the overview rather than stopping dead
  const progress = (s) => {
    const e = s * s * (3 - 2 * s);
    return 1 - Math.pow(1 - e, INTRO.camera.easeOut);
  };
  const sample = (t, out = {}) => {
    const s = THREE.MathUtils.clamp(t / duration, 0, 1);
    const u = progress(s);
    out.position = positions.getPoint(u, out.position || new THREE.Vector3());
    out.target = targets.getPoint(u, out.target || new THREE.Vector3());
    out.s = s;
    return out;
  };
  return { keys, duration, sample };
}
