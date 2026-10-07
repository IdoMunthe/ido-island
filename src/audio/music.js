// A soundtrack per place, synthesised live on the ambience's Web Audio
// graph — no files. Each place has its own track with its own vibe (see
// THEMES below); opening a place crossfades to its track, closing it fades
// back to the plain sea. A look-ahead scheduler steps every track in 16th
// notes on the audio clock, so timing holds even when the main thread is
// busy. Levels are AUDIO.music in island.config.js; ambience.js starts and
// stops this with the sound toggle.
import { AUDIO } from "../three/island.config.js";

const mtof = (n) => 440 * 2 ** ((n - 69) / 12);
// repeatable "randomness": the same step always rolls the same number
const rnd = (n) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ---- instruments -------------------------------------------------------

function env(g, t, vol, a, dur) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + 0.01, dur));
}

// One pitched note. f in Hz; type is the oscillator; uni adds a second
// oscillator detuned by that many cents; cutoff is a number or [from, to]
// swept over `sweep` seconds; vib is { rate, depth } in Hz; slide glides
// in from that frequency.
function note(io, t, o) {
  const { ctx, out } = io;
  const dur = o.dur ?? 0.2;
  const g = ctx.createGain();
  env(g, t, o.vol ?? 0.1, o.a ?? 0.005, dur);
  g.connect(out);
  let head = g;
  if (o.cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = o.filter || "lowpass";
    f.Q.value = o.q ?? 1;
    const [c0, c1] = Array.isArray(o.cutoff) ? o.cutoff : [o.cutoff];
    f.frequency.setValueAtTime(c0, t);
    if (c1) f.frequency.exponentialRampToValueAtTime(c1, t + (o.sweep ?? dur));
    f.connect(g);
    head = f;
  }
  const end = t + dur + 0.05;
  const detunes = o.uni ? [-o.uni, o.uni] : [0];
  let lfo = null;
  if (o.vib) {
    lfo = ctx.createOscillator();
    lfo.frequency.value = o.vib.rate;
    const depth = ctx.createGain();
    depth.gain.value = o.vib.depth;
    lfo.connect(depth);
    lfo.depthNode = depth;
    lfo.start(t);
    lfo.stop(end);
  }
  for (const d of detunes) {
    const osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.detune.value = d;
    if (o.slide) {
      osc.frequency.setValueAtTime(o.slide, t);
      osc.frequency.exponentialRampToValueAtTime(o.f, t + (o.slideTime ?? 0.06));
    } else osc.frequency.setValueAtTime(o.f, t);
    if (lfo) lfo.depthNode.connect(osc.frequency);
    osc.connect(head);
    osc.start(t);
    osc.stop(end);
  }
}

const chord = (io, t, notes, o) => notes.forEach((n) => note(io, t, { ...o, f: mtof(n), vol: (o.vol ?? 0.1) / Math.sqrt(notes.length) }));

function noise(io, t, o) {
  const { ctx, out } = io;
  const src = ctx.createBufferSource();
  src.buffer = io.noise;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = o.filter || "highpass";
  f.frequency.value = o.f ?? 6000;
  f.Q.value = o.q ?? 0.7;
  const g = ctx.createGain();
  env(g, t, o.vol ?? 0.1, o.a ?? 0.001, o.dur ?? 0.05);
  src.connect(f).connect(g).connect(out);
  src.start(t, rnd(t) * 0.9);
  src.stop(t + (o.dur ?? 0.05) + 0.05);
}

const kick = (io, t, vol = 0.8, from = 150, to = 45, dur = 0.35) => note(io, t, { f: to, slide: from, slideTime: 0.1, dur, vol, a: 0.002 });
const snare = (io, t, vol = 0.25, tail = 0.16) => {
  noise(io, t, { filter: "bandpass", f: 1900, q: 0.8, vol, dur: tail });
  note(io, t, { type: "triangle", f: 185, dur: 0.08, vol: vol * 0.6 });
};
const hat = (io, t, vol = 0.05, open = false) => noise(io, t, { f: 8000, vol, dur: open ? 0.14 : 0.03 });
const clap = (io, t, vol = 0.2) => [0, 0.011, 0.022].forEach((d, i) => noise(io, t + d, { filter: "bandpass", f: 1300, q: 1.2, vol: vol * (i === 2 ? 1 : 0.6), dur: i === 2 ? 0.18 : 0.012 }));
// an inharmonic struck-metal partial stack
const bell = (io, t, f, vol = 0.1, dur = 4) =>
  [1, 2.76, 5.4, 8.93].forEach((r, i) => note(io, t, { f: f * r, dur: dur / (1 + i * 0.8), vol: vol / (1 + i * 1.5), a: 0.002 }));

