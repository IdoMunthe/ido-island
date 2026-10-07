// The loading screen: the island's palette and type, honest staged
// progress, a minimum of ~400 ms so it never flashes, and a soft crossfade
// out. If the 3D code fails, it says so and offers the document.
import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { content } from "../content.js";
import { useLoading, loadingProgress } from "../three/loading.js";
import { useThreeMode } from "../three/context.jsx";
import { introLoadingGone } from "../three/intro.js";

const MIN_MS = 400;
const FADE_MS = 550;
const STALL_MS = 25000;

export function LoadingScreen() {
  const state = useLoading();
  const { setMode } = useThreeMode();
  const ui = content.ui.island.loadingScreen;
  const [phase, setPhase] = useState("in"); // in | out | gone
  const [stalled, setStalled] = useState(false);

  // Leave once done, but not before the minimum, then fade.
  useEffect(() => {
    if (state.stage !== "done") return;
    const wait = Math.max(0, MIN_MS - (performance.now() - state.startedAt));
    const t1 = window.setTimeout(() => setPhase("out"), wait);
    const t2 = window.setTimeout(() => {
      setPhase("gone");
      introLoadingGone();
    }, wait + FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [state.stage, state.startedAt]);

  // If the chunk never arrives, stop pretending.
  useEffect(() => {
    if (state.stage !== "chunk") return;
    const t = window.setTimeout(() => setStalled(true), STALL_MS);
    return () => window.clearTimeout(t);
  }, [state.stage]);

  if (phase === "gone") return null;
  const failed = state.stage === "error" || stalled;
  const progress = loadingProgress();
  const message = failed ? ui.failed : ui.stages[state.stage] || ui.stages.chunk;
  const percent = progress == null ? null : Math.round(progress * 100);

  return (
    <div className={`loading-screen ${phase === "out" ? "is-leaving" : ""}`} aria-hidden={phase === "out"}>
      <div className="loading-sky" aria-hidden="true">
        <span className="loading-sun" />
        <span className="loading-island" />
        <span className="loading-sea" />
      </div>
      <div className="loading-card">
        <p className="eyebrow">{content.ui.eyebrow}</p>
        <h1 className="display mt-2 text-[2rem] leading-[1.02] text-ink sm:text-[2.6rem]">{content.header.name}</h1>
        {content.header.tagline ? <p className="display-italic mt-2 text-[1.1rem] text-ink-soft">{content.header.tagline}</p> : null}

        <div className="mt-8" role="status" aria-live="polite">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[15px] text-ink">{message}</p>
            {!failed && percent != null ? <span className="tabular font-mono text-[12px] text-ink-mute">{percent}%</span> : null}
          </div>
          {!failed ? (
            <div className={`loading-bar ${progress == null ? "is-indeterminate" : ""}`}>
              <span style={{ width: progress == null ? "38%" : `${Math.round(progress * 100)}%` }} />
            </div>
          ) : null}
          {failed ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setMode("document")} className="island-focus inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-white/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink hover:border-ink">
                <BookOpen size={13} aria-hidden="true" />
                {ui.readInstead}
              </button>
              {state.error ? <span className="font-mono text-[11px] text-ink-mute">{state.error}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
