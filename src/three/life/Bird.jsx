// One small bird circling the island, flapping.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PALETTE, LIFE } from "../island.config.js";

export function Bird() {
  const g = useRef();
  const l = useRef();
  const r = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = t * LIFE.birdSpeed;
    if (g.current) {
      g.current.position.set(Math.cos(a) * LIFE.birdRadius, LIFE.birdHeight + Math.sin(t * 1.7) * 0.25, Math.sin(a) * LIFE.birdRadius);
      g.current.rotation.y = -a - Math.PI / 2;
      g.current.rotation.z = 0.2;
    }
    const flap = Math.sin(t * 9) * 0.6;
    if (l.current) l.current.rotation.z = flap;
    if (r.current) r.current.rotation.z = -flap;
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color={PALETTE.bird} roughness={1} />
      </mesh>
      <group ref={l} position={[-0.04, 0, 0]}>
        <mesh position={[-0.14, 0, 0]}>
          <boxGeometry args={[0.28, 0.01, 0.08]} />
          <meshStandardMaterial color={PALETTE.bird} roughness={1} />
        </mesh>
      </group>
      <group ref={r} position={[0.04, 0, 0]}>
        <mesh position={[0.14, 0, 0]}>
          <boxGeometry args={[0.28, 0.01, 0.08]} />
          <meshStandardMaterial color={PALETTE.bird} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
