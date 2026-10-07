import { content } from "../content.js";
import { Section } from "./Section.jsx";

// Work and study. The document sets it as a timeline on the rail axis:
// dates in mono on the left, the role and its lines on the right.
export function ExperienceBody({ doc = false }) {
  const e = content.experience;
  if (doc) {
    return (
      <ol className="border-t border-rule">
        {e.roles.map((r, i) => (
          <li key={`${r.title}-${i}`} className="doc-rail-grid print-flat avoid-break gap-y-1.5 border-b border-rule py-6 md:py-7">
            <p className="tabular font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-mute md:pt-1.5">{r.dates}</p>
            <div className="doc-measure min-w-0">
              <h3 className="doc-h3 text-ink">{r.title}</h3>
              {r.org ? <p className="doc-role mt-1 text-[1.05rem] text-ink-soft">{r.org}</p> : null}
              {r.bullets?.length ? (
                <ul className="doc-list mt-3.5 space-y-1.5 text-[16px] leading-[1.5] text-ink">
                  {r.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="space-y-9">
      {e.roles.map((r, i) => (
        <li key={`${r.title}-${i}`} className="avoid-break print-flat grid gap-x-6 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <h3 className="font-display text-[1.3rem] font-medium leading-tight text-ink" style={{ fontVariationSettings: '"opsz" 36, "SOFT" 30' }}>
              {r.title}
            </h3>
            {r.org ? <p className="mt-0.5 text-[15px] text-ink-soft">{r.org}</p> : null}
          </div>
          {r.dates ? <p className="tabular font-mono text-[12px] uppercase tracking-[0.08em] text-ink-mute sm:pt-1.5 sm:text-right">{r.dates}</p> : null}
          {r.bullets?.length ? (
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15.5px] leading-snug text-ink marker:text-kraft-deep sm:col-span-2">
              {r.bullets.map((b, j) => (
                <li key={j} className="pl-1">{b}</li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function Experience() {
  const e = content.experience;
  if (!e?.roles?.length) return null;
  return (
    <Section id="experience" label={content.ui.rail.experience} title={e.title} subtitle={e.subtitle} layout="wide">
      <ExperienceBody doc />
    </Section>
  );
}
