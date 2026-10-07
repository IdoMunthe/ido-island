// Lantern posts along the path. They come on as the sun goes down.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PALETTE, LAMPS } from "../island.config.js";
import { useDay } from "../sky/DayNight.jsx";

export function Lanterns({ tier }) {
  const day = useDay();
  const lights = useRef([]);
  const glows = useRef([]);
  useFrame((state) => {
    const on = day?.current.lights ?? 0;
    const t = state.clock.elapsedTime;
    lights.current.forEach((l, i) => {
      if (l) l.intensity = LAMPS.intensity * on * (0.94 + Math.sin(t * 7 + i) * 0.03);
    });
    glows.current.forEach((m) => {
      if (m) m.material.emissiveIntensity = 1.8 * on;
    });
  });
  return (
    <>
      {LAMPS.posts.map((p, i) => (
        <group key={i} position={[p.at[0], 0, p.at[1]]}>
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.035, 1.3, 8]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <boxGeometry args={[0.16, 0.22, 0.16]} />
            <meshStandardMaterial color="#26312e" roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh ref={(el) => (glows.current[i] = el)} position={[0, 1.4, 0]}>
            <boxGeometry args={[0.12, 0.17, 0.12]} />
            <meshStandardMaterial color={LAMPS.glow} emissive={LAMPS.glow} emissiveIntensity={0} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.55, 0]} castShadow>
            <coneGeometry args={[0.15, 0.1, 4]} />
            <meshStandardMaterial color="#26312e" roughness={0.6} metalness={0.3} />
          </mesh>
          {tier !== "off" ? <pointLight ref={(el) => (lights.current[i] = el)} position={[0, 1.35, 0]} color={LAMPS.color} intensity={0} distance={LAMPS.distance} decay={2} /> : null}
        </group>
      ))}
    </>
  );
}
