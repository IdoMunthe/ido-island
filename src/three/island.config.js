// =====================================================================
//  island.config.js — EVERY visual decision of the 3D island, in one place
// =====================================================================
//
//  Nothing in src/three/ hardcodes a colour, a light, a camera pose or a
//  position: they all read from here. Nudge a number, save, look again.
//
//  Units are metres in a toy world: the island is ~12 m across, the house
//  ~2.4 m wide. y is up; the island's top surface is y = 0.
//  Colours are plain CSS hex. Angles are radians (Math.PI = 180°).
//  Facing angles are rotation about y: 0 faces +z, π/2 faces +x.
//
// =====================================================================

export const PALETTE = {
  // Sky: the clear colour and the fog colour that blends the horizon.
  sky: "#cfe6f5",
  skyHorizon: "#eef3f1",
  // Water around the island.
  water: "#8ec5d6",
  waterDeep: "#5fa5bf",
  waterFoam: "#e9f6fa",
  // The island body.
  cliff: "#d9b48a",
  cliffDeep: "#b98e63",
  grass: "#a6c48a",
  grassLight: "#bfd6a3",
  path: "#e6d3b1",
  soil: "#8a6a4a",
  // Buildings and things.
  cream: "#f3ead9",
  plaster: "#f6efe3",
  terracotta: "#d08a6a",
  roof: "#c2705a",
  wood: "#b98a5e",
  woodDark: "#8c6543",
  sage: "#8fae8a",
  leaf: "#7fb07a",
  leafLight: "#a8cf9a",
  wilt: "#b59a63",
  glass: "#dff0f5",
  metal: "#7d8a86",
  post: "#a58a6b",
  paper: "#f8f4ea",
  pin: "#d55a4a",
  flower: ["#f2b8b0", "#f7d98c", "#c9b9e8", "#ffffff"],
  cloud: "#ffffff",
  bird: "#4b5450",
  highlight: "#ffd27a",
  // The family figures: skin, hair, and clothing colours cycled by member.
  // (The user's own figure is coloured from `avatar` in content.js.)
  skin: "#e8c4a6",
  hair: "#4a3324",
  clothes: ["#6f9ecf", "#d08a6a", "#8fae8a", "#f7d98c", "#c9b9e8"],
  trousers: "#8c6543",
  // Instruments and sport.
  guitar: "#c98a4a",
  piano: "#3b2f2a",
  court: "#b8d0a0",
  courtLine: "#f8f4ea",
  net: "#f3ead9",
  weight: "#4b5450",
};

export const RENDER = {
  // ACES film tone mapping; exposure > 1 brightens the whole picture.
  exposure: 1.15,
  // Fog softens the horizon: [near, far] distances from the camera.
  fog: [22, 60],
  // Device pixel ratio caps: [min, max] on desktop and on touch devices.
  dpr: [1, 1.5],
  dprTouch: [1, 1.25],
};

export const LIGHTS = {
  // Warm afternoon sun. Position is where the sun sits relative to the island.
  sun: { position: [8, 12, 6], intensity: 2.6, color: "#fff2dc" },
  // Sky/ground bounce: makes shadows blue-grey instead of black.
  hemisphere: { sky: "#cfe6ff", ground: "#e2cfae", intensity: 1.1 },
  ambient: { intensity: 0.35, color: "#ffffff" },
  // Shadow map sizes (desktop / touch). Bigger = crisper, costlier.
  shadowMap: 2048,
  shadowMapTouch: 1024,
  // Contact shadows: the soft dark pool under every object.
  contact: { opacity: 0.5, blur: 2.2, resolution: 1024, resolutionTouch: 512, far: 3, scale: 18 },
};

export const CAMERA = {
  fov: 38,
  // The overview pose: where the camera sits when nothing is selected.
  // The page opens here.
  overview: { target: [0, 0.4, 0], distance: 16.5, polar: 1.02, azimuth: 0.55 },
  // Zoom limits and how far you can tilt (polar 0 = straight down, π/2 = horizon).
  minDistance: 3.0,
  maxDistance: 26,
  minPolar: 0.35,
  maxPolar: 1.32,
  // Orbit feel.
  damping: 0.08,
  rotateSpeed: 0.7,
  zoomSpeed: 0.8,
  // How quickly the camera glides to a place (per-second easing rate).
  glide: 3.2,
  // Portrait phones: back off by this factor per unit of missing aspect.
  portraitPush: 0.9,
};

