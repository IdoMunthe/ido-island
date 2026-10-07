// Nature ambience for the island: the sea as a continuous bed, and night
// insects that fade in with the lamps and out at dawn. Off by default and
// never started without a click. The files are only fetched the first time
// sound is turned on. Web Audio (decoded buffers looped on the graph)
// rather than <audio loop>, so the loops have no gap and the two layers
// crossfade on gain nodes. Levels and files: AUDIO in island.config.js.
// Each place also has its own synthesised track (music.js), which plays
// on the same graph while that place is open; the sea ducks under it.
import { AUDIO } from "../three/island.config.js";
import { startMusic, stopMusic, setMusicSection, musicPlaying, onMusicChange } from "./music.js";

const KEY = "dating-cv:sound";
const listeners = new Set();

const state = {
  status: "off", // off | loading | on | blocked | failed
  wanted: false, // the remembered preference
  night: 0, // 0 by day → 1 at night, fed by the scene each frame
  hidden: false,
  paused: false, // document mode etc.
};

let ctx = null;
let master = null;
let seaGain = null;
let nightGain = null;
let sources = [];
let buffers = null;
let loadingPromise = null;

const notify = () => listeners.forEach((l) => l());

export function subscribeAmbience(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export const ambienceStatus = () => state.status;
export const ambienceWanted = () => state.wanted;

// The remembered preference (only a wish — playback still needs a gesture).
// Sound is wanted by DEFAULT: a first-time visitor gets the ambience as soon
// as the browser lets us start it. Only an explicit "off" turns it back down,
// so someone who mutes it stays muted on their next visit.
try {
  state.wanted = window.localStorage.getItem(KEY) !== "off";
} catch {
  state.wanted = true;
}
function remember(on) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* no storage */
  }
}

const url = (file) => `${import.meta.env.BASE_URL}${file}`;

async function load() {
  if (buffers) return buffers;
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error("no Web Audio");
      ctx = ctx || new Ctx();
      const fetchBuffer = async (file) => {
        const res = await fetch(url(file));
        if (!res.ok) throw new Error(`${file}: ${res.status}`);
        return ctx.decodeAudioData(await res.arrayBuffer());
      };
      const [sea, night] = await Promise.all([fetchBuffer(AUDIO.files.sea), fetchBuffer(AUDIO.files.night)]);
      buffers = { sea, night };
      return buffers;
    })().catch((e) => {
      loadingPromise = null;
      throw e;
    });
  }
  return loadingPromise;
}

function targets() {
  const n = state.night;
  const duck = musicPlaying() ? AUDIO.music.duck : 1;
  return {
    sea: (AUDIO.sea.day + (AUDIO.sea.night - AUDIO.sea.day) * n) * duck,
    night: AUDIO.insects * n * duck,
  };
}

function build() {
  if (sources.length) return;
  master = ctx.createGain();
  master.gain.value = AUDIO.master;
  master.connect(ctx.destination);
  seaGain = ctx.createGain();
  nightGain = ctx.createGain();
  const t = targets();
  seaGain.gain.value = t.sea;
  nightGain.gain.value = t.night;
  seaGain.connect(master);
  nightGain.connect(master);
  for (const [buf, gain] of [
    [buffers.sea, seaGain],
    [buffers.night, nightGain],
  ]) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    // skip the encoder padding at both ends so the loop point is clean
    src.loopStart = Math.min(0.06, buf.duration / 4);
    src.loopEnd = Math.max(src.loopStart + 1, buf.duration - 0.06);
    src.connect(gain);
    src.start(0, src.loopStart);
    sources.push(src);
  }
  startMusic(ctx, master);
}

function teardown() {
  stopMusic();
  for (const s of sources) {
    try {
      s.stop();
    } catch {
      /* already stopped */
    }
    s.disconnect();
  }
  sources = [];
  if (master) master.disconnect();
  master = seaGain = nightGain = null;
}

// Turn sound on. Must be called from a user gesture the first time (the
// browser will otherwise keep the context suspended, which we report as
// "blocked" and leave the toggle off so the next click works).
// `speculative` marks an attempt the visitor did not ask for — the automatic
// one on load. If the browser blocks that (it usually will, before any
// gesture), we keep wanting sound so the next real gesture starts it, and we
// don't write a preference they never expressed.
export async function enableAmbience({ speculative = false } = {}) {
  state.wanted = true;
  if (!speculative) remember(true);
  if (state.status === "on" || state.status === "loading") return;
  state.status = "loading";
  notify();
  try {
    await load();
    if (!state.wanted) {
      state.status = "off";
      notify();
      return;
    }
    if (ctx.state !== "running") await ctx.resume();
    if (ctx.state !== "running") throw Object.assign(new Error("blocked"), { blocked: true });
    build();
    state.status = "on";
    applyPause();
  } catch (e) {
    console.warn("[dating-cv] ambience:", e?.message || e);
    state.status = e?.blocked ? "blocked" : "failed";
    // A blocked speculative attempt is expected — keep wanting sound so the
    // first gesture starts it. A blocked attempt they actually asked for
    // stands down, so we're not retrying behind their back.
    if (e?.blocked && !speculative) state.wanted = false;
    teardown();
  }
  notify();
}

export function disableAmbience() {
  state.wanted = false;
  remember(false);
  teardown();
  if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
  state.status = "off";
  notify();
}

export function toggleAmbience() {
  if (state.status === "on" || state.status === "loading") disableAmbience();
  else enableAmbience();
}

// The scene feeds the night amount (the lamps' curve) every frame; gains
// glide toward their targets over AUDIO.crossfadeSeconds.
let lastSea = -1;
let lastNight = -1;
export function setAmbienceNight(n) {
  state.night = n;
  applyLevels();
}
function applyLevels() {
  if (!seaGain || !ctx || state.status !== "on") return;
  const t = targets();
  if (Math.abs(t.sea - lastSea) < 0.004 && Math.abs(t.night - lastNight) < 0.004) return;
  lastSea = t.sea;
  lastNight = t.night;
  const tc = Math.max(0.05, AUDIO.crossfadeSeconds / 3);
  seaGain.gain.setTargetAtTime(t.sea, ctx.currentTime, tc);
  nightGain.gain.setTargetAtTime(t.night, ctx.currentTime, tc);
}

// The place that's open (null back on the island): its track plays and
// the nature layers duck under it.
export function setAmbienceSection(id) {
  setMusicSection(id);
}
onMusicChange(applyLevels);

// Silence while the tab is hidden or the page is in document mode; back
// when it isn't. (The context is suspended, so nothing is decoded or mixed.)
function applyPause() {
  if (!ctx || state.status !== "on") return;
  const shouldPause = state.hidden || state.paused;
  if (shouldPause && ctx.state === "running") ctx.suspend().catch(() => {});
  else if (!shouldPause && ctx.state === "suspended") ctx.resume().catch(() => {});
}
export function pauseAmbience(paused) {
  state.paused = paused;
  applyPause();
}
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    state.hidden = document.hidden;
    applyPause();
  });
}
