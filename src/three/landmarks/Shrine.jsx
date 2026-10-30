// The shrine: a small hokora on a stone base at the end of a short path of
// stepping stones, a pair of stone lanterns flanking the approach (lit at
// dusk), a tsukubai basin with a bamboo spout and a ladle, moss, a few
// weathered stones and a small maple. Beside it a rack of ema — one wooden
// votive plaque per value, its character(s) (`glyph` in content.js) painted
// on in a brushed serif, or its name in the hand-lettering face when no
// glyph is set — each swinging gently on its own cord. Pairs with the torii: vermilion
// accents, matte clay, restraint. Card: values.
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Landmark } from "./Landmark.jsx";
import { PALETTE, LAMPS, SHRINE } from "../island.config.js";
import { IslandContext } from "../islandContext.js";
import { useDay } from "../sky/DayNight.jsx";
import { content } from "../../content.js";
import { paintEma, toTexture, remap } from "../textures.js";
import { seeded } from "../springs.js";
import { painted } from "../loading.js";

const VERMILION = "#c8452b";
const BLACK = "#1d1b1a";
const STONE = "#8f9490";
const STONE_DARK = "#767b78";
const MOSS = "#6f8f5a";
const EMA = SHRINE.ema;

export function Shrine({ config }) {
  const { isTouch, tier } = useContext(IslandContext);
  const day = useDay();
  const values = useMemo(() => (content.values?.items || []).slice(0, 10), []);
  const rnd = useMemo(() => seeded(57), []);
  const glows = useRef([]);
  const lights = useRef([]);
  const plaques = useRef([]);
  const [labels, setLabels] = useState(null);
  useEffect(() => {
    const t = values.map((v) => toTexture(paintEma(v.glyph || v.name || "", isTouch ? 256 : 512, { glyph: !!v.glyph })));
    setLabels(t);
    painted();
    return () => t.forEach((x) => x.dispose());
  }, [values, isTouch]);
  // the plaque: a pentagon (a little house), as a body and a painted face
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = EMA.width / 2;
    const h = EMA.height;
    s.moveTo(-w, -h * 0.5);
    s.lineTo(w, -h * 0.5);
    s.lineTo(w, h * 0.32);
    s.lineTo(0, h * 0.62);
    s.lineTo(-w, h * 0.32);
    s.closePath();
    return s;
  }, []);
  const body = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false }), [shape]);
  const face = useMemo(() => new THREE.ShapeGeometry(shape), [shape]);
  // ShapeGeometry's UVs are the shape's own metres; stretch the texture over it
  const fixUv = (t) => {
    if (!t) return t;
    t.repeat.set(1 / EMA.width, 1 / (EMA.height * 1.12));
    t.offset.set(0.5, 0.5 / 1.12);
    return t;
  };
  const cols = Math.min(values.length, EMA.perRow);
  const rows = Math.ceil(values.length / EMA.perRow);
  const sway = useMemo(() => values.map((_, i) => ({ f: 0.7 + rnd() * 0.5, p: rnd() * Math.PI * 2, a: 0.6 + rnd() * 0.6 })), [values, rnd]);
  const stones = useMemo(() => Array.from({ length: 7 }).map(() => ({ x: (rnd() - 0.5) * 2.4, z: (rnd() - 0.5) * 2.4, s: 0.05 + rnd() * 0.07, r: rnd() * Math.PI })), [rnd]);

  useFrame((state, rawDt) => {
    const t = state.clock.elapsedTime;
    const on = day?.current.lights ?? 0;
    glows.current.forEach((m) => m && (m.material.emissiveIntensity = 1.8 * on));
    lights.current.forEach((l) => l && (l.intensity = LAMPS.intensity * 0.6 * on));
    // the ema swing on their cords, each to its own rhythm
    const amp = SHRINE.emaSway * (tier === "off" ? 0.6 : 1);
    plaques.current.forEach((g, i) => {
      if (!g) return;
      const s = sway[i];
      g.rotation.z = Math.sin(t * s.f + s.p) * amp * s.a;
      g.rotation.y = Math.sin(t * s.f * 0.6 + s.p * 1.7) * amp * 0.9;
      g.rotation.x = Math.sin(t * s.f * 0.35 + s.p) * amp * 0.25;
    });
  });

  const matte = (color) => <meshStandardMaterial color={color} roughness={0.92} />;
  const lantern = (x, z) => (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.26, 0.09, 0.26]} />
        {matte(STONE)}
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.42, 10]} />
        {matte(STONE)}
      </mesh>
      <mesh position={[0, 0.535, 0]} castShadow>
        <boxGeometry args={[0.22, 0.05, 0.22]} />
        {matte(STONE)}
      </mesh>
      <mesh position={[0, 0.66, 0]} castShadow>
        <boxGeometry args={[0.18, 0.2, 0.18]} />
        {matte(STONE)}
      </mesh>
      <mesh ref={(m) => m && !glows.current.includes(m) && glows.current.push(m)} position={[0, 0.66, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.2]} />
        <meshStandardMaterial color={LAMPS.glow} emissive={LAMPS.glow} emissiveIntensity={0} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.82, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.2, 0.13, 4]} />
        {matte(STONE)}
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        {matte(STONE)}
      </mesh>
      {!isTouch ? <pointLight ref={(l) => l && !lights.current.includes(l) && lights.current.push(l)} position={[0, 0.68, 0]} color={LAMPS.color} intensity={0} distance={3} decay={2} /> : null}
    </group>
  );

  return (
    <Landmark config={config} labelHeight={2.0} ringRadius={1.8}>
      {/* moss under everything, and a few weathered stones */}
      <mesh position={[0, 0.008, -0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.5, 28]} />
        <meshStandardMaterial color={MOSS} roughness={1} />
      </mesh>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, s.s * 0.6, s.z]} rotation={[0, s.r, 0]} scale={[1.4, 0.8, 1]} castShadow receiveShadow>
          <dodecahedronGeometry args={[s.s, 0]} />
          {matte(i % 2 ? STONE : STONE_DARK)}
        </mesh>
      ))}

      {/* ---- the hokora, on a stone base, facing +z (the approach) ---- */}
      <group position={[0, 0, SHRINE.hokoraZ]}>
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.2, 0.8]} />
          {matte(STONE)}
        </mesh>
        <mesh position={[0, 0.27, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.14, 0.62]} />
          {matte(STONE_DARK)}
        </mesh>
        {/* the little house */}
        <mesh position={[0, 0.66, -0.02]} castShadow>
          <boxGeometry args={[0.5, 0.64, 0.44]} />
          {matte(PALETTE.woodDark)}
        </mesh>
        {/* closed doors with a latch */}
        {[-0.115, 0.115].map((x, i) => (
          <mesh key={i} position={[x, 0.62, 0.205]} castShadow>
            <boxGeometry args={[0.2, 0.46, 0.02]} />
            {matte(PALETTE.wood)}
          </mesh>
        ))}
        <mesh position={[0, 0.62, 0.22]}>
          <boxGeometry args={[0.03, 0.06, 0.012]} />
          {matte(BLACK)}
        </mesh>
        {/* vermilion posts at the corners */}
        {[-0.24, 0.24].map((x, i) => (
          <mesh key={i} position={[x, 0.66, 0.2]} castShadow>
            <boxGeometry args={[0.04, 0.64, 0.04]} />
            {matte(VERMILION)}
          </mesh>
        ))}
        {/* offering ledge */}
        <mesh position={[0, 0.36, 0.3]} castShadow>
          <boxGeometry args={[0.56, 0.03, 0.18]} />
          {matte(PALETTE.wood)}
        </mesh>
        <mesh position={[0.12, 0.4, 0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.028, 0.05, 10]} />
          {matte(PALETTE.cream)}
        </mesh>
        {/* gabled roof: two leaves, eaves curving up, overhanging; ridge beam */}
        {[-1, 1].map((sgn) => (
          <group key={sgn} position={[0, 1.0, sgn * 0.13]} rotation={[sgn * -0.62, 0, 0]}>
            <mesh position={[0, 0, sgn * 0.19]} castShadow>
              <boxGeometry args={[0.78, 0.035, 0.42]} />
              {matte(PALETTE.woodDark)}
            </mesh>
            <mesh position={[0, 0.02, sgn * 0.4]} rotation={[sgn * 0.45, 0, 0]} castShadow>
              <boxGeometry args={[0.8, 0.03, 0.12]} />
              {matte(PALETTE.woodDark)}
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.07, 0]} castShadow>
          <boxGeometry args={[0.84, 0.05, 0.06]} />
          {matte(BLACK)}
        </mesh>
        {[-0.4, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 1.1, 0]} castShadow>
            <boxGeometry args={[0.05, 0.11, 0.08]} />
            {matte(VERMILION)}
          </mesh>
        ))}
      </group>

      {/* ---- the stepping stones up to it ---- */}
      {[0.35, 0.72, 1.08, 1.42].map((z, i) => (
        <mesh key={i} position={[(i % 2 ? 0.05 : -0.05), 0.02, z]} rotation={[0, i * 0.7, 0]} scale={[1.2, 1, 1]} receiveShadow>
          <cylinderGeometry args={[0.15, 0.16, 0.04, 9]} />
          {matte(i % 2 ? STONE : STONE_DARK)}
        </mesh>
      ))}

      {/* ---- lanterns flanking the approach ---- */}
      {lantern(-SHRINE.lanternX, SHRINE.lanternZ)}
      {lantern(SHRINE.lanternX, SHRINE.lanternZ)}

      {/* ---- tsukubai: a basin with a bamboo spout and a ladle across it ---- */}
      <group position={SHRINE.basin}>
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.17, 0.28, 12]} />
          {matte(STONE_DARK)}
        </mesh>
        {tier !== "off" ? (
          <mesh position={[0, 0.265, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 16]} />
            <meshStandardMaterial color="#6f8ea0" roughness={0.08} metalness={0.2} envMapIntensity={1.2} />
          </mesh>
        ) : null}
        <mesh position={[0.05, 0.42, -0.2]} rotation={[0.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
          {matte("#a8b07a")}
        </mesh>
        <mesh position={[0.12, 0.2, -0.28]} castShadow>
          <cylinderGeometry args={[0.022, 0.024, 0.5, 8]} />
          {matte("#a8b07a")}
        </mesh>
        <mesh position={[-0.02, 0.3, 0.02]} rotation={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.36, 0.014, 0.014]} />
          {matte("#c9b98a")}
        </mesh>
        <mesh position={[-0.16, 0.3, -0.06]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.035, 10]} />
          {matte("#c9b98a")}
        </mesh>
      </group>

      {/* ---- a small maple ---- */}
      <group position={SHRINE.maple}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.045, 0.7, 8]} />
          {matte(PALETTE.woodDark)}
        </mesh>
        {[
          [0, 0.85, 0, 0.32],
          [0.22, 0.72, 0.1, 0.22],
          [-0.2, 0.78, -0.08, 0.24],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1.15, 0.7, 1.15]} castShadow>
            <sphereGeometry args={[r, 10, 8]} />
            {matte(i % 2 ? "#b8402c" : "#c85a35")}
          </mesh>
        ))}
      </group>

      {/* ---- the ema rack: a frame of two posts and rails, plaques on cords ---- */}
      <group position={SHRINE.rack} rotation={[0, SHRINE.rackYaw, 0]}>
        {[-1, 1].map((sgn) => (
          <mesh key={sgn} position={[(sgn * (cols * (EMA.width + EMA.gap) + 0.2)) / 2, EMA.rackHeight / 2, 0]} castShadow>
            <boxGeometry args={[0.06, EMA.rackHeight, 0.06]} />
            {matte(PALETTE.woodDark)}
          </mesh>
        ))}
        {Array.from({ length: rows }).map((_, r) => (
          <mesh key={r} position={[0, EMA.rackHeight - r * EMA.rowGap, 0]} castShadow>
            <boxGeometry args={[cols * (EMA.width + EMA.gap) + 0.26, 0.04, 0.04]} />
            {matte(VERMILION)}
          </mesh>
        ))}
        {values.map((v, i) => {
          const r = Math.floor(i / EMA.perRow);
          const c = i % EMA.perRow;
          const inRow = r === rows - 1 ? values.length - r * EMA.perRow : EMA.perRow;
          const x = (c - (inRow - 1) / 2) * (EMA.width + EMA.gap);
          const y = EMA.rackHeight - r * EMA.rowGap;
          return (
            <group key={i} ref={(g) => (plaques.current[i] = g)} position={[x, y, 0.03]}>
              {/* the cord and the plaque hanging from it */}
              <mesh position={[0, -EMA.cord / 2, 0]}>
                <cylinderGeometry args={[0.004, 0.004, EMA.cord, 4]} />
                {matte(VERMILION)}
              </mesh>
              <group position={[0, -EMA.cord - EMA.height * 0.62, 0]}>
                <mesh geometry={body} position={[0, 0, -0.006]} castShadow>
                  {matte(PALETTE.wood)}
                </mesh>
                <mesh geometry={face} position={[0, 0, 0.0065]}>
                  <meshStandardMaterial map={fixUv(labels?.[i]) || null} color={labels ? "#ffffff" : PALETTE.wood} roughness={0.9} onUpdate={remap} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>
    </Landmark>
  );
}