export const ISLAND = {
  radius: 7.2,
  depth: 2.4,
  // Sand path: a loop past every place, as [x, z] waypoints. The figure
  // walks along it; every segment is checked against the footprints below
  // at start-up and any collision is logged to the console in development.
  path: [
    [0.0, 2.75],
    [1.35, 2.3],
    [2.35, 1.3],
    [2.7, 0.0],
    [2.3, -1.4],
    [1.3, -2.35],
    [0.0, -2.7],
    [-1.35, -2.3],
    [-2.35, -1.25],
    [-2.75, 0.0],
    [-2.3, 1.35],
    [-1.3, 2.35],
  ],
  pathClosed: true,
  // Side paths off the loop: to the jetty gate and to the arch where the
  // path leaves the island. Each is a polyline starting on the loop.
  spurs: [
    [
      [2.35, 1.3],
      [3.2, 2.8],
      [4.05, 4.15],
    ],
    [
      [-1.35, -2.3],
      [-1.5, -4.2],
      [-1.65, -6.15],
    ],
  ],
  pathWidth: 0.55,
  // Trees: [x, z, scale]. Keep them off the places and the path.
  trees: [
    [-6.5, -1.0, 0.9],
    [-3.3, 5.8, 0.8],
    [2.5, -6.2, 0.9],
    [4.2, 2.8, 0.75],
    [6.1, -1.9, 0.8],
    [-4.0, -5.4, 0.7],
    [-6.1, 2.9, 0.7],
    [6.5, 1.0, 0.6],
  ],
};

