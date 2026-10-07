// The owl's flight, as pure maths so the scene and scripts/flightplot.mjs
// run the very same code. `makeFlight` builds the path from where the
// camera is right now and returns a sampler: at time t it gives position,
// heading, pitch, bank (from the path's curvature, leading the turn a
// little), speed, the wing-stroke phase and amplitude (bursts of flapping
// with real glides, slowing on approach) and which stage of the flight it
// is in. Every number comes from OWL.flight in island.config.js.
import * as THREE from "three";
import { OWL } from "../island.config.js";

const UP = new THREE.Vector3(0, 1, 0);
const TWO_PI = Math.PI * 2;

// Fractions of the flight during which the wings beat, with an amplitude:
// [from, to, amplitude]. Outside these the bird glides.
function flapAt(bursts, s) {
  let a = 0;
  for (const [from, to, amp] of bursts) {
    if (s < from - 0.04 || s > to + 0.04) continue;
    // ease the burst in and out over 4 % of the flight
    const inE = THREE.MathUtils.smoothstep(s, from - 0.04, from + 0.02);
    const outE = 1 - THREE.MathUtils.smoothstep(s, to - 0.02, to + 0.04);
    a = Math.max(a, amp * Math.min(inE, outE));
  }
  return a;
}

// Control points for the way in: far, high and off to one side of the
// perch as seen from the camera, crossing the sky, descending, dipping
// below the perch in front of it and swooping up onto it — with an S in
// it (one way, then the other) so it reads as flown, not aimed.
function pointsIn(cam, perch, F) {
  const fwd = new THREE.Vector3().subVectors(perch, cam).setY(0).normalize(); // camera → perch
  const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
  const side = F.side >= 0 ? 1 : -1;
  const p = (f, r, h) => perch.clone().addScaledVector(fwd, f).addScaledVector(right, r * side).add(new THREE.Vector3(0, h, 0));
  return [
    p(-F.entryBack, F.entryDistance, F.entryHeight), // far out to the side, high
    p(-F.entryBack * 0.9, F.entryDistance * 0.55, F.entryHeight * 0.62), // crossing the sky
    p(-F.approachBack * 1.25, F.entryDistance * 0.18, F.entryHeight * 0.22), // banking round
    p(-F.approachBack, -F.sCross, -F.dip), // the dip, below the perch, on the far side of the S
    p(-F.approachBack * 0.42, -F.sCross * 0.35, 0.05), // climbing in
    p(0, 0, F.hoverHeight), // the hover just above the perch
  ];
}

// The way out at dawn: a hop up off the perch, a banking climb out on the
// side the swoop came from, and away high.
function pointsOut(cam, perch, F) {
  const fwd = new THREE.Vector3().subVectors(perch, cam).setY(0).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
  const side = F.side >= 0 ? 1 : -1;
  const p = (f, r, h) => perch.clone().addScaledVector(fwd, f).addScaledVector(right, r * side).add(new THREE.Vector3(0, h, 0));
  return [
    p(0, 0, F.hoverHeight),
    p(-F.approachBack * 0.5, -F.sCross * 0.6, 0.3),
    p(-F.approachBack * 1.0, -F.sCross * 1.4, F.entryHeight * 0.28),
    p(-F.entryBack * 0.9, -F.entryDistance * 0.55, F.entryHeight * 0.65),
    p(-F.entryBack, -F.entryDistance, F.entryHeight),
  ];
}

