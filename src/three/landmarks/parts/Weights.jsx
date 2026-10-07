// A barbell (bar, collars, two plates a side) and hex dumbbells.
import { PALETTE } from "../../island.config.js";

const IRON = { color: PALETTE.weight, roughness: 0.55, metalness: 0.35 };
const STEEL = { color: PALETTE.metal, roughness: 0.35, metalness: 0.7 };

export function Barbell({ position = [0, 0, 0], rotation = [0, 0, 0], length = 1.3 }) {
  const half = length / 2;
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, length, 12]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      {[-1, 1].map((sgn) => (
        <group key={sgn} position={[sgn * (half - 0.2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          {/* collar */}
          <mesh position={[0, sgn * -0.07, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.03, 12]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          {/* plates: big inside, small outside */}
          <mesh position={[0, 0, 0]} castShadow>
            <torusGeometry args={[0.1, 0.05, 10, 28]} />
            <meshStandardMaterial {...IRON} />
          </mesh>
          <mesh position={[0, sgn * 0.075, 0]} castShadow>
            <torusGeometry args={[0.075, 0.04, 10, 24]} />
            <meshStandardMaterial {...IRON} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Dumbbell({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.011, 0.011, 0.28, 10]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      {[-0.11, 0.11].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.055, 6]} />
          <meshStandardMaterial {...IRON} />
        </mesh>
      ))}
    </group>
  );
}
