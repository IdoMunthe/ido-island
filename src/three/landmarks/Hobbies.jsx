// Hobbies: a music corner (guitar on a stand, upright piano), a badminton
// court (net, racket, shuttle) and an outdoor gym (bench, rack, barbell,
// dumbbells). One card covers all three.
import { RoundedBox } from "@react-three/drei";
import { Landmark } from "./Landmark.jsx";
import { PALETTE } from "../island.config.js";
import { Guitar } from "./parts/Guitar.jsx";
import { Piano } from "./parts/Piano.jsx";
import { Racket, Shuttle } from "./parts/Racket.jsx";
import { Barbell, Dumbbell } from "./parts/Weights.jsx";

export function Hobbies({ config }) {
  return (
    <Landmark config={config} labelHeight={1.8} ringRadius={2.3}>
      {/* ---- badminton court, centre ---- */}
      <group>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.0, 1.0]} />
          <meshStandardMaterial color={PALETTE.court} roughness={1} />
        </mesh>
        {[
          [0, 0.49, 2.0, 0.03],
          [0, -0.49, 2.0, 0.03],
          [-0.985, 0, 0.03, 1.0],
          [0.985, 0, 0.03, 1.0],
          [-0.5, 0, 0.03, 1.0],
          [0.5, 0, 0.03, 1.0],
        ].map(([x, z, w, d], i) => (
          <mesh key={i} position={[x, 0.026, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial color={PALETTE.courtLine} roughness={1} />
          </mesh>
        ))}
        {[-0.55, 0.55].map((z, i) => (
          <mesh key={i} position={[0, 0.3, z]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.02, 0.28, 1.1]} />
          <meshStandardMaterial color={PALETTE.net} roughness={1} transparent opacity={0.72} />
        </mesh>
        <mesh position={[0, 0.565, 0]}>
          <boxGeometry args={[0.03, 0.03, 1.12]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={1} />
        </mesh>
        <Racket position={[0.62, 0.03, -0.22]} rotation={[-Math.PI / 2, 0, 0.7]} scale={1.1} />
        <Shuttle position={[0.35, 0.02, 0.28]} rotation={[0.5, 0, 0.35]} />
      </group>

      {/* ---- music corner, left ---- */}
      <group position={[-1.55, 0, 0.1]} rotation={[0, 0.5, 0]}>
        <RoundedBox args={[1.4, 0.06, 1.2]} radius={0.012} position={[0, 0.03, 0]} receiveShadow castShadow>
          <meshStandardMaterial color={PALETTE.wood} roughness={0.95} />
        </RoundedBox>
        <Piano position={[-0.3, 0.06, -0.3]} scale={0.95} />
        <Guitar position={[0.42, 0.06, 0.12]} rotation={[0, -0.5, 0]} scale={0.95} />
      </group>

      {/* ---- outdoor gym, south ---- */}
      <group position={[0.2, 0, 1.35]}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.4, 1.2]} />
          <meshStandardMaterial color={PALETTE.path} roughness={1} />
        </mesh>
        {/* bench */}
        <RoundedBox args={[0.34, 0.08, 1.0]} radius={0.015} position={[0, 0.3, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.pin} roughness={0.7} />
        </RoundedBox>
        {[-0.4, 0.4].map((z, i) => (
          <mesh key={i} position={[0, 0.13, z]} castShadow>
            <boxGeometry args={[0.3, 0.26, 0.05]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        {/* rack with the barbell resting on it */}
        {[-0.42, 0.42].map((x, i) => (
          <mesh key={i} position={[x, 0.45, -0.42]} castShadow>
            <boxGeometry args={[0.05, 0.9, 0.05]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        {[-0.42, 0.42].map((x, i) => (
          <mesh key={i} position={[x, 0.88, -0.42]} castShadow>
            <boxGeometry args={[0.07, 0.04, 0.09]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        <Barbell position={[0, 0.92, -0.42]} />
        <Dumbbell position={[0.5, 0.06, 0.3]} rotation={[0, 0.3, 0]} />
        <Dumbbell position={[0.5, 0.06, 0.48]} rotation={[0, -0.2, 0]} />
      </group>
    </Landmark>
  );
}
