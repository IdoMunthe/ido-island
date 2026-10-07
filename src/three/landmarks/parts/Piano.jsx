// An upright piano: rounded case, lid, fallboard, music desk, three octaves
// of keys with the black keys grouped 2 then 3, three pedals, and a bench.
import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { PALETTE } from "../../island.config.js";

const WHITE_W = 0.026;
const OCTAVES = 3;
const BLACK_AFTER = [0, 1, 3, 4, 5]; // a black key after these white keys in an octave (C D · F G A ·)

export function Piano({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const whites = OCTAVES * 7;
  const width = whites * WHITE_W;
  const blacks = useMemo(() => {
    const out = [];
    for (let o = 0; o < OCTAVES; o++) for (const k of BLACK_AFTER) out.push((o * 7 + k + 1) * WHITE_W);
    return out;
  }, []);
  const caseW = width + 0.14;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* case */}
      <RoundedBox args={[caseW, 1.05, 0.36]} radius={0.012} smoothness={3} position={[0, 0.525, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.piano} roughness={0.38} metalness={0.05} />
      </RoundedBox>
      {/* lid */}
      <RoundedBox args={[caseW + 0.03, 0.035, 0.4]} radius={0.008} position={[0, 1.065, 0.01]} castShadow>
        <meshStandardMaterial color={PALETTE.piano} roughness={0.32} metalness={0.05} />
      </RoundedBox>
      {/* music desk: a thin panel tilted back above the fallboard */}
      <mesh position={[0, 0.86, 0.19]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.17, 0.012]} />
        <meshStandardMaterial color="#4a3a33" roughness={0.45} />
      </mesh>
      {/* keybed shelf */}
      <RoundedBox args={[caseW, 0.06, 0.2]} radius={0.006} position={[0, 0.66, 0.16]} castShadow>
        <meshStandardMaterial color={PALETTE.piano} roughness={0.38} />
      </RoundedBox>
      {/* fallboard, folded back above the keys */}
      <mesh position={[0, 0.755, 0.115]} rotation={[0.55, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.02, 0.09, 0.012]} />
        <meshStandardMaterial color={PALETTE.piano} roughness={0.35} />
      </mesh>
      {/* white keys */}
      {Array.from({ length: whites }).map((_, i) => (
        <mesh key={i} position={[-width / 2 + WHITE_W * (i + 0.5), 0.697, 0.19]} castShadow>
          <boxGeometry args={[WHITE_W - 0.002, 0.014, 0.14]} />
          <meshStandardMaterial color="#f4efe4" roughness={0.45} />
        </mesh>
      ))}
      {/* black keys */}
      {blacks.map((x, i) => (
        <mesh key={i} position={[-width / 2 + x, 0.709, 0.165]} castShadow>
          <boxGeometry args={[0.015, 0.014, 0.085]} />
          <meshStandardMaterial color="#1c1714" roughness={0.4} />
        </mesh>
      ))}
      {/* pedals */}
      <mesh position={[0, 0.08, 0.2]} castShadow>
        <boxGeometry args={[0.24, 0.06, 0.08]} />
        <meshStandardMaterial color={PALETTE.piano} roughness={0.4} />
      </mesh>
      {[-0.07, 0, 0.07].map((x, i) => (
        <mesh key={i} position={[x, 0.06, 0.27]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.025, 0.012, 0.08]} />
          <meshStandardMaterial color="#c9a46c" roughness={0.35} metalness={0.7} />
        </mesh>
      ))}
      {/* toe blocks */}
      {[-caseW / 2 + 0.05, caseW / 2 - 0.05].map((x, i) => (
        <mesh key={i} position={[x, 0.03, 0.14]} castShadow>
          <boxGeometry args={[0.08, 0.06, 0.1]} />
          <meshStandardMaterial color={PALETTE.piano} roughness={0.4} />
        </mesh>
      ))}
      {/* bench */}
      <group position={[0, 0, 0.52]}>
        <RoundedBox args={[0.42, 0.05, 0.24]} radius={0.008} position={[0, 0.32, 0]} castShadow>
          <meshStandardMaterial color={PALETTE.piano} roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.345, 0]}>
          <boxGeometry args={[0.36, 0.02, 0.18]} />
          <meshStandardMaterial color={PALETTE.terracotta} roughness={0.9} />
        </mesh>
        {[
          [-0.17, -0.09],
          [0.17, -0.09],
          [-0.17, 0.09],
          [0.17, 0.09],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.15, z]} castShadow>
            <boxGeometry args={[0.03, 0.3, 0.03]} />
            <meshStandardMaterial color={PALETTE.piano} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
