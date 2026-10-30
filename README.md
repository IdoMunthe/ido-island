# Dating CV

A personal CV as a small sunlit island you turn in your hands, with a plain document version behind one button. Built with Vite, React, Tailwind and framer-motion, and compiled to plain static files you can host anywhere.

## Run it locally

```
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

## Make it yours

**Edit one file: `src/content.js`.** Every word on the site lives there, with a comment above each field explaining what it is, how long it should be, and what happens if you leave it blank. Anything in `[ SQUARE BRACKETS ]` is a placeholder you must replace. The pre-filled text is example copy in the intended voice; overwrite all of it.

Nothing in `src/components/` needs touching unless you want to change how things look.

## Photos

1. Put your image files in `src/photos/` (the folder is already there). A 1200–2000px-wide JPEG is plenty. Vite fingerprints them into `dist/assets/` on build, so they are cached properly by the host — no need to keep them tiny, but don't ship 8 MB phone originals either.
2. At the top of `src/content.js`, import each one:
   ```js
   import portrait from "./photos/me.jpg";
   ```
3. Use the imported name in the matching `src` field:
   ```js
   photo: { src: portrait, alt: "Me, squinting at a lake", caption: "recent, allegedly" },
   ```

Sizes that look best: the header portrait is 4:5 (portrait); the washing-line photographs are square. Any shape is accepted and centre-cropped. Leaving `src: null` shows a kraft-paper placeholder. The example content ships with temporary placeholder pictures from picsum.photos; if one can't be fetched the kraft placeholder is used, so an outside image can never break the island.

## Build

```
npm run build
```

Everything lands in `dist/` as static files — `index.html` plus fingerprinted JS, CSS and images in `dist/assets/`. No server, no runtime, no environment variables.

Check it before deploying:

```
npm run preview
```

That serves the real production build locally, which catches anything that works in dev but breaks when built.

## Deploy to Vercel

Vercel detects Vite automatically, so there is nothing to configure. Two ways:

**From your terminal** — quickest:

```
npx vercel          # preview deployment, gives you a URL to check
npx vercel --prod    # the real one
```

It will ask you to log in the first time, then confirm the project settings. Accept the defaults; the Vite preset already uses build command `npm run build` and output directory `dist`.

**From the dashboard** — better if you want auto-deploys:

1. Push this folder to a GitHub repo of its own.
2. In Vercel, *Add New Project* → import that repo.
3. Framework preset should already say **Vite**. Deploy.

After that, every push to `main` redeploys. Edit `src/content.js`, commit, push, done.

### A custom domain

A `your-name.vercel.app` URL is fine, but a real domain reads better on something you are actually sending to people. Buy one anywhere, then in Vercel: *Project → Settings → Domains → Add*, and follow the DNS records it gives you.

### Anywhere else

`dist/` is just static files, so all of these work the same way: Netlify (drag the `dist` folder onto the dashboard), Cloudflare Pages, GitHub Pages, or any web server. `base: "./"` in `vite.config.js` keeps asset paths relative, so it works in a subfolder too.

## The island (3D mode)

The CV is a small sunlit island you turn in your hands. Drag to orbit, scroll or pinch to zoom, click a place and the camera glides down to it while its card opens; "Back to the island" or Escape returns you to the whole view. The first time the island appears (once per page load, after the loading screen has faded) there is a short arrival: the camera starts low by the gate looking out along the jetty, your figure walks in from the end of the decking — the gate swings open for it and shuts behind — and up the path to its spot by the house while the camera eases out and up into the overview, settling as it arrives (about eight seconds). A **Skip** button shows throughout and any drag, scroll, click or key ends it and eases straight to the overview with the figure at home; clicking a place during it does the normal glide to that place. It never plays with reduced motion, without WebGL, or in document mode. `INTRO` in the config holds the camera keyframes, timing, entry point and walking pace, and `node scripts/introplot.mjs` draws the camera path and the walk together (top-down with time ticks, plus camera height and distance over time) to `scripts/intro.svg`, warning if the camera goes through the ground, the water or a place, or if he arrives long before or after the camera settles. After that, nothing is on rails and the page never scrolls. A quiet hint in the top-right corner explains the controls and fades after the first drag or scroll. With a keyboard, Tab reaches a hidden list of the eight places. The buttons themselves are never drawn — focusing one highlights its landmark in the scene with the hover ring and name label, and that is the focus indicator. Enter opens a place, Escape closes its card and focus returns to the list.

Places, in the order the row shows them:

- **The house** — the card holds the introduction, the numbers (height, weight, age, languages, birth order and the rest) and, last, the honest paragraph.
- **Family** — five clay figures in the middle of the island, labelled by role only (names are an optional field left empty); the mother and sister have long hair; everyone wears trousers. At night they gather round a campfire — a ring of stones, logs, a shader flame of upward-scrolling noise with irregular licks, drifting embers and one warm light that flickers with the flame — sitting on the ground with their knees up, turned in to the fire. As the lamps come on, one of them sets off and the others follow over a couple of seconds at their own pace — the same walk the figure uses — each turning to face the flames and sitting down (knees bend, hips lower, a little settle, hands to knees; the kids drop down faster); at dawn they push up, turn and walk back. The move starts when the lamps' curve crosses a threshold with hysteresis and always finishes before it can reverse, so a wobbling light never leaves anyone half-way (`FIRE` and `FIRE.move` in the config; `scripts/map.mjs` checks the routes don't cross the fire or each other).
- **The family goes visiting.** Select **Hobbies** and the father and the younger brother get up, walk over (the campfire walk, routed round the fire ring and round the others) and sit on the two stools at the chess table, facing each other; they play — the one to move leans in, reaches over the board and a piece slides to a neighbouring square, now and then taking one, which goes to the pile beside the board — with real pauses to think, then sit back; leave Hobbies and they walk back. Select **Photos** and the mother and sister come and stand under the photographs, pointing one out, leaning in, turning to each other, a small laugh, each on her own clock. Night has priority: at night nobody goes visiting, and night falling while they are away calls them back to the fire. Every move runs to its end before another is taken, so leaving a place mid-walk ends in a clean rest, and the group copes with members away (the wave-back goes to those present; the fire circle has empty seats). `VISITS` and `CHESS` in the config; `node scripts/map.mjs` checks the roles match, the spots are clear of the figure's own place, and the walks are clear of every footprint.
- **Shrine** — a small hokora on a stone base at the end of stepping stones, two stone lanterns lit at dusk, a tsukubai basin with a ladle, moss, stones and a maple; the values hang beside it as ema, one wooden plaque each with the value's Chinese character painted on in a brushed serif (`glyph` beside each value in `src/content.js`; the English name stays everywhere else), swinging on their cords. The character face (Noto Serif TC) is served by Google Fonts cut down to just those characters, and the island waits for it before painting; `node scripts/emapng.mjs` paints every plaque with the real painter in Node and writes `scripts/ema.png`, failing if a character is missing or a tofu box, and `node scripts/emacheck.mjs` checks the wiring — every value has a glyph, the link and the local subset carry it, the painter waits for the face. (The old garden's growth-to-a-rating went with it; the plaques don't rank.)
- **Workshop** — work and study, a crate per role outside; inside, a bench under a big window where your figure works.
- **Hobbies** — a music corner (a proper acoustic guitar on a stand, an upright piano), a badminton court, an outdoor gym and a chess table — a flat stone with a board and a game part-played on it, two stools; your figure sits at the piano and plays.
- **Photos** — eight polaroids pegged along a washing line, each hung a little differently; click one and it opens large in a viewer with its title and description, with arrows (wrapping round), Escape/X/backdrop to close, ←/→ and swipe to move between them.
- **The path** — a tall vermilion torii where the path leaves the island, the gate to what comes next, with stepping stones running on through it over the water and a stone lantern beside it: the next few years, what you want from dating, and how to get in touch.
- **The gate** — a garden gate at the shore with the welcome sign beside it, and a wooden jetty out over the water beyond; the gate opens for your figure (`spec.gateSign` in `src/content.js`, painted on a board). What you are looking for, and what you are not.

**The layout.** The family stands at the centre; the other seven places sit around it at roughly even angles (42–63° apart) and varied distances, with a loop path touching each and two side paths — one to the jetty, one out through the torii where the path leaves the island. `node scripts/map.mjs` draws a top-down map of the current config (ASCII on stdout, `scripts/map.svg` on disk): the shore, every place with its real footprint circles, trees, lamps, the path with its waypoints, where the figure waits and stands, and the overview camera. It also warns about overlapping footprints, footprints over the shore or across the path, places too close together or unevenly spread, tall things hiding one another from the overview camera, and path segments the figure could not walk. Re-run it after moving anything; an empty warnings list is the goal. `node scripts/signpng.mjs` runs the real sign painter in Node (with the same Google fonts, subset in `scripts/fonts/`) and writes `scripts/sign.png` — open it to see exactly what is painted on the board — and fails if the lettering is missing. `node scripts/signcheck.mjs` checks the welcome sign's wiring without a browser: that its text is set, splits into the two lines, is painted onto a colour-managed texture on both faces, and sits inside the camera's view from the overview and from the gate's own pose at a legible size.

**Your figure.** A small clay person — you — waits by the house and, when a place is clicked, walks there along the sand path (a procedural walk: legs, arms, a little bob, turning to face the way it goes) and does something fitting: sits on the bench by the door with its knees bent and feet on the ground, talks with the family (one of them gestures back) — or, at night, takes the empty seat on the circle by the fire (`standNight` in the config), bows before the shrine and then stands quietly, goes into the workshop (the door swings open as it arrives and shuts behind it, and again on the way out) and saws and hammers at the bench where the window shows it, sits at the piano and plays, reaches for a photo, walks through the torii and stands on its threshold looking out, and, at the gate, waits for it to swing open, goes through (it shuts behind), walks to the far edge of the jetty and takes in the view. The rig has hips, knees, shoulders and a neck (`src/three/life/Figure.jsx`). Places that need a way in list it as `stand.via` in the config (the workshop: outside the door, inside the door; the gate: either side of it; the torii: just before it) and doors swing from the figure's own position (`door` in the config: open while it walks within `radius`) and the figure walks those points in and back out in reverse. It walks around things: every place has a `footprint` (circles) in the config, the route is chosen so the figure's own `AVATAR.radius` never crosses one, and in development the console reports any path segment that would. Its colours are the `avatar` block in `src/content.js` (change them; it is not a likeness); its size, walking speed, home spot and where it stands at each place are in `src/three/island.config.js` (`AVATAR` and each place's `stand`). The figure is decoration: the document, print and keyboard paths carry every word without it.

Every card reuses the same components as the document, so the two modes cannot drift apart. **"Read it as a document"** (top right) is always available and is also what screen readers, reduced-motion settings, machines without WebGL and the print stylesheet get. Which mode the page chose is logged to the console with its reason and shown as a badge in development.

**The day.** A real sun travels an arc over the island and runs everything: its height and colour, shadow length, the sky (drei's scattering sky), the fog at the horizon and the environment light the materials pick up. Dawn is pink and long-shadowed, midday neutral, golden hour long and warm, dusk violet, and night deep blue with stars, a moon and the lights coming on — the house windows, the lantern posts along the path, the workshop door lamp, the stone lantern by the torii, the string lights over the washing line, and the fairy lights round the nests in the trees. The day runs on its own — a full 24 hours every `DAY.cycleMinutes` real minutes (1.5 by default: dawn and dusk each take about five seconds, and the light is visibly moving while a card is read), starting from the visitor's own local time — so dawn, noon, sunset and night all come round while someone looks. There is no control for it: the day is not a setting. As the lamps come on an owl appears far off, high and to one side of the view — worked out from wherever the camera is at that moment — crosses the sky, banks round (it rolls into every turn, from the path's curvature), dips below the washing-line post and swoops up onto it: a flare, legs reaching, a hover, the drop, then the wings fold in stages. It flaps in bursts and glides between them, its body lifts and pitches with each stroke, and its head stays level and locked on the perch while the body moves under it. At dawn it hops off and climbs away. Everything is `OWL.flight` in the config, and `node scripts/flightplot.mjs` draws the exact flight from the overview camera to `scripts/flight.svg` — top-down and side views with speed ticks, plus bank, pitch, flap and speed over time — and warns if it dives into the ground, brushes a place, or leaves the camera's view. `node scripts/daycheck.mjs` steps the same arithmetic over simulated time and prints the hour and the sun's height, so the cycle can be proven to advance without a browser. The whole curve is `DAY.keyframes` in `src/three/island.config.js`; the lights are `LAMPS`.

**The nests.** Four of the eight trees have a bird's nest seated in the crown — a woven cup of twigs with a few straying out and two small eggs in it. They ride the trees' sway. The nests are one merged geometry instanced and the eggs one instanced mesh (two draw calls). Which trees, where in the crown and sizes are `NESTS` in the config, and `node scripts/map.mjs` checks each nest is seated in its crown, clear of the other foliage, off the overview camera's line to any place and away from the owl.

**Post-processing and tiers.** Desktops with a capable GPU get ambient occlusion, a tilt-shift focal band (the miniature look), soft bloom, a gentle vignette and a hair of chromatic aberration; weak desktop GPUs get bloom and vignette only; touch devices get no post-processing, no shadows and fewer lights. The tier is logged to the console (`[dating-cv] render tier: …`). Values per tier are `POST` in the config.

**Tuning without hunting:** every colour, light, camera pose, zoom limit and object position lives in `src/three/island.config.js`, commented. Copy for the island (place names, buttons, the hint) is in `ui.island` in `src/content.js`.

**Performance:** clay-simple geometry with rounded edges (boxes, spheres, extruded outlines for the guitar and roof, instanced grass and flowers), one shadow-casting light that is the sun by day and the moon by night, sky and ambient fill, image-based light from the sky, ACES tone mapping, soft contact shadows, a reflective water surface with waves, and the post-processing above by tier. The loop runs continuously (so the first frame is guaranteed) but pauses when the tab is hidden.

## The document

"Read it as a document" is the same CV as a piece of print design on one sheet: a masthead with the name set large in Fraunces, then numbered sections down one left axis (a mono rail label beside each heading). The sections are laid out by what they hold — the introduction as a lede with a drop cap, the numbers as a two-column specification, family and work as rows on the rail axis, hobbies as four columns, the photographs as a grid that opens the same viewer, the plans as numbered lists — and the honest paragraph is set as a pull quote before the contact details, which come last. The island cards keep their own compact layouts; both read from `src/content.js`. The print stylesheet flattens all of it to the plain black-and-white document.

## Sound

Nature ambience, **off until the visitor clicks the small speaker** in the top-right corner of the island (a real button with `aria-pressed`; it shows a spinner while the files fetch, and goes back to off if the browser refuses to play so the next click works). Nothing is fetched or played before that click — the files (9.0 MB together) are not part of the page load. The choice is remembered (`localStorage`), but a returning visitor's first click or key on the island is what starts it again; sound never autoplays. It pauses when the tab is hidden and in document mode.

Two layers, mixed with the Web Audio API (decoded buffers looped on the graph, so there is no gap at the loop point): the sea runs all the time, and night insects crossfade in as the lamps come on and out at dawn — the same `DAY.lightsOn` curve the lights and the owl follow — with the sea ducking a little at night so the insects sit on top. While the owl is on its post — after it lands at nightfall, before it leaves at dawn, never while it is flying — it hoots now and then: a one-shot every 20–50 seconds, randomised, never the same clip twice running, mostly the single call with a longer sequence occasionally, quiet under the insects and panned to where the post is on screen (a `StereoPannerNode` fed from the perch's screen position), its head dipping with each call; `AUDIO.owl` in the config. Every level is `AUDIO` in `src/three/island.config.js`; keep it quiet.

The files, in `public/audio/`, are from [BigSoundBank](https://bigsoundbank.com) under **CC0 / public domain** (free for any use, no attribution required): `sea-day.mp3` (medium sea waves with Sandwich tern calls, 0:58, 2.3 MB), `night-insects.mp3` (nocturnal insects and wind in a hedge, 2:31, 6.0 MB) and three tawny owl recordings, `owl-3459.mp3` (a single call, 0:02, 55 KB), `owl-1763.mp3` (a sequence, 0:09, 343 KB) and `owl-1764.mp3` (a sequence, 0:08, 320 KB). All are 320 kbps mono, far more than background ambience needs: re-encoding the whole `public/audio` folder to ~96 kbps mono (e.g. `ffmpeg -i in.mp3 -ac 1 -b:a 96k out.mp3`) would cut them by roughly 4× with no audible loss here.

## Accessibility and motion

- With "reduce motion" turned on in the OS, the island is never loaded; the page opens straight into the document.
- The drawer opens by dragging, tapping, or pressing Enter.
- "Print this CV" uses the browser's print dialog and a dedicated print stylesheet: the printout is a plain, formal, black-and-white document with every ticket and reference expanded. Worth testing once via *Print → Save as PDF* after you have written your content, since it is the one view nobody checks.
