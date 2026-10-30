// The photo viewer, as an album lying open over the dimmed page: two
// facing pages with a gutter and spine. The photograph is mounted on the
// left page with four photo corners, a little off-square; the title is
// written in by hand on the right page with the description under it and
// a small folio ("3 / 8") printed in the corner. Under 768px it is a
// single page — photo on top, the writing below.
//
// The arrows turn the page. A real page — a hinged element with a front
// and a back face — lifts at the spine and flips over, and a shadow moves
// across the spread underneath it. Forward turns the right page over to
// the left; back turns the left page over to the right. On the single
// page the whole leaf flips away to the left (forward) or back in from
// the left (back). With reduced motion there is no flip: the pages
// crossfade.
//
// Everything else is as before: arrows wrap round, X / backdrop / Escape
// close, ←/→ keys, focus stays inside and goes back where it came from,
// swipe on touch, the large image (`large`, else `src`) with the kraft
// placeholder if it fails to load.
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { content } from "../content.js";
import { placeholderImage } from "../placeholders.js";

const SWIPE = 48; // px of horizontal travel that counts as a swipe
const TURN = 0.85; // seconds a page takes to turn
const EASE = [0.5, 0.05, 0.2, 1];
const SPREAD_QUERY = "(min-width: 768px)";
// The description types itself in once a page has landed (ms): a lead-in
// after the landing, a base per character with a little jitter, and a
// longer beat after a full stop or a comma. Any click, tap or key finishes
// it at once; reduced motion shows the whole text straight away.
const TYPE = { lead: 420, base: 20, jitter: 14, stop: 240, pause: 110 };

