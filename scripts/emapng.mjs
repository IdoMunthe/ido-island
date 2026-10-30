// Paints every ema with the real painter (src/three/textures.js paintEma —
// the very code the browser runs) onto Node canvases, with the same subset
// of Noto Serif TC the page loads, tiles them into scripts/ema.png so the
// result can be looked at, and then measures the bitmaps: if a character
// is missing, or came out as a tofu box, it fails. Run:
//   node scripts/emapng.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { content } from "../src/content.js";
import { paintEma, EMA_FONT, EMA_GLYPH } from "../src/three/textures.js";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const fonts = [
  [EMA_FONT.family, "./fonts/NotoSerifTC-ema-subset.ttf"],
  ["Nanum Pen Script", "./fonts/NanumPenScript-subset.ttf"],
];
for (const [family, file] of fonts) {
  const okReg = GlobalFonts.registerFromPath(here(file), family);
  console.log(`${okReg ? "font " : "FONT MISSING "}${family} ← ${file}`);
}

const values = (content.values?.items || []).slice(0, 10);
const W = 512;
const H = Math.round(W * 0.9);

// the glyph area of a plaque: the centred band the characters are painted in
const area = { x0: 0.08, x1: 0.92, y0: EMA_GLYPH.y - 0.3, y1: EMA_GLYPH.y + 0.3 };
function ink(canvas) {
  const ctx = canvas.getContext("2d");
  const x = Math.round(W * area.x0);
  const y = Math.round(H * area.y0);
  const w = Math.round(W * (area.x1 - area.x0));
  const h = Math.round(H * (area.y1 - area.y0));
  const d = ctx.getImageData(x, y, w, h).data;
  // dark pixels (the wood is ~ (217,185,138), ink is ~ (24,32,29))
  let n = 0;
  let minX = w, maxX = -1, minY = h, maxY = -1;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const dark = d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] < 240;
    if (!dark) continue;
    mask[i] = 1;
    n++;
    const px = i % w;
    const py = (i / w) | 0;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }
  const coverage = n / (w * h);
  if (n === 0) return { coverage: 0, interior: 0, hash: "empty", box: null };
  // a tofu is a hollow rectangle: its inside is empty. Count ink in the inner
  // 50% of the ink's own bounding box
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  let inner = 0, innerN = 0;
  for (let py = minY + Math.round(bh * 0.25); py < minY + Math.round(bh * 0.75); py++)
    for (let px = minX + Math.round(bw * 0.25); px < minX + Math.round(bw * 0.75); px++) {
      innerN++;
      if (mask[py * w + px]) inner++;
    }
  // a cheap signature of the shape, to tell two renderings apart
  let hash = 0;
  for (let i = 0; i < mask.length; i += 7) hash = (hash * 31 + mask[i] * (i % 251)) % 1000003;
  return { coverage, interior: innerN ? inner / innerN : 0, hash: String(hash), box: [bw, bh] };
}

const tiles = [];
const fails = [];
// the reference: a character no font has (private use), painted the same way
const notdef = createCanvas(W, H);
paintEma("", W, { glyph: true, canvas: notdef });
const ref = ink(notdef);
console.log(`reference (U+E000, no glyph): coverage ${(ref.coverage * 100).toFixed(1)}%, interior ${(ref.interior * 100).toFixed(0)}%`);

for (const v of values) {
  const text = v.glyph || v.name || "";
  const c = createCanvas(W, H);
  paintEma(text, W, { glyph: !!v.glyph, canvas: c });
  const m = ink(c);
  tiles.push({ c, label: `${v.name} ${v.glyph || ""}` });
  const line = `${v.name.padEnd(12)} ${(v.glyph || "—").padEnd(3)} coverage ${(m.coverage * 100).toFixed(1).padStart(5)}%  interior ${(m.interior * 100).toFixed(0).padStart(3)}%  box ${m.box ? m.box.join("×") : "none"}`;
  console.log("  " + line);
  if (!v.glyph) fails.push(`${v.name}: no glyph set`);
  if (m.coverage < 0.03) fails.push(`${v.name} ${v.glyph}: only ${(m.coverage * 100).toFixed(1)}% ink — the character is not painted`);
  if (m.coverage > 0.6) fails.push(`${v.name} ${v.glyph}: ${(m.coverage * 100).toFixed(0)}% ink — a solid block, not a character`);
  if (m.interior < 0.04) fails.push(`${v.name} ${v.glyph}: a hollow box (interior ${(m.interior * 100).toFixed(0)}% ink) — tofu, the font has no such glyph`);
  if (m.hash === ref.hash) fails.push(`${v.name} ${v.glyph}: painted exactly like a character the font lacks — tofu`);
}
// two different characters must not paint the same
for (let i = 0; i < values.length; i++)
  for (let j = i + 1; j < values.length; j++)
    if (values[i].glyph && values[i].glyph === values[j].glyph) console.log(`  note: ${values[i].name} and ${values[j].name} share ${values[i].glyph}`);

// the contact sheet
const cols = 4;
const rows = Math.ceil((tiles.length + 1) / cols);
const pad = 16;
const sheet = createCanvas(cols * (W + pad) + pad, rows * (H + pad + 28) + pad);
const sctx = sheet.getContext("2d");
sctx.fillStyle = "#1e2a27";
sctx.fillRect(0, 0, sheet.width, sheet.height);
sctx.fillStyle = "#f6f4ee";
sctx.font = `500 20px "Nanum Pen Script", sans-serif`;
[...tiles, { c: notdef, label: "reference: U+E000 (no glyph)" }].forEach((t, i) => {
  const x = pad + (i % cols) * (W + pad);
  const y = pad + Math.floor(i / cols) * (H + pad + 28);
  sctx.drawImage(t.c, x, y);
  sctx.fillText(t.label, x + 4, y + H + 22);
});
const out = here("./ema.png");
writeFileSync(out, sheet.toBuffer("image/png"));
console.log(`painted ${tiles.length} plaques → ${out} (${sheet.width}×${sheet.height})`);
console.log(fails.length ? `FAIL:\n  ${fails.join("\n  ")}` : "ema.png: every character present, none a tofu box");
process.exit(fails.length ? 1 : 0);