// The eight places. `at` is where the object stands, `rotation` its facing,
// `camera` the pose the camera glides to (distance from `at`, polar tilt,
// azimuth around it, look-at offset above the ground), `stand` where the
// figure goes and what it does there, and `footprint` the circles (in the
// place's own local metres: [dx, dz, radius]) the figure must walk around.
//   stand.at     — [x, z] on the ground, world metres
//   stand.y      — height of the floor it stands on (default 0)
//   stand.seat   — for "sit"/"piano": height of the seat above the ground;
//                  the knees bend to put the feet on the floor
//   stand.via    — [x, z] points it must pass through on the way in (and
//                  back out through in reverse): e.g. outside and inside a
//                  door. Routing on the path ends at the first one.
//   stand.face   — which way it faces when it arrives
//   stand.action — see Avatar.jsx: "sit" | "talk" | "tend" | "work" |
//                  "piano" | "reach" | "lookout" | "look"
export const LANDMARKS = [
  {
    id: "house",
    at: [-4.26, 0, -1.99],
    rotation: 1.13,
    camera: { distance: 5.8, polar: 1.05, azimuth: 1.5, lookAt: [0, 1.0, 0] },
    // sits on the bench beside the door, feet on the ground
    stand: { at: [-3.08, -1.79], seat: 0.19, face: 1.13, action: "sit" },
    footprint: [
      [0, 0, 1.5],
      [0.55, 1.4, 0.3],
    ],
  },
  {
    // The family stands in the middle of the island, facing the front.
    id: "family",
    at: [0, 0, 0.3],
    rotation: 0.55,
    camera: { distance: 4.8, polar: 1.1, azimuth: 0.55, lookAt: [0, 0.75, 0] },
    // by day it stands in front of them and talks; at night (the lamps'
    // curve past half) it takes the empty seat on the circle by the fire
    stand: { at: [0.9, 1.9], face: -2.63, action: "talk" },
    standNight: { at: [0.63, 1.32], seat: 0.12, face: -2.59, action: "sitfire" },
    // the group, and the fire ring inside it
    footprint: [
      [0, 0, 1.25],
      [0, 0.35, 0.45],
    ],
  },
  {
    // the shrine faces +z (its own metres), toward the island; the stones
    // lead in from there
    id: "shrine",
    at: [4.88, 0, -0.43],
    rotation: -1.48,
    // from the west, a little to the south: the hokora front, the lanterns
    // and the ema rack side-on
    camera: { distance: 4.6, polar: 1.05, azimuth: -0.93, lookAt: [0.3, 0.6, -0.1] },
    // up the stepping stones (via) to stand before the hokora, and bow
    stand: { at: [4.53, -0.4], via: [[3.49, -0.3]], face: 1.66, action: "bow" },
    // the hokora's base, the two lanterns, the ema rack, the basin, the maple
    footprint: [
      [0, -0.6, 0.55],
      [-0.6, 0.55, 0.18],
      [0.6, 0.55, 0.18],
      [0.95, 0.2, 0.55],
      [-0.95, 0.1, 0.3],
      [-0.9, -0.9, 0.3],
    ],
  },
  {
    id: "workshop",
    at: [-4.24, 0, 2.45],
    rotation: 2.09,
    camera: { distance: 5.4, polar: 1.05, azimuth: 1.2, lookAt: [0, 0.8, 0] },
    // in through the door (outside, then inside it) to the bench under the
    // window, facing the window
    stand: { at: [-4.06, 2.76], via: [[-3.01, 1.87], [-3.93, 2.4]], face: 0.52, action: "work" },
    // the door: where it is (world), how far away the figure is when it
    // starts to open, and how far it swings (radians, negative = outward)
    door: { at: [-3.57, 2.19], radius: 1.25, open: -1.85 },
    footprint: [
      [0, 0, 1.1],
      [1.05, 1.3, 0.75],
    ],
  },
  {
    id: "hobbies",
    at: [2.6, 0, -4.55],
    rotation: -0.52,
    camera: { distance: 5.8, polar: 1.0, azimuth: 2.6, lookAt: [0, 0.5, 0] },
    // sits at the piano (on the music deck, 6 cm up) and plays
    stand: { at: [0.9, -5.02], y: 0.06, seat: 0.41, face: 3.12, action: "piano" },
    footprint: [
      [-0.5, 0, 0.75],
      [0.5, 0, 0.75],
      [-1.55, 0.1, 0.9],
      [0.2, 1.35, 0.85],
    ],
  },
  {
    id: "washing",
    at: [0.0, 0, 4.7],
    rotation: 3.0,
    camera: { distance: 4.4, polar: 1.15, azimuth: -0.15, lookAt: [0, 1.1, 0] },
    stand: { at: [-0.25, 4.15], face: -0.14, action: "reach" },
    // the two posts; the line itself hangs above head height
    footprint: [
      [-2.0, 0, 0.2],
      [2.0, 0, 0.2],
    ],
  },
  {
    id: "heading",
    at: [-1.73, 0, -6.47],
    rotation: 1.83,
    // from the island side, looking out through the torii with the figure
    // on the threshold
    camera: { distance: 6.6, polar: 1.1, azimuth: 0.2, lookAt: [0.3, 1.1, 0] },
    // up the spur to just before the opening (via), through the centre of
    // the torii, and a step past it, on the threshold looking out
    stand: { at: [-1.81, -6.76], via: [[-1.65, -6.15]], face: -2.88, action: "lookout" },
    // the two torii pillars (local: the path runs along +x, the pillars sit
    // either side at ±0.95) and the stone lantern
    footprint: [
      [0, 0.95, 0.16],
      [0, -0.95, 0.16],
      [-0.45, 0.85, 0.2],
    ],
  },
  {
    id: "gate",
    at: [4.24, 0, 5.06],
    rotation: 0.7,
    camera: { distance: 4.2, polar: 1.1, azimuth: -1.9, lookAt: [0.2, 0.7, 0.6] },
    // walks from the path to the gate (via: just outside it, then just
    // inside on the deck), through it and out to the far edge of the
    // decking (deck top 13 cm up), facing the open water
    stand: { at: [5.63,6.7], via: [[4.05,4.83], [4.63,5.52]], y: 0.13, face: 0.7, action: "look" },
    // the gate leaf: where it is (world), how far away the figure is when
    // it starts to open, and how far it swings (radians, negative = out
    // along the jetty, clear of the walk)
    door: { at: [4.34,5.17], radius: 1.4, open: -1.9 },
    // the welcome sign beside the gate: board size (m), the height of its
    // top edge, where its post stands (local), its yaw, and how far it
    // leans back to face the overview camera. Painted on both faces.
    sign: { at: [1.1, 0, -0.05], rotation: -0.2, lean: 0.3, width: 1.5, height: 0.7, top: 1.95, twoSided: true },
    footprint: [
      [0, 0.15, 0.6],
      [1.1, -0.05, 0.2],
    ],
  },
];

// Other things the figure walks around, as world circles [x, z, radius].
// Trees and lantern posts are added automatically.
export const OBSTACLES = [];

