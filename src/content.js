// =====================================================================
//  content.js  —  THE ONLY FILE YOU NEED TO EDIT
// =====================================================================
//
//  Everything a visitor reads comes from this file: the island's places,
//  the cards that open at each place, and the plain document version.
//  The components never contain their own copy.
//
//  HOW TO EDIT SAFELY
//  ------------------
//  • Text lives inside quotes:  "like this".  If your text contains a
//    double quote, put a backslash before it ("she said \"hi\"").
//  • Lists live inside square brackets [ ... ] and every item ends with
//    a comma. Add, remove or reorder items freely — the layout adapts.
//  • Objects live inside curly braces { ... }. Keep the field names
//    (the part before the colon) exactly as they are. Change the values.
//  • Lines starting with // are comments. They are never shown.
//  • Leaving a text field as "" (empty) hides that line. Leaving a list
//    as [] hides that block.
//  • The pre-filled text is EXAMPLE copy, written to show the register:
//    plain, warm, specific. Overwrite all of it. Anything in
//    [ SQUARE BRACKETS ] is a placeholder you must replace.
//
//  THE VOICE
//  ---------
//  Natural, formal and warm. Write in full sentences, the way a thoughtful
//  person writes to someone they hope to like. No jokes, no winking asides,
//  no line that exists only to be clever — but no stiffness either, and
//  nothing you would put on a job application.
//  Warmth comes from detail, not from charm: the actual book, the actual
//  Tuesday, the real habit. Be specific and be generous.
//
//  PHOTOS
//  ------
//  Put your image files in  src/photos/  and import them at the top of
//  this file, then use the imported name in the `src` field. Example:
//
//      import portrait from "./photos/me.jpg";
//      ...
//      photo: { src: portrait, alt: "Me, squinting at a lake" },
//
//  Leaving  src: null  shows a generated placeholder so the site still
//  looks finished. A 1200–2000px-wide JPEG is plenty.
//    – Header portrait: portrait orientation, 4:5 works best.
//    – Washing-line photographs: square (1:1) crops look best; any shape
//      is accepted and will be centre-cropped.
//
// =====================================================================

// import portrait from "./photos/me.jpg";
// import photo1 from "./photos/one.jpg";
// import photo2 from "./photos/two.jpg";
// import photo3 from "./photos/three.jpg";

