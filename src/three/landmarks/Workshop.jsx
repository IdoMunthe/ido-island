// The workshop: a shed with a crate per role stacked outside, each
// stencilled with its dates. The figure goes in through the door (which
// swings open as it arrives and shuts behind it) and works at the bench
// under the big window in the wall that faces the overview camera, so the
// sawing and hammering can be seen from outside. A lamp over the door
// comes on at dusk; a bulb inside keeps the bench lit. Card: work and study.
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Landmark } from "./Landmark.jsx";
import { PALETTE, LAMPS } from "../island.config.js";
import { IslandContext } from "../islandContext.js";
import { useDay } from "../sky/DayNight.jsx";
import { content } from "../../content.js";
import { paintCrate, toTexture, remap } from "../textures.js";
import { spring, step, clampDt } from "../springs.js";
import { painted } from "../loading.js";

const WALL = 0.06; // wall thickness

export function Workshop({ config }) {
  const { isTouch, bus } = useContext(IslandContext);
  const day = useDay();
  const roles = useMemo(() => (content.experience?.roles || []).slice(0, 4), []);
  const [labels, setLabels] = useState(null);
  useEffect(() => {
    const t = roles.map((r, i) => toTexture(paintCrate(r.dates || "", i + 1, isTouch ? 256 : 512)));
    setLabels(t);
    painted();
    return () => t.forEach((x) => x.dispose());
  }, [roles, isTouch]);
  const positions = [
    [0.55, 0.28, 1.25],
    [1.15, 0.28, 1.05],
    [0.85, 0.84, 1.15],
    [1.55, 0.28, 1.5],
  ];
  const glow = useRef();
  const light = useRef();
  const door = useRef();
  // The door: shut, and swung open while the figure is walking within
  // `door.radius` of it — so it opens as the figure arrives, shuts once it
  // has stopped at the bench, opens again when it sets off, and shuts once
  // it is away. Stiff spring so it keeps up with the walk.
  const swing = useMemo(() => spring(0, 160, 20), []);
  const doorAt = config.door?.at || [config.at[0], config.at[2]];
  useFrame((_, rawDt) => {
    const on = day?.current.lights ?? 0;
    if (glow.current) glow.current.material.emissiveIntensity = 1.6 * on;
    if (light.current) light.current.intensity = LAMPS.intensity * 0.8 * on;
    const av = bus?.avatar;
    const near = av ? Math.hypot(av.x - doorAt[0], av.z - doorAt[1]) < (config.door?.radius ?? 1.2) : false;
    swing.t = av?.walking && near ? config.door?.open ?? -1.85 : 0;
    step(swing, clampDt(rawDt));
    if (door.current) door.current.rotation.y = swing.v;
  });
  return (
    <Landmark config={config} labelHeight={2.5} ringRadius={1.9}>
      {/* floor */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[1.9, 0.04, 1.4]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
      </mesh>
      {/* back wall (-z) and the blind side (+x) */}
      <Wall args={[1.9, 1.5, WALL]} position={[0, 0.75, -0.7 + WALL / 2]} />
      <Wall args={[WALL, 1.5, 1.4]} position={[0.95 - WALL / 2, 0.75, 0]} />
      {/* front wall (+z) around the door opening, x -0.35..0.13 */}
      <Wall args={[0.6, 1.5, WALL]} position={[-0.65, 0.75, 0.7 - WALL / 2]} />
      <Wall args={[0.82, 1.5, WALL]} position={[0.54, 0.75, 0.7 - WALL / 2]} />
      <Wall args={[0.48, 0.5, WALL]} position={[-0.11, 1.25, 0.7 - WALL / 2]} />
      {/* window wall (-x) around the opening, z -0.42..0.42, y 0.5..1.2 */}
      <Wall args={[WALL, 0.5, 1.4]} position={[-0.95 + WALL / 2, 0.25, 0]} />
      <Wall args={[WALL, 0.3, 1.4]} position={[-0.95 + WALL / 2, 1.35, 0]} />
      <Wall args={[WALL, 0.7, 0.28]} position={[-0.95 + WALL / 2, 0.85, -0.56]} />
      <Wall args={[WALL, 0.7, 0.28]} position={[-0.95 + WALL / 2, 0.85, 0.56]} />
      {/* window frame, sill and one mullion */}
      {[
        [[0.05, 0.05, 0.94], [-0.95, 0.5, 0]],
        [[0.05, 0.05, 0.94], [-0.95, 1.2, 0]],
        [[0.05, 0.75, 0.05], [-0.95, 0.85, -0.43]],
        [[0.05, 0.75, 0.05], [-0.95, 0.85, 0.43]],
        [[0.04, 0.7, 0.03], [-0.95, 0.85, 0]],
        [[0.12, 0.04, 1.0], [-0.98, 0.48, 0]],
      ].map(([args, pos], i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={args} />
          <meshStandardMaterial color={PALETTE.cream} roughness={0.9} />
        </mesh>
      ))}
      {/* roof slab */}
      <RoundedBox args={[2.2, 0.08, 1.7]} radius={0.015} position={[0, 1.6, 0]} rotation={[0, 0, 0.16]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.sage} roughness={0.9} />
      </RoundedBox>
      {/* battens on the front */}
      {[-0.6, 0.35, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.75, 0.705]}>
          <boxGeometry args={[0.03, 1.4, 0.01]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
        </mesh>
      ))}
      {/* the door, hinged on its left post, swung by the figure */}
      <group ref={door} position={[-0.35, 0, 0.71]}>
        <RoundedBox args={[0.48, 1.0, 0.04]} radius={0.01} position={[0.24, 0.5, 0]} castShadow>
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
        </RoundedBox>
        <mesh position={[0.42, 0.5, 0.035]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshStandardMaterial color={PALETTE.metal} roughness={0.4} metalness={0.5} />
        </mesh>
      </group>
      {/* lamp over the door */}
      <mesh position={[-0.11, 1.18, 0.78]} castShadow>
        <coneGeometry args={[0.12, 0.08, 12, 1, true]} />
        <meshStandardMaterial color="#26312e" roughness={0.6} metalness={0.3} side={2} />
      </mesh>
      <mesh ref={glow} position={[-0.11, 1.15, 0.78]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshStandardMaterial color={LAMPS.glow} emissive={LAMPS.glow} emissiveIntensity={0} roughness={0.5} />
      </mesh>
      {!isTouch ? <pointLight ref={light} position={[-0.11, 1.1, 0.95]} color={LAMPS.color} intensity={0} distance={LAMPS.distance} decay={2} /> : null}
      {/* inside: the bench under the window, a plank in the vice, saw and
          hammer, and a bulb on a cord over the bench */}
      <group>
        <mesh position={[-0.74, 0.62, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.05, 1.1]} />
          <meshStandardMaterial color={PALETTE.wood} roughness={0.95} />
        </mesh>
        {[-0.48, 0.48].map((z, i) => (
          <mesh key={i} position={[-0.74, 0.3, z]} castShadow>
            <boxGeometry args={[0.3, 0.6, 0.05]} />
            <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
          </mesh>
        ))}
        <mesh position={[-0.7, 0.67, 0.12]} rotation={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.14, 0.04, 0.7]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={0.9} />
        </mesh>
        {/* saw: blade and handle, lying across the plank */}
        <mesh position={[-0.66, 0.71, 0.05]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.4, 0.07, 0.008]} />
          <meshStandardMaterial color={PALETTE.metal} roughness={0.35} metalness={0.6} />
        </mesh>
        <mesh position={[-0.5, 0.72, 0.05]} castShadow>
          <boxGeometry args={[0.1, 0.09, 0.03]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
        </mesh>
        {/* hammer */}
        <mesh position={[-0.78, 0.66, -0.3]} rotation={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.24, 6]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
        </mesh>
        <mesh position={[-0.83, 0.67, -0.4]} rotation={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.07, 0.035, 0.035]} />
          <meshStandardMaterial color={PALETTE.metal} roughness={0.4} metalness={0.6} />
        </mesh>
        {/* a jar of pencils and a couple of tins on the shelf end */}
        <mesh position={[-0.8, 0.7, 0.45]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 10]} />
          <meshStandardMaterial color={PALETTE.terracotta} roughness={0.9} />
        </mesh>
        {/* bulb on a cord */}
        <mesh position={[-0.55, 1.35, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.3, 4]} />
          <meshStandardMaterial color="#26312e" roughness={0.8} />
        </mesh>
        <mesh position={[-0.55, 1.18, 0]}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshStandardMaterial color={LAMPS.glow} emissive={LAMPS.glow} emissiveIntensity={0.9} roughness={0.5} />
        </mesh>
        {!isTouch ? <pointLight position={[-0.5, 1.15, 0]} color={LAMPS.color} intensity={LAMPS.intensity * 0.55} distance={2.6} decay={2} /> : null}
      </group>
      {/* tools leaning on the outside wall */}
      <mesh position={[0.75, 0.55, 0.75]} rotation={[0.15, 0, 0.18]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.1, 8]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      <mesh position={[0.66, 1.08, 0.72]} rotation={[0.15, 0, 0.18]} castShadow>
        <boxGeometry args={[0.18, 0.09, 0.03]} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.5} />
      </mesh>
      {/* crates */}
      {roles.map((_, i) => (
        <group key={i} position={positions[i]} rotation={[0, (i % 2 ? -1 : 1) * 0.18, 0]}>
          <RoundedBox args={[0.56, 0.56, 0.56]} radius={0.02} smoothness={3} castShadow receiveShadow>
            <meshStandardMaterial color={i % 2 ? PALETTE.wood : PALETTE.cream} roughness={0.95} />
          </RoundedBox>
          {[-0.2, 0.2].map((y, k) => (
            <mesh key={k} position={[0, y, 0.281]}>
              <boxGeometry args={[0.56, 0.02, 0.005]} />
              <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
            </mesh>
          ))}
          <mesh position={[0, 0, 0.285]}>
            <planeGeometry args={[0.4, 0.26]} />
            <meshStandardMaterial map={labels?.[i] || null} color={labels ? "#ffffff" : PALETTE.paper} roughness={0.9} onUpdate={remap} />
          </mesh>
        </group>
      ))}
    </Landmark>
  );
}

// One wall piece: the shed's wood outside, lighter inside is a nicety we
// skip — one material, both faces, and the bulb inside does the rest.
function Wall({ args, position }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={PALETTE.wood} roughness={0.95} />
    </mesh>
  );
}