// The shrine's parts, in its own metres (see Shrine.jsx). The ema are the
// values: one plaque each, hung on the rack.
export const SHRINE = {
  hokoraZ: -0.6,
  lanternX: 0.6,
  lanternZ: 0.55,
  basin: [-0.95, 0, 0.1],
  maple: [-0.9, 0, -0.9],
  rack: [0.95, 0, 0.2],
  rackYaw: 0.55, // turned toward the card camera
  emaSway: 0.09, // radians of swing on the cords
  ema: { width: 0.2, height: 0.16, gap: 0.05, cord: 0.07, perRow: 4, rackHeight: 1.25, rowGap: 0.34 },
};

// The campfire at the family, only there at night (it fades with
// DAY.lightsOn like the lamps). Positions are in the family's own metres.
export const FIRE = {
  local: [0, 0, 0.35], // where the fire is
  circleRadius: 0.85, // where everyone sits round it
  seatHeight: 0.12, // hips above the ground when sitting (knees come up)
  ringRadius: 0.3, // the ring of stones
  stones: 9,
  flameHeight: 0.8,
  flameWidth: 0.5,
  flicker: 0.35, // how much the flame and light dip (0 = steady)
  light: { color: "#ff9d45", intensity: 2.4, distance: 5.5, height: 0.4 },
  embers: { count: 18, rise: 0.7, wander: 0.18, life: [1.2, 2.6] },
  // The move between standing by day and sitting by night (the family and
  // the user's figure): starts when the lamps' curve crosses threshold ±
  // hysteresis and always finishes before it can turn round.
  move: {
    threshold: 0.5,
    hysteresis: 0.1,
    stagger: 2.2, // seconds between the first and the last setting off
    walkSpeed: [0.9, 1.3], // m/s, each person somewhere in this range
    sitSeconds: [0.7, 1.2], // [kids, adults]
    riseSeconds: [0.7, 1.3], // [kids, adults]
    turnRate: 7, // how fast they turn to face where they're going
  },
};

// The owl: only there at night. As the lamps come on (DAY.lightsOn) it
// flies in from behind the camera — wherever the camera is at that moment —
// past the viewer and lands on top of the washing-line post nearest the
// overview camera; at dawn it flies back out the same way. `local` is in
// that landmark's own metres; `face` is its resting world yaw.
export const OWL = {
  perch: { landmark: "washing", local: [-2.0, 2.06, 0] },
  face: 0.7,
  scale: 0.55,
  // The flight (the maths is src/three/life/flight.js; node scripts/flightplot.mjs
  // draws it). Distances are metres from the perch, in the camera's frame:
  // "back" is toward the camera, "side" across the view.
  flight: {
    side: 1, // which side of the view it enters from (1 or -1)
    entryDistance: 5.5, // how far off to the side it first appears
    entryHeight: 3.0, // and how high above the perch
    entryBack: 1.0, // and how far toward the camera
    approachBack: 1.4, // in front of the perch, where the swoop bottoms out
    dip: 0.4, // below the perch at the bottom of the swoop
    sCross: 1.5, // how far the S weaves either side of the line in
    hoverHeight: 0.14, // above the post at the end of the approach, before the drop
    duration: 8.5, // seconds, the way in
    leaveDuration: 6.5, // seconds, the way out at dawn
    approachEase: 1.7, // >1: bleeds speed into the perch
    departEase: 1.5, // >1: accelerates away
    flapRate: 2.4, // wingbeats per second, full speed
    flapRateApproach: 0.65, // × the rate by the end of the approach
    // when the wings beat, as fractions of the flight [from, to, amplitude];
    // between bursts it glides
    flapBursts: [
      [0, 0.16, 1],
      [0.34, 0.46, 0.85],
      [0.66, 0.74, 0.7],
      [0.83, 1, 0.6],
    ],
    leaveBursts: [
      [0, 0.5, 1],
      [0.66, 0.8, 0.8],
    ],
    strokeAmp: 0.85, // radians of shoulder travel at full amplitude
    glideDihedral: 0.18, // wings held slightly up in a glide
    wristFold: 1.0, // how much the wrist folds on the upstroke
    rollGain: 0.55, // bank per radian/s of turn
    maxRoll: 0.95, // radians
    rollLead: 0.05, // fraction of the flight the roll leads the turn by
    flareFrom: 0.84, // fraction of the way in where the landing flare starts
    flarePitch: 0.75, // nose-up in the flare (radians)
    flareLift: 0.7, // wings up and…
    flareSweep: 0.55, // …forward to brake
    bodyBob: 0.035, // lift on each downstroke (m)
    bodyPitch: 0.09, // pitch oscillation with the stroke (radians)
    dropSeconds: 0.3, // the drop from the hover onto the post
    takeoffSeconds: 0.35, // the hop off the post at dawn
    // after touchdown the wings fold in stages: [seconds, spread] — half
    // fold, settle, tuck
    foldStages: [
      [0.35, 0.55],
      [0.35, 0.55],
      [0.4, 0.2],
      [0.6, 0],
    ],
  },
  blink: [2.5, 7], // seconds between blinks, min and max
  turn: [3, 9], // seconds between head turns, min and max
  turnRange: 1.2, // how far the head turns either way (radians)
};