export function makeFlight({ camPos, perch, mode = "in", F = OWL.flight }) {
  const pts = mode === "in" ? pointsIn(camPos, perch, F) : pointsOut(camPos, perch, F);
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
  const duration = mode === "in" ? F.duration : F.leaveDuration;
  const bursts = mode === "in" ? F.flapBursts : F.leaveBursts;
  const length = curve.getLength();

  // progress along the path: unhurried, bleeding speed into the perch on
  // the way in; accelerating away on the way out
  const progress = (s) => (mode === "in" ? 1 - Math.pow(1 - s, F.approachEase) : Math.pow(s, F.departEase));

  // stroke phase, integrated once: the rate slows toward the end of the
  // approach and the wings only beat during bursts
  const N = 600;
  const phaseTable = new Float32Array(N + 1);
  let acc = 0;
  for (let i = 1; i <= N; i++) {
    const s = i / N;
    const dt = duration / N;
    const rate = F.flapRate * (mode === "in" ? 1 - (1 - F.flapRateApproach) * s : 1 + 0.15 * (1 - s));
    const amp = flapAt(bursts, s);
    acc += amp > 0.02 ? rate * TWO_PI * dt : 0;
    phaseTable[i] = acc;
  }

  const tmpP = new THREE.Vector3();
  const tmpT = new THREE.Vector3();
  const tmpT2 = new THREE.Vector3();

  function sample(t, out = {}) {
    const s = THREE.MathUtils.clamp(t / duration, 0, 1);
    const u = progress(s);
    curve.getPoint(u, tmpP);
    curve.getTangent(u, tmpT);
    const yaw = Math.atan2(tmpT.x, tmpT.z);
    const pitchPath = -Math.atan2(tmpT.y, Math.hypot(tmpT.x, tmpT.z)); // nose down = +x rotation
    // speed (m/s) from the progress curve
    const ds = 1e-3;
    const du = (progress(Math.min(1, s + ds)) - progress(Math.max(0, s - ds))) / (2 * ds);
    const speed = (du * length) / duration;
    // bank from the rate of turn a little ahead (the roll leads the turn)
    const lead = F.rollLead;
    const uL = Math.min(1, progress(Math.min(1, s + lead)));
    curve.getTangent(uL, tmpT2);
    let dyaw = Math.atan2(tmpT2.x, tmpT2.z) - yaw;
    dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
    const yawRate = dyaw / Math.max(1e-3, lead * duration);
    const roll = THREE.MathUtils.clamp(-yawRate * F.rollGain, -F.maxRoll, F.maxRoll);
    // stroke
    const idx = s * N;
    const i0 = Math.floor(idx);
    const phase = i0 >= N ? phaseTable[N] : phaseTable[i0] + (phaseTable[i0 + 1] - phaseTable[i0]) * (idx - i0);
    const flapAmp = flapAt(bursts, s);
    // stages
    let stage = flapAmp > 0.02 ? "flap" : "glide";
    let flare = 0;
    if (mode === "in" && s >= F.flareFrom) {
      flare = THREE.MathUtils.smoothstep(s, F.flareFrom, Math.min(1, F.flareFrom + 0.1));
      stage = "flare";
    }
    if (mode === "out" && s < 0.1) stage = "takeoff";
    out.s = s;
    out.u = u;
    out.pos = out.pos ? out.pos.copy(tmpP) : tmpP.clone();
    out.yaw = yaw;
    out.pitch = pitchPath * 0.6 - flare * F.flarePitch;
    out.roll = roll * (1 - flare * 0.8);
    out.speed = speed;
    out.phase = phase;
    out.flapAmp = flapAmp;
    out.flare = flare;
    out.stage = stage;
    return out;
  }

  return { curve, points: pts, duration, length, sample, mode };
}

// Wing pose for a stroke: shoulder elevation (up +), sweep (forward +),
// wrist fold (0 open … 1 folded), outer twist — from the phase, amplitude,
// glide/flare state. Downstroke is phase 0→π (wing moving down), upstroke
// π→2π with the wrist folding and the wing sweeping back.
export function wingPose(phase, amp, flare, F = OWL.flight) {
  const c = Math.cos(phase);
  const sn = Math.sin(phase);
  const beat = amp * F.strokeAmp;
  return {
    elevation: F.glideDihedral * (1 - amp) + c * beat + flare * F.flareLift,
    sweep: sn * beat * 0.55 + flare * F.flareSweep,
    fold: Math.max(0, -sn) * amp * F.wristFold,
    twist: -sn * beat * 0.35,
    // the tip trails the shoulder: a lagged copy of the stroke for the outer segment
    tipLag: c * beat * 0.25,
  };
}

// The body's answer to the wings: a small lift on each downstroke and a
// pitch oscillation locked to the stroke.
export function bodyResponse(phase, amp, F = OWL.flight) {
  return { bob: Math.sin(phase) * amp * F.bodyBob, pitch: Math.cos(phase) * amp * F.bodyPitch };
}

// Staged fold after landing: [[seconds, spread], ...] — half-fold, settle,
// tuck — evaluated at `since` seconds after touchdown; returns the spread.
export function foldAt(since, F = OWL.flight) {
  let t = 0;
  let prev = 1;
  for (const [dur, target] of F.foldStages) {
    if (since < t + dur) {
      const k = THREE.MathUtils.smoothstep(since, t, t + dur);
      return prev + (target - prev) * k;
    }
    t += dur;
    prev = target;
  }
  return prev;
}
