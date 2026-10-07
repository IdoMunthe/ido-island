// The island itself: a clay body, a grass top with a soft edge and a
// painted grass texture (patches and variation carry the grass — nothing
// scattered on the ground), a sand path and trees that sway. Colours
// follow the live palette (dev panel).
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE, ISLAND, LIFE } from "../island.config.js";
import { seeded } from "../springs.js";
import { paintGrass, paintNoise, toTexture } from "../textures.js";

const R = ISLAND.radius;

export function IslandBase() {
  const body = useMemo(() => {
    const pts = [
      new THREE.Vector2(R * 1.0, 0),
      new THREE.Vector2(R * 0.99, -0.25),
      new THREE.Vector2(R * 0.93, -0.75),
      new THREE.Vector2(R * 0.78, -1.35),
      new THREE.Vector2(R * 0.5, -ISLAND.depth * 0.9),
      new THREE.Vector2(R * 0.18, -ISLAND.depth),
      new THREE.Vector2(0, -ISLAND.depth),
    ];
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  const top = useMemo(() => {
    const g = new THREE.CircleGeometry(R * 1.005, 96);
    const pos = g.attributes.position;
    const rnd = seeded(3);
    for (let i = 1; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const d = Math.hypot(x, y);
      if (d > R * 0.9) {
        const k = 1 + (rnd() - 0.5) * 0.035;
        pos.setXY(i, x * k, y * k);
      }
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const grassMap = useMemo(() => toTexture(paintGrass(), { repeat: 5 }), []);
  const cliffMap = useMemo(() => toTexture(paintNoise("#ffffff", 0.1, 256, 73), { repeat: 4 }), []);
  useEffect(
    () => () => {
      grassMap.dispose();
      cliffMap.dispose();
    },
    [grassMap, cliffMap]
  );
  return (
    <group>
      <mesh geometry={body} receiveShadow castShadow>
        <meshStandardMaterial color={PALETTE.cliff} map={cliffMap} roughness={1} />
      </mesh>
      <mesh geometry={top} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <meshStandardMaterial color={PALETTE.grass} map={grassMap} roughness={1} />
      </mesh>
      <Path />
      <Trees />
    </group>
  );
}

function Path() {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const spots = useMemo(() => {
    const out = [];
    const lines = [ISLAND.pathClosed ? [...ISLAND.path, ISLAND.path[0]] : ISLAND.path, ...(ISLAND.spurs || [])];
    for (const pts of lines)
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i];
        const [bx, bz] = pts[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const n = Math.max(2, Math.ceil(len / 0.28));
        for (let k = i === 0 ? 0 : 1; k <= n; k++) {
          const t = k / n;
          out.push([ax + (bx - ax) * t, az + (bz - az) * t, 0.85 + Math.sin(k * 1.7 + i) * 0.15]);
        }
      }
    return out;
  }, []);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    spots.forEach(([x, z, s], i) => {
      dummy.position.set(x, 0.02, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(s, s, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [spots, dummy]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, spots.length]} receiveShadow>
      <circleGeometry args={[ISLAND.pathWidth / 2, 14]} />
      <meshStandardMaterial color={PALETTE.path} roughness={1} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </instancedMesh>
  );
}

function Trees() {
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (g) g.rotation.z = Math.sin(t * 0.8 + i * 1.3) * LIFE.treeSway;
    });
  });
  return (
    <>
      {ISLAND.trees.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 0.9, 8]} />
            <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
          </mesh>
          <group ref={(el) => (refs.current[i] = el)} position={[0, 0.9, 0]}>
            <mesh position={[0, 0.35, 0]} castShadow>
              <sphereGeometry args={[0.55, 14, 10]} />
              <meshStandardMaterial color={i % 2 ? PALETTE.leaf : PALETTE.sage} roughness={1} />
            </mesh>
            <mesh position={[0.3, 0.6, 0.15]} castShadow>
              <sphereGeometry args={[0.4, 12, 9]} />
              <meshStandardMaterial color={PALETTE.leafLight} roughness={1} />
            </mesh>
            <mesh position={[-0.28, 0.65, -0.1]} castShadow>
              <sphereGeometry args={[0.36, 12, 9]} />
              <meshStandardMaterial color={i % 2 ? PALETTE.sage : PALETTE.leaf} roughness={1} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}