// The arrival, once per page load: the camera starts low by the gate looking
// out along the jetty while the figure walks in from the end of the decking,
// through the gate and up the path to its home spot, and the camera eases
// out and up into the overview as it arrives. Skippable; any input cancels.
// node scripts/introplot.mjs draws the camera path and the walk together.
export const INTRO = {
  enabled: true,
  camera: {
    seconds: 7.8, // the whole camera move
    easeOut: 1.8, // >1: decelerates into the overview
    // keyframes on the way to the overview (which is added last): spherical
    // around a landmark, like the card cameras
    keys: [
      // Out over the water just beyond the jetty, low, looking back along it
      // at the figure. azimuth 0.70 IS the jetty's axis (the same bearing the
      // figure faces out along) — off it, the shot starts beside the washing
      // line instead of at the gate.
      { landmark: "gate", distance: 2.8, polar: 1.36, azimuth: 0.703, lookAt: [0.6, 0.55, 1.8] },
      // Rising and retreating on roughly that same bearing, so the whole move
      // reads as one pull-back rather than a swing around the island.
      { landmark: "gate", distance: 7.04, polar: 0.968, azimuth: 0.477, lookAt: [0, 0.5, 0.2] },
    ],
  },
  walk: {
    from: [5.63, 6.7], // out at the end of the jetty (the gate's own stand)
    face: -2.44, // facing back along the jetty toward the island
    delay: 0.4, // seconds after the camera starts before it sets off
    speed: 1.2, // m/s — a touch slower than its usual walk between places
  },
};

// Nature ambience (off by default; a click turns it on, and only then are
// the files fetched — see src/audio/ambience.js). Levels are linear gains;
// keep them low, it's a bed, not a feature.
//   Files, both from BigSoundBank (bigsoundbank.com), CC0 / public domain —
//   free for any use, no attribution required:
//     public/audio/sea-day.mp3        medium sea waves with Sandwich tern calls, 0:58
//     public/audio/night-insects.mp3  nocturnal insects and wind in a hedge, 2:31
export const AUDIO = {
  files: { sea: "audio/sea-day.mp3", night: "audio/night-insects.mp3" },
  master: 0.32, // everything, 0–1
  sea: { day: 1.0, night: 0.55 }, // the sea ducks at night so the insects sit on top
  insects: 0.9, // the night layer at full night
  crossfadeSeconds: 3, // how long the layers take to follow the lamps' curve
  // Each place's own synthesised track (src/audio/music.js), playing while
  // that place is open.
  music: {
    level: 0.9, // the soundtrack against the nature layers, 0–1 (before master)
    duck: 0.45, // the sea and insects drop to this while a track plays
    fadeSeconds: 1.6, // crossfade between tracks
  },
};

// The user's figure: where it waits when nothing is selected, and how it
// walks. Its colours are in content.js (`avatar`), because they're yours.
export const AVATAR = {
  height: 0.92,
  radius: 0.24, // how much room it keeps from everything while walking
  home: { at: [-1.3, 2.2], face: 0.9 },
  // A walk takes between minSeconds and maxSeconds whatever the distance;
  // the speed is scaled to fit, but never above maxSpeed (m/s).
  minSeconds: 0.7,
  maxSeconds: 1.9,
  maxSpeed: 4.0,
  // Steps per metre of walking, and how much the body bobs.
  stepsPerMetre: 1.6,
  bob: 0.03,
  // How fast the figure turns to face its direction of travel (per second).
  turn: 9,
};

