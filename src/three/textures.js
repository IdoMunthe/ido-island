// Paints signs, labels and photographs onto 2D canvases with the site's own
// web fonts, then hands them to three.js as textures. Nothing is fetched;
// every string comes from content.js.
import * as THREE from "three";

const PAPER = "#f8f4ea";
const PAPER_2 = "#ece9e0";
const INK = "#18201d";
const INK_SOFT = "#4b5450";
const INK_MUTE = "#7a837e";
const PEN = "#2b4bc2";
const POSTAL = "#c1272d";

const F_DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const F_MONO = '"IBM Plex Mono", Menlo, Consolas, monospace';
const F_HAND = '"Nanum Pen Script", "Segoe Print", cursive';
const F_BODY = '"Instrument Sans", "Helvetica Neue", Arial, sans-serif';

export async function waitForFonts(timeout = 1800) {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  const wanted = ['500 60px "Fraunces"', 'italic 400 30px "Fraunces"', '500 20px "IBM Plex Mono"', '600 20px "IBM Plex Mono"', '400 40px "Nanum Pen Script"', '400 20px "Instrument Sans"'];
  await Promise.race([Promise.all(wanted.map((f) => document.fonts.load(f).catch(() => null))), new Promise((r) => setTimeout(r, timeout))]);
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// Materials compile their shader the first time they are drawn. If the
// texture arrives later (every painted or downloaded one does) neither three
// nor react-three-fiber recompiles for a new `map`, so the material keeps
// its no-texture program and the board stays blank. Pass this as
// `onUpdate` on any material whose map is set after first render.
export function remap(material) {
  material.needsUpdate = true;
}

export function toTexture(canvas, { srgb = true, repeat = null } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
  }
  t.needsUpdate = true;
  return t;
}

