import { content } from "../content.js";
import { Section } from "./Section.jsx";

// Where I'm heading: the next few years, and what I want from dating.
// The document numbers both lists in the gutter, the second in pen.
export function HeadingBody({ doc = false }) {
  const h = content.heading;
  if (doc) {
    return (
      <div className="doc-measure">
        {h.years?.length ? (
          <ol className="doc-numbered space-y-3 text-[16px] leading-[1.55] text-ink">
            {h.years.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        ) : null}
        {h.dating?.length ? (
          <ol className="doc-numbered is-pen mt-7 space-y-3 border-t border-rule pt-7 text-[16px] leading-[1.55] text-ink">
            {h.dating.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        ) : null}
        {h.note ? <p className="doc-role mt-8 text-ink-soft">{h.note}</p> : null}
      </div>
    );
  }
  return (
    <>
      {h.years?.length ? (
        <ul className="max-w-[62ch] list-disc space-y-2 pl-5 text-[15.5px] leading-snug text-ink marker:text-kraft-deep">
          {h.years.map((line, i) => (
            <li key={i} className="pl-1">{line}</li>
          ))}
        </ul>
      ) : null}
      {h.dating?.length ? (
        <ul className="mt-6 max-w-[62ch] list-disc space-y-2 border-t border-rule pl-5 pt-5 text-[15.5px] leading-snug text-ink marker:text-pen">
          {h.dating.map((line, i) => (
            <li key={i} className="pl-1">{line}</li>
          ))}
        </ul>
      ) : null}
      {h.note ? <p className="mt-6 max-w-[60ch] text-[15.5px] italic leading-snug text-ink-soft">{h.note}</p> : null}
    </>
  );
}

export function Heading() {
  const h = content.heading;
  if (!h) return null;
  return (
    <Section id="heading" label={content.ui.rail.heading} title={h.title} subtitle={h.subtitle}>
      <HeadingBody doc />
    </Section>
  );
}