// ---------------------------------------------------------------------
//  TIME OF DAY
//  The sun travels an arc from east (sunrise) to west (sunset). Everything
//  below is interpolated between these keyframes by the hour (0–24).
//  Colours are hex; intensities are three.js light units under ACES.
// ---------------------------------------------------------------------
export const DAY = {
  sunrise: 6.0,
  sunset: 18.5,
  // The day runs on its own: a full 24 hours takes this many real minutes.
  // It starts at the visitor's local time; the slider takes over when dragged.
  cycleMinutes: 1.5,
  // How far away the sun/moon sit (metres) and how the arc leans south.
  sunDistance: 40,
  sunArcTilt: 0.35, // 0 = straight overhead at noon; more = lower arc
  // The night lights fade in as the sun's elevation (radians) drops from
  // the first value to the second.
  lightsOn: [0.03, -0.12],
  keyframes: [
    { hour: 0.0, sun: "#8fa8ff", sunIntensity: 0.0, moonIntensity: 0.55, hemiSky: "#22355e", hemiGround: "#141d2a", hemiIntensity: 0.5, ambient: 0.18, fog: "#1a2a4a", exposure: 0.85, turbidity: 2, rayleigh: 0.2, night: 1 },
    { hour: 5.0, sun: "#8fa8ff", sunIntensity: 0.0, moonIntensity: 0.35, hemiSky: "#2b3f6a", hemiGround: "#1a2230", hemiIntensity: 0.55, ambient: 0.2, fog: "#2b3d63", exposure: 0.9, turbidity: 3, rayleigh: 0.4, night: 0.85 },
    { hour: 6.3, sun: "#ff9a5c", sunIntensity: 1.3, moonIntensity: 0.0, hemiSky: "#d9a8b8", hemiGround: "#b98e63", hemiIntensity: 0.8, ambient: 0.28, fog: "#f2c4b0", exposure: 1.05, turbidity: 6, rayleigh: 2.5, night: 0.15 },
    { hour: 8.0, sun: "#ffd7a8", sunIntensity: 2.2, moonIntensity: 0.0, hemiSky: "#bfe0ff", hemiGround: "#e2cfae", hemiIntensity: 1.0, ambient: 0.32, fog: "#eaf0f0", exposure: 1.12, turbidity: 4, rayleigh: 1.2, night: 0 },
    { hour: 12.5, sun: "#fff6e8", sunIntensity: 2.7, moonIntensity: 0.0, hemiSky: "#cfe6ff", hemiGround: "#e2cfae", hemiIntensity: 1.1, ambient: 0.35, fog: "#eef3f1", exposure: 1.15, turbidity: 3, rayleigh: 0.9, night: 0 },
    { hour: 16.5, sun: "#ffe0b0", sunIntensity: 2.4, moonIntensity: 0.0, hemiSky: "#c9dcf2", hemiGround: "#e0c9a2", hemiIntensity: 1.0, ambient: 0.32, fog: "#efe9df", exposure: 1.12, turbidity: 4, rayleigh: 1.4, night: 0 },
    { hour: 17.9, sun: "#ffb26b", sunIntensity: 2.0, moonIntensity: 0.0, hemiSky: "#e6b8a0", hemiGround: "#c9a26e", hemiIntensity: 0.85, ambient: 0.28, fog: "#f6cfa6", exposure: 1.08, turbidity: 8, rayleigh: 3.0, night: 0.05 },
    { hour: 19.0, sun: "#ff7a4d", sunIntensity: 0.9, moonIntensity: 0.0, hemiSky: "#a98ab8", hemiGround: "#6d5a5a", hemiIntensity: 0.7, ambient: 0.24, fog: "#c9a0b8", exposure: 1.0, turbidity: 10, rayleigh: 4.0, night: 0.45 },
    { hour: 20.3, sun: "#7c86c8", sunIntensity: 0.0, moonIntensity: 0.4, hemiSky: "#3b4a7a", hemiGround: "#2a2e3d", hemiIntensity: 0.55, ambient: 0.2, fog: "#2f3f66", exposure: 0.9, turbidity: 3, rayleigh: 0.5, night: 0.9 },
    { hour: 24.0, sun: "#8fa8ff", sunIntensity: 0.0, moonIntensity: 0.55, hemiSky: "#22355e", hemiGround: "#141d2a", hemiIntensity: 0.5, ambient: 0.18, fog: "#1a2a4a", exposure: 0.85, turbidity: 2, rayleigh: 0.2, night: 1 },
  ],
  // The night sky dome (never black), the moon and the stars.
  nightZenith: "#0f1f3d",
  nightHorizon: "#2b4a7a",
  moon: { color: "#dfe8ff", size: 1.6, glow: "#9fb4ff" },
  stars: { count: 1400, factor: 3.5 },
};

