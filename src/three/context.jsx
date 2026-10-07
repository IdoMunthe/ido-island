// Decides how the page is shown and makes that decision impossible to
// miss: it is logged to the console with its reason, shown as a badge in
// development, and the visitor can switch at any time.
//
//   mode: "3d"       — the office room (WebGL, motion allowed, chunk OK)
//         "document" — the plain scrollable CV (also the print path)
//
//   reason (when not "3d"): "reduced-motion" | "no-webgl" |
//         "chunk-failed: <message>" | "chosen"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

const ThreeContext = createContext({ mode: "document", reason: "no-provider", available: false, setMode: () => {}, fail: () => {}, isTouch: false });

export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

const STORAGE_KEY = "dating-cv:mode";
function readChoice() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "3d" || v === "document" ? v : null;
  } catch {
    return null;
  }
}
function writeChoice(v) {
  try {
    window.localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* storage may be unavailable; the choice just doesn't persist */
  }
}

export function ThreeProvider({ children }) {
  const reduce = useReducedMotion();
  const [webgl] = useState(() => (typeof window !== "undefined" ? hasWebGL() : false));
  const [failure, setFailure] = useState(null);
  const [choice, setChoice] = useState(() => (typeof window !== "undefined" ? readChoice() : null));
  const isTouch = useMemo(() => (typeof navigator !== "undefined" ? navigator.maxTouchPoints > 0 : false), []);

  let blocked = null;
  if (failure) blocked = `chunk-failed: ${failure}`;
  else if (!webgl) blocked = "no-webgl";
  else if (reduce) blocked = "reduced-motion";

  const available = !blocked;
  const mode = blocked ? "document" : choice === "document" ? "document" : "3d";
  const reason = blocked || (choice === "document" ? "chosen" : "default");

  const fail = useCallback((err) => setFailure(String(err?.message || err || "unknown error")), []);
  const setMode = useCallback((m) => {
    setChoice(m);
    writeChoice(m);
  }, []);

  // Never silent: one line per decision.
  useEffect(() => {
    const line = `[dating-cv] mode: ${mode}${mode === "document" ? ` (${reason})` : ""} · webgl=${webgl} reducedMotion=${!!reduce} touch=${isTouch}`;
    if (mode === "document" && blocked) console.warn(line);
    else console.info(line);
  }, [mode, reason, webgl, reduce, isTouch, blocked]);

  const value = useMemo(() => ({ mode, reason, available, setMode, fail, isTouch }), [mode, reason, available, setMode, fail, isTouch]);
  return <ThreeContext.Provider value={value}>{children}</ThreeContext.Provider>;
}

export function useThreeMode() {
  return useContext(ThreeContext);
}

// Development-only corner badge so the chosen mode is always visible.
export function ModeBadge() {
  const { mode, reason } = useThreeMode();
  if (!import.meta.env.DEV) return null;
  return (
    <div
      className="no-print pointer-events-none fixed bottom-2 left-2 z-[60] rounded-sm border border-paper/30 bg-desk-deep/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/80"
      aria-hidden="true"
    >
      dev · mode: {mode}
      {mode === "document" ? ` · ${reason}` : ""}
    </div>
  );
}