// ---- the tracks --------------------------------------------------------
// play(io, step, t, sp): step counts 16ths from the start of the track,
// t is when it sounds, sp is one 16th in seconds.

const bar = (step, n) => Math.floor(step / 16) % n;

export const THEMES = {
  // The house — Lo-fi Living Room: dusty swung boom-bap, Rhodes-ish
  // sevenths, vinyl crackle, a sleepy pentatonic noodle on top.
  house: {
    bpm: 80,
    swing: 0.33,
    wet: 0.35,
    play(io, step, t, sp) {
      const b = bar(step, 4);
      const s = step % 16;
      const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
      const root = chords[b][0] - 12;
      if (s === 0) chord(io, t, chords[b], { type: "triangle", cutoff: 1600, uni: 7, a: 0.02, dur: sp * 15, vol: 0.13, vib: { rate: 0.6, depth: 1.2 } });
      if (s === 10) chord(io, t, chords[b], { type: "triangle", cutoff: 1300, uni: 7, a: 0.02, dur: sp * 6, vol: 0.08 });
      if (s === 0 || s === 10) note(io, t, { f: mtof(root - 12), dur: sp * 5, vol: 0.3, cutoff: 400 });
      if (s === 7) note(io, t, { f: mtof(root - 5), dur: sp * 2, vol: 0.22, cutoff: 400 });
      if (s === 0 || s === 10 || (s === 3 && b % 2)) kick(io, t, 0.65, 120, 42, 0.3);
      if (s === 4 || s === 12) noise(io, t, { filter: "bandpass", f: 1500, q: 0.7, vol: 0.18, dur: 0.14 });
      if (s % 2 === 0) hat(io, t, s % 4 ? 0.035 : 0.02);
      if (rnd(step) < 0.45) noise(io, t + rnd(step + 1) * sp, { f: 2500, vol: 0.025, dur: 0.004 });
      const penta = [72, 74, 76, 79, 81, 84];
      if ([2, 6, 9, 14].includes(s) && rnd(step * 3) < 0.55) note(io, t, { f: mtof(penta[Math.floor(rnd(step * 7) * penta.length)]), dur: sp * 4, vol: 0.05, a: 0.01, vib: { rate: 5, depth: 2 } });
    },
  },

  // Family — Oompah Polka Party: tuba on the one, "pah" chords on the
  // off, an accordion that will not stop smiling, a slide whistle and a
  // "HEY!" every few bars.
  family: {
    bpm: 126,
    wet: 0.18,
    play(io, step, t, sp) {
      const b = bar(step, 4);
      const s = step % 16;
      const loop = Math.floor(step / 64);
      const F = { bass: [41, 48], pah: [57, 60, 65] };
      const C7 = { bass: [36, 43], pah: [55, 58, 64] };
      const ch = b === 1 || (b === 3 && s < 8) ? C7 : F;
      if (s === 0 || s === 8) note(io, t, { type: "square", f: mtof(ch.bass[s ? 1 : 0]), cutoff: 520, dur: sp * 2.6, vol: 0.2 });
      if (s === 4 || s === 12) {
        chord(io, t, ch.pah, { type: "triangle", dur: sp * 1.4, vol: 0.12, cutoff: 3000 });
        noise(io, t, { f: 5000, vol: 0.05, dur: 0.06 });
      }
      if (s === 0 || s === 8) kick(io, t, 0.35, 100, 50, 0.18);
      const tune = [72, 0, 69, 72, 77, 76, 74, 72, 70, 0, 67, 70, 76, 74, 72, 70, 69, 72, 77, 72, 69, 72, 77, 79, 77, 76, 74, 72, 70, 67, 65, 0];
      if (s % 2 === 0) {
        const n = tune[(step / 2) % 32];
        if (n) note(io, t, { type: "sawtooth", f: mtof(n + (loop % 2 ? 12 : 0)), uni: 12, cutoff: 2400, a: 0.01, dur: sp * 1.8, vol: 0.06, vib: { rate: 6, depth: 3 } });
      }
      if (b === 2 && s === 14) note(io, t, { f: 2400, slide: 900, slideTime: 0.25, dur: 0.3, vol: 0.05, vib: { rate: 9, depth: 30 } });
      if (b === 3 && s === 14 && loop % 2) noise(io, t, { filter: "bandpass", f: 850, q: 4, vol: 0.4, dur: 0.18, a: 0.01 }); // HEY!
    },
  },

  // Shrine — Neon Temple: koto plucks in the In scale over a drone and a
  // temple bell, taiko on the downbeat… and then every other phrase it
  // drops into Japanese trap: 808 glides, half-time claps, rolling hats.
  shrine: {
    bpm: 76,
    wet: 0.55,
    play(io, step, t, sp) {
      const b8 = bar(step, 8);
      const s = step % 16;
      const trap = b8 >= 4;
      const scale = [62, 63, 67, 69, 70, 74, 75, 79];
      if (s === 0 && b8 % 2 === 0) {
        note(io, t, { f: mtof(38), dur: sp * 32, a: 1.2, vol: 0.12 });
        note(io, t, { f: mtof(45), dur: sp * 32, a: 1.6, vol: 0.06 });
      }
      if (s === 0 && b8 % 4 === 0) bell(io, t, mtof(74), 0.12, 6);
      if ([0, 3, 6, 8, 11, 14].includes(s) && rnd(step) < (trap ? 0.4 : 0.7)) {
        const n = scale[Math.floor(rnd(step * 5) * scale.length)];
        const bend = rnd(step * 11) < 0.25;
        note(io, t, { type: "triangle", f: mtof(n), slide: bend ? mtof(n - 1) : undefined, slideTime: 0.12, cutoff: [4500, 700], dur: 1.1, vol: 0.13 });
        note(io, t, { type: "sawtooth", f: mtof(n), cutoff: [3000, 400], sweep: 0.2, dur: 0.25, vol: 0.03 });
      }
      if (!trap) {
        if (s === 0 || s === 11 || (s === 14 && b8 === 3)) {
          kick(io, t, 0.7, 110, 48, 0.6);
          noise(io, t, { filter: "lowpass", f: 400, vol: 0.15, dur: 0.12 });
        }
      } else {
        if (s === 0 || s === 10) note(io, t, { f: mtof(26), slide: s ? mtof(31) : undefined, slideTime: 0.2, dur: sp * 6, vol: 0.45 });
        if (s === 8) clap(io, t, 0.22);
        const roll = s >= 12 && b8 % 2;
        if (roll) for (let k = 0; k < 3; k++) hat(io, t + (k * sp) / 3, 0.035);
        else if (s % 2 === 0 || rnd(step) < 0.3) hat(io, t, s % 4 ? 0.03 : 0.045);
      }
    },
  },

  // Workshop — Acid Factory: four-on-the-floor warehouse techno, a 303
  // squelching through a resonant filter that opens over eight bars, and
  // metal being hit on purpose.
  workshop: {
    bpm: 134,
    wet: 0.15,
    play(io, step, t, sp) {
      const b8 = bar(step, 8);
      const s = step % 16;
      if (s % 4 === 0) kick(io, t, 0.85, 160, 44, 0.32);
      if (s % 4 === 2) hat(io, t, 0.08, true);
      else if (s % 2) hat(io, t, 0.03);
      if (s === 4 || s === 12) clap(io, t, 0.2);
      if ((s === 3 || s === 11) && rnd(step) < 0.7) {
        noise(io, t, { filter: "bandpass", f: 3200, q: 8, vol: 0.12, dur: 0.09 });
        note(io, t, { type: "square", f: 1760 + rnd(step) * 400, dur: 0.05, vol: 0.02 });
      }
      if (b8 === 7 && s >= 12) snare(io, t, 0.08 + (s - 12) * 0.05, 0.08);
      const acid = [45, 45, 57, 0, 48, 45, 60, 43, 45, 57, 0, 52, 55, 45, 57, 58];
      const accent = [1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1];
      const n = acid[s];
      if (n) {
        const open = 0.5 - 0.5 * Math.cos((step / 128) * Math.PI * 2);
        const cut = 280 + 2200 * open;
        const slide = s > 0 && acid[s - 1] && rnd(step) < 0.3 ? mtof(acid[s - 1]) : undefined;
        note(io, t, { type: "sawtooth", f: mtof(n), slide, cutoff: [cut * (accent[s] ? 3 : 1.8), cut * 0.5], sweep: sp * 1.5, q: 16, dur: sp * 0.95, vol: accent[s] ? 0.12 : 0.08 });
      }
    },
  },

  // Hobbies — 8-bit Overdrive: a boss-fight chiptune. Square arpeggios,
  // triangle bass, noise drums, a hero melody every other loop and a
  // power-up chime at the end of each phrase.
  hobbies: {
    bpm: 152,
    wet: 0.1,
    play(io, step, t, sp) {
      const b = bar(step, 4);
      const s = step % 16;
      const loop = Math.floor(step / 64);
      const chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
      const c = chords[b];
      const arp = [c[0], c[1], c[2], c[0] + 12][s % 4] + 12;
      note(io, t, { type: "square", f: mtof(arp), dur: sp * 0.8, vol: 0.035, a: 0.001 });
      if (s % 2 === 0) note(io, t, { type: "triangle", f: mtof(c[0] - 24 + (s % 4 ? 12 : 0)), dur: sp * 1.6, vol: 0.22, a: 0.001 });
      if (s === 0 || s === 8 || (s === 6 && b % 2)) note(io, t, { type: "triangle", f: 55, slide: 300, slideTime: 0.05, dur: 0.12, vol: 0.4, a: 0.001 });
      if (s === 4 || s === 12) noise(io, t, { filter: "lowpass", f: 7000, vol: 0.13, dur: 0.1 });
      if (s % 2 === 0) noise(io, t, { f: 9000, vol: 0.025, dur: 0.02 });
      const lead = [[72, 76, 79, 76, 84, 0, 79, 0], [74, 79, 83, 79, 86, 0, 83, 0], [76, 72, 69, 72, 76, 79, 81, 0], [77, 81, 84, 81, 77, 76, 74, 72]];
      if (loop % 2 && s % 2 === 0) {
        const n = lead[b][s / 2];
        if (n) note(io, t, { type: "square", f: mtof(n), cutoff: 5000, dur: sp * 1.7, vol: 0.05, a: 0.002, vib: { rate: 7, depth: 4 } });
      }
      if (b === 3 && s === 14) [988, 1319, 1976].forEach((f, k) => note(io, t + k * 0.05, { type: "square", f, dur: 0.07, vol: 0.04 }));
    },
  },

  // Photos — Bossa on the Line: poolside bossa nova for hanging memories
  // out to dry. Nylon comping on the clave, walking-ish bass, shaker, rim
  // clicks and a breathy flute with vibrato.
  washing: {
    bpm: 118,
    wet: 0.3,
    play(io, step, t, sp) {
      const b = bar(step, 4);
      const s = step % 16;
      const loop = Math.floor(step / 64);
      const roots = [38, 43, 36, 45];
      const voicings = [[53, 57, 60, 64], [53, 59, 64], [52, 55, 59, 62], [55, 58, 61, 64]];
      if ([0, 3, 6, 10, 13].includes(s)) {
        chord(io, t, voicings[b], { type: "triangle", cutoff: [2600, 900], dur: sp * 2.4, vol: 0.13, a: 0.003 });
        noise(io, t, { filter: "bandpass", f: 1700, q: 5, vol: 0.06, dur: 0.02 });
      }
      const r = roots[b];
      if (s === 0 || s === 14) note(io, t, { f: mtof(r), dur: sp * 5, vol: 0.28, cutoff: 600 });
      if (s === 6 || s === 8) note(io, t, { f: mtof(r + 7), dur: sp * 2, vol: 0.22, cutoff: 600 });
      if (s === 0 || s === 8) kick(io, t, 0.3, 90, 50, 0.2);
      noise(io, t, { f: 6000, vol: s % 2 ? 0.035 : 0.018, dur: 0.04, a: 0.01 });
      const flute = [[69, 0, 72, 74, 76, 0, 74, 72], [71, 0, 74, 76, 77, 76, 74, 0], [76, 74, 72, 71, 72, 0, 67, 0], [70, 0, 69, 0, 67, 69, 70, 73]];
      if (loop % 2 === 0 && s % 2 === 0) {
        const n = flute[b][s / 2];
        if (n) {
          note(io, t, { f: mtof(n), a: 0.04, dur: sp * 2.2, vol: 0.07, vib: { rate: 5.2, depth: 4 } });
          noise(io, t, { filter: "bandpass", f: mtof(n) * 2, q: 3, vol: 0.012, dur: sp * 1.5, a: 0.03 });
        }
      }
    },
  },

  // The path — Outrun to the Horizon: synthwave at sunset doing 88mph.
  // Pulsing octave bass, wide saw pads, a gated snare the size of a
  // stadium, an echoing arp and a laser at the end of every phrase.
  heading: {
    bpm: 104,
    wet: 0.5,
    play(io, step, t, sp) {
      const b = bar(step, 4);
      const s = step % 16;
      const loop = Math.floor(step / 64);
      const roots = [45, 41, 48, 43];
      const pads = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]];
      note(io, t, { type: "sawtooth", f: mtof(roots[b] - 12 + (s % 2 ? 12 : 0)), cutoff: [1400, 300], dur: sp * 0.85, vol: 0.09, q: 4 });
      if (s === 0) chord(io, t, pads[b].concat(pads[b][0] + 12), { type: "sawtooth", uni: 14, cutoff: 1900, a: 0.35, dur: sp * 16, vol: 0.12 });
      if (s === 0 || s === 8 || (s === 10 && b === 3)) kick(io, t, 0.8, 140, 42, 0.4);
      if (s === 4 || s === 12) {
        snare(io, t, 0.3, 0.38);
        noise(io, t, { filter: "lowpass", f: 5000, vol: 0.08, dur: 0.6 });
      }
      if (s % 2 === 0) hat(io, t, 0.03);
      if (loop % 2 || b >= 2) {
        const c = pads[b];
        const n = [c[0], c[1], c[2], c[1]][s % 4] + 24;
        note(io, t, { type: "square", f: mtof(n), cutoff: 3500, dur: sp * 0.7, vol: 0.03 });
        note(io, t + sp * 3, { type: "square", f: mtof(n), cutoff: 2200, dur: sp * 0.7, vol: 0.012 });
      }
      if (b === 3 && s === 14) note(io, t, { type: "sawtooth", f: 90, slide: 2400, slideTime: 0.4, cutoff: 3000, dur: 0.45, vol: 0.05 });
    },
  },

  // The gate — Tango of Requirements: the spec sheet, danced. Bandoneon
  // stabs in marcato and habanera, a melodramatic violin, a body knock on
  // the off-beat, a chromatic run into the turnaround and a dramatic stop.
  gate: {
    bpm: 118,
    wet: 0.3,
    play(io, step, t, sp) {
      const b = bar(step, 4);
      const b8 = bar(step, 8);
      const s = step % 16;
      const Dm = { c: [62, 65, 69], r: [38, 45] };
      const A7 = { c: [61, 64, 67], r: [33, 40] };
      const Gm = { c: [62, 67, 70], r: [43, 50] };
      const ch = [Dm, A7, Dm, s < 8 ? Gm : A7][b];
      if (b8 === 7 && s >= 13) return; // the dramatic stop
      const marcato = b % 2 === 0;
      const hits = marcato ? [0, 4, 8, 12] : [0, 3, 6, 8, 12];
      if (hits.includes(s) && !(b === 3 && s >= 12)) chord(io, t, ch.c, { type: "sawtooth", uni: 9, cutoff: [2200, 700], dur: s === 0 ? sp * 1.6 : sp * 0.9, vol: s === 0 ? 0.16 : 0.1, a: 0.004 });
      if ([0, 6, 8, 12].includes(s)) note(io, t, { type: "triangle", f: mtof(ch.r[s >= 8 ? 1 : 0]), cutoff: 900, dur: sp * 1.5, vol: 0.28 });
      if (s === 2 && b % 2) noise(io, t, { filter: "bandpass", f: 300, q: 2, vol: 0.25, dur: 0.06 });
      if (b === 3 && s >= 12) note(io, t, { type: "sawtooth", f: mtof(69 + (s - 12)), uni: 9, cutoff: 2000, dur: sp * 0.9, vol: 0.07 });
      const violin = [
        [[0, 74, 6], [6, 73, 2], [8, 74, 4], [12, 77, 4]],
        [[0, 76, 6], [6, 73, 2], [8, 69, 8]],
        [[0, 77, 4], [4, 76, 4], [8, 74, 4], [12, 81, 4]],
        [[0, 79, 4], [4, 77, 2], [6, 76, 2], [8, 73, 4]],
      ];
      for (const [at, n, len] of violin[b]) if (at === s) note(io, t, { type: "sawtooth", f: mtof(n), cutoff: 2600, a: 0.08, dur: sp * len, vol: 0.07, vib: { rate: 5.5, depth: 5 } });
    },
  },
};