export const content = {
  // -------------------------------------------------------------------
  //  SITE-WIDE
  // -------------------------------------------------------------------
  meta: {
    // Shown in the browser tab. 2–4 words.
    title: "Curriculum Vitae, Personal",
    // One sentence for link previews.
    description: "A personal curriculum vitae, presented as a small island you can turn in your hands.",
  },

  // -------------------------------------------------------------------
  //  THE HOUSE  —  who you are  (name on the sign, a short introduction)
  // -------------------------------------------------------------------
  header: {
    // Your name. Replace the brackets entirely. Long names wrap fine.
    name: "[ YOUR NAME HERE ]",
    // One line under the name. What you'd say if someone asked "so what
    // are you like?" and you only had a breath. 6–14 words.
    tagline: "Steady company, a careful cook, and close to my family.",
    // City, or "City, Country". Short.
    location: "[ Your city ]",
    // Small coloured pill next to the location.
    //   `text`  — 2–5 words.
    //   `tone`  — "open" (green), "busy" (amber) or "closed" (grey).
    status: { text: "Open to meeting someone", tone: "open" },
    // Portrait photo. See PHOTOS at the top of this file.
    photo: {
      // TEMPORARY placeholder — see PHOTOS at the top. Replace with your own.
      src: "https://picsum.photos/seed/dating-cv-portrait/480/600",
      alt: "[ A photo of you. Describe it here. ]",
      caption: "recent",
    },
  },

  profile: {
    // Heading for the introduction. 1–4 words.
    title: "About me",
    // 60–120 words. The paragraph people read first. Say what you do,
    // what your days are like, and one or two things that are true of you
    // and not of most people.
    text:
      "I am a [ profession ], and on most days I am glad of it. Outside of work I cook properly, play the guitar and the piano, and take long walks that rarely end where I intended. I am the eldest of four, which explains a good deal about me: I am organised, I stay calm when things go wrong, and I have to remind myself that not everything requires a plan. People tell me I am quiet when they first meet me and much less so afterwards. I would rather have one real conversation than a whole evening of pleasant small talk, though I am trying to become better at the small talk as well.",
  },

  // -------------------------------------------------------------------
  //  FAMILY  —  the figures outside the house
  //  Real people who didn't choose to be on a public page, so they are
  //  labelled by role only. Names can be added later in `name`; leave it
  //  "" and only the role is shown.
  // -------------------------------------------------------------------
  family: {
    title: "Family",
    subtitle: "The people outside the house.",
    members: [
      { role: "my mum", name: "", line: "She feeds everyone who comes through the door. She taught me to cook, and to notice when someone needs checking on." },
      { role: "my dad", name: "", line: "Quiet and steady, and able to repair almost anything. He calls once a week and asks the same three questions, which I have come to look forward to." },
      { role: "my sister", name: "", line: "The person I call when something has gone wrong, and the first person I call when something has gone right." },
      { role: "my younger brother", name: "", line: "The liveliest of the four of us. He is becoming genuinely good at what he does, and I am proud of him." },
      { role: "my youngest brother", name: "", line: "Still at home, and still sending me everything that made him laugh. I read all of it." },
    ],
    // One line under the figures. Optional ("").
    note: "We are a close family. Sunday lunch is not optional, and you would be very welcome at it.",
  },

  // -------------------------------------------------------------------
  //  THE NUMBERS  —  shown inside the house card, after the introduction.
  //  The plain numbers, including the ones people usually leave out.
  // -------------------------------------------------------------------
  personal: {
    title: "The numbers",
    subtitle: "The plain details, including the ones people usually leave out.",
    rows: [
      { label: "Height", value: "175 cm" },
      { label: "Weight", value: "[ 00 ] kg" },
      { label: "Age", value: "[ 00 ]" },
      { label: "Languages", value: "[ One ] fluently, and enough [ another ] to hold a simple conversation" },
      { label: "Birth order", value: "Eldest of four" },
      { label: "Hours", value: "A morning person. Asleep by eleven, awake before the alarm." },
      { label: "Drinks", value: "Occasionally, and coffee every day." },
    ],
  },

  // -------------------------------------------------------------------
  //  THE SHRINE  —  values
  //  Each value hangs as an ema, a small votive plaque, on the rack beside
  //  the shrine. `level` (0–5) is how well you hold to it at the moment; an
  //  honest 2 is more useful here than a flattering 5.
  // -------------------------------------------------------------------
  values: {
    // If you would rather this section carried faith or belief, it can: the
    // shape is the same (a title and a few named items) and so are the plaques.
    title: "What I try to live by",
    subtitle: "Some of these I hold to well. Others I am still working on.",
    items: [
      { name: "Kindness", level: 5, note: "To the people serving me, to strangers, and to myself on a difficult day. The last of those took the longest to learn." },
      { name: "Honesty", level: 4, note: "I will tell you the true thing, and gently. I am still learning to say it sooner than I do." },
      { name: "Patience", level: 3, note: "I have a great deal of it for people and rather less of it for machines." },
      { name: "Curiosity", level: 5, note: "I read the acknowledgements first. I want to know who a person loves." },
      { name: "Rest", level: 2, note: "The one I neglect. I am trying to keep some evenings with nothing in them at all." },
      { name: "Showing up", level: 5, note: "If I have said I will be somewhere, I am there, usually early and usually with something to eat." },
      { name: "Letting go", level: 2, note: "I hold on to small mistakes for far longer than they deserve. It is getting better." },
      { name: "Family", level: 5, note: "Sunday lunch and a weekly call. Neither is negotiable, and neither feels like an obligation." },
    ],
  },

  // -------------------------------------------------------------------
  //  THE WORKSHOP  —  work and study  (a crate per role)
  // -------------------------------------------------------------------
  experience: {
    title: "Work and study",
    subtitle: "What I do, and how I got here.",
    // Most recent first. `dates` is stencilled on the crate, keep it short.
    roles: [
      {
        title: "[ Your current role ]",
        org: "[ Where, described generally — no company names on a public page ]",
        dates: "[ 20XX ] – now",
        bullets: [
          "What the job actually involves, in a sentence a stranger could follow.",
          "The part of it you're good at, and the part you like, if they're different.",
          "Something it has taught you about yourself.",
        ],
      },
      {
        title: "[ A previous role ]",
        org: "[ Where, generally ]",
        dates: "[ 20XX ] – [ 20XX ]",
        bullets: ["What you did there.", "Why you left, honestly and briefly."],
      },
      {
        title: "[ Your degree or training ]",
        org: "[ Field of study ]",
        dates: "[ 20XX ] – [ 20XX ]",
        bullets: ["What you studied and whether you'd choose it again.", "The one thing from it you still use every week."],
      },
    ],
  },

  // -------------------------------------------------------------------
  //  HOBBIES  —  the music corner, the badminton court, the outdoor gym
  // -------------------------------------------------------------------
  hobbies: {
    title: "Hobbies",
    subtitle: "The three things you will most often find me doing, and a few others.",
    music: {
      label: "Music",
      text: "The guitar since I was fourteen, and the piano for the last few years. I play in the evenings, mostly for my own sake, and mostly pieces people would recognise. I would be glad to play for you, and nervous about it, and would do it anyway.",
    },
    badminton: {
      label: "Badminton",
      text: "Twice a week when I can manage it. I keep score and I like to win, but never at the cost of the evening. If you have never played, I would enjoy teaching you the serve.",
    },
    gym: {
      label: "The gym",
      text: "Mornings, before work, and nothing ambitious. It has far less to do with how I look than with sleeping well and being able to carry the shopping in one trip.",
    },
    // Anything else, briefly. Optional ([]).
    others: [
      { label: "Cooking for people", detail: "Properly, and often. Ask me what I would make you." },
      { label: "Long walks", detail: "Usually longer than intended, and usually ending at a bakery." },
      { label: "Reading", detail: "Novels, slowly, in bed, beginning with the acknowledgements." },
    ],
  },

  // -------------------------------------------------------------------
  //  THE WASHING LINE  —  photographs
  //  Click one to open it large.
  // -------------------------------------------------------------------
  photos: {
    title: "Photographs",
    subtitle: "Select one to see it properly.",
    // Up to eight photos, pegged along the washing line. Click one and it
    // opens large with its title and description.
    //   `src`         — see PHOTOS at the top. null = placeholder.
    //   `large`       — optional bigger version for the viewer (else `src`).
    //   `alt`         — plain description for screen readers.
    //   `caption`     — the title, handwritten under the photo. Short.
    //   `description` — one to three sentences shown under it in the
    //                   viewer: where, when, and why it's here.
    items: [
      // TEMPORARY placeholders from picsum.photos (random stock images) —
      // replace every src with your own file from src/photos/ (see the top
      // of this file). Eight hang on the line; the first eight are used.
      { src: "https://picsum.photos/seed/dating-cv-1/600/600", large: "https://picsum.photos/seed/dating-cv-1/1400/1400", alt: "[ Describe photo one ]", caption: "the long walk", description: "I set out for a short loop and came home four hours later with a loaf of bread. This happens more often than I would like to admit." },
      { src: "https://picsum.photos/seed/dating-cv-2/600/600", large: "https://picsum.photos/seed/dating-cv-2/1400/1400", alt: "[ Describe photo two ]", caption: "sunday lunch", description: "My mum's table, everyone talking at once. I'm the one not talking, for once." },
      { src: "https://picsum.photos/seed/dating-cv-3/600/600", large: "https://picsum.photos/seed/dating-cv-3/1400/1400", alt: "[ Describe photo three ]", caption: "after badminton", description: "I lost both games, 21–18 and 21–19, and enjoyed the evening entirely." },
      { src: "https://picsum.photos/seed/dating-cv-4/600/600", large: "https://picsum.photos/seed/dating-cv-4/1400/1400", alt: "[ Describe photo four ]", caption: "first attempt", description: "The loaf that began the habit. It was dense and rather heavy, and I ate the whole of it." },
      { src: "https://picsum.photos/seed/dating-cv-5/600/600", large: "https://picsum.photos/seed/dating-cv-5/1400/1400", alt: "[ Describe photo five ]", caption: "the workshop", description: "There was sawdust in my hair for two days afterwards. The shelf is still standing." },
      { src: "https://picsum.photos/seed/dating-cv-6/600/600", large: "https://picsum.photos/seed/dating-cv-6/1400/1400", alt: "[ Describe photo six ]", caption: "my sister's wedding", description: "I gave the speech, and cried partway through it. Nobody seemed to mind." },
      { src: "https://picsum.photos/seed/dating-cv-7/600/600", large: "https://picsum.photos/seed/dating-cv-7/1400/1400", alt: "[ Describe photo seven ]", caption: "the piano", description: "The piece I have been learning for a year. I am nearly able to play it all the way through." },
      { src: "https://picsum.photos/seed/dating-cv-8/600/600", large: "https://picsum.photos/seed/dating-cv-8/1400/1400", alt: "[ Describe photo eight ]", caption: "late train home", description: "I missed the last train and walked instead. It turned out to be the best two hours of that month." },
    ],
    // The viewer's labels (read by screen readers).
    viewer: { label: "Photo", open: "Open photo", prev: "Previous photo", next: "Next photo", close: "Close the photo" },
    // Heading for the printed list of titles and descriptions.
    printHeading: "The photographs",
  },

  // -------------------------------------------------------------------
  //  WHERE I'M HEADING  —  the path off the island
  //  Written straight. This is the section that saves everyone's time.
  // -------------------------------------------------------------------
  heading: {
    title: "Where I'm heading",
    subtitle: "The next few years, as honestly as I can see them.",
    // 3–5 lines about life in the next few years.
    years: [
      "To stay in [ city ] for the time being. I am happy here and my family is close by. I would move for a good reason, though not simply for a change of scenery.",
      "To continue the work I do, become better at it, and stop allowing it to take up my evenings.",
      "A small place of my own with a proper kitchen and a little outside space, and a dog once the place allows for one.",
      "To learn the piano well enough to play a piece from beginning to end without stopping.",
    ],
    // 2–4 lines about what you want from dating, plainly.
    dating: [
      "Something that becomes a life, not a series of evenings. I'm not in a hurry, but I'm not casual about it either.",
      "Someone I can be ordinary with: errands, cooking, the same walk on a Sunday. I'd like that to feel like enough, because for me it is.",
      "I'd like children one day. I say it early so nobody wastes their time.",
    ],
    // One closing line. Optional ("").
    note: "I know that is a great deal to state so early. I would rather say it now than later.",
  },

  // -------------------------------------------------------------------
  //  THE JETTY GATE  —  what you're looking for, and what you're not
  //  The gate opens as the figure walks through; the sign beside it
  //  welcomes people in.
  // -------------------------------------------------------------------
  spec: {
    title: "What I'm looking for",
    subtitle: "A short list, because it is the short list that matters.",
    // What genuinely matters. 3–5 items. Plain.
    essential: [
      "Kind to the people serving them, and to the people who can do nothing for them.",
      "Able to disagree with me and remain on my side while we do it.",
      "Wants an ordinary life, and considers that a good thing to want.",
      "Says what they mean, particularly when it is difficult to say.",
    ],
    // Nice-to-haves. 3–5 items.
    desirable: [
      "Enjoys eating, and enjoys talking about what we are going to eat next.",
      "Has something they are not very good at and keeps doing it regardless.",
      "Content to read the map while I drive, or to drive while I read it.",
      "Gets along with my family, who will certainly get along with them.",
    ],
    // What genuinely would not work. 3–5 items. State them plainly and
    // courteously — this is information, not an accusation.
    rejections: [
      "Unkindness towards people who are serving them or working for them.",
      "Speaking cruelly about former partners.",
      "Not wanting children, or not wanting to discuss it. Both are entirely reasonable positions; neither is compatible with mine.",
      "Being consistently late and untroubled by it.",
    ],
    // Painted on the sign beside the gate. Keep it to a few words.
    gateSign: "Welcome to Ido's Island",
    // Small text under the dealbreakers. Optional ("").
    rejectionFootnote: "",
  },

  // -------------------------------------------------------------------
  //  THE HONEST PARAGRAPH  —  the last thing in the house card, and near
  //  the end of the document. No format, nothing clever. Write it plainly.
  // -------------------------------------------------------------------
  bench: {
    // Handwritten heading on the note. 2–4 words.
    heading: "honestly",
    // 80–140 words. Write this last, and write it plainly.
    text:
      "I am not looking for someone to repair me, and I am not looking for someone to repair. I am looking for a person I can be entirely ordinary with: cooking on a Tuesday evening, disagreeing about nothing of consequence, falling asleep during the film I insisted we watch. I take people seriously. I will remember something you mentioned in passing and return to it months later. I am slow to let people in, which I am working on, and I would rather tell you that now than have you discover it. If any of this sounds like you, I would be very glad to hear from you.",
    // Signature line. Optional ("").
    signoff: "— [ your first name ]",
  },

  // -------------------------------------------------------------------
  //  CONTACT  —  shown at the end of the path ("where I'm heading")
  // -------------------------------------------------------------------
  closing: {
    title: "Get in touch",
    text: "A message is enough to begin with. Tell me one true thing about your week, and I will take it from there.",
    // Contact rows. Shown as selectable text with a copy button, because
    // email and phone links don't work everywhere.
    //   `label` — "Email", "Instagram", "Signal", etc.
    //   `value` — what is shown and copied.
    //   `href`  — optional link (an https:// URL works best). "" for none.
    contacts: [
      { label: "Email", value: "[ you@example.com ]", href: "" },
      { label: "Instagram", value: "[ @yourhandle ]", href: "" },
    ],
    // One last handwritten line. Optional ("").
    signoff: "thank you for looking around.",
  },

  // -------------------------------------------------------------------
  //  YOUR FIGURE  —  the small clay person who walks around the island
  //  This is you. It is deliberately not a likeness, just a figure in the
  //  island's style; these colours are meant to be changed. The figure's
  //  size, walking speed and where it stands at each place are in
  //  src/three/island.config.js (AVATAR and each place's `stand`).
  // -------------------------------------------------------------------
  avatar: {
    skin: "#e8c4a6",
    hair: "#4a3324",
    // "short" or "long"
    hairStyle: "short",
    shirt: "#8fae8a",
    trousers: "#c9b39a",
  },

  // -------------------------------------------------------------------
  //  PRINT  (the plain paper version)
  // -------------------------------------------------------------------
  print: {
    buttonLabel: "Print this CV",
    footer: "Curriculum vitae, personal. Printed from the online edition.",
  },

  // -------------------------------------------------------------------
  //  SMALL INTERFACE LABELS
  //  You probably don't need to touch these. They're here so nothing on
  //  the page is hardcoded — translate them, or leave them.
  // -------------------------------------------------------------------
  ui: {
    eyebrow: "Curriculum vitae · personal",
    copyLink: "Copy link",
    copied: "Copied",
    copy: "Copy",
    printHint: "If no print dialog appeared, press Ctrl+P (or ⌘P), or open this page in its own browser tab.",
    essential: "Essential",
    desirable: "Nice to have",
    rejectionTitle: "Not for me",
    // The 3D island
    island: {
      toDocument: "Read it as a document",
      // The small speaker toggle beside it. Sound is on by default and
      // begins as soon as the browser allows it; this remembers "off".
      sound: { on: "Sound on", off: "Sound off", loading: "Loading sound…", failed: "Sound unavailable" },
      toIsland: "Back to the island",
      loading: "Preparing the island…",
      // The loading screen. One line per stage: a plain statement of what is
      // happening. `failed` shows if the 3D code can't load, with a button to
      // read the document instead.
      loadingScreen: {
        stages: {
          chunk: "Loading the island",
          fonts: "Preparing the lettering",
          paint: "Placing the photographs",
          frame: "Setting the light",
          done: "Ready",
        },
        failed: "The island could not be loaded on this device.",
        readInstead: "Read it as a document instead",
      },
      // Names of the places (the row along the bottom and the
      // hover labels). Keep them to one or two words.
      places: {
        house: "The house",
        family: "Family",
        shrine: "Shrine",
        workshop: "Workshop",
        hobbies: "Hobbies",
        washing: "Photos",
        heading: "The path",
        gate: "The gate",
      },
      navLabel: "Places",
      orbitHint: "Drag to turn the island · scroll to zoom · select a place",
      // The button shown during the arrival shot.
      skipIntro: "Skip",
      back: "Back to the island",
    },
    // Section rail labels in the document (small mono text beside each heading)
    rail: {
      profile: "About",
      personal: "Numbers",
      family: "Family",
      values: "Values",
      experience: "Work",
      hobbies: "Hobbies",
      photos: "Photos",
      heading: "Ahead",
      closing: "Contact",
      spec: "Looking for",
      bench: "Honestly",
    },
  },
};
