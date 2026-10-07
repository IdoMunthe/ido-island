import { useState } from "react";
import { MapPin } from "lucide-react";
import { content } from "../content.js";
import { placeholderImage } from "../placeholders.js";
import { Polaroid } from "./Polaroid.jsx";
import { PrintButton, CopyLinkButton } from "./Buttons.jsx";

const STATUS = {
  open: "bg-ok-soft text-ok border-ok/30",
  busy: "bg-warn-soft text-warn border-warn/30",
  closed: "bg-paper-2 text-ink-soft border-rule",
};
const DOT = { open: "bg-ok", busy: "bg-warn", closed: "bg-ink-mute" };

// Location and status on one line. `quiet` is the document's version: a
// hairline pill with only the dot coloured.
function Meta({ quiet = false, className = "" }) {
  const h = content.header;
  const tone = STATUS[h.status?.tone] ? h.status.tone : "open";
  if (!h.location && !h.status?.text) return null;
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] ${className}`}>
      {h.location ? (
        <span className="inline-flex items-center gap-1.5 text-ink-soft">
          <MapPin size={14} strokeWidth={2} aria-hidden="true" />
          {h.location}
        </span>
      ) : null}
      {h.status?.text ? (
        <span className={`print-tag inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] ${quiet ? "border-rule text-ink-soft" : STATUS[tone]}`}>
          <span className={`no-print h-1.5 w-1.5 rounded-full ${DOT[tone]}`} aria-hidden="true" />
          {h.status.text}
        </span>
      ) : null}
    </div>
  );
}

function Facts({ className = "" }) {
  const facts = content.header.facts;
  if (!facts?.length) return null;
  return (
    <dl className={`grid max-w-[46ch] grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5 font-mono text-[12.5px] leading-snug ${className}`}>
      {facts.map((f) => (
        <div key={f.label} className="contents">
          <dt className="uppercase tracking-[0.1em] text-ink-mute">{f.label}</dt>
          <dd className="m-0 text-ink">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// The island card's version of the header: tagline, location, status and
// a small polaroid. (The document has its own masthead below.)
export function HeaderBody() {
  const h = content.header;
  return (
    <div className="print-flat grid gap-8 sm:grid-cols-[minmax(0,1fr)_9rem]">
      <div className="min-w-0">
        {h.tagline ? <p className="display-italic text-[1.25rem] leading-tight text-ink-soft">{h.tagline}</p> : null}
        <Meta className="mt-5" />
        <Facts className="mt-6" />
      </div>
      <div className="justify-self-start sm:justify-self-end">
        <Polaroid src={h.photo?.src} alt={h.photo?.alt || ""} caption={h.photo?.caption} kind="portrait" rotate={2.2} className="w-[8.5rem]" />
      </div>
    </div>
  );
}

// The portrait as a plain photograph with a hairline, not a polaroid:
// the masthead is print design, not a pinboard. Falls back to the kraft
// placeholder if the image can't be fetched.
function Portrait() {
  const p = content.header.photo;
  const [failed, setFailed] = useState(false);
  const src = failed || !p?.src ? placeholderImage("portrait", "your photo") : p.src;
  return (
    <figure className="doc-portrait m-0 w-[10.5rem] md:w-full">
      <img src={src} alt={p?.alt || ""} onError={() => setFailed(true)} className="doc-photo aspect-[4/5] w-full bg-paper-2 object-cover" />
      {p?.caption ? <figcaption className="hand mt-2 text-right text-[1.3rem] leading-none">{p.caption}</figcaption> : null}
    </figure>
  );
}

// The masthead: the name is the largest thing on the page, the tagline
// sits under it in the soft italic, location and status close the column,
// and the portrait holds the right edge. One ink rule above, one below.
export function Header() {
  const h = content.header;
  return (
    <header className="doc-masthead">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-3">
        <p className="eyebrow text-ink-soft">{content.ui.eyebrow}</p>
        <div className="no-print flex flex-wrap gap-2">
          <CopyLinkButton />
          <PrintButton />
        </div>
      </div>
      <div className="doc-masthead-grid mt-10 grid gap-10 md:mt-14 md:grid-cols-[minmax(0,1fr)_13rem] md:gap-14">
        <div className="flex min-w-0 flex-col">
          <h1 className="doc-name text-ink">{h.name}</h1>
          {h.tagline ? <p className="doc-tagline mt-6 text-ink-soft md:mt-7">{h.tagline}</p> : null}
          <Meta quiet className="mt-8 md:mt-auto md:pt-12" />
          <Facts className="mt-6" />
        </div>
        <Portrait />
      </div>
      <div className="mt-12 border-b border-ink md:mt-16" aria-hidden="true" />
    </header>
  );
}
