// A badminton racket: an elliptical tube frame, a painted string grid,
// a throat and a wrapped handle. And a shuttlecock.
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { PALETTE } from "../../island.config.js";
import { paintStrings, toTexture, remap } from "../../textures.js";
import { painted } from "../../loading.js";

export function Racket({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const frame = useMemo(() => {
    const pts = new THREE.EllipseCurve(0, 0, 0.1, 0.125, 0, Math.PI * 2, false, 0).getPoints(56).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const curve = new THREE.CatmullRomCurve3(pts, true);
    return new THREE.TubeGeometry(curve, 72, 0.006, 8, true);
  }, []);
  const [strings, setStrings] = useState(null);
  useEffect(() => {
    const t = toTexture(paintStrings());
    t.repeat.set(1.2, 1.5);
    setStrings(t);
    painted();
    return () => t.dispose();
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={frame} castShadow>
        <meshStandardMaterial color={PALETTE.pin} roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.1, 32]} />
        <meshStandardMaterial map={strings} transparent opacity={strings ? 1 : 0} alphaTest={0.2} side={THREE.DoubleSide} roughness={0.9} onUpdate={remap} />
      </mesh>
      {/* throat */}
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} position={[sgn * 0.03, -0.155, 0]} rotation={[0, 0, sgn * 0.35]}>
          <cylinderGeometry args={[0.005, 0.005, 0.08, 6]} />
          <meshStandardMaterial color={PALETTE.pin} roughness={0.45} metalness={0.3} />
        </mesh>
      ))}
      {/* shaft + grip */}
      <mesh position={[0, -0.27, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, -0.42, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.013, 0.12, 10]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Shuttle({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.035, 0]} castShadow>
        <coneGeometry args={[0.045, 0.08, 14, 1, true]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={1} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -0.01, 0]} castShadow>
        <sphereGeometry args={[0.02, 10, 8]} />
        <meshStandardMaterial color={PALETTE.pin} roughness={0.8} />
      </mesh>
    </group>
  );
}
