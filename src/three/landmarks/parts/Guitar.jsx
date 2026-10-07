// An acoustic guitar built from a real body outline (two bouts and a
// waist) extruded with rounded edges: sound hole with a rosette, neck with
// nut and frets, headstock with six tuners, bridge and six strings. Wood
// grain painted on, satin finish. Sits on a simple A-frame stand.
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { PALETTE } from "../../island.config.js";
import { paintWood, toTexture, remap } from "../../textures.js";
import { painted } from "../../loading.js";

const DEPTH = 0.085;

function bodyShape() {
  const s = new THREE.Shape();
  // right half, bottom → top, then mirrored back down the left
  s.moveTo(0, -0.24);
  s.bezierCurveTo(0.13, -0.24, 0.205, -0.17, 0.205, -0.06);
  s.bezierCurveTo(0.205, -0.005, 0.16, 0.02, 0.145, 0.05);
  s.bezierCurveTo(0.15, 0.1, 0.175, 0.13, 0.165, 0.175);
  s.bezierCurveTo(0.15, 0.235, 0.07, 0.25, 0, 0.25);
  s.bezierCurveTo(-0.07, 0.25, -0.15, 0.235, -0.165, 0.175);
  s.bezierCurveTo(-0.175, 0.13, -0.15, 0.1, -0.145, 0.05);
  s.bezierCurveTo(-0.16, 0.02, -0.205, -0.005, -0.205, -0.06);
  s.bezierCurveTo(-0.205, -0.17, -0.13, -0.24, 0, -0.24);
  const hole = new THREE.Path();
  hole.absarc(0, 0.035, 0.046, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

function headstockShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.028, 0);
  s.lineTo(0.028, 0);
  s.lineTo(0.036, 0.13);
  s.bezierCurveTo(0.03, 0.15, -0.03, 0.15, -0.036, 0.13);
  s.closePath();
  return s;
}

export function Guitar({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const [wood, setWood] = useState(null);
  useEffect(() => {
    const t = toTexture(paintWood(PALETTE.guitar));
    t.repeat.set(1.5, 1.5);
    setWood(t);
    painted();
    return () => t.dispose();
  }, []);
  const body = useMemo(() => new THREE.ExtrudeGeometry(bodyShape(), { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 28 }), []);
  const head = useMemo(() => new THREE.ExtrudeGeometry(headstockShape(), { depth: 0.014, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 }), []);
  const strings = useMemo(() => [-0.018, -0.011, -0.004, 0.004, 0.011, 0.018], []);
  const frets = useMemo(() => Array.from({ length: 14 }).map((_, i) => 0.245 + (i + 1) * 0.026), []);
  const top = DEPTH + 0.006;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* stand: two legs and a cradle */}
      <group position={[0, 0, 0.06]}>
        {[-0.14, 0.14].map((x, i) => (
          <mesh key={i} position={[x * 0.6, 0.2, -0.05]} rotation={[0.3, 0, x > 0 ? -0.25 : 0.25]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.42, 8]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 0.04, 0.02]} castShadow>
          <boxGeometry args={[0.22, 0.02, 0.06]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.4} />
        </mesh>
      </group>
      {/* the instrument, leaning back on the stand */}
      <group position={[0, 0.27, 0.02]} rotation={[-0.32, 0, 0.06]}>
        {/* body */}
        <mesh geometry={body} position={[0, 0, -DEPTH / 2]} castShadow receiveShadow>
          <meshStandardMaterial map={wood} color={wood ? "#ffffff" : PALETTE.guitar} roughness={0.42} metalness={0.02} onUpdate={remap} />
        </mesh>
        {/* dark inside, seen through the sound hole */}
        <mesh position={[0, 0.035, -DEPTH / 2]}>
          <cylinderGeometry args={[0.06, 0.06, DEPTH * 0.6, 20]} />
          <meshStandardMaterial color="#1a120c" roughness={1} />
        </mesh>
        {/* rosette */}
        <mesh position={[0, 0.035, top - 0.003]}>
          <torusGeometry args={[0.052, 0.004, 6, 32]} />
          <meshStandardMaterial color="#3b2416" roughness={0.6} />
        </mesh>
        {/* bridge with saddle */}
        <RoundedBox args={[0.13, 0.024, 0.01]} radius={0.003} position={[0, -0.075, top + 0.002]} castShadow>
          <meshStandardMaterial color="#2b1b12" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, -0.07, top + 0.009]}>
          <boxGeometry args={[0.1, 0.004, 0.004]} />
          <meshStandardMaterial color="#efe6d2" roughness={0.5} />
        </mesh>
        {/* neck + fretboard */}
        <RoundedBox args={[0.052, 0.42, 0.024]} radius={0.008} position={[0, 0.445, DEPTH / 2 - 0.012]} castShadow>
          <meshStandardMaterial color={PALETTE.wood} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.445, top - 0.002]} castShadow>
          <boxGeometry args={[0.05, 0.42, 0.006]} />
          <meshStandardMaterial color="#2b1b12" roughness={0.55} />
        </mesh>
        {frets.map((y, i) => (
          <mesh key={i} position={[0, y, top + 0.002]}>
            <boxGeometry args={[0.05, 0.0025, 0.002]} />
            <meshStandardMaterial color="#d8d3c8" roughness={0.3} metalness={0.6} />
          </mesh>
        ))}
        {/* nut */}
        <mesh position={[0, 0.655, top + 0.003]}>
          <boxGeometry args={[0.05, 0.005, 0.006]} />
          <meshStandardMaterial color="#efe6d2" roughness={0.5} />
        </mesh>
        {/* headstock, angled back, with tuners */}
        <group position={[0, 0.658, top - 0.012]} rotation={[0.22, 0, 0]}>
          <mesh geometry={head} castShadow>
            <meshStandardMaterial map={wood} color={wood ? "#ffffff" : PALETTE.guitar} roughness={0.42} onUpdate={remap} />
          </mesh>
          {[0.03, 0.065, 0.1].map((y, i) =>
            [-1, 1].map((sgn) => (
              <group key={`${i}${sgn}`} position={[sgn * 0.033, y, 0.007]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.004, 0.004, 0.02, 8]} />
                  <meshStandardMaterial color="#d8d3c8" roughness={0.3} metalness={0.7} />
                </mesh>
                <mesh position={[sgn * 0.014, 0, 0]}>
                  <boxGeometry args={[0.006, 0.014, 0.004]} />
                  <meshStandardMaterial color="#efe6d2" roughness={0.5} />
                </mesh>
              </group>
            ))
          )}
        </group>
        {/* strings */}
        {strings.map((x, i) => (
          <mesh key={i} position={[x * 1.15, 0.29, top + 0.008]} rotation={[0, 0, (x * 1.15 - x) / 0.73]}>
            <cylinderGeometry args={[0.0012, 0.0012, 0.73, 4]} />
            <meshStandardMaterial color="#e8e2d0" roughness={0.3} metalness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
