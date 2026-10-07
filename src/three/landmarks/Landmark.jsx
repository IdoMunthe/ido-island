// A clickable place on the island: hover highlights it and shows its name,
// click glides the camera to it and opens its card. The HTML row of places
// does the same for keyboard users.
import { useContext, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { content } from "../../content.js";
import { IslandContext } from "../islandContext.js";
import { PALETTE } from "../island.config.js";

export function Landmark({ config, labelHeight = 1.6, ringRadius = 1.2, children }) {
  const { hovered, setHovered, selected, select } = useContext(IslandContext);
  const ring = useRef();
  const glow = useRef(0);
  const id = config.id;
  const isHover = hovered === id;
  const isSel = selected === id;
  const name = content.ui.island.places[id] || id;

  useEffect(() => () => {
    if (document.body.style.cursor === "pointer") document.body.style.cursor = "";
  }, []);

  useFrame((_, dt) => {
    const target = isHover || isSel ? 1 : 0;
    glow.current += (target - glow.current) * Math.min(1, dt * 8);
    if (ring.current) {
      ring.current.material.opacity = 0.55 * glow.current;
      const s = 1 + 0.06 * Math.sin(performance.now() / 350) * glow.current;
      ring.current.scale.setScalar(s);
    }
  });

  return (
    <group
      position={config.at}
      rotation={[0, config.rotation || 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (hovered === id) setHovered(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        select(isSel ? null : id);
      }}
    >
      {children}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[ringRadius * 0.86, ringRadius, 48]} />
        <meshBasicMaterial color={PALETTE.highlight} transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, labelHeight, 0]} center distanceFactor={9} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <span className={`place-label ${isHover || isSel ? "is-active" : ""}`}>{name}</span>
      </Html>
    </group>
  );
}
