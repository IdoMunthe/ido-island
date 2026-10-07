// One clay person. Used for the family (static) and for the user's own
// figure (animated). Every limb pivots at its joint so a rig can pose it:
//   rig.root  — the whole figure (position / facing)
//   rig.body  — torso + arms + head (bob, lean, sway)
//   rig.head  — looks around
//   rig.armL / rig.armR — pivot at the shoulder (rotation.x swings, .z lifts sideways)
//   rig.legL / rig.legR — the thigh, pivot at the hip (negative x = forward)
//   rig.kneeL / rig.kneeR — the shin, pivot at the knee (positive x = bends back)
// `hair` is "short" (a cap) or "long" (a cap plus hair falling down the
// back and over the shoulders). Everyone wears trousers.
import { PALETTE } from "../island.config.js";

// Proportions shared with the rig code in Avatar.jsx.
export const FIGURE = { legs: 0.42, thigh: 0.5, body: 0.36, head: 0.12 };

export function FigureRig({ height = 0.9, skin = PALETTE.skin, hair = PALETTE.hair, hairStyle = "short", shirt = PALETTE.clothes[0], trousers = PALETTE.trousers, rig, position, rotation }) {
  const legs = height * FIGURE.legs;
  const thigh = legs * FIGURE.thigh;
  const shin = legs - thigh;
  const body = height * FIGURE.body;
  const head = height * FIGURE.head;
  const armLen = body * 0.92;
  const set = (key) => (el) => {
    if (rig) rig.current[key] = el;
  };
  return (
    <group ref={set("root")} position={position} rotation={rotation}>
      {/* legs: thigh pivots at the hip, shin at the knee */}
      {[-1, 1].map((sgn) => (
        <group key={sgn} ref={set(sgn < 0 ? "legL" : "legR")} position={[sgn * 0.07 * height, legs, 0]}>
          <mesh position={[0, -thigh / 2, 0]} castShadow>
            <cylinderGeometry args={[0.05 * height, 0.055 * height, thigh, 8]} />
            <meshStandardMaterial color={trousers} roughness={0.95} />
          </mesh>
          <mesh position={[0, -thigh, 0]} castShadow>
            <sphereGeometry args={[0.052 * height, 8, 6]} />
            <meshStandardMaterial color={trousers} roughness={0.95} />
          </mesh>
          <group ref={set(sgn < 0 ? "kneeL" : "kneeR")} position={[0, -thigh, 0]}>
            <mesh position={[0, -shin / 2, 0]} castShadow>
              <cylinderGeometry args={[0.045 * height, 0.05 * height, shin, 8]} />
              <meshStandardMaterial color={trousers} roughness={0.95} />
            </mesh>
            <mesh position={[0, -shin + 0.02, 0.03 * height]} castShadow>
              <boxGeometry args={[0.09 * height, 0.04 * height, 0.14 * height]} />
              <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
            </mesh>
          </group>
        </group>
      ))}
      {/* body: torso, arms and head move together */}
      <group ref={set("body")} position={[0, legs, 0]}>
        <mesh position={[0, body / 2, 0]} castShadow>
          <capsuleGeometry args={[0.135 * height, body - 0.27 * height, 4, 10]} />
          <meshStandardMaterial color={shirt} roughness={0.95} />
        </mesh>
        {[-1, 1].map((sgn) => (
          <group key={sgn} ref={set(sgn < 0 ? "armL" : "armR")} position={[sgn * 0.17 * height, body * 0.9, 0]} rotation={[0, 0, sgn * 0.12]}>
            <mesh position={[0, -armLen / 2, 0]} castShadow>
              <capsuleGeometry args={[0.038 * height, armLen - 0.076 * height, 3, 8]} />
              <meshStandardMaterial color={shirt} roughness={0.95} />
            </mesh>
            <mesh position={[0, -armLen, 0]} castShadow>
              <sphereGeometry args={[0.04 * height, 8, 6]} />
              <meshStandardMaterial color={skin} roughness={0.9} />
            </mesh>
          </group>
        ))}
        <group ref={set("head")} position={[0, body + head * 0.15, 0]}>
          <mesh position={[0, head * 0.85, 0]} castShadow>
            <sphereGeometry args={[head, 14, 12]} />
            <meshStandardMaterial color={skin} roughness={0.9} />
          </mesh>
          {/* cap of hair */}
          <mesh position={[0, head * 1.15, -head * 0.15]} castShadow>
            <sphereGeometry args={[head * 0.98, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={hair} roughness={0.95} />
          </mesh>
          {hairStyle === "long" ? (
            <>
              {/* hair falling down the back to below the shoulders */}
              <mesh position={[0, head * 0.25, -head * 0.62]} castShadow>
                <capsuleGeometry args={[head * 0.62, head * 1.6, 4, 10]} />
                <meshStandardMaterial color={hair} roughness={0.95} />
              </mesh>
              {/* two strands over the shoulders */}
              {[-1, 1].map((sgn) => (
                <mesh key={sgn} position={[sgn * head * 0.78, head * 0.35, head * 0.05]} rotation={[0, 0, sgn * -0.12]} castShadow>
                  <capsuleGeometry args={[head * 0.28, head * 1.3, 3, 8]} />
                  <meshStandardMaterial color={hair} roughness={0.95} />
                </mesh>
              ))}
            </>
          ) : null}
        </group>
      </group>
    </group>
  );
}
