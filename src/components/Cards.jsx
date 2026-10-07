// The card that opens when a place on the island is visited. Each card
// reuses the same body components the document mode renders, so the two
// modes can never drift apart.
import { content } from "../content.js";
import { HeaderBody } from "./Header.jsx";
import { ProfileBody } from "./Profile.jsx";
import { PersonalBody } from "./Personal.jsx";
import { FamilyBody } from "./Family.jsx";
import { ValuesBody } from "./Values.jsx";
import { ExperienceBody } from "./Experience.jsx";
import { HobbiesBody } from "./Hobbies.jsx";
import { PhotosBody } from "./Photos.jsx";
import { HeadingBody } from "./Heading.jsx";
import { ClosingBody } from "./Closing.jsx";
import { SpecBody } from "./Spec.jsx";
import { BenchBody } from "./BenchNote.jsx";

export const CARD_TITLES = {
  house: () => content.header.name,
  family: () => content.family.title,
  shrine: () => content.values.title,
  workshop: () => content.experience.title,
  hobbies: () => content.hobbies.title,
  washing: () => content.photos.title,
  heading: () => content.heading.title,
  gate: () => content.spec.title,
};

const CARD_SUBTITLES = {
  house: () => content.header.tagline,
  family: () => content.family.subtitle,
  shrine: () => content.values.subtitle,
  workshop: () => content.experience.subtitle,
  hobbies: () => content.hobbies.subtitle,
  washing: () => content.photos.subtitle,
  heading: () => content.heading.subtitle,
  gate: () => content.spec.subtitle,
};

export function cardSubtitle(id) {
  return CARD_SUBTITLES[id]?.() || "";
}

// A titled block inside a card, with a rail label like the document's.
function Sub({ label, title, subtitle, children, first = false }) {
  return (
    <section className={first ? "" : "mt-9 border-t border-rule pt-7"}>
      {label ? <p className="eyebrow">{label}</p> : null}
      {title ? <h3 className="display mt-1 text-[1.35rem] text-ink">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-[14px] text-ink-soft">{subtitle}</p> : null}
      <div className={title || label ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function LandmarkCard({ id, onOpenPhoto }) {
  const ui = content.ui;
  switch (id) {
    case "house":
      // name → about me → the numbers → the honest paragraph
      return (
        <>
          <Sub first>
            <HeaderBody compact />
          </Sub>
          <Sub label={ui.rail.profile} title={content.profile.title}>
            <ProfileBody />
          </Sub>
          <Sub label={ui.rail.personal} title={content.personal.title} subtitle={content.personal.subtitle}>
            <PersonalBody />
          </Sub>
          <Sub label={ui.rail.bench}>
            <BenchBody />
          </Sub>
        </>
      );
    case "family":
      return <FamilyBody />;
    case "shrine":
      return <ValuesBody />;
    case "workshop":
      return <ExperienceBody />;
    case "hobbies":
      return <HobbiesBody />;
    case "washing":
      return <PhotosBody onOpen={onOpenPhoto} />;
    case "heading":
      // where I'm going → how to reach me
      return (
        <>
          <Sub first>
            <HeadingBody />
          </Sub>
          <Sub label={ui.rail.closing} title={content.closing.title}>
            <ClosingBody />
          </Sub>
        </>
      );
    case "gate":
      return <SpecBody />;
    default:
      return null;
  }
}
