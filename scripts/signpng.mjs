// Paints the welcome sign with the real painter (src/three/textures.js
// paintWelcome — the very code the browser runs) onto a Node canvas, with
// the same Google fonts, and writes scripts/sign.png so the result can be
// looked at. Then it measures the bitmap: if the lettering isn't there, it
// fails. Run:  node scripts/signpng.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { content } from "../src/content.js";
import { paintWelcome, splitWelcome } from "../src/three/textures.js";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const fonts = [
  ["Nanum Pen Script", "./fonts/NanumPenScript-subset.ttf"],
  ["IBM Plex Mono", "./fonts/IBMPlexMono-600-subset.ttf"],
];
for (const [family, file] of fonts) {
  const okReg = GlobalFonts.registerFromPath(here(file), family);
  console.log(`${okReg ? "font " : "FONT MISSING "}${family} ← ${file}`);
}

const text = content.spec?.gateSign;
const { small, name } = splitWelcome(text);
const W = 1024;
const canvas = createCanvas(W, Math.round(W * (0.6 / 1.3)));
paintWelcome(text, W, canvas);
const out = here("./sign.png");
writeFileSync(out, canvas.toBuffer("image/png"));
console.log(`painted ${JSON.stringify(text)} → ${out} (${canvas.width}×${canvas.height})`);

// How much of each text band is actually dark? (fibres and the red border
// are pale or thin; black lettering is not)
const ctx = canvas.getContext("2d");
const { width: cw, height: ch } = canvas;
function darkFraction(y0, y1) {
  const img = ctx.getImageData(0, Math.round(ch * y0), cw, Math.round(ch * (y1 - y0))).data;
  let dark = 0;
  for (let i = 0; i < img.length; i += 4) if (img[i] + img[i + 1] + img[i + 2] < 180) dark++;
  return dark / (img.length / 4);
}
const nameBand = darkFraction(0.42, 0.82);
const smallBand = darkFraction(0.18, 0.36);
console.log(`dark pixels — name band: ${(nameBand * 100).toFixed(1)}%, small band: ${(smallBand * 100).toFixed(1)}%`);
// zero-width text would be the classic silent failure
ctx.font = `400 ${canvas.height * 0.5}px "Nanum Pen Script"`;
const nameWidth = ctx.measureText(name).width;
console.log(`measureText(${JSON.stringify(name)}) in the hand font: ${nameWidth.toFixed(0)} px`);

const fails = [];
if (!name) fails.push("no name text");
if (nameBand < 0.04) fails.push(`name band only ${(nameBand * 100).toFixed(1)}% dark — the name is not painted`);
if (small && smallBand < 0.01) fails.push(`small band only ${(smallBand * 100).toFixed(1)}% dark — "${small}" is not painted`);
if (nameWidth < 10) fails.push("measureText returned ~0 for the name (font not loaded)");
console.log(fails.length ? `FAIL: ${fails.join("; ")}` : "sign.png: lettering present");
process.exit(fails.length ? 1 : 0);