// Two facing pages from 768px up, one page below.
function useSpread() {
  const [spread, setSpread] = useState(() => typeof window !== "undefined" && window.matchMedia(SPREAD_QUERY).matches);
  useEffect(() => {
    const m = window.matchMedia(SPREAD_QUERY);
    const on = () => setSpread(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return spread;
}

function Corners() {
  return (
    <>
      <span className="photo-corner tl" aria-hidden="true" />
      <span className="photo-corner tr" aria-hidden="true" />
      <span className="photo-corner bl" aria-hidden="true" />
      <span className="photo-corner br" aria-hidden="true" />
    </>
  );
}

// The photograph, mounted with corners on album paper.
function Mount({ item, src, onError, tilt = -1.4 }) {
  return (
    <div className="album-mount" style={{ transform: `rotate(${tilt}deg)` }}>
      <Corners />
      <img key={src} src={src} alt={item.alt || ""} onError={onError} draggable={false} className="album-photo select-none" />
    </div>
  );
}

// The writing: title by hand, the description in the body face, folio.
// `shown` is how many characters of the description are typed so far
// (null: all of it, static). The full text is laid out invisibly
// underneath so the page never grows while it types, and is in the DOM
// in full, visually hidden, for assistive tech; the typed copy is
// aria-hidden. The title is handwriting and is never typed.
function Writing({ item, index, n, live = false, shown = null }) {
  const full = item.description || "";
  const typing = shown != null && shown < full.length;
  const text = shown == null ? full : full.slice(0, Math.max(0, shown));
  return (
    <>
      <p className="hand album-title">{item.caption}</p>
      {full ? (
        <p className="album-desc">
          <span className="sr-only">{full}</span>
          <span aria-hidden="true" className="album-desc-layer">
            <span className="album-desc-ghost">{full}</span>
            <span className="album-desc-typed">
              {text}
              {typing ? <span className="album-caret" /> : null}
            </span>
          </span>
        </p>
      ) : null}
      <p className="album-folio tabular" aria-live={live ? "polite" : undefined}>
        {index + 1} / {n}
      </p>
    </>
  );
}

function PhotoPage({ item, src, onError, side = "left" }) {
  return (
    <div className={`album-page album-page-${side} album-page-photo`}>
      <Mount item={item} src={src} onError={onError} />
    </div>
  );
}

function TextPage({ item, index, n, side = "right", live = false, shown = null }) {
  return (
    <div className={`album-page album-page-${side} album-page-text`}>
      <Writing item={item} index={index} n={n} live={live} shown={shown} />
    </div>
  );
}

function SinglePage({ item, src, onError, index, n, live = false, shown = null }) {
  return (
    <div className="album-page album-page-single">
      <div className="album-page-photo">
        <Mount item={item} src={src} onError={onError} tilt={-1.1} />
      </div>
      <div className="album-page-text">
        <Writing item={item} index={index} n={n} live={live} shown={shown} />
      </div>
    </div>
  );
}

function BlankPage({ side }) {
  return <div className={`album-page album-page-${side}`} />;
}

export function Lightbox({ items, index, onIndex, onClose }) {
  const ui = content.photos.viewer;
  const n = items.length;
  const reduce = useReducedMotion();
  const spread = useSpread();
  const box = useRef(null);
  const openedFrom = useRef(null);
  const touch = useRef(null);
  const [failed, setFailed] = useState(() => new Set());
  // a page in motion: which way, from which photo, to which
  const [turning, setTurning] = useState(null);

  // take focus, give it back on close; keep the page from scrolling behind
  useEffect(() => {
    openedFrom.current = document.activeElement;
    box.current?.focus({ preventScroll: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      const el = openedFrom.current;
      if (el && el !== document.body && document.contains(el) && typeof el.focus === "function") el.focus({ preventScroll: true });
    };
  }, []);

  const srcFor = (i) => {
    const it = items[i];
    return failed.has(i) ? placeholderImage("square", it.caption || "photo") : it.large || it.src || placeholderImage("square", it.caption || "photo");
  };
  const fail = (i) => () =>
    setFailed((f) => {
      if (f.has(i)) return f;
      const next = new Set(f);
      next.add(i);
      return next;
    });

  // have the neighbouring pages ready before they are turned to
  useEffect(() => {
    if (n < 2) return;
    [(index + 1) % n, (index - 1 + n) % n].forEach((i) => {
      const im = new Image();
      im.src = srcFor(i);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, n]);

  // The typewriter. It writes the description of whichever page is current
  // or about to land: nothing during a turn, then — once the leaf has
  // landed, or the album has opened — character by character. Every turn
  // starts it over, so quick turning never queues a backlog.
  const [typed, setTyped] = useState(0);
  const typeTimer = useRef(null);
  const typeTarget = turning ? turning.to : index;
  const desc = items[typeTarget]?.description || "";
  const shownFor = (i) => (i === typeTarget ? (reduce ? Infinity : typed) : null);
  useEffect(() => {
    window.clearTimeout(typeTimer.current);
    typeTimer.current = null;
    if (reduce) {
      setTyped(Infinity);
      return;
    }
    setTyped(0);
    if (turning || !desc) return; // the landing page waits for the leaf
    let i = 0;
    const tick = () => {
      i++;
      setTyped(i);
      if (i >= desc.length) {
        typeTimer.current = null;
        return;
      }
      const ch = desc[i - 1];
      const wait = TYPE.base + Math.random() * TYPE.jitter + (/[.!?…]/.test(ch) ? TYPE.stop : /[,;:—–]/.test(ch) ? TYPE.pause : 0);
      typeTimer.current = window.setTimeout(tick, wait);
    };
    typeTimer.current = window.setTimeout(tick, TYPE.lead);
    return () => {
      window.clearTimeout(typeTimer.current);
      typeTimer.current = null;
    };
  }, [index, turning, reduce, desc]);
  // any click, tap or key while it types finishes the text at once
  const skipTyping = () => {
    if (typeTimer.current == null) return;
    window.clearTimeout(typeTimer.current);
    typeTimer.current = null;
    setTyped(Infinity);
  };

  const go = (dir) => {
    if (n < 2 || turning) return;
    const to = (index + dir + n) % n;
    if (reduce) {
      onIndex(to);
      return;
    }
    setTurning({ dir, from: index, to });
  };
  const prev = () => go(-1);
  const next = () => go(1);
  const landed = () => {
    if (!turning) return;
    onIndex(turning.to);
    setTurning(null);
  };

  const onKey = (e) => {
    skipTyping();
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "Tab") {
      // trap: cycle through the viewer's visible buttons
      const f = Array.from(box.current?.querySelectorAll("button") || []).filter((b) => b.getClientRects().length > 0);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      const to = e.shiftKey ? (i <= 0 ? f[f.length - 1] : f[i - 1]) : i < 0 || i === f.length - 1 ? f[0] : f[i + 1];
      e.preventDefault();
      to.focus();
    }
  };
  const onTouchStart = (e) => {
    skipTyping();
    touch.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) > SWIPE) (dx < 0 ? next : prev)();
  };

  const cur = items[index] || items[0];
  const fwd = turning?.dir === 1;
  // What lies flat on the album while a page turns. Forward: the current
  // photo stays on the left until the turning page lands on it; the next
  // writing is already on the right, under the lifting page. Back: the
  // previous photo is already on the left; the current writing stays on
  // the right until the page lands.
  const leftIdx = turning ? (fwd ? turning.from : turning.to) : index;
  const rightIdx = turning ? (fwd ? turning.to : turning.from) : index;
  const singleIdx = turning ? (fwd ? turning.to : turning.from) : index;

  const fade = reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.25 } } : {};
  const btn = "island-focus inline-flex items-center justify-center rounded-full border border-paper/25 bg-ink/60 text-paper backdrop-blur-sm transition-colors hover:border-paper hover:bg-ink/80 disabled:opacity-50";
  const turnTransition = { duration: TURN, ease: EASE };
  const shadeTransition = { duration: TURN, times: [0, 0.5, 1], ease: "easeInOut" };

  return (
    <div className="no-print fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-3 backdrop-blur-[2px] sm:p-6" onClick={onClose}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={`${ui.label}: ${cur.caption || ""}`.trim()}
        tabIndex={-1}
        onKeyDown={onKey}
        onClick={(e) => {
          e.stopPropagation();
          skipTyping();
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative flex max-h-full w-full max-w-[1080px] flex-col items-stretch outline-none"
      >
        <div className="album-scroll">
          <div className="album">
            {spread ? (
              <div className="album-spread">
                <motion.div key={reduce ? `l${leftIdx}` : "l"} className="album-half" {...fade}>
                  <PhotoPage item={items[leftIdx]} src={srcFor(leftIdx)} onError={fail(leftIdx)} side="left" />
                </motion.div>
                <motion.div key={reduce ? `r${rightIdx}` : "r"} className="album-half" {...fade}>
                  <TextPage item={items[rightIdx]} index={rightIdx} n={n} side="right" live shown={shownFor(rightIdx)} />
                </motion.div>
                <div className="album-spine" aria-hidden="true" />

                {turning ? (
                  <>
                    {/* the shadow the lifting page throws on the page it will land on */}
                    <motion.div className={`album-shade ${fwd ? "on-left" : "on-right"}`} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.45, 0.1] }} transition={shadeTransition} aria-hidden="true" />
                    <motion.div
                      className={`album-flip ${fwd ? "fwd" : "back"}`}
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: fwd ? -180 : 180 }}
                      transition={turnTransition}
                      onAnimationComplete={landed}
                      aria-hidden="true"
                    >
                      <div className="album-face">
                        {fwd ? <TextPage item={items[turning.from]} index={turning.from} n={n} side="right" /> : <PhotoPage item={items[turning.from]} src={srcFor(turning.from)} onError={fail(turning.from)} side="left" />}
                      </div>
                      <div className="album-face is-back">
                        {fwd ? <PhotoPage item={items[turning.to]} src={srcFor(turning.to)} onError={fail(turning.to)} side="left" /> : <TextPage item={items[turning.to]} index={turning.to} n={n} side="right" shown={shownFor(turning.to)} />}
                      </div>
                      {/* the page darkens as it stands on edge */}
                      <motion.div className="album-curl" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0] }} transition={shadeTransition} />
                    </motion.div>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="album-single">
                <motion.div key={reduce ? `s${singleIdx}` : "s"} {...fade}>
                  <SinglePage item={items[singleIdx]} src={srcFor(singleIdx)} onError={fail(singleIdx)} index={singleIdx} n={n} live shown={shownFor(singleIdx)} />
                </motion.div>
                {turning ? (
                  <>
                    <motion.div className="album-shade on-full" initial={{ opacity: 0 }} animate={{ opacity: fwd ? [0.35, 0.2, 0] : [0, 0.25, 0.35] }} transition={shadeTransition} aria-hidden="true" />
                    <motion.div
                      className="album-flip single"
                      initial={{ rotateY: fwd ? 0 : -180 }}
                      animate={{ rotateY: fwd ? -180 : 0 }}
                      transition={turnTransition}
                      onAnimationComplete={landed}
                      aria-hidden="true"
                    >
                      <div className="album-face">
                        <SinglePage item={items[fwd ? turning.from : turning.to]} src={srcFor(fwd ? turning.from : turning.to)} onError={fail(fwd ? turning.from : turning.to)} index={fwd ? turning.from : turning.to} n={n} shown={shownFor(fwd ? turning.from : turning.to)} />
                      </div>
                      <div className="album-face is-back">
                        <BlankPage side="single" />
                      </div>
                      <motion.div className="album-curl" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0] }} transition={shadeTransition} />
                    </motion.div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {n > 1 ? (
          <>
            <button type="button" onClick={prev} aria-label={ui.prev} className={`${btn} absolute left-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 md:inline-flex lg:-left-14`}>
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" onClick={next} aria-label={ui.next} className={`${btn} absolute right-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 md:inline-flex lg:-right-14`}>
              <ChevronRight size={22} aria-hidden="true" />
            </button>
            <div className="mt-3 flex items-center justify-center gap-6 md:hidden">
              <button type="button" onClick={prev} aria-label={ui.prev} className={`${btn} h-11 w-11`}>
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button type="button" onClick={next} aria-label={ui.next} className={`${btn} h-11 w-11`}>
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : null}
        <button type="button" onClick={onClose} aria-label={ui.close} className={`${btn} fixed right-3 top-3 h-10 w-10 sm:right-5 sm:top-5`}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