// Paper fibre: short random strokes in light and dark.
function fibres(ctx, w, h, alpha, count, seed = 1) {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const len = 2 + rnd() * 9;
    const a = rnd() * Math.PI;
    ctx.strokeStyle = rnd() < 0.5 ? "#000" : "#fff";
    ctx.lineWidth = 0.5 + rnd();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function setFont(ctx, weight, size, family, style = "") {
  ctx.font = `${style} ${weight} ${size}px ${family}`.trim();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// --------------------------------------------------------------------
// Polaroids (front: photo in a white frame + caption; back: handwriting)
// --------------------------------------------------------------------
export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    if (/^https?:/.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function paintPolaroidFront(img, caption, size = 512) {
  const W = size;
  const H = Math.round(size * 1.2);
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  fibres(ctx, W, H, 0.03, 900, 17);
  const inset = Math.round(W * 0.06);
  const pw = W - inset * 2;
  ctx.fillStyle = PAPER_2;
  ctx.fillRect(inset, inset, pw, pw);
  if (img && img.width && img.height) {
    const s = Math.max(pw / img.width, pw / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset, inset, pw, pw);
    ctx.clip();
    ctx.drawImage(img, inset + (pw - dw) / 2, inset + (pw - dh) / 2, dw, dh);
    ctx.restore();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(inset + 1, inset + 1, pw - 2, pw - 2);
  if (caption) {
    ctx.fillStyle = PEN;
    setFont(ctx, 400, Math.round(W * 0.095), F_HAND);
    ctx.textAlign = "center";
    ctx.fillText(caption, W / 2, inset + pw + (H - inset - pw) * 0.62, pw);
    ctx.textAlign = "left";
  }
  return c;
}

// The house sign: the name large, the tagline in italics beneath.
export function paintSign(name, tagline, W = 1024) {
  const H = Math.round(W * (0.42 / 0.9));
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  fibres(ctx, W, H, 0.04, 900, 37);
  ctx.strokeStyle = "#b98a5e";
  ctx.lineWidth = W * 0.012;
  ctx.strokeRect(W * 0.03, H * 0.06, W * 0.94, H * 0.88);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  let size = W * 0.1;
  setFont(ctx, 500, size, F_DISPLAY);
  while (ctx.measureText(name).width > W * 0.84 && size > W * 0.04) {
    size -= W * 0.006;
    setFont(ctx, 500, size, F_DISPLAY);
  }
  ctx.fillText(name, W / 2, H * (tagline ? 0.5 : 0.62));
  if (tagline) {
    ctx.fillStyle = INK_SOFT;
    setFont(ctx, 400, W * 0.04, F_DISPLAY, "italic");
    ctx.fillText(tagline, W / 2, H * 0.78, W * 0.86);
  }
  ctx.textAlign = "left";
  return c;
}

// An ema: a wooden votive plaque with a value written on it by hand.
export function paintEma(text, W = 512) {
  const H = Math.round(W * 0.9);
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#d9b98a";
  ctx.fillRect(0, 0, W, H);
  // wood grain: soft horizontal streaks
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = i % 2 ? "rgba(120,80,40,0.10)" : "rgba(255,240,210,0.12)";
    const y = (i / 26) * H + Math.sin(i * 1.7) * 6;
    ctx.fillRect(0, y, W, 4 + (i % 3) * 3);
  }
  fibres(ctx, W, H, 0.05, 300, 17);
  // the hole and the cord's knot at the top
  ctx.fillStyle = "#6b4a2e";
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.14, W * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = W * 0.26;
  setFont(ctx, 400, size, F_HAND);
  const lines = wrapLines(ctx, String(text || ""), W * 0.8).slice(0, 2);
  while (lines.some((l) => ctx.measureText(l).width > W * 0.82) && size > W * 0.1) {
    size -= W * 0.02;
    setFont(ctx, 400, size, F_HAND);
  }
  const lh = size * 1.05;
  const y0 = H * 0.58 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh));
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  return c;
}

// A stencilled crate label: number + dates.
export function paintCrate(dates, index, W = 512) {
  const H = Math.round(W * 0.65);
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f3ead9";
  ctx.fillRect(0, 0, W, H);
  fibres(ctx, W, H, 0.05, 500, 41 + index);
  ctx.strokeStyle = INK;
  ctx.lineWidth = W * 0.014;
  ctx.setLineDash([W * 0.05, W * 0.025]);
  ctx.strokeRect(W * 0.05, H * 0.08, W * 0.9, H * 0.84);
  ctx.setLineDash([]);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  setFont(ctx, 700, W * 0.3, F_MONO);
  ctx.fillText(String(index).padStart(2, "0"), W / 2, H * 0.55);
  setFont(ctx, 600, W * 0.075, F_MONO);
  ctx.fillText(String(dates || "").toUpperCase(), W / 2, H * 0.83, W * 0.8);
  ctx.textAlign = "left";
  return c;
}

// The welcome sign on the gate. "Welcome to" small and spaced above the
// island's name in big brushed letters, each one a little off its baseline
// and tilted its own way, on a cream board with a double painted border.
// The lettering is plain black on cream; the red is kept for the border
// and the flourish.
//
// Layout fractions of the board height, shared with scripts/signcheck.mjs
// so the on-screen letter size can be estimated without a browser.
export const WELCOME = {
  nameSize: 0.5, // font size of the name as a fraction of the board height
  capHeight: 0.62, // roughly how much of that font size a capital fills
};

// "Welcome to Ido's Island" → { small: "Welcome to", name: "Ido's Island" }.
// Anything that doesn't start with "welcome to" is all name. Pure, so the
// check script can run it in Node.
export function splitWelcome(text) {
  const raw = String(text || "").trim();
  const m = raw.match(/^(welcome\s+to)\s+(.+)$/i);
  return m ? { small: m[1], name: m[2] } : { small: "", name: raw };
}

// `canvas` may be supplied (scripts/signpng.mjs passes a Node canvas) so
// the very same drawing code can be run and looked at outside a browser.
export function paintWelcome(text, W = 1024, canvas = null) {
  const H = Math.round(W * (0.6 / 1.3));
  const c = canvas || makeCanvas(W, H);
  if (c.width !== W || c.height !== H) {
    c.width = W;
    c.height = H;
  }
  const ctx = c.getContext("2d");
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  fibres(ctx, W, H, 0.05, 700, 91);
  // double border, slightly uneven like a brush
  ctx.strokeStyle = "#b8322f";
  ctx.lineWidth = H * 0.028;
  ctx.strokeRect(W * 0.03, H * 0.06, W * 0.94, H * 0.88);
  ctx.lineWidth = H * 0.01;
  ctx.strokeRect(W * 0.05, H * 0.105, W * 0.9, H * 0.79);
  const { small, name } = splitWelcome(text);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const rnd = seededRandom(7);
  if (small) {
    ctx.fillStyle = "#000000";
    setFont(ctx, 600, H * 0.13, F_MONO);
    const spaced = small.toUpperCase().split("").join(String.fromCharCode(8202));
    ctx.fillText(spaced, W / 2, H * 0.3);
    // a short rule either side
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = H * 0.008;
    const tw = ctx.measureText(spaced).width;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + sgn * (tw / 2 + W * 0.025), H * 0.265);
      ctx.lineTo(W / 2 + sgn * (tw / 2 + W * 0.09), H * 0.265);
      ctx.stroke();
    }
  }
  // the name, letter by letter, each with its own tilt and lift
  let size = H * (small ? WELCOME.nameSize : 0.62);
  setFont(ctx, 400, size, F_HAND);
  while (ctx.measureText(name).width > W * 0.84 && size > H * 0.2) {
    size -= H * 0.01;
    setFont(ctx, 400, size, F_HAND);
  }
  const widths = name.split("").map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = W / 2 - total / 2;
  const y = H * (small ? 0.76 : 0.68);
  ctx.textAlign = "left";
  name.split("").forEach((ch, i) => {
    const tilt = (rnd() - 0.5) * 0.12;
    const lift = (rnd() - 0.5) * size * 0.07;
    ctx.save();
    ctx.translate(x + widths[i] / 2, y + lift);
    ctx.rotate(tilt);
    // a soft shadow first, then the ink; a thin ink stroke fattens the hand face
    ctx.fillStyle = "rgba(24,32,29,0.22)";
    ctx.fillText(ch, -widths[i] / 2 + size * 0.03, size * 0.03);
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = size * 0.035;
    ctx.lineJoin = "round";
    ctx.strokeText(ch, -widths[i] / 2, 0);
    ctx.fillText(ch, -widths[i] / 2, 0);
    ctx.restore();
    x += widths[i];
  });
  // a little flourish under the name
  ctx.strokeStyle = "#b8322f";
  ctx.lineWidth = H * 0.012;
  ctx.beginPath();
  ctx.moveTo(W * 0.3, H * 0.87);
  ctx.quadraticCurveTo(W / 2, H * 0.835, W * 0.7, H * 0.87);
  ctx.stroke();
  ctx.textAlign = "left";
  return c;
}

