import { useState } from "react";
import { content } from "../content.js";
import { placeholderImage } from "../placeholders.js";
import { Section } from "./Section.jsx";
import { Polaroid } from "./Polaroid.jsx";
import { Lightbox } from "./Lightbox.jsx";

const TILT = [-2.5, 1.8, -1.2, 2.4, -1.9, 1.1, -2.8, 2.1];

// One square in the document's grid: the photograph with a hairline and a
// numbered mono caption. Falls back to the kraft placeholder on error.
function GridPhoto({ item, index }) {
  const [failed, setFailed] = useState(false);
  const src = failed || !item.src ? placeholderImage("square", item.caption || "photo") : item.src;
  return (
    <figure className="m-0">
      <img src={src} alt={item.alt || ""} onError={() => setFailed(true)} className="doc-photo aspect-square w-full bg-paper-2 object-cover" loading="lazy" />
      <figcaption className="mt-2 flex items-baseline gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
        <span className="tabular text-ink-mute">{String(index + 1).padStart(2, "0")}</span>
        <span className="min-w-0">{item.caption}</span>
      </figcaption>
    </figure>
  );
}

// The eight photographs. Click one and it opens large in the viewer with
// its title and description. On the island the viewer is owned by the page
// (`onOpen`), so the washing line can open it too; in document mode it is
// local. The card hangs polaroids; the document sets a real grid. Print
// gets every photo with its title and description.
export function PhotosBody({ onOpen, doc = false }) {
  const ph = content.photos;
  const items = (ph?.items || []).slice(0, 8);
  const [local, setLocal] = useState(null);
  const open = (i) => (onOpen ? onOpen(i) : setLocal(i));

  return (
    <>
      {doc ? (
        <ul className="doc-photo-grid grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4">
          {items.map((p, i) => (
            <li key={i}>
              <button type="button" onClick={() => open(i)} aria-label={`${ph.viewer.open}: ${p.caption || i + 1}`} className="doc-photo-btn island-focus block w-full rounded-[2px] text-left">
                <GridPhoto item={p} index={i} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-8 sm:justify-start">
          {items.map((p, i) => (
            <li key={i} className="w-[10.5rem] sm:w-[11.5rem]">
              <button type="button" onClick={() => open(i)} aria-label={`${ph.viewer.open}: ${p.caption || i + 1}`} className="island-focus block w-full rounded-sm text-left">
                <Polaroid src={p.src} alt={p.alt || ""} caption={p.caption} kind="square" rotate={TILT[i % TILT.length]} className="w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="print-only hidden">
        <h3 className="eyebrow mt-6">{ph.printHeading}</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px]">
          {items.map((p, i) => (
            <li key={i}>
              <span className="italic">{p.caption}</span>
              {p.description ? <span> — {p.description}</span> : null}
            </li>
          ))}
        </ol>
      </div>

      {!onOpen && local != null ? <Lightbox items={items} index={local} onIndex={setLocal} onClose={() => setLocal(null)} /> : null}
    </>
  );
}

export function Photos() {
  const ph = content.photos;
  if (!ph?.items?.length) return null;
  return (
    <Section id="photos" label={content.ui.rail.photos} title={ph.title} subtitle={ph.subtitle} layout="wide">
      <PhotosBody doc />
    </Section>
  );
}
