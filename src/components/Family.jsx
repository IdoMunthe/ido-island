import { content } from "../content.js";
import { Section } from "./Section.jsx";

// Family, by role. `name` is shown only if it's been filled in. The
// document sets them as a roster: the role in italic on the rail axis,
// the line beside it, a hairline between each.
export function FamilyBody({ doc = false }) {
  const f = content.family;
  if (doc) {
    return (
      <>
        <ul className="border-t border-rule">
          {f.members.map((m, i) => (
            <li key={i} className="doc-rail-grid print-flat avoid-break gap-y-1 border-b border-rule py-4 md:py-5">
              <p className="doc-role text-ink">
                {m.role}
                {m.name ? <span className="font-body text-[15px] not-italic text-ink-soft"> — {m.name}</span> : null}
              </p>
              {m.line ? <p className="doc-measure text-[16px] leading-[1.55] text-ink-soft">{m.line}</p> : null}
            </li>
          ))}
        </ul>
        {f.note ? (
          <div className="doc-rail-grid print-flat mt-7">
            <span aria-hidden="true" />
            <p className="doc-measure doc-body-text text-ink">{f.note}</p>
          </div>
        ) : null}
      </>
    );
  }
  return (
    <>
      <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
        {f.members.map((m, i) => (
          <li key={i} className="avoid-break border-l-2 border-kraft pl-4">
            <p className="font-medium text-ink">
              {m.role}
              {m.name ? <span className="text-ink-soft"> — {m.name}</span> : null}
            </p>
            {m.line ? <p className="mt-0.5 text-[15px] leading-snug text-ink-soft">{m.line}</p> : null}
          </li>
        ))}
      </ul>
      {f.note ? <p className="mt-6 max-w-[60ch] text-[15.5px] leading-snug text-ink">{f.note}</p> : null}
    </>
  );
}

export function Family() {
  const f = content.family;
  if (!f?.members?.length) return null;
  return (
    <Section id="family" label={content.ui.rail.family} title={f.title} subtitle={f.subtitle} layout="wide">
      <FamilyBody doc />
    </Section>
  );
}
