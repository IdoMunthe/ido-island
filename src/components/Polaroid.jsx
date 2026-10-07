import { placeholderImage } from "../placeholders.js";

// A photo in a white instant-print frame with a handwritten caption.
// `kind` is "portrait" (4:5) or "square" (1:1); the image is centre-cropped.
export function Polaroid({ src, alt, caption, kind = "portrait", rotate = 0, className = "", tape = true }) {
  const source = src || placeholderImage(kind, "your photo");
  const aspect = kind === "square" ? "aspect-square" : "aspect-[4/5]";
  return (
    <figure
      className={`avoid-break relative inline-block bg-white p-2.5 pb-3 shadow-[0_1px_2px_rgba(0,0,0,0.18),0_12px_24px_-12px_rgba(0,0,0,0.45)] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {tape ? (
        <span aria-hidden="true" className="tape-bit absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-3 no-print" />
      ) : null}
      <img src={source} alt={alt} className={`${aspect} block w-full bg-paper-2 object-cover`} loading="lazy" />
      <figcaption className={`hand mt-2 min-h-[1.4rem] text-center text-[1.35rem] leading-none ${caption ? "" : "invisible"}`}>
        {caption || "."}
      </figcaption>
    </figure>
  );
}
