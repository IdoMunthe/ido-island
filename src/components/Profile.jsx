import { content } from "../content.js";
import { Section, MarginNote } from "./Section.jsx";

// The introduction. In the document it is the lede: a little larger,
// with a drop cap, and its margin note out in the rail.
export function ProfileBody({ doc = false }) {
  const p = content.profile;
  return (
    <>
      <p className={doc ? "doc-lede doc-measure text-ink" : "max-w-[62ch] text-[17px] leading-[1.6] text-ink md:text-[18px]"}>{p.text}</p>
      {p.marginNote && !doc ? (
        <div className="mt-3 flex max-w-[62ch] justify-end pr-2">
          <MarginNote>{p.marginNote}</MarginNote>
        </div>
      ) : null}
    </>
  );
}

export function Profile() {
  const p = content.profile;
  if (!p?.text) return null;
  return (
    <Section id="profile" label={content.ui.rail.profile} title={p.title} aside={p.marginNote ? <MarginNote>{p.marginNote}</MarginNote> : null}>
      <ProfileBody doc />
    </Section>
  );
}
