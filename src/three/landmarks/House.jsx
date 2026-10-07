// The little house: rounded plaster walls, a gable roof, a chimney, window
// boxes, and the name on a sign by the door. In the evening the windows
// glow and a warm light spills out. Card: header + about + numbers + the
// honest paragraph.
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Landmark } from "./Landmark.jsx";
import { PALETTE, LAMPS } from "../island.config.js";
import { IslandContext } from "../islandContext.js";
import { useDay } from "../sky/DayNight.jsx";
import { content } from "../../content.js";
import { paintSign, paintNoise, toTexture, remap } from "../textures.js";
import { painted } from "../loading.js";

const W = 2.4;
const D = 1.9;
const H = 1.45;

export function House({ config }) {
  const { isTouch } = useContext(IslandContext);
  const day = useDay();
  const [sign, setSign] = useState(null);
  const wallMap = useMemo(() => toTexture(paintNoise("#ffffff", 0.08, 256, 75), { repeat: 2 }), []);
  useEffect(() => {
    const t = toTexture(paintSign(content.header.name, content.header.tagline, isTouch ? 512 : 1024));
    setSign(t);
    painted();
    return () => {
      t.dispose();
    };
  }, [isTouch]);
  useEffect(() => () => wallMap.dispose(), [wallMap]);

  const roof = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2 - 0.18, 0);
    shape.lineTo(W / 2 + 0.18, 0);
    shape.lineTo(0, 0.95);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: D + 0.36, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  }, []);

  const panes = useRef([]);
  const light = useRef();
  useFrame((state) => {
    const on = day?.current.lights ?? 0;
    const flicker = 0.92 + Math.sin(state.clock.elapsedTime * 5.3) * 0.04;
    panes.current.forEach((m) => {
      if (m) m.material.emissiveIntensity = 1.6 * on * flicker;
    });
    if (light.current) light.current.intensity = LAMPS.windows.intensity * on * flicker;
  });

  return (
    <Landmark config={config} labelHeight={3.0} ringRadius={2.0}>
      <RoundedBox args={[W, H, D]} radius={0.035} smoothness={4} position={[0, H / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.plaster} map={wallMap} roughness={0.95} />
      </RoundedBox>
      <mesh geometry={roof} position={[0, H - 0.02, -D / 2 - 0.18]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.roof} roughness={0.9} />
      </mesh>
      <RoundedBox args={[0.24, 0.5, 0.24]} radius={0.02} position={[0.7, H + 0.75, -0.3]} castShadow>
        <meshStandardMaterial color={PALETTE.terracotta} roughness={0.9} />
      </RoundedBox>
      {/* door + step */}
      <RoundedBox args={[0.44, 0.9, 0.04]} radius={0.012} position={[-0.45, 0.45, D / 2 + 0.01]} castShadow>
        <meshStandardMaterial color={PALETTE.terracotta} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.6, 0.06, 0.3]} radius={0.012} position={[-0.45, 0.03, D / 2 + 0.16]} receiveShadow>
        <meshStandardMaterial color={PALETTE.path} roughness={0.95} />
      </RoundedBox>
      {/* a bench beside the door (seat 19 cm up: the figure sits here) */}
      <group position={[0.32, 0, D / 2 + 0.2]}>
        <RoundedBox args={[0.6, 0.04, 0.26]} radius={0.01} position={[0, 0.19, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.wood} roughness={0.95} />
        </RoundedBox>
        {[-0.24, 0.24].map((x, i) => (
          <mesh key={i} position={[x, 0.085, 0]} castShadow>
            <boxGeometry args={[0.05, 0.17, 0.22]} />
            <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
          </mesh>
        ))}
      </group>
      <mesh position={[-0.3, 0.47, D / 2 + 0.035]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial color="#c9a46c" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* windows */}
      {[0, 1].map((i) => (
        <group key={i} position={i === 0 ? [0.45, 0.85, D / 2 + 0.01] : [-W / 2 - 0.01, 0.85, 0.2]} rotation={i === 0 ? [0, 0, 0] : [0, -Math.PI / 2, 0]}>
          <RoundedBox args={[0.5, 0.5, 0.03]} radius={0.008} castShadow>
            <meshStandardMaterial color={PALETTE.wood} roughness={0.85} />
          </RoundedBox>
          <mesh ref={(el) => (panes.current[i] = el)} position={[0, 0, 0.012]}>
            <boxGeometry args={[0.4, 0.4, 0.02]} />
            <meshStandardMaterial color={PALETTE.glass} emissive={LAMPS.glow} emissiveIntensity={0} roughness={0.25} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <boxGeometry args={[0.02, 0.4, 0.01]} />
            <meshStandardMaterial color={PALETTE.wood} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <boxGeometry args={[0.4, 0.02, 0.01]} />
            <meshStandardMaterial color={PALETTE.wood} roughness={0.85} />
          </mesh>
          <RoundedBox args={[0.5, 0.1, 0.16]} radius={0.012} position={[0, -0.3, 0.09]} castShadow>
            <meshStandardMaterial color={PALETTE.terracotta} roughness={0.9} />
          </RoundedBox>
          {[-0.15, 0, 0.15].map((fx, k) => (
            <mesh key={k} position={[fx, -0.2, 0.09]} castShadow>
              <sphereGeometry args={[0.055, 10, 8]} />
              <meshStandardMaterial color={PALETTE.flower[(k + i) % PALETTE.flower.length]} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      {/* the warm light inside, spilling out of the front window in the evening */}
      {!isTouch ? <pointLight ref={light} position={[0.45, 0.9, D / 2 + 0.3]} color={LAMPS.color} intensity={0} distance={LAMPS.windows.distance} decay={2} /> : null}
      {/* the sign by the door */}
      <group position={[0.55, 0, D / 2 + 0.45]} rotation={[0, -0.15, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.035, 1.0, 8]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
        </mesh>
        <RoundedBox args={[0.98, 0.5, 0.05]} radius={0.01} position={[0, 0.98, 0]} castShadow>
          <meshStandardMaterial color={PALETTE.wood} roughness={0.9} />
        </RoundedBox>
        <mesh position={[0, 0.98, 0.027]}>
          <planeGeometry args={[0.9, 0.42]} />
          <meshStandardMaterial map={sign} color={sign ? "#ffffff" : PALETTE.paper} roughness={0.9} onUpdate={remap} />
        </mesh>
      </group>
    </Landmark>
  );
}
