import { content } from "../content.js";
import { Section } from "./Section.jsx";

// Hobbies: the three main ones, then anything else briefly. The document
// sets the three as magazine columns and the rest as a run-in list in the
// text column.
export function HobbiesBody({ doc = false }) {
  const h = content.hobbies;
  const main = [h.music, h.badminton, h.gym].filter((x) => x && x.text);
  if (doc) {
    return (
      <>
        <ul className="print-flat grid gap-x-8 gap-y-7 sm:grid-cols-3">
          {main.map((item) => (
            <li key={item.label} className="avoid-break border-t border-rule pt-4">
              <h3 className="doc-h3 text-ink">{item.label}</h3>
              <p className="mt-2.5 text-[15px] leading-[1.55] text-ink-soft">{item.text}</p>
            </li>
          ))}
        </ul>
        {h.others?.length ? (
          <div className="doc-rail-grid print-flat mt-10 border-t border-rule pt-6">
            <span aria-hidden="true" />
            <dl className="doc-measure space-y-2 text-[16px] leading-[1.5]">
              {h.others.map((o) => (
                <div key={o.label} className="avoid-break">
                  <dt className="inline font-medium text-ink">{o.label}</dt>
                  <dd className="m-0 inline text-ink-soft">
                    <span aria-hidden="true"> — </span>
                    {o.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </>
    );
  }
  return (
    <>
      <ul className="space-y-5">
        {main.map((item) => (
          <li key={item.label} className="avoid-break max-w-[62ch]">
            <p className="font-medium text-ink">{item.label}</p>
            <p className="mt-1 text-[15.5px] leading-snug text-ink-soft">{item.text}</p>
          </li>
        ))}
      </ul>
      {h.others?.length ? (
        <dl className="mt-7 grid gap-x-10 gap-y-3 border-t border-rule pt-5 sm:grid-cols-2">
          {h.others.map((o) => (
            <div key={o.label} className="avoid-break">
              <dt className="font-medium text-ink">{o.label}</dt>
              <dd className="m-0 text-[15px] leading-snug text-ink-soft">{o.detail}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
}

export function Hobbies() {
  const h = content.hobbies;
  if (!h) return null;
  return (
    <Section id="hobbies" label={content.ui.rail.hobbies} title={h.title} subtitle={h.subtitle} layout="wide">
      <HobbiesBody doc />
    </Section>
  );
}
