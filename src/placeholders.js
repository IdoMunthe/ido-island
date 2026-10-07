// Generates a kraft-paper placeholder image as an inline SVG data URI.
// Used whenever a photo's `src` in content.js is null, so the site looks
// finished before any real photographs are added. Nothing is fetched.

export function placeholderImage(kind = "portrait", label = "your photo") {
  const [w, h, ratio] = kind === "square" ? [800, 800, "1 : 1"] : [800, 1000, "4 : 5"];
  const text = String(label).toUpperCase();
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<defs><pattern id='p' width='28' height='28' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>` +
    `<rect width='28' height='28' fill='#d9cfbc'/><rect width='14' height='28' fill='#cfc3ac'/></pattern></defs>` +
    `<rect width='100%' height='100%' fill='url(#p)'/>` +
    `<rect x='28' y='28' width='${w - 56}' height='${h - 56}' fill='none' stroke='#7d5e30' stroke-width='3' stroke-dasharray='16 12'/>` +
    `<text x='50%' y='47%' text-anchor='middle' font-family='IBM Plex Mono, Menlo, monospace' font-size='36' fill='#5a4522' letter-spacing='5'>${text}</text>` +
    `<text x='50%' y='54%' text-anchor='middle' font-family='IBM Plex Mono, Menlo, monospace' font-size='26' fill='#7d5e30'>${ratio}</text>` +
    `</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
