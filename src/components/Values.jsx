import { content } from "../content.js";
import { Section } from "./Section.jsx";

// Values, each with how well it's tended right now (0–5). The document
// sets them two across, name in the display face with the meter on the
// same line, a hairline over each.
export function ValuesBody({ doc = false }) {
  const v = content.values;
  const items = v.items.map((item) => ({ ...item, level: Math.max(0, Math.min(5, Math.round(Number(item.level) || 0))) }));
  if (doc) {
    return (
      <ul className="print-flat grid gap-x-12 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.name} className="avoid-break border-t border-rule py-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="doc-h3 text-ink">{item.name}</span>
              <span className="flex shrink-0 items-center gap-2.5">
                <span className="flex gap-[3px]" role="img" aria-label={`${item.name}: ${item.level} out of 5`}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className={`seg h-[6px] w-4 rounded-[1px] ${i < item.level ? "on bg-ink" : "bg-rule"}`} />
                  ))}
                </span>
                <span className="tabular font-mono text-[11px] text-ink-mute">{item.level}/5</span>
              </span>
            </div>
            {item.note ? <p className="mt-1.5 text-[15px] leading-[1.5] text-ink-soft">{item.note}</p> : null}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.name} className="avoid-break">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium text-ink">{item.name}</span>
            <span className="tabular font-mono text-[12px] text-ink-mute">{item.level} / 5</span>
          </div>
          <div className="mt-2 flex gap-1" role="img" aria-label={`${item.name}: ${item.level} out of 5`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`seg h-[7px] flex-1 rounded-[2px] ${i < item.level ? "on bg-ink" : "bg-rule"}`} />
            ))}
          </div>
          {item.note ? <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{item.note}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function Values() {
  const v = content.values;
  if (!v?.items?.length) return null;
  return (
    <Section id="values" label={content.ui.rail.values} title={v.title} subtitle={v.subtitle} layout="wide">
      <ValuesBody doc />
    </Section>
  );
}