// Lights that come on in the evening: warm point lights with an emissive
// glow. `posts` are lantern posts along the path; the house windows, the
// workshop doorway, the arch lantern and the washing line add their own.
export const LAMPS = {
  color: "#ffcf8a",
  glow: "#ffd9a0",
  intensity: 1.6,
  distance: 4.5,
  posts: [{ at: [3.6, 1.9] }, { at: [-2.9, -2.9] }, { at: [0.3, -3.1] }, { at: [-3.3, 3.5] }],
  windows: { intensity: 1.4, distance: 4 },
  stringLights: { count: 11, color: "#fff0c2" },
};

// Bird nests up in a few of the trees: a woven cup of twigs seated in the
// crown of the canopy with a couple of eggs in it. Not every tree: `nests`
// says which (an index into ISLAND.trees), where round the crown it sits (`bearing`, radians from
// +z as map.mjs measures) and how high on the crown (`up`, radians above the
// crown's equator; about 0.55 seats it high enough that the opening clears the foliage). They sit in the branches, so they are not obstacles;
// node scripts/map.mjs checks each is seated in its crown, clear of the
// other blobs, off the overview camera's sightlines and away from the owl.
export const NESTS = {
  nests: [
    { tree: 1, bearing: 1.0, up: 0.55 }, // by the washing line, facing the overview camera
    { tree: 3, bearing: 0.35, up: 0.7 }, // between the shrine and the gate
    { tree: 6, bearing: 0.95, up: 0.55 }, // the left edge, by the workshop
    { tree: 4, bearing: 0.1, up: 0.55 }, // the right edge, by the shrine
  ],
  sink: 0.015, // metres the cup's floor sits inside the foliage; the opening and the outer rim stand clear
  // Sizes against AVATAR.height (0.92): a real nest is about a tenth of a
  // person, so a cup 10 cm across here.
  radius: 0.05,
  depth: 0.03,
  twigs: 44,
  strays: 6,
  eggs: 2,
  eggRadius: 0.011,
  eggColor: "#ece6d4",
};


// The water: a reflective, slightly rough surface with drifting ripples.
// `shore` is the paler band where the water meets the island (metres).
export const WATER = {
  color: "#7fb9cf",
  shoreColor: "#a9d6e2",
  shore: 1.6,
  roughness: 0.18,
  metalness: 0.05,
  envMapIntensity: 1.2,
  waveHeight: 0.05,
  rippleSpeed: 0.04,
};

// Post-processing per tier: "full" = desktop with a capable GPU,
// "lite" = desktop with a weak GPU, "off" = touch devices.
export const POST = {
  full: {
    ao: { intensity: 2.2, radius: 0.8, falloff: 1.0, quality: "medium" },
    tiltShift: { blur: 0.35, taper: 0.55, offset: 0.0 },
    bloom: { intensity: 0.55, threshold: 0.85, smoothing: 0.25 },
    vignette: { offset: 0.3, darkness: 0.55 },
    chroma: 0.0008,
  },
  lite: { ao: null, tiltShift: null, bloom: { intensity: 0.45, threshold: 0.9, smoothing: 0.25 }, vignette: { offset: 0.3, darkness: 0.5 }, chroma: 0 },
  off: { ao: null, tiltShift: null, bloom: null, vignette: null, chroma: 0 },
};

// Environment (image-based) lighting baked from the sky.
export const ENVIRONMENT = { intensity: 0.9, resolution: 64 };

// Tier detection: a desktop is "lite" if any of these hold.
export const TIERS = {
  maxCoresForLite: 4,
  minTextureSizeForFull: 8192,
  weakGpuPatterns: ["intel", "swiftshader", "llvmpipe", "mali-4", "adreno 5"],
};

// Idle life.
export const LIFE = {
  clouds: 6,
  cloudHeight: [4.5, 7.5],
  cloudRadius: [9, 15],
  cloudSpeed: 0.03, // radians per second around the island
  birdRadius: 8.5,
  birdHeight: 5.2,
  birdSpeed: 0.25,
  dawnBirds: [5.2, 8.5], // two extra birds between these hours
  treeSway: 0.03,
  windStrength: 0.14, // grass sway amplitude (radians)
  waterSpeed: 0.6,
  lineSway: 0.06, // washing line swing amplitude (radians)
};
