// A washing line of polaroids pegged between two posts, swaying in the
// breeze. Click one and it opens large in the page's photo viewer. Click
// to peg it back. Card: photographs (with turn-over buttons for keyboard).
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Landmark } from "./Landmark.jsx";
import { PALETTE, LIFE, LAMPS } from "../island.config.js";
import { useDay } from "../sky/DayNight.jsx";
import { IslandContext } from "../islandContext.js";
import { content } from "../../content.js";
import { placeholderImage } from "../../placeholders.js";
import { loadImage, paintPolaroidFront, toTexture, remap } from "../textures.js";
import { seeded } from "../springs.js";
import { painted } from "../loading.js";

const PW = 0.34;
const PH = PW * 1.2;
const LINE_Y = 1.7;
const HALF = 2.0; // half the distance between the posts
const SAG = 0.22;

export function WashingLine({ config }) {
  const { isTouch, openPhoto, selected, select } = useContext(IslandContext);
  const items = useMemo(() => (content.photos?.items || []).slice(0, 8), []);
  const textures = useTextures(items, isTouch ? 320 : 384);
  const line = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-HALF, LINE_Y, 0), new THREE.Vector3(0, LINE_Y - SAG, 0), new THREE.Vector3(HALF, LINE_Y, 0));
    return new THREE.TubeGeometry(curve, 24, 0.006, 6, false);
  }, []);
  const lightLine = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-HALF, LINE_Y + 0.22, 0), new THREE.Vector3(0, LINE_Y + 0.22 - SAG * 0.8, 0), new THREE.Vector3(HALF, LINE_Y + 0.22, 0));
    return new THREE.TubeGeometry(curve, 24, 0.004, 5, false);
  }, []);
  const n = items.length;
  const day = useDay();
  const bulbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: LAMPS.stringLights.color, emissive: LAMPS.stringLights.color, emissiveIntensity: 0, roughness: 0.5 }), []);
  useEffect(() => () => bulbMat.dispose(), [bulbMat]);
  const bulbSpots = useMemo(() => Array.from({ length: LAMPS.stringLights.count }).map((_, i) => { const x = -HALF + ((i + 0.5) / LAMPS.stringLights.count) * HALF * 2; return [x, LINE_Y + 0.22 - SAG * 0.4 * (1 - (x / HALF) ** 2) - 0.05, 0]; }), []);
  useFrame((state) => {
    const on = day?.current.lights ?? 0;
    bulbMat.emissiveIntensity = (1.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2) * on;
  });
  return (
    <Landmark config={config} labelHeight={2.2} ringRadius={1.7}>
      {/* a string of little lights above the line */}
      <mesh geometry={lightLine}>
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
      {bulbSpots.map((p, i) => (
        <mesh key={i} position={p} material={bulbMat}>
          <sphereGeometry args={[0.028, 8, 6]} />
        </mesh>
      ))}
      {[-HALF, HALF].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 2.0, 10]} />
            <meshStandardMaterial color={PALETTE.post} roughness={0.95} />
          </mesh>
          <mesh position={[0, 2.02, 0]} castShadow>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color={PALETTE.terracotta} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh geometry={line} castShadow>
        <meshStandardMaterial color={PALETTE.cream} roughness={0.9} />
      </mesh>
      {items.map((it, i) => {
        // evenly along the line, then nudged: a hand pegged these, not a grid
        const j = seeded(i * 7 + 3);
        const x = (i - (n - 1) / 2) * ((HALF * 2 - 0.5) / Math.max(1, n - 1)) * (n > 1 ? 1 : 0) + (j() - 0.5) * 0.07;
        const sag = LINE_Y - SAG * 0.55 * (1 - (x / HALF) ** 2) + (j() - 0.5) * 0.04;
        const tilt = (j() - 0.5) * 0.14;
        return (
          <Polaroid
            key={i}
            index={i}
            x={x}
            y={sag}
            tilt={tilt}
            tex={textures?.[i]}
            onOpen={() => (selected === "washing" ? openPhoto?.(i) : select("washing"))}
            interactive
          />
        );
      })}
    </Landmark>
  );
}

function Polaroid({ index, x, y, tilt = 0, tex, onOpen, interactive }) {
  const g = useRef();
  const lift = useRef(0);
  const [hover, setHover] = useState(false);
  useFrame((state, rawDt) => {
    if (!g.current) return;
    const dt = Math.min(rawDt || 0.016, 1 / 30);
    const t = state.clock.elapsedTime;
    lift.current += ((hover ? 1 : 0) - lift.current) * Math.min(1, dt * 10);
    const sway = Math.sin(t * 1.3 + index * 1.7) * LIFE.lineSway + Math.sin(t * 0.4 + index) * 0.01;
    g.current.position.set(x, y, lift.current * 0.05);
    g.current.rotation.set(-lift.current * 0.12, 0, tilt + sway);
  });
  return (
    <group ref={g} position={[x, y, 0]}>
      {/* peg */}
      <mesh position={[0, -0.02, 0.008]} castShadow>
        <boxGeometry args={[0.03, 0.08, 0.02]} />
        <meshStandardMaterial color={PALETTE.wood} roughness={0.95} />
      </mesh>
      {/* the photo hangs below the line; it leans toward you on hover */}
      <mesh
        position={[0, -PH / 2 - 0.04, 0]}
        castShadow
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          onOpen();
        }}
        onPointerOver={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      >
        <boxGeometry args={[PW, PH, 0.004]} />
        <meshStandardMaterial attach="material-0" color="#ffffff" roughness={0.9} />
        <meshStandardMaterial attach="material-1" color="#ffffff" roughness={0.9} />
        <meshStandardMaterial attach="material-2" color="#ffffff" roughness={0.9} />
        <meshStandardMaterial attach="material-3" color="#ffffff" roughness={0.9} />
        <meshStandardMaterial attach="material-4" color="#ffffff" map={tex?.front || null} roughness={0.55} onUpdate={remap} />
        <meshStandardMaterial attach="material-5" color="#efece4" roughness={0.85} />
      </mesh>
    </group>
  );
}

function useTextures(items, size) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    let alive = true;
    let built = [];
    (async () => {
      const out = [];
      for (const it of items) {
        const img = await loadImage(it.src || placeholderImage("square", "your photo"));
        if (!alive) return;
        out.push({ front: toTexture(paintPolaroidFront(img, it.caption, size)) });
      }
      built = out;
      if (alive) {
        setTex(out);
        painted();
      }
    })();
    return () => {
      alive = false;
      built.forEach((t) => {
        t.front.dispose();
      });
    };
  }, [items, size]);
  return tex;
}
