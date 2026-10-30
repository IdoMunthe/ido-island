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
    // Your name. Long names wrap fine.
    name: "Ido",
    // One line under the name. 6–14 words.
    tagline: "Easy-going, up with the sun, and sure the journey is the destination.",
    // City, or "City, Country". Short.
    location: "Jakarta, Indonesia",
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
    // 60–120 words. The paragraph people read first.
    text:
      "I'm a software engineer in Jakarta, and my days have a simple rhythm: the gym in the morning, then work, then friends or home, and an early night so I can do it all again. Life just feels better when I rise and rest with the sun. On weekends I see friends, or go to an event where I know no one, on purpose, to step outside my comfort zone. I play the guitar and the piano, I'll say yes to almost any racket sport, and I'm always somewhere in the middle of a book. People who meet me in a quiet room sometimes take me for cold; a few minutes of real conversation usually changes their mind. I believe the journey is the destination, so I try to enjoy the walk and not just count the steps.",
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
      { role: "my dad", name: "", line: "My friends have heard me call him a real-life Thomas Shelby, minus the razor-blade cap. He came from nothing and decided he would succeed, and then he did. Much of my drive comes from watching him." },
      { role: "my mum", name: "", line: "Loving and endlessly kind. All she has ever wanted for her children is that we are happy, and she means it completely." },
      { role: "my big sister", name: "", line: "The wise one. Smart and kind, and somehow able to give her little brothers advice without ever sounding bossy. We actually listen to her." },
      { role: "my younger brother", name: "", line: "The social one. He has friends wherever he goes and is the most fun person to spend an afternoon with." },
      { role: "my youngest brother", name: "", line: "The out-of-the-box thinker. He questions everything and is brilliant at maths and logic. He reminds me of who I was as a kid." },
    ],
    // One line under the figures. Optional ("").
    note: "We grew up in a small village, and each of us left for the city at twelve. We now live in different cities, but every Christmas Eve we find our way back to the same table.",
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
      { label: "Weight", value: "73 kg" },
      { label: "Age", value: "24" },
      { label: "Languages", value: "Bahasa Indonesia, fluently. English, comfortably. Mandarin, a beginner's amount. German, I understand more than I can say." },
      { label: "Birth order", value: "Second of four: one big sister, two little brothers" },
      { label: "Hours", value: "A morning person. I rise and rest with the sun, more or less, as people have since the dawn of time." },
    ],
  },

  // -------------------------------------------------------------------
  //  THE SHRINE  —  values
  //  Each value hangs as an ema, a small votive plaque, on the rack beside
  //  the shrine. `level` (0–5) is how well you hold to it at the moment; an
  //  honest 2 is more useful here than a flattering 5.
  // -------------------------------------------------------------------
  values: {
    title: "What I try to live by",
    subtitle: "Some of these I hold to well. Others I am still working on.",
    // `glyph` is what is painted on the plaque — one or two Chinese
    // characters, traditional forms — in place of the English `name`, which
    // is what everything else (the card, the document, print, alt text)
    // shows. Change either on its own. The painted font is served with only
    // the characters listed in index.html (the Noto Serif TC link, its
    // `text=` part): add a new character there too, or it falls back to
    // whatever Chinese font the visitor's system has.
    //   自愛 zì'ài, to care for oneself · 毅 yì, fortitude, the harder road ·
    //   勇 yǒng, courage, stepping out · 遊 yóu, to journey · 律 lǜ,
    //   discipline · 家 jiā, home, family
    items: [
      { name: "Taking care of myself", glyph: "自愛", level: 5, note: "I believe my feelings are mine to look after. So I take care of myself, for my own sake and for whoever I end up with. Two people who look after themselves have so much more to give each other." },
      { name: "The harder path", glyph: "毅", level: 4, note: "I want my future self to thank me for the uncomfortable choices. An easy life rarely builds a strong character." },
      { name: "Stepping out", glyph: "勇", level: 4, note: "Random events, new people, things I've never tried. Comfort is lovely, but it's rarely where I grow." },
      { name: "Enjoying the journey", glyph: "遊", level: 4, note: "The destination matters less than I used to think. I'm learning to enjoy the walk." },
      { name: "Discipline", glyph: "律", level: 5, note: "The gym every morning before work. Small habits, kept, are what hold the rest of my life together." },
      { name: "Family", glyph: "家", level: 5, note: "Spread across different cities, but Christmas Eve is always together." },
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
        title: "Software engineer",
        org: "Bank Mandiri",
        dates: "[ 20XX ] – now",
        bullets: [
          "What I like most is the people. They're genuinely fun to work with, and that makes the hard days lighter.",
          "I'd like to grow toward leading teams, not only writing code.",
        ],
      },
      {
        title: "Informatics Engineering",
        org: "Brawijaya University",
        dates: "[ 20XX ] – [ 20XX ]",
        bullets: ["I grew up a gamer, and that turned into a real curiosity about technology and code. Studying informatics felt like the natural next step, so I applied and got in."],
      },
    ],
  },

  // -------------------------------------------------------------------
  //  HOBBIES  —  the music corner, the badminton court, the outdoor gym,
  //  the chess table
  // -------------------------------------------------------------------
  hobbies: {
    title: "Hobbies",
    subtitle: "The three things you will most often find me doing, and a few others.",
    music: {
      label: "Music",
      text: "Guitar and piano, mostly in the evenings and mostly for myself. If you sing, though, I'd love to be the one playing along.",
    },
    badminton: {
      label: "Racket sports",
      text: "Badminton, padel and tennis. If it involves a racket, I'm in. Chess too, which absolutely counts as a sport when you're the one losing.",
    },
    gym: {
      label: "The gym",
      text: "Every morning before work. It clears my head, and it's the habit that keeps everything else in order.",
    },
    chess: {
      label: "Chess",
      text: "Online most evenings, two or three quick games before bed, and over the board on a Sunday with a friend who usually beats me. I'm rated around 1400: good enough to see a plan coming, not always good enough to stop it. I like that it's quiet, and that there is nowhere to hide in it.",
    },
    // Anything else, briefly. Optional ([]).
    others: [
      { label: "Reading", detail: "Slowly but steadily." },
      { label: "Nature", detail: "Anything green, open and quiet, which is a good antidote to Jakarta traffic." },
      { label: "Meeting new people", detail: "Random events, on purpose. It's how I step out of my comfort zone." },
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
      "To stay in Jakarta. My life and my work are here, and I'm happy in it.",
      "To keep growing in tech, moving step by step toward leading teams.",
      "To travel when I can, around Indonesia and further away.",
      "To keep improving my body, my mind and my spirit. You can't have both an easy life and a great character, so I'd rather choose the uncomfortable thing now.",
    ],
    // 2–4 lines about what you want from dating, plainly.
    dating: [
      "Someone to experience life with: sunsets at Baywalk Mall, a movie night, a run around GBK.",
      "She sings, I play the guitar, and we have each other's back.",
      "Someone intelligent I can talk with about almost anything, who understands her feelings and can say them clearly.",
    ],
    // One closing line. Optional ("").
    note: "I'm not in a hurry, but I'm serious about it.",
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
      "Emotional intelligence: she understands her feelings and can talk about them.",
      "A sharp, curious mind I can talk with about anything, silly or serious.",
      "Kind eyes.",
      "A beautiful smile.",
    ],
    // Nice-to-haves. 3–5 items.
    desirable: [
      "Loves to sing, because I'd love to play the guitar for her.",
      "Up for a Marvel marathon, and has opinions about the watching order.",
      "Enjoys the gym, or wouldn't mind a morning workout together.",
    ],
    // What genuinely would not work. 3–5 items. State them plainly and
    // courteously — this is information, not an accusation.
    rejections: [
      "Being emotionally unavailable.",
      "Anger that turns explosive or hurtful.",
      "No interest in learning, questioning or thinking things through.",
      "Not caring for herself. I hope she loves herself as much as she deserves to be loved.",
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
    // 80–140 words.
    text:
      "I'm looking for an intelligent, kind woman to share a life with and to build one together. Someone I can talk to about anything, from a good book to a bad day. I'll be honest: I fall in love slowly. I take my time getting to know someone, and I'd rather do that than rush into something neither of us understands. But once I'm in, I'm all in. I believe we are each responsible for our own feelings, and that the best partners hold each other up when things get heavy. So I take care of myself, for me and for you, and I hope you'll do the same. If that sounds like you, I'd love to hear from you.",
    // Signature line. Optional ("").
    signoff: "— Ido",
  },

  // -------------------------------------------------------------------
  //  CONTACT  —  shown at the end of the path ("where I'm heading")
  // -------------------------------------------------------------------
  closing: {
    title: "Get in touch",
    text: "A message is enough to begin with. Tell me the best part of your week, and I'll take it from there.",
    // Contact rows. Shown as selectable text with a copy button, because
    // email and phone links don't work everywhere.
    //   `label` — "Email", "Instagram", "Signal", etc.
    //   `value` — what is shown and copied.
    //   `href`  — optional link (an https:// URL works best). "" for none.
    contacts: [
      { label: "Email", value: "[ you@example.com ]", href: "" },
      { label: "LinkedIn", value: "linkedin.com/in/idomunthe", href: "https://www.linkedin.com/in/idomunthe" },
      { label: "Instagram", value: "@idomunthe3", href: "https://www.instagram.com/idomunthe3" },
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
    shirt: "#1f1f1f",
    trousers: "#efe4cc",
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
