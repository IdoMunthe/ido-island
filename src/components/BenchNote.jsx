import { content } from "../content.js";
import { SectionShell } from "./Section.jsx";

// The honest paragraph. In the card it is a handwritten-headed note on
// paper; in the document it is the change of pace — a pull quote in the
// soft serif, wide and slow, with the heading and sign-off in pen.
export function BenchBody() {
  const b = content.bench;
  return (
    <article className="paper max-w-[36rem] rounded-[2px] px-6 py-7 sm:px-8 sm:py-8">
      {b.heading ? <p className="hand text-[2rem] leading-none">{b.heading}</p> : null}
      <p className="mt-4 font-display text-[1.12rem] leading-[1.6] text-ink sm:text-[1.2rem]" style={{ fontVariationSettings: '"opsz" 18, "SOFT" 40, "WONK" 0' }}>
        {b.text}
      </p>
      {b.signoff ? <p className="hand mt-5 text-[1.55rem] leading-none">{b.signoff}</p> : null}
    </article>
  );
}

export function BenchNote() {
  const b = content.bench;
  if (!b?.text) return null;
  return (
    <SectionShell id="bench" className="doc-quote" padding="py-16 md:py-24">
      <p className="eyebrow doc-rail">{content.ui.rail.bench}</p>
      <h2 id="bench-title" className="hand mt-8 text-[2.2rem] leading-none md:mt-10 md:text-[2.5rem]">
        {b.heading}
      </h2>
      <p className="doc-quote-text mt-6 text-ink md:mt-7">{b.text}</p>
      {b.signoff ? <p className="hand mt-8 text-[1.7rem] leading-none">{b.signoff}</p> : null}
    </SectionShell>
  );
}