// ---- the player --------------------------------------------------------

let ctx = null;
let bus = null;
let reverb = null;
let noiseBuf = null;
let timer = null;
let players = [];
let wanted = null;
const listeners = new Set();

export const musicPlaying = () => !!(ctx && wanted && THEMES[wanted]);
export const onMusicChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const notify = () => listeners.forEach((l) => l());

function impulse(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.5;
  }
  return buf;
}

function switchTo(id) {
  const now = ctx.currentTime;
  const fade = AUDIO.music.fadeSeconds;
  for (const p of players) {
    if (p.dying) continue;
    p.dying = now + fade * 1.5;
    p.out.gain.setTargetAtTime(0, now, fade / 4);
    p.send.gain.setTargetAtTime(0, now, fade / 4);
  }
  const th = THEMES[id];
  if (!th) return;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(1, now, fade / 4);
  out.connect(bus);
  const send = ctx.createGain();
  send.gain.value = th.wet ?? 0.2;
  out.connect(send).connect(reverb);
  players.push({ th, out, send, io: { ctx, out, noise: noiseBuf }, step: 0, next: now + 0.08, dying: 0 });
}

function tick() {
  if (!ctx) return;
  const now = ctx.currentTime;
  const ahead = now + 0.15;
  players = players.filter((p) => {
    if (p.dying && now > p.dying) {
      p.out.disconnect();
      p.send.disconnect();
      return false;
    }
    return true;
  });
  for (const p of players) {
    const sp = 60 / p.th.bpm / 4;
    if (p.next < now - 0.1) p.next = now + 0.02; // the tab slept; don't fire a backlog
    while (p.next < ahead) {
      const t = p.next + (p.th.swing && p.step % 2 ? sp * p.th.swing : 0);
      p.th.play(p.io, p.step, t, sp);
      p.step++;
      p.next += sp;
    }
  }
}

// Called by ambience.js once the graph is up, and on teardown.
export function startMusic(context, destination) {
  if (ctx) return;
  ctx = context;
  bus = ctx.createGain();
  bus.gain.value = AUDIO.music.level;
  bus.connect(destination);
  reverb = ctx.createConvolver();
  reverb.buffer = impulse(2.4);
  reverb.connect(bus);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  timer = window.setInterval(tick, 25);
  if (wanted) switchTo(wanted);
  notify();
}

export function stopMusic() {
  if (!ctx) return;
  window.clearInterval(timer);
  for (const p of players) {
    p.out.disconnect();
    p.send.disconnect();
  }
  players = [];
  reverb.disconnect();
  bus.disconnect();
  ctx = bus = reverb = timer = null;
  notify();
}

// The place that's open (null for none). Remembered while sound is off, so
// turning sound on inside a place starts that place's track.
export function setMusicSection(id) {
  const next = id && THEMES[id] ? id : null;
  if (next === wanted) return;
  wanted = next;
  if (ctx) switchTo(next);
  notify();
}
