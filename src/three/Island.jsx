// The island. One fullscreen canvas, continuous render loop (guaranteed
// first frame), free orbit by default, eased glides to whatever place is
// selected. A real sun runs the day; post-processing by device tier.
// Every number comes from island.config.js.
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { IslandContext } from "./islandContext.js";
import { content } from "../content.js";
import { PALETTE, RENDER, LIGHTS, CAMERA, LANDMARKS, TIERS, LIFE } from "./island.config.js";
import { waitForFonts } from "./textures.js";
import { loading, reportStage, expectPaint } from "./loading.js";
import { DayNight, useDay } from "./sky/DayNight.jsx";
import { intro, introStarted, skipIntro } from "./intro.js";
import { makeIntroCamera } from "./introPath.js";
import { Effects } from "./post/Effects.jsx";
import { IslandBase } from "./life/IslandBase.jsx";
import { Water } from "./life/Water.jsx";
import { Clouds } from "./life/Clouds.jsx";
import { Bird } from "./life/Bird.jsx";
import { Avatar } from "./life/Avatar.jsx";
import { Lanterns } from "./life/Lanterns.jsx";
import { Nests } from "./life/Nests.jsx";
import { Owl } from "./life/Owl.jsx";
import { House } from "./landmarks/House.jsx";
import { Family } from "./landmarks/Family.jsx";
import { Shrine } from "./landmarks/Shrine.jsx";
import { Workshop } from "./landmarks/Workshop.jsx";
import { Hobbies } from "./landmarks/Hobbies.jsx";
import { WashingLine } from "./landmarks/WashingLine.jsx";
import { Heading } from "./landmarks/Heading.jsx";
import { Gate } from "./landmarks/Gate.jsx";

// Every place must have its own, sane camera pose.
if (import.meta.env.DEV) {
  const seen = new Map();
  for (const lm of LANDMARKS) {
    const p = poseFor(lm.at, lm.camera, 1);
    const key = p.position.toArray().map((v) => v.toFixed(2)).join(",");
    if (seen.has(key)) console.warn(`[dating-cv] places "${seen.get(key)}" and "${lm.id}" share a camera pose`);
    seen.set(key, lm.id);
    if (p.position.y < 0.5) console.warn(`[dating-cv] camera pose for "${lm.id}" is below the ground`);
  }
}

const LANDMARK_COMPONENTS = { house: House, family: Family, shrine: Shrine, workshop: Workshop, hobbies: Hobbies, washing: WashingLine, heading: Heading, gate: Gate };

// Which tier this device gets: "off" on touch devices, "lite" on weak
// desktop GPUs, "full" otherwise. Logged once so it is never a mystery.
export function detectTier(isTouch) {
  if (isTouch) return "off";
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return "off";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).toLowerCase() : "";
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const cores = navigator.hardwareConcurrency || 8;
    const weak = TIERS.weakGpuPatterns.some((p) => renderer.includes(p));
    if (weak || cores <= TIERS.maxCoresForLite || maxTex < TIERS.minTextureSizeForFull) return "lite";
    return "full";
  } catch {
    return "lite";
  }
}

function useFontsReady(onReady) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    reportStage("fonts");
    // every character the ema paint, so the CJK face's pieces are fetched first
    const glyphs = (content.values?.items || []).map((v) => v.glyph || "").join("");
    waitForFonts(1800, glyphs).then(() => {
      if (!alive) return;
      // six painted textures: crates, gate sign, washing line photos,
      // guitar wood, racket strings, the ema
      expectPaint(6);
      reportStage("paint");
      setReady(true);
      onReady?.();
    });
    return () => {
      alive = false;
    };
  }, [onReady]);
  return ready;
}

// Marks the loading screen done once the first real frame has rendered.
function FirstFrame() {
  const done = useRef(false);
  const frames = useRef(0);
  useFrame(() => {
    if (done.current) return;
    frames.current++;
    // done once every texture has reported, or after a few seconds of
    // frames if a count was missed — never hang on the loading screen
    if (loading.stage === "frame" || frames.current > 240) {
      done.current = true;
      reportStage("done");
    }
  });
  return null;
}

export function Island({ isTouch, onReady, selected, onSelect, hovered, onHover, onOpenPhoto, tier: tierProp }) {
  const ready = useFontsReady(onReady);
  const tier = useMemo(() => tierProp || detectTier(isTouch), [tierProp, isTouch]);
  useEffect(() => {
    console.info(`[dating-cv] render tier: ${tier}`);
  }, [tier]);
  const [frameloop, setFrameloop] = useState("always");
  useEffect(() => {
    const onVis = () => setFrameloop(document.visibilityState === "hidden" ? "never" : "always");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  const initial = useMemo(() => poseFor([0, 0, 0], { ...CAMERA.overview, lookAt: CAMERA.overview.target }, 1), []);

  return (
    <Canvas
      id="island-root"
      className="no-print"
      dpr={tier === "off" ? RENDER.dprTouch : RENDER.dpr}
      shadows={tier === "off" ? false : "soft"}
      frameloop={frameloop}
      gl={{ antialias: tier !== "full", alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: RENDER.exposure, stencil: false }}
      camera={{ fov: CAMERA.fov, near: 0.1, far: 120, position: initial.position }}
      onCreated={({ gl }) => gl.setClearColor(PALETTE.sky, 1)}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, touchAction: "none" }}
    >
      {ready ? <Scene tier={tier} isTouch={isTouch} selected={selected} onSelect={onSelect} hovered={hovered} onHover={onHover} onOpenPhoto={onOpenPhoto} /> : null}
    </Canvas>
  );
}

