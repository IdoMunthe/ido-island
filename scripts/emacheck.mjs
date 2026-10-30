// Checks the ema at the shrine without a browser, so a plaque painted
// before its font arrived — a blank plaque, or a row of tofu boxes — can't
// get to a visitor unnoticed. Run:  node scripts/emacheck.mjs
//   1. every value in content.js has a `glyph`, and it is Chinese
//   2. the page loads the character face cut down to those characters
//      (index.html, the Noto Serif TC link's text= part covers every one)
//   3. the local subset the Node proof paints with carries every character
//      (its cmap, read from the TTF)
//   4. the wiring: the island waits for the face with those characters
//      before painting, Shrine.jsx paints the glyph, paintEma uses the
//      face, and the plaque material recompiles when its texture arrives
import { readFileSync, existsSync } from "node:fs";
import { content } from "../src/content.js";
import { EMA_FONT } from "../src/three/textures.js";

const here = (p) => new URL(p, import.meta.url);
const fails = [];
const ok = (cond, msg) => (cond ? console.log("  ok   " + msg) : (fails.push(msg), console.log("  FAIL " + msg)));
const cjk = (ch) => {
  const c = ch.codePointAt(0);
  return (c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf) || (c >= 0x20000 && c <= 0x2ebef) || (c >= 0xf900 && c <= 0xfaff);
};

// 1. the glyphs
const values = (content.values?.items || []).slice(0, 10);
const chars = new Set();
for (const v of values) {
  const g = String(v.glyph || "").replace(/\s+/g, "");
  ok(g.length > 0, `${v.name}: glyph set (${g || "—"})`);
  const cs = Array.from(g);
  ok(cs.length >= 1 && cs.length <= 2 && cs.every(cjk), `${v.name}: one or two Chinese characters`);
  cs.forEach((c) => chars.add(c));
}
console.log(`characters in use: ${[...chars].join(" ")} (${chars.size})`);

// 2. the page's font link
const html = readFileSync(here("../index.html"), "utf8");
const link = html.match(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/)?.[1] || "";
const family = encodeURIComponent(EMA_FONT.family).replace(/%20/g, "+");
ok(link.includes(`family=${family}`), `index.html loads ${EMA_FONT.family} from Google Fonts`);
ok(link.includes(`wght@${EMA_FONT.weight}`), `at weight ${EMA_FONT.weight}, the weight the painter asks for`);
const textParam = link.match(/[?&]text=([^&"]+)/)?.[1];
const served = textParam ? new Set(Array.from(decodeURIComponent(textParam))) : null;
ok(!!served, "the link is cut down to a text= set of characters (a full CJK face is megabytes)");
for (const c of chars) ok(served?.has(c), `the link carries ${c}`);
for (const c of served || []) if (!chars.has(c)) console.log(`  note: the link carries ${c}, which no value uses`);

// 3. the local subset (what scripts/emapng.mjs paints with)
const ttfPath = here("./fonts/NotoSerifTC-ema-subset.ttf");
ok(existsSync(ttfPath), "scripts/fonts/NotoSerifTC-ema-subset.ttf is there");
if (existsSync(ttfPath)) {
  const cmap = readCmap(readFileSync(ttfPath));
  ok(cmap.size > 0, `its cmap maps ${cmap.size} code points`);
  for (const c of chars) ok(cmap.has(c.codePointAt(0)), `the subset carries ${c}`);
}

// 4. wiring (static)
const tex = readFileSync(here("../src/three/textures.js"), "utf8");
const shrine = readFileSync(here("../src/three/landmarks/Shrine.jsx"), "utf8");
const island = readFileSync(here("../src/three/Island.jsx"), "utf8");
ok(/document\.fonts\.load\(`\$\{EMA_FONT\.weight\} 40px "\$\{EMA_FONT\.family\}"`, cjkText\)/.test(tex), "waitForFonts loads the character face with the characters to paint");
ok(/waitForFonts\(1800, glyphs\)/.test(island) && /v\.glyph/.test(island), "Island.jsx waits for the face with every glyph before anything is painted");
ok(/if \(glyph\) \{[\s\S]*setFont\(ctx, EMA_FONT\.weight, size, F_CJK\)/.test(tex), "paintEma paints a glyph in the character face");
ok(/paintEma\(v\.glyph \|\| v\.name \|\| "", [^)]*\{ glyph: !!v\.glyph \}\)/.test(shrine), "Shrine.jsx paints each value's glyph (its name only when there is none)");
ok(/map=\{fixUv\(labels\?\.\[i\]\) \|\| null\}[^\n]*onUpdate=\{remap\}/.test(shrine), "the plaque material recompiles when the texture arrives (onUpdate={remap}); without it the plaque stays blank");

console.log(fails.length ? `\nema: ${fails.length} check(s) failed` : "\nema: all checks pass");
process.exit(fails.length ? 1 : 0);

// ---- a small cmap reader (formats 4 and 12) ----------------------------
function readCmap(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const numTables = dv.getUint16(4);
  let cmapOff = -1;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(buf[rec], buf[rec + 1], buf[rec + 2], buf[rec + 3]);
    if (tag === "cmap") cmapOff = dv.getUint32(rec + 8);
  }
  const out = new Set();
  if (cmapOff < 0) return out;
  const n = dv.getUint16(cmapOff + 2);
  for (let i = 0; i < n; i++) {
    const off = cmapOff + dv.getUint32(cmapOff + 4 + i * 8 + 4);
    const format = dv.getUint16(off);
    if (format === 4) {
      const segX2 = dv.getUint16(off + 6);
      const ends = off + 14;
      const starts = ends + segX2 + 2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = dv.getUint16(ends + s * 2);
        const start = dv.getUint16(starts + s * 2);
        if (start === 0xffff) continue;
        for (let c = start; c <= end; c++) out.add(c);
      }
    } else if (format === 12) {
      const groups = dv.getUint32(off + 12);
      for (let g = 0; g < groups; g++) {
        const p = off + 16 + g * 12;
        const start = dv.getUint32(p);
        const end = dv.getUint32(p + 4);
        for (let c = start; c <= end; c++) out.add(c);
      }
    }
  }
  return out;
}
