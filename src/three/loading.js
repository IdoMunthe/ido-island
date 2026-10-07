// Honest loading progress for the island. Stages, in order:
//   chunk  — the 3D code is still downloading (size unknown → no percentage)
//   fonts  — waiting for the web fonts the signs are painted with
//   paint  — landmarks painting their textures (counted)
//   frame  — first frame rendered
//   done
// Anything can call fail(message) to surface an error instead.
import { useSyncExternalStore } from "react";

const listeners = new Set();
export const loading = {
  stage: "chunk",
  painted: 0,
  toPaint: 0,
  error: null,
  startedAt: typeof performance !== "undefined" ? performance.now() : 0,
  version: 0,
};

function bump() {
  loading.version++;
  listeners.forEach((l) => l());
}

export function reportStage(stage) {
  if (loading.stage === "done" || loading.stage === "error") return;
  loading.stage = stage;
  bump();
}
export function expectPaint(n) {
  loading.toPaint = Math.max(loading.toPaint, n);
  bump();
}
export function painted() {
  loading.painted++;
  if (loading.stage === "paint" && loading.toPaint && loading.painted >= loading.toPaint) loading.stage = "frame";
  bump();
}
export function loadingFailed(message) {
  loading.stage = "error";
  loading.error = String(message || "unknown");
  bump();
}

// 0–1, or null while the size of the work is unknown.
export function loadingProgress() {
  switch (loading.stage) {
    case "chunk":
      return null;
    case "fonts":
      return 0.15;
    case "paint":
      return 0.2 + 0.7 * (loading.toPaint ? Math.min(1, loading.painted / loading.toPaint) : 0);
    case "frame":
      return 0.95;
    case "done":
      return 1;
    default:
      return null;
  }
}

export function useLoading() {
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => loading.version,
    () => loading.version
  );
  return loading;
}