function Scene({ tier, isTouch, selected, onSelect, hovered, onHover, onOpenPhoto }) {
  const bus = useMemo(() => ({}), []);
  const ctx = useMemo(() => ({ hovered, setHovered: onHover, selected, select: onSelect, isTouch, openPhoto: onOpenPhoto, bus, tier }), [hovered, onHover, selected, onSelect, isTouch, onOpenPhoto, bus, tier]);
  return (
    <IslandContext.Provider value={ctx}>
      <DayNight tier={tier}>
        <CameraRig selected={selected} />
        <IslandBase />
        <Water />
        <Clouds />
        <Bird />
        <DawnBirds />
        {tier !== "off" ? <ContactShadows position={[0, 0.02, 0]} opacity={LIGHTS.contact.opacity} blur={LIGHTS.contact.blur} far={LIGHTS.contact.far} scale={LIGHTS.contact.scale} resolution={LIGHTS.contact.resolution} frames={1} /> : null}
        {LANDMARKS.map((lm) => {
          const Cmp = LANDMARK_COMPONENTS[lm.id];
          return Cmp ? <Cmp key={lm.id} config={lm} /> : null;
        })}
        <Lanterns tier={tier} />
        <Nests />
        <Owl tier={tier} />
        <Avatar />
        <FirstFrame />
      </DayNight>
      <Effects tier={tier} />
    </IslandContext.Provider>
  );
}

// Two extra birds in the early morning.
function DawnBirds() {
  const day = useDay();
  const g = useRef();
  useFrame(() => {
    if (!g.current) return;
    const h = day?.current.hour ?? 12;
    g.current.visible = h >= LIFE.dawnBirds[0] && h <= LIFE.dawnBirds[1];
  });
  return (
    <group ref={g} visible={false}>
      <group position={[1.5, 0.6, -1]}>
        <Bird />
      </group>
      <group position={[-2, -0.4, 1.5]} rotation={[0, 1.2, 0]}>
        <Bird />
      </group>
    </group>
  );
}

// Spherical pose → { target, position } in world space.
export function poseFor(at, cam, push = 1) {
  const target = new THREE.Vector3(at[0] + cam.lookAt[0], at[1] + cam.lookAt[1], at[2] + cam.lookAt[2]);
  const d = cam.distance * push;
  const position = new THREE.Vector3(
    target.x + d * Math.sin(cam.polar) * Math.sin(cam.azimuth),
    target.y + d * Math.cos(cam.polar),
    target.z + d * Math.sin(cam.polar) * Math.cos(cam.azimuth)
  );
  return { target, position };
}

function CameraRig({ selected }) {
  const controls = useRef();
  const { camera, size } = useThree();
  const glide = useRef({ active: false, target: new THREE.Vector3(), position: new THREE.Vector3() });
  const shot = useRef({ cam: null, sample: {}, placed: false });

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const push = 1 + Math.max(0, 1.25 / aspect - 1) * CAMERA.portraitPush;
    const lm = selected ? LANDMARKS.find((l) => l.id === selected) : null;
    const pose = lm ? poseFor(lm.at, lm.camera, push) : poseFor([0, 0, 0], { ...CAMERA.overview, lookAt: CAMERA.overview.target }, push);
    glide.current.target.copy(pose.target);
    glide.current.position.copy(pose.position);
    glide.current.active = true;
    if (selected) skipIntro(); // a place click always wins over the arrival
  }, [selected, size]);

  useFrame((state, rawDt) => {
    const c = controls.current;
    if (!c) return;
    const g = glide.current;
    // ---- the arrival shot: hold the first frame at the gate until the
    // loading screen has faded, then play the camera path; any end of the
    // shot (finished or skipped) hands over to the usual glide
    const sh = shot.current;
    if (intro.status === "waiting" || intro.status === "playing") {
      if (!sh.cam) {
        const aspect = size.width / Math.max(1, size.height);
        sh.cam = makeIntroCamera(1 + Math.max(0, 1.25 / aspect - 1) * CAMERA.portraitPush);
      }
      if (intro.status === "waiting") {
        if (intro.loadingGone) introStarted(state.clock.elapsedTime);
        const s = sh.cam.sample(0, sh.sample);
        camera.position.copy(s.position);
        c.target.copy(s.target);
        c.enabled = false;
        g.active = false;
        return;
      }
      const t = state.clock.elapsedTime - intro.startedAt;
      const s = sh.cam.sample(t, sh.sample);
      camera.position.copy(s.position);
      c.target.copy(s.target);
      c.enabled = false;
      g.active = false;
      if (t >= sh.cam.duration) {
        // the camera has settled; the glide takes over (already there)
        c.enabled = true;
        g.target.copy(s.target);
        g.position.copy(s.position);
      }
      return;
    }
    if (!c.enabled) {
      // the shot just ended (skipped, or done): ease to where we should be
      c.enabled = true;
      g.active = true;
    }
    if (g.active) {
      const dt = Math.min(rawDt || 0.016, 1 / 30);
      const k = 1 - Math.exp(-dt * CAMERA.glide);
      c.target.lerp(g.target, k);
      camera.position.lerp(g.position, k);
      if (c.target.distanceToSquared(g.target) < 1e-5 && camera.position.distanceToSquared(g.position) < 1e-5) g.active = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={CAMERA.damping}
      rotateSpeed={CAMERA.rotateSpeed}
      zoomSpeed={CAMERA.zoomSpeed}
      minDistance={CAMERA.minDistance}
      maxDistance={CAMERA.maxDistance}
      minPolarAngle={CAMERA.minPolar}
      maxPolarAngle={CAMERA.maxPolar}
      target={CAMERA.overview.target}
      onStart={() => {
        glide.current.active = false;
      }}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
    />
  );
}
