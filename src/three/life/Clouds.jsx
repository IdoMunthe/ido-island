// Soft clouds drifting slowly around the island.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PALETTE, LIFE } from "../island.config.js";
import { seeded } from "../springs.js";

export function Clouds() {
  const rnd = useMemo(() => seeded(17), []);
  const clouds = useMemo(
    () =>
      Array.from({ length: LIFE.clouds }).map((_, i) => ({
        angle: (i / LIFE.clouds) * Math.PI * 2 + rnd(),
        radius: LIFE.cloudRadius[0] + rnd() * (LIFE.cloudRadius[1] - LIFE.cloudRadius[0]),
        height: LIFE.cloudHeight[0] + rnd() * (LIFE.cloudHeight[1] - LIFE.cloudHeight[0]),
        scale: 0.8 + rnd() * 0.9,
        puffs: Array.from({ length: 4 + Math.floor(rnd() * 3) }).map(() => [(rnd() - 0.5) * 1.6, (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.8, 0.35 + rnd() * 0.45]),
      })),
    [rnd]
  );
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    clouds.forEach((c, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = c.angle + t * LIFE.cloudSpeed;
      g.position.set(Math.cos(a) * c.radius, c.height + Math.sin(t * 0.3 + i) * 0.15, Math.sin(a) * c.radius);
      g.rotation.y = -a;
    });
  });
  return (
    <>
      {clouds.map((c, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} scale={c.scale}>
          {c.puffs.map(([x, y, z, r], k) => (
            <mesh key={k} position={[x, y, z]} scale={[1, 0.62, 1]}>
              <sphereGeometry args={[r, 12, 9]} />
              <meshStandardMaterial color={PALETTE.cloud} roughness={1} transparent opacity={0.92} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
