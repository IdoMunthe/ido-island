import { content } from "../content.js";
import { Section } from "./Section.jsx";

// The numbers: height, weight, age and the rest. The card shows a plain
// table; the document lays them out as a specification sheet — two
// columns of cells, each a mono label over a value in the display face.
export function PersonalBody({ doc = false }) {
  const p = content.personal;
  if (doc) {
    return (
      <dl className="print-flat grid gap-x-10 sm:grid-cols-2">
        {p.rows.map((r) => (
          <div key={r.label} className="avoid-break border-t border-rule py-3.5">
            <dt className="eyebrow">{r.label}</dt>
            <dd className="doc-num m-0 mt-1.5 text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className="grid max-w-[46rem] grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-[15.5px] leading-snug">
      {p.rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-mute pt-1">{r.label}</dt>
          <dd className="m-0 text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Personal() {
  const p = content.personal;
  if (!p?.rows?.length) return null;
  return (
    <Section id="personal" label={content.ui.rail.personal} title={p.title} subtitle={p.subtitle} layout="wide">
      <PersonalBody doc />
    </Section>
  );
}
