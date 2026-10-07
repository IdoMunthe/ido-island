import { useEffect, useRef, useState } from "react";
import { Check, Plus, X, Scissors, ShieldAlert } from "lucide-react";
import { content } from "../content.js";
import { Section } from "./Section.jsx";

// The person specification. The rejection filter runs in place: fed lines
// get struck through. The document version keeps the two checklists side
// by side and sets the dealbreakers under a hairline with no tinted box —
// only the title and the strike are red.
export function SpecBody({ doc = false }) {
  const s = content.spec;
  const ui = content.ui;
  const rejections = s?.rejections || [];
  const [status, setStatus] = useState(() => rejections.map(() => "idle"));
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const hasLists = s.essential?.length || s.desirable?.length;

  function feed(i, delay = 0) {
    if (status[i] !== "idle") return;
    setStatus((st) => st.map((v, k) => (k === i ? "feeding" : v)));
    timers.current.push(window.setTimeout(() => setStatus((st) => st.map((v, k) => (k === i ? "shredded" : v))), delay + 350));
  }
  function feedAll() {
    let n = 0;
    rejections.forEach((_, i) => {
      if (status[i] === "idle") feed(i, n++ * 300);
    });
  }
  const remaining = status.filter((v) => v === "idle").length;

  const item = doc ? "flex gap-3 text-[16px] leading-[1.5]" : "flex gap-2.5 text-[15.5px] leading-snug";
  const box = doc ? "avoid-break mt-12 border-t border-rule" : "avoid-break mt-9 rounded-md border border-bad/40 bg-bad-soft/40";
  const boxHead = doc ? "flex flex-wrap items-center justify-between gap-2 pt-5" : "flex flex-wrap items-center justify-between gap-2 border-b border-bad/30 px-4 py-2.5";
  const boxList = doc ? "doc-measure mt-4 space-y-3" : "space-y-2.5 px-4 py-4";
  const boxFoot = doc ? "mt-5 font-mono text-[12px] text-ink-soft" : "border-t border-bad/30 px-4 py-2.5 font-mono text-[12px] text-ink-soft";

  return (
    <>
      {hasLists ? (
        <div className={`print-flat grid gap-8 sm:grid-cols-2 ${doc ? "sm:gap-x-12" : ""}`}>
          {s.essential?.length ? (
            <div className={`avoid-break ${doc ? "border-t border-rule pt-4" : ""}`}>
              <h3 className="eyebrow">{ui.essential}</h3>
              <ul className={doc ? "mt-4 space-y-3" : "mt-3 space-y-2"}>
                {s.essential.map((it, i) => (
                  <li key={i} className={`${item} text-ink`}>
                    <Check size={16} strokeWidth={2.5} className="mt-[4px] shrink-0 text-ok" aria-hidden="true" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {s.desirable?.length ? (
            <div className={`avoid-break ${doc ? "border-t border-rule pt-4" : ""}`}>
              <h3 className="eyebrow">{ui.desirable}</h3>
              <ul className={doc ? "mt-4 space-y-3" : "mt-3 space-y-2"}>
                {s.desirable.map((it, i) => (
                  <li key={i} className={`${item} text-ink-soft`}>
                    <Plus size={16} strokeWidth={2.5} className="mt-[4px] shrink-0 text-kraft-deep" aria-hidden="true" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {rejections.length ? (
        <div className={box}>
          <div className={boxHead}>
            <h3 className="inline-flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.14em] text-bad">
              <ShieldAlert size={14} aria-hidden="true" />
              {ui.rejectionTitle}
            </h3>
            <button type="button" onClick={feedAll} disabled={remaining === 0} className="no-print inline-flex items-center gap-1.5 rounded-sm border border-bad/40 bg-paper px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-bad transition-colors hover:bg-bad hover:text-paper disabled:cursor-default disabled:opacity-40 disabled:hover:bg-paper disabled:hover:text-bad">
              <Scissors size={12} aria-hidden="true" />
              {s.feedAllLabel}
            </button>
          </div>
          <ul className={boxList} aria-label={s.shredderName}>
            {rejections.map((it, i) => {
              const st = status[i];
              return (
                <li key={i} className={`${item} items-start text-ink`}>
                  <X size={16} strokeWidth={2.5} className="mt-[4px] shrink-0 text-bad" aria-hidden="true" />
                  <span className={`min-w-0 flex-1 transition-all duration-500 ${st === "shredded" ? "text-ink-mute line-through decoration-bad/70 decoration-2" : st === "feeding" ? "opacity-70" : ""}`}>{it}</span>
                  <span className="no-print shrink-0">
                    {st === "idle" ? (
                      <button type="button" onClick={() => feed(i)} className="rounded-sm border border-rule px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute hover:border-bad hover:text-bad" aria-label={`${s.feedLabel}: ${it}`}>
                        {s.feedLabel}
                      </button>
                    ) : (
                      <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${st === "shredded" ? "text-bad" : "text-ink-mute"}`} role="status">
                        {st === "shredded" ? s.shreddedLabel : "…"}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          {s.rejectionFootnote ? <p className={boxFoot}>{s.rejectionFootnote}</p> : null}
        </div>
      ) : null}
    </>
  );
}

export function Spec() {
  const s = content.spec;
  if (!s) return null;
  const hasLists = s.essential?.length || s.desirable?.length;
  if (!hasLists && !s.rejections?.length) return null;
  return (
    <Section id="spec" label={content.ui.rail.spec} title={s.title} subtitle={s.subtitle} layout="wide">
      <SpecBody doc />
    </Section>
  );
}
