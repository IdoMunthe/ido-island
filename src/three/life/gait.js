// The one procedural walk (and sit) everyone on the island uses — the
// user's figure and the family alike, so they move the same way. Pure
// functions on plain numbers: the callers own their state and rigs.
import { AVATAR } from "../island.config.js";

const TAU = Math.PI * 2;

// Limb targets for one moment of the walk cycle. `phase` advances by
// speed × AVATAR.stepsPerMetre × 2π per second of walking.
export function walkPose(phase, out = {}) {
  const sw = Math.sin(phase);
  out.legL = sw * 0.6;
  out.legR = -sw * 0.6;
  // the knee bends while the leg swings forward, straight while it bears weight
  out.kneeL = 0.55 * Math.max(0, -Math.sin(phase + 0.8));
  out.kneeR = 0.55 * Math.max(0, Math.sin(phase + 0.8));
  out.armL = -sw * 0.45;
  out.armR = sw * 0.45;
  out.bodyY = Math.abs(sw) * AVATAR.bob;
  out.bodyRx = 0.08;
  return out;
}

// Advance a walk phase for a step of `dist` metres.
export function advancePhase(phase, dist) {
  return phase + dist * AVATAR.stepsPerMetre * TAU;
}

// Sitting with the hips `h` above the floor: thighs forward, knees bent so
// the shins drop straight to the floor (feet flat). Returns the hip angle;
// use it as -angle at the hip and +angle at the knee. On a seat lower than
// the shin the knees simply come up.
export function sitAngle(h, thigh, shin) {
  return Math.acos(Math.max(-1, Math.min(1, (h - shin) / thigh)));
}

// Turn `cur` toward `target` by fraction k, the short way round.
export function angleTowards(cur, target, k) {
  let d = target - cur;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  return cur + d * k;
}

export const damp = (cur, target, k) => cur + (target - cur) * k;
