// The gate and the jetty: a garden gate at the shore, where a wooden
// bridge sets out over the water. The figure walks up, the gate swings
// open ahead of it (driven by where it is and whether it's walking, like
// the workshop door), it goes through and the gate shuts behind it; then
// it walks to the far edge of the decking and takes in the view. The
// welcome sign stands beside the gate, painted on both faces so it reads
// from the approach and from the overview. Card: person specification.
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Landmark } from "./Landmark.jsx";
import { PALETTE, LANDMARKS } from "../island.config.js";
import { IslandContext } from "../islandContext.js";
import { content } from "../../content.js";
import { paintWelcome, toTexture, remap } from "../textures.js";
import { spring, step, clampDt } from "../springs.js";
import { painted } from "../loading.js";

const LEN = 2.45; // jetty length from the gate (z 0) out to sea
const WIDTH = 1.1; // deck width; the figure is ~0.27 wide and walks the centre line
const GATE_Z = 0.15; // the gate, at the shore end
const SIGN = LANDMARKS.find((l) => l.id === "gate").sign;

export function Gate({ config }) {
  const { isTouch, bus } = useContext(IslandContext);
  const [sign, setSign] = useState(null);
  useEffect(() => {
    const text = content.spec.gateSign;
    if (!text) {
      painted();
      return;
    }
    const t = toTexture(paintWelcome(text, isTouch ? 1024 : 2048));
    setSign(t);
    painted();
    return () => t.dispose();
  }, [isTouch]);
  // The leaf: shut, and swung open (outward, along the left rail, clear of
  // the centre line) while the figure is walking within `door.radius` of
  // the gate — so it opens as the figure arrives, shuts once it has
  // stopped at the end of the jetty, opens again when it sets off back
  // and shuts once it is away. Stiff spring so it keeps up with the walk.
  const leaf = useRef();
  const swing = useMemo(() => spring(0, 160, 20), []);
  const doorAt = config.door?.at || [config.at[0], config.at[2]];
  useFrame((_, rawDt) => {
    const av = bus?.avatar;
    const near = av ? Math.hypot(av.x - doorAt[0], av.z - doorAt[1]) < (config.door?.radius ?? 1.4) : false;
    swing.t = av?.walking && near ? config.door?.open ?? -1.9 : 0;
    step(swing, clampDt(rawDt));
    if (leaf.current) leaf.current.rotation.y = swing.v;
  });
  return (
    <Landmark config={config} labelHeight={1.9} ringRadius={1.0}>
      {/* jetty: two beams and planks, raised clear of the ground (deck top
          at 0.13) on posts down into the water */}
      {[-WIDTH / 2 + 0.08, WIDTH / 2 - 0.08].map((x, i) => (
        <mesh key={i} position={[x, 0.05, LEN / 2]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.06, LEN]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
        </mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, 0.105, 0.15 + i * 0.3]} castShadow receiveShadow>
          <boxGeometry args={[WIDTH, 0.045, 0.24]} />
          <meshStandardMaterial color={i % 2 ? PALETTE.wood : PALETTE.woodDark} roughness={0.95} />
        </mesh>
      ))}
      {[0.9, 1.6, 2.3].flatMap((z) => [-WIDTH / 2 + 0.05, WIDTH / 2 - 0.05].map((x) => [x, z])).map(([x, z], i) => (
        <mesh key={i} position={[x, -0.4, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.95, 8]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
        </mesh>
      ))}
      {/* a low rail along both sides beyond the gate's swing */}
      {[-WIDTH / 2 + 0.03, WIDTH / 2 - 0.03].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.42, 1.475]} castShadow>
            <boxGeometry args={[0.035, 0.035, 1.85]} />
            <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
          </mesh>
          {[0.7, 1.5, 2.3].map((z, k) => (
            <mesh key={k} position={[x, 0.27, z]} castShadow>
              <boxGeometry args={[0.04, 0.3, 0.04]} />
              <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
      {/* gate posts at the shore end */}
      {[-WIDTH / 2, WIDTH / 2].map((x, i) => (
        <mesh key={i} position={[x, 0.5, GATE_Z]} castShadow>
          <boxGeometry args={[0.1, 1.0, 0.1]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
        </mesh>
      ))}
      {/* the leaf, hinged on the left post, swung by the figure */}
      <group ref={leaf} position={[-WIDTH / 2 + 0.05, 0, GATE_Z]}>
        {[0.0, 0.2, 0.4, 0.6, 0.8].map((x, i) => (
          <mesh key={i} position={[x + 0.1, 0.45, 0]} castShadow>
            <boxGeometry args={[0.07, i % 2 ? 0.7 : 0.8, 0.04]} />
            <meshStandardMaterial color={PALETTE.cream} roughness={0.95} />
          </mesh>
        ))}
        {[0.25, 0.65].map((y, i) => (
          <mesh key={i} position={[0.5, y, 0.025]} castShadow>
            <boxGeometry args={[0.96, 0.06, 0.03]} />
            <meshStandardMaterial color={PALETTE.wood} roughness={0.95} />
          </mesh>
        ))}
        <mesh position={[0.93, 0.5, 0.05]} castShadow>
          <boxGeometry args={[0.07, 0.09, 0.04]} />
          <meshStandardMaterial color={PALETTE.metal} roughness={0.4} metalness={0.5} />
        </mesh>
      </group>
      {/* the welcome sign on its own post beside the gate: a big board,
          leaning back a little to face the overview camera, painted on both
          faces so it reads from the approach as well */}
      <group position={SIGN.at} rotation={[0, SIGN.rotation, 0]}>
        <mesh position={[0, (SIGN.top - SIGN.height) / 2, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.038, SIGN.top - SIGN.height + 0.1, 8]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
        </mesh>
        <group position={[0, SIGN.top - SIGN.height / 2, 0]} rotation={[-SIGN.lean, 0, 0]}>
          <mesh rotation={[0, 0, -0.02]} castShadow>
            <boxGeometry args={[SIGN.width + 0.06, SIGN.height + 0.06, 0.035]} />
            <meshStandardMaterial color={PALETTE.wood} roughness={0.9} />
          </mesh>
          {(SIGN.twoSided ? [1, -1] : [1]).map((side) => (
            <mesh key={side} position={[0, 0, side * 0.019]} rotation={[0, side < 0 ? Math.PI : 0, -0.02 * side]}>
              <planeGeometry args={[SIGN.width, SIGN.height]} />
              <meshStandardMaterial map={sign} color={sign ? "#ffffff" : PALETTE.paper} roughness={0.85} onUpdate={remap} />
            </mesh>
          ))}
        </group>
      </group>
    </Landmark>
  );
}