function seededRandom(seed) {
  let s = seed * 7919 + 13;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// --------------------------------------------------------------------
// Surface variation (tiled)
// --------------------------------------------------------------------
// Wood grain on a base colour (guitar, signs).
export function paintWood(base = "#b98a5e") {
  const S = 512;
  const c = makeCanvas(S, S);
  const ctx = c.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  let s = 77;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 90; i++) {
    const y = rnd() * S;
    ctx.strokeStyle = rnd() < 0.5 ? "rgba(0,0,0,0.16)" : "rgba(255,230,190,0.12)";
    ctx.lineWidth = 0.8 + rnd() * 2.2;
    ctx.beginPath();
    for (let x = 0; x <= S; x += 16) {
      const yy = y + Math.sin(x / 60 + i) * 4 + Math.sin(x / 17 + i * 3) * 1.2;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  return c;
}

// Soft blotchy noise, tinted: breaks up large flat surfaces (grass, walls).
export function paintNoise(base = "#ffffff", strength = 0.12, S = 256, seed = 71) {
  const c = makeCanvas(S, S);
  const ctx = c.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 900; i++) {
    const r = 6 + rnd() * 26;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    const dark = rnd() < 0.5;
    g.addColorStop(0, dark ? `rgba(0,0,0,${strength * 0.6})` : `rgba(255,255,255,${strength * 0.6})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.translate(rnd() * S, rnd() * S);
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  return c;
}

// Grass: soft patches of lighter and darker green, a few worn spots and a
// faint blade-like grain, so the ground reads as grass without anything
// scattered on it.
export function paintGrass(S = 512) {
  const c = makeCanvas(S, S);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, S, S);
  let s = 131;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  // broad patches
  for (let i = 0; i < 140; i++) {
    const r = 30 + rnd() * 90;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    const light = rnd() < 0.5;
    g.addColorStop(0, light ? "rgba(255,246,200,0.16)" : "rgba(40,80,40,0.16)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.translate(rnd() * S, rnd() * S);
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  // worn, sandy spots
  for (let i = 0; i < 14; i++) {
    const r = 14 + rnd() * 24;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, "rgba(230,211,177,0.35)");
    g.addColorStop(1, "rgba(230,211,177,0)");
    ctx.save();
    ctx.translate(rnd() * S, rnd() * S);
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  // fine grain
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 6000; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    ctx.strokeStyle = rnd() < 0.5 ? "#2f5a2f" : "#e8f0c0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 2, y - 3 - rnd() * 4);
    ctx.stroke();
  }
  ctx.restore();
  return c;
}

// The water's colour map: a paler band that fades out from the shore.
// The plane is `size` metres wide; the island sits at its centre.
export function paintShore(size, radius, shoreWidth, water, shoreColor, S = 1024) {
  const c = makeCanvas(S, S);
  const ctx = c.getContext("2d");
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, S, S);
  const px = (m) => (m / size) * S;
  const g = ctx.createRadialGradient(S / 2, S / 2, px(radius - 0.3), S / 2, S / 2, px(radius + shoreWidth));
  g.addColorStop(0, shoreColor);
  g.addColorStop(0.35, shoreColor);
  g.addColorStop(1, water);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return c;
}

// Greyscale ripples for the water's bump map.
export function paintRipples(S = 256) {
  const c = makeCanvas(S, S);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, S, S);
  let s = 5;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 260; i++) {
    const r = 10 + rnd() * 40;
    const g = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r);
    const light = rnd() < 0.5;
    g.addColorStop(0, light ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)");
    g.addColorStop(1, "rgba(128,128,128,0)");
    ctx.save();
    ctx.translate(rnd() * S, rnd() * S);
    ctx.scale(1, 0.55);
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  return c;
}

// The racket's string grid (transparent background).
export function paintStrings(S = 256) {
  const c = makeCanvas(S, S);
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(245,240,225,0.95)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 16; i++) {
    const p = (i / 16) * S;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, S);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(S, p);
    ctx.stroke();
  }
  return c;
}

export const COLORS = { PAPER, PAPER_2, PEN, INK, INK_MUTE };
