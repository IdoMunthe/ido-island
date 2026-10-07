// Where I'm heading: a great vermilion torii stands where the path leaves
// the island — the gate to what comes next — and the path runs on through
// its opening as stepping stones over the water that shrink and fade
// toward the horizon. A stone lantern keeps it company and lights at
// dusk. The figure walks through and stands on the threshold looking
// out. Card: the next few years, and what I want from dating.
import { useContext, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Landmark } from "./Landmark.jsx";
import { PALETTE, LAMPS } from "../island.config.js";
import { IslandContext } from "../islandContext.js";
import { useDay } from "../sky/DayNight.jsx";

// torii proportions (metres) — the tallest thing on the island
const PILLAR_HALF = 0.95; // half the distance between the pillars (opening ≈ 1.75 m clear)
const PILLAR_H = 2.4;
const PILLAR_LEAN = 0.03; // radians, tops leaning inward
const NUKI_Y = 1.62;
const SHIMAKI_Y = 2.18;
const KASAGI_Y = 2.32;
const KASAGI_LEN = 3.1;
const VERMILION = "#c8452b";
const BLACK = "#1d1b1a";
const STONE = "#8f9490";

export function Heading({ config }) {
  const { isTouch } = useContext(IslandContext);
  const day = useDay();
  const glow = useRef();
  const light = useRef();
  useFrame(() => {
    const on = day?.current.lights ?? 0;
    if (glow.current) glow.current.material.emissiveIntensity = 1.8 * on;
    if (light.current) light.current.intensity = LAMPS.intensity * 0.8 * on;
  });
  // Stones run along local +x (the landmark is rotated to face the water),
  // starting just past the torii.
  const stones = useMemo(() => Array.from({ length: 11 }).map((_, i) => ({ x: 0.75 + i * 0.62, y: i === 0 ? 0.01 : -0.55 + Math.sin(i * 1.3) * 0.02, s: 1 - i * 0.05, o: 1 - i * 0.085 })), []);
  // the kasagi: seen from the side, flat underneath and curving up toward
  // both ends, extruded across the gate's depth
  const kasagi = useMemo(() => {
    const L = KASAGI_LEN / 2;
    const s = new THREE.Shape();
    s.moveTo(-L, 0);
    s.lineTo(L, 0);
    s.lineTo(L, 0.34);
    s.quadraticCurveTo(L * 0.55, 0.15, 0, 0.17);
    s.quadraticCurveTo(-L * 0.55, 0.15, -L, 0.34);
    s.lineTo(-L, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: false });
    g.translate(0, 0, -0.13);
    return g;
  }, []);
  const matte = (color) => <meshStandardMaterial color={color} roughness={0.92} />;
  return (
    <Landmark config={config} labelHeight={3.1} ringRadius={1.4}>
      {/* ---- the torii, its opening facing along the path (+x) ---- */}
      <group rotation={[0, Math.PI / 2, 0]}>
        {[-1, 1].map((sgn) => (
          <group key={sgn} position={[sgn * PILLAR_HALF, 0, 0]} rotation={[0, 0, -sgn * PILLAR_LEAN]}>
            {/* pillar, tapering toward the top, on a black base */}
            <mesh position={[0, PILLAR_H / 2, 0]} castShadow>
              <cylinderGeometry args={[0.085, 0.105, PILLAR_H, 14]} />
              {matte(VERMILION)}
            </mesh>
            <mesh position={[0, 0.14, 0]} castShadow>
              <cylinderGeometry args={[0.118, 0.128, 0.28, 14]} />
              {matte(BLACK)}
            </mesh>
            {/* a collar just under the beams */}
            <mesh position={[0, NUKI_Y - 0.18, 0]}>
              <cylinderGeometry args={[0.102, 0.102, 0.07, 14]} />
              {matte(BLACK)}
            </mesh>
          </group>
        ))}
        {/* nuki: the tie beam through the pillars, poking out either side */}
        <mesh position={[0, NUKI_Y, 0]} castShadow>
          <boxGeometry args={[PILLAR_HALF * 2 + 0.7, 0.15, 0.11]} />
          {matte(VERMILION)}
        </mesh>
        {[-1, 1].map((sgn) => (
          <mesh key={sgn} position={[sgn * (PILLAR_HALF + 0.35 - 0.05), NUKI_Y, 0]} castShadow>
            <boxGeometry args={[0.1, 0.156, 0.12]} />
            {matte(BLACK)}
          </mesh>
        ))}
        {/* gakuzuka: the strut between nuki and shimaki */}
        <mesh position={[0, (NUKI_Y + SHIMAKI_Y) / 2, 0]} castShadow>
          <boxGeometry args={[0.14, SHIMAKI_Y - NUKI_Y, 0.1]} />
          {matte(VERMILION)}
        </mesh>
        {/* shimaki: the beam directly under the kasagi */}
        <mesh position={[0, SHIMAKI_Y + 0.07, 0]} castShadow>
          <boxGeometry args={[KASAGI_LEN - 0.45, 0.15, 0.2]} />
          {matte(VERMILION)}
        </mesh>
        {/* kasagi: the top lintel, overhanging and curving up at the ends */}
        <mesh geometry={kasagi} position={[0, KASAGI_Y, 0]} castShadow>
          {matte(VERMILION)}
        </mesh>
        {[-1, 1].map((sgn) => (
          <mesh key={sgn} position={[sgn * (KASAGI_LEN / 2 - 0.04), KASAGI_Y + 0.17, 0]} castShadow>
            <boxGeometry args={[0.1, 0.37, 0.28]} />
            {matte(BLACK)}
          </mesh>
        ))}
      </group>

      {/* the stones over the water, on through the opening */}
      {stones.map((st, i) => (
        <mesh key={i} position={[st.x, st.y, 0]} scale={[st.s, 1, st.s]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.26, 0.12, 14]} />
          <meshStandardMaterial color={PALETTE.path} roughness={1} transparent={st.o < 1} opacity={Math.max(0.15, st.o)} />
        </mesh>
      ))}

      {/* a stone lantern beside the torii, lit at dusk */}
      <group position={[-0.45, 0, 0.85]}>
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.12, 0.34]} />
          {matte(STONE)}
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.075, 0.56, 10]} />
          {matte(STONE)}
        </mesh>
        <mesh position={[0, 0.71, 0]} castShadow>
          <boxGeometry args={[0.3, 0.06, 0.3]} />
          {matte(STONE)}
        </mesh>
        {/* the fire box: stone frame with a glowing window on each side */}
        <mesh position={[0, 0.87, 0]} castShadow>
          <boxGeometry args={[0.24, 0.26, 0.24]} />
          {matte(STONE)}
        </mesh>
        <mesh ref={glow} position={[0, 0.87, 0]}>
          <boxGeometry args={[0.26, 0.14, 0.26]} />
          <meshStandardMaterial color={LAMPS.glow} emissive={LAMPS.glow} emissiveIntensity={0} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.08, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.27, 0.18, 4]} />
          {matte(STONE)}
        </mesh>
        <mesh position={[0, 1.21, 0]} castShadow>
          <sphereGeometry args={[0.045, 10, 8]} />
          {matte(STONE)}
        </mesh>
        {!isTouch ? <pointLight ref={light} position={[0, 0.9, 0]} color={LAMPS.color} intensity={0} distance={LAMPS.distance} decay={2} /> : null}
      </group>
    </Landmark>
  );
}
