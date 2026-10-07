import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { BookOpen, Map as MapIcon, X, Volume2, VolumeX, Loader2 } from "lucide-react";
import { content } from "./content.js";
import { Document } from "./components/Document.jsx";
import { LandmarkCard, CARD_TITLES, cardSubtitle } from "./components/Cards.jsx";
import { LoadingScreen } from "./components/Loading.jsx";
import { Lightbox } from "./components/Lightbox.jsx";
import { ambienceStatus, ambienceWanted, enableAmbience, toggleAmbience, pauseAmbience, subscribeAmbience, setAmbienceSection } from "./audio/ambience.js";
import { introStatus, subscribeIntro, decideIntro, skipIntro } from "./three/intro.js";
import { ThreeProvider, useThreeMode, ModeBadge } from "./three/context.jsx";
import { LazyIsland } from "./three/Lazy.jsx";
import { LANDMARKS } from "./three/island.config.js";

export default function App() {
  return (
    <ThreeProvider>
      <Page />
    </ThreeProvider>
  );
}

function Page() {
  const { mode } = useThreeMode();
  return (
    <>
      {mode === "3d" ? <IslandPage /> : <DocumentPage />}
      <ModeBadge />
    </>
  );
}

// ---------------------------------------------------------------- document
function DocumentPage() {
  const { available, setMode } = useThreeMode();
  const ui = content.ui.island;
  return (
    <div className="desk min-h-[100svh] overflow-x-clip">
      {available ? (
        <div className="no-print sticky top-0 z-40 flex justify-end px-4 pt-3">
          <ModeButton onClick={() => setMode("3d")} icon={<MapIcon size={13} aria-hidden="true" />} label={ui.toIsland} />
        </div>
      ) : null}
      <div className="pt-6">
        <Document />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ island
function IslandPage() {
  const { setMode, isTouch } = useThreeMode();
  const ui = content.ui.island;
  // The arrival shot: decided once per page load, before the island mounts.
  // Not for reduced motion (that path never reaches here anyway) and
  // cancelled by any input.
  const introState = useSyncExternalStore(subscribeIntro, introStatus, introStatus);
  useMemo(() => decideIntro({ reducedMotion: typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches }), []);
  const introPlaying = introState === "waiting" || introState === "playing";
  useEffect(() => {
    if (!introPlaying) return;
    const cancel = () => skipIntro();
    const opts = { passive: true, capture: true };
    window.addEventListener("pointerdown", cancel, opts);
    window.addEventListener("wheel", cancel, opts);
    window.addEventListener("keydown", cancel, opts);
    window.addEventListener("touchstart", cancel, opts);
    return () => {
      window.removeEventListener("pointerdown", cancel, opts);
      window.removeEventListener("wheel", cancel, opts);
      window.removeEventListener("keydown", cancel, opts);
      window.removeEventListener("touchstart", cancel, opts);
    };
  }, [introPlaying]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  // the photo viewer: index of the open photo, or null
  const [viewer, setViewer] = useState(null);
  const photos = useMemo(() => (content.photos?.items || []).slice(0, 8), []);
  const closeRef = useRef(null);
  const placeRefs = useRef({});
  // the orbit hint whispers until the visitor first drags, scrolls or presses a key
  const [hintGone, setHintGone] = useState(false);
  useEffect(() => {
    if (!ready || hintGone || introPlaying) return;
    const done = () => setHintGone(true);
    const opts = { once: true, passive: true };
    window.addEventListener("pointerdown", done, opts);
    window.addEventListener("wheel", done, opts);
    window.addEventListener("keydown", done, opts);
    return () => {
      window.removeEventListener("pointerdown", done);
      window.removeEventListener("wheel", done);
      window.removeEventListener("keydown", done);
    };
  }, [ready, hintGone, introPlaying]);

  const onReady = useCallback(() => setReady(true), []);
  const openPhoto = useCallback((i) => setViewer(i), []);
  const select = useCallback((id) => setSelected(id), []);

  useEffect(() => {
    document.documentElement.classList.add("island-mode");
    return () => document.documentElement.classList.remove("island-mode");
  }, []);
  // Sound plays only on the island: silent in document mode (this page
  // unmounts) and back when it returns.
  useEffect(() => {
    pauseAmbience(false);
    return () => pauseAmbience(true);
  }, []);
  // Sound is on by default, so try to start it the moment the island is
  // ready. Browsers refuse to play audio before the visitor has interacted,
  // and there is no way around that — so when the speculative attempt is
  // blocked we arm every plausible first gesture (a click, a key, a scroll,
  // a touch) and start on whichever lands. In practice the ambience comes up
  // as soon as they touch the page. Someone who muted it stays muted.
  useEffect(() => {
    if (!ready || !ambienceWanted()) return;
    if (ambienceStatus() === "off") enableAmbience({ speculative: true });
    const go = () => {
      if (ambienceWanted() && ambienceStatus() !== "on" && ambienceStatus() !== "loading") enableAmbience();
    };
    const opts = { once: true, passive: true };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((e) => window.addEventListener(e, go, opts));
    return () => events.forEach((e) => window.removeEventListener(e, go));
  }, [ready]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
    };
  }, [selected]);
  // How the visitor is driving: focus is handed back to a place's (visually
  // hidden) button only after a keyboard close, so a mouse close never
  // leaves a stray pill at the bottom of the screen.
  const modality = useRef("mouse");
  useEffect(() => {
    const key = () => (modality.current = "keyboard");
    const pointer = () => (modality.current = "mouse");
    window.addEventListener("keydown", key, true);
    window.addEventListener("pointerdown", pointer, true);
    return () => {
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("pointerdown", pointer, true);
    };
  }, []);
  // each place has its own soundtrack while it's open
  useEffect(() => setAmbienceSection(selected), [selected]);

  const lastSelected = useRef(null);
  useEffect(() => {
    if (selected) lastSelected.current = selected;
    else if (lastSelected.current && modality.current === "keyboard") placeRefs.current[lastSelected.current]?.focus({ preventScroll: true });
  }, [selected]);

  const title = selected ? CARD_TITLES[selected]?.() : null;
  const subtitle = selected ? cardSubtitle(selected) : "";

  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#cfe6f5]" aria-hidden="true" />
      <LazyIsland isTouch={isTouch} onReady={onReady} selected={selected} onSelect={select} hovered={hovered} onHover={setHovered} onOpenPhoto={openPhoto} />

      <LoadingScreen />

      <div className="island-ui pointer-events-none fixed inset-0 z-50 no-print">
        <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-2 sm:right-4">
          <SoundToggle />
          <ModeButton onClick={() => setMode("document")} icon={<BookOpen size={13} aria-hidden="true" />} label={ui.toDocument} />
        </div>


        {/* No skip button: the arrival is short, and any drag, scroll, click
            or key ends it (see the cancel listeners above), so nothing here
            traps the visitor. */}

        {!selected && !introPlaying ? (
          <p aria-hidden="true" className={`absolute right-3 top-12 hidden font-mono text-[9px] uppercase tracking-[0.18em] text-ink transition-opacity duration-[1600ms] ease-out sm:right-4 sm:block ${hintGone ? "opacity-0" : "opacity-45"}`}>
            {ui.orbitHint}
          </p>
        ) : null}

        {/* Keyboard and screen-reader route to every place. These buttons are
            never shown: focusing one highlights its landmark in the scene (the
            hover ring and name label), which is the focus indicator. Nothing is
            drawn at the bottom of the screen — a pill there read as a stray tab
            left over after closing a card. */}
        <nav aria-label={ui.navLabel} className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2">
          <ol>
            {LANDMARKS.map((lm) => {
              const active = selected === lm.id;
              return (
                <li key={lm.id}>
                  <button
                    ref={(el) => (placeRefs.current[lm.id] = el)}
                    type="button"
                    onClick={() => select(active ? null : lm.id)}
                    onFocus={() => setHovered(lm.id)}
                    onBlur={() => setHovered((h) => (h === lm.id ? null : h))}
                    aria-pressed={active}
                    className="sr-only"
                  >
                    {ui.places[lm.id] || lm.id}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {selected ? (
          <aside role="dialog" aria-labelledby="card-title" className="island-card pointer-events-auto">
            <div className="flex items-start justify-between gap-3 border-b border-rule px-5 py-3 sm:px-6">
              <div>
                <p className="eyebrow">{ui.places[selected]}</p>
                <h2 id="card-title" className="display mt-1 text-[1.5rem] leading-tight text-ink">{title}</h2>
                {subtitle ? <p className="mt-1 text-[13.5px] text-ink-soft">{subtitle}</p> : null}
              </div>
              <button ref={closeRef} type="button" onClick={() => setSelected(null)} className="island-focus inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rule px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-soft hover:border-ink hover:text-ink">
                <X size={12} aria-hidden="true" />
                {ui.back}
              </button>
            </div>
            <div className="island-card-body px-5 py-5 sm:px-6">
              <LandmarkCard id={selected} onOpenPhoto={openPhoto} />
            </div>
          </aside>
        ) : null}
      </div>

      {viewer != null ? <Lightbox items={photos} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} /> : null}

      {/* Printing from the island still yields the document. */}
      <div className="hidden print:block">
        <Document />
      </div>
    </>
  );
}

// The speaker: off until clicked; "loading" while the files fetch the first
// time; back to off if the browser refuses to play, so the next click works.
function SoundToggle() {
  const ui = content.ui.island.sound;
  const status = useSyncExternalStore(subscribeAmbience, ambienceStatus, ambienceStatus);
  const on = status === "on";
  const loading = status === "loading";
  const label = loading ? ui.loading : status === "failed" ? ui.failed : on ? ui.on : ui.off;
  return (
    <button
      type="button"
      onClick={toggleAmbience}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`island-focus inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white/75 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors ${on ? "border-ink text-ink" : "border-ink/15 text-ink-mute hover:border-ink hover:text-ink"}`}
    >
      {loading ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : on ? <Volume2 size={13} aria-hidden="true" /> : <VolumeX size={13} aria-hidden="true" />}
    </button>
  );
}

function ModeButton({ onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="island-focus inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white/75 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:border-ink hover:text-ink"
    >
      {icon}
      {label}
    </button>
  );
}
