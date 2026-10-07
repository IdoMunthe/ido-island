import { ArrowUpRight } from "lucide-react";
import { content } from "../content.js";
import { Section, MarginNote } from "./Section.jsx";
import { CopyValueButton } from "./Buttons.jsx";

// How to get in touch. The document sets the contact rows on the rail
// axis — label left, value right — like a colophon, and ends with the
// handwritten line.
export function ClosingBody({ doc = false }) {
  const c = content.closing;
  const link = (row) =>
    row.href ? (
      <a href={row.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-rule underline-offset-4 hover:decoration-pen">
        {row.value}
        <ArrowUpRight size={13} className="no-print shrink-0 text-ink-mute" aria-hidden="true" />
      </a>
    ) : (
      row.value
    );

  if (doc) {
    return (
      <>
        {c.text ? (
          <div className="doc-rail-grid print-flat">
            <span aria-hidden="true" />
            <p className="doc-measure doc-body-text text-ink">{c.text}</p>
          </div>
        ) : null}
        {c.contacts?.length ? (
          <dl className="mt-8 border-t border-rule">
            {c.contacts.map((row) => (
              <div key={row.label} className="doc-rail-grid print-flat items-baseline gap-y-1 border-b border-rule py-3.5">
                <dt className="eyebrow">{row.label}</dt>
                <dd className="m-0 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
                  <span className="min-w-0 select-all break-all font-mono text-[14px] text-ink">{link(row)}</span>
                  <span className="no-print">
                    <CopyValueButton value={row.value} />
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {c.signoff ? (
          <div className="doc-rail-grid print-flat mt-9">
            <span aria-hidden="true" />
            <div>
              <MarginNote className="text-[1.6rem]">{c.signoff}</MarginNote>
            </div>
          </div>
        ) : null}
      </>
    );
  }
  return (
    <>
      {c.text ? <p className="max-w-[60ch] text-[17px] leading-[1.6] text-ink">{c.text}</p> : null}
      {c.contacts?.length ? (
        <ul className="mt-7 max-w-[34rem] divide-y divide-rule border-y border-rule">
          {c.contacts.map((row) => (
            <li key={row.label} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
              <span className="w-[6.5rem] shrink-0 font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-mute">{row.label}</span>
              <span className="min-w-0 flex-1 select-all break-all font-mono text-[14px] text-ink">{link(row)}</span>
              <span className="no-print">
                <CopyValueButton value={row.value} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {c.signoff ? (
        <div className="mt-8">
          <MarginNote className="text-[1.6rem]">{c.signoff}</MarginNote>
        </div>
      ) : null}
    </>
  );
}

export function Closing() {
  const c = content.closing;
  if (!c) return null;
  return (
    <Section id="closing" label={content.ui.rail.closing} title={c.title} layout="wide">
      <ClosingBody doc />
    </Section>
  );
}
