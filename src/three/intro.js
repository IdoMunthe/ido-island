// The arrival: once per page load, after the loading screen has faded, the
// camera starts low by the gate looking out along the jetty, the figure
// walks in from the end of the decking, through the gate and up the path
// to its home spot, and the camera eases out and up into the overview as
// it arrives. Skippable by a button or any interaction. The camera path
// maths is in introPath.js (pure, three-based) so scripts/introplot.mjs
// draws exactly what the scene plays; this file is three-free so the main
// bundle can import it. Keyframes and timings: INTRO in island.config.js.
import { INTRO } from "./island.config.js";

// ---- state --------------------------------------------------------------
const listeners = new Set();
export const intro = {
  status: "pending", // pending | waiting | playing | done | skipped | off
  startedAt: 0, // scene clock seconds when it began
  loadingGone: false,
};
const bump = () => listeners.forEach((l) => l());
export function subscribeIntro(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export const introStatus = () => intro.status;

// Decide once whether this page load gets the arrival at all.
export function decideIntro({ reducedMotion = false, available = true } = {}) {
  if (intro.status !== "pending") return;
  const ok = INTRO.enabled && available && !reducedMotion;
  intro.status = ok ? "waiting" : "off";
  bump();
}
// The loading screen calls this when its crossfade has finished.
export function introLoadingGone() {
  intro.loadingGone = true;
  bump();
}
// The scene calls this when it starts the shot (with its clock time).
export function introStarted(clockSeconds) {
  if (intro.status !== "waiting") return;
  intro.status = "playing";
  intro.startedAt = clockSeconds;
  bump();
}
export function introFinished() {
  if (intro.status !== "playing") return;
  intro.status = "done";
  bump();
}
// A skip, or any input, or a place click: the shot ends now.
export function skipIntro() {
  if (intro.status === "playing" || intro.status === "waiting") {
    intro.status = "skipped";
    bump();
  }
}
