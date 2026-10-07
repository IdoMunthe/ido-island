// Bird nests up in a few of the trees. A nest is a woven cup of twigs —
// dozens of short thin sticks laid round a low bowl, a few straying out —
// seated in the crown of a tree, with a couple of small eggs in it.
//
// Draw calls: nests (one merged twig geometry, instanced) and eggs, one
// instanced mesh each. The nests ride the
// trees' sway: every frame their instance matrices follow the same
// rotation IslandBase.jsx gives the canopy. Everything is NESTS in
// island.config.js; where they sit is life/nests.js.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PALETTE, NESTS } from "../island.config.js";
import { nestPlacements, treeSway, CANOPY } from "./nests.js";
import { seeded } from "../springs.js";

// Paint a geometry one flat colour (a `color` attribute) so the merged
// nest can vary twig by twig under a single vertexColors material.
function tint(geo, hex) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

// The cup: a shallow bowl of dry grass with twigs laid round it and a few
// sticking out. Origin at the floor's centre; the rim is at NESTS.depth.
function buildNest() {
  const R = NESTS.radius;
  const D = NESTS.depth;
  const rnd = seeded(7);
  const browns = [PALETTE.woodDark, PALETTE.wood, PALETTE.wilt, PALETTE.soil];
  const parts = [];
  // the bowl
  const profile = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    profile.push(new THREE.Vector2(R * 0.92 * Math.sin((t * Math.PI) / 2), D * (1 - Math.cos((t * Math.PI) / 2)) * 0.95));
  }
  parts.push(tint(new THREE.LatheGeometry(profile, 14), PALETTE.soil));
  // twigs round the rim, in a few loose courses
  const place = (len, r0, y, a, tiltOut, pitch, thick, color) => {
    const g = new THREE.CylinderGeometry(thick, thick * 1.3, len, 4, 1);
    g.rotateZ(Math.PI / 2); // lie along x (+x will point in toward the cup's centre)
    g.rotateZ(pitch); // raise one end
    g.rotateY(tiltOut); // swing it off the tangent so the weave is loose
    g.rotateY(a + Math.PI / 2);
    g.translate(r0 * Math.sin(a), y, r0 * Math.cos(a));
    parts.push(tint(g, color));
  };
  const n = NESTS.twigs;
  for (let i = 0; i < n; i++) {
    const course = i % 3;
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.3;
    const r0 = R * (0.8 + course * 0.1 + (rnd() - 0.5) * 0.12);
    const y = D * (0.25 + course * 0.33) + (rnd() - 0.5) * 0.006;
    place(R * (1.1 + rnd() * 0.8), r0, y, a, (rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.5, 0.0022 + rnd() * 0.0014, browns[i % browns.length]);
  }
  // a few strays, longer, pointing out and up from the rim
  for (let i = 0; i < NESTS.strays; i++) {
    const a = (i / NESTS.strays) * Math.PI * 2 + rnd() * 0.8;
    place(R * (1.8 + rnd() * 0.9), R * 1.05, D * (0.8 + rnd() * 0.3), a, 0.2 + rnd() * 0.5, -0.5 - rnd() * 0.6, 0.002, i % 2 ? PALETTE.wilt : PALETTE.woodDark);
  }
  return mergeGeometries(parts, false);
}

export function Nests() {
  const nests = useMemo(() => nestPlacements(), []);
  const eggsPer = Math.max(0, Math.round(NESTS.eggs));
  const nestGeo = useMemo(() => buildNest(), []);
  useEffect(() => () => nestGeo.dispose(), [nestGeo]);

  const nestRef = useRef();
  const eggRef = useRef();
  // egg spots on the cup floor, a little apart
  const eggOffsets = useMemo(() => {
    const rnd = seeded(5);
    return Array.from({ length: eggsPer }, (_, i) => {
      const a = (i / Math.max(1, eggsPer)) * Math.PI * 2 + 0.8;
      const r = eggsPer > 1 ? NESTS.radius * 0.3 : 0;
      return { x: r * Math.sin(a), z: r * Math.cos(a), yaw: rnd() * Math.PI };
    });
  }, [eggsPer]);

  const tmp = useMemo(
    () => ({
      nest: new THREE.Matrix4(),
      off: new THREE.Matrix4(),
      out: new THREE.Matrix4(),
      pos: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(),
      one: new THREE.Vector3(1, 1, 1),
      egg: new THREE.Vector3(NESTS.eggRadius, NESTS.eggRadius * 1.3, NESTS.eggRadius),
      local: new THREE.Vector3(),
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const nm = nestRef.current;
    const em = eggRef.current;
    const { nest, off, out, pos, q, e, one, egg, local } = tmp;
    nests.forEach((n, i) => {
      // the crown's sway, as the tree applies it, about its pivot
      const sway = treeSway(n.tree, t);
      local.set(n.local[0], n.local[1], n.local[2]);
      const cs = Math.cos(sway);
      const sn = Math.sin(sway);
      const lx = local.x * cs - local.y * sn;
      const ly = local.x * sn + local.y * cs;
      pos.set(n.treeAt[0] + n.scale * (CANOPY.pivot[0] + lx), n.scale * (CANOPY.pivot[1] + ly), n.treeAt[1] + n.scale * (CANOPY.pivot[2] + local.z));
      q.setFromEuler(e.set(0, n.yaw, sway, "ZYX"));
      nest.compose(pos, q, one);
      if (nm) nm.setMatrixAt(i, nest);
      if (em) {
        eggOffsets.forEach((o, k) => {
          q.setFromEuler(e.set(0, o.yaw, 0));
          off.compose(pos.set(o.x, NESTS.eggRadius * 1.1, o.z), q, egg);
          out.multiplyMatrices(nest, off);
          em.setMatrixAt(i * eggsPer + k, out);
        });
      }
    });
    if (nm) nm.instanceMatrix.needsUpdate = true;
    if (em) em.instanceMatrix.needsUpdate = true;
  });

  if (!nests.length) return null;
  return (
    <group>
      <instancedMesh ref={nestRef} args={[nestGeo, undefined, nests.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={1} />
      </instancedMesh>
      {eggsPer > 0 ? (
        <instancedMesh ref={eggRef} args={[undefined, undefined, nests.length * eggsPer]} frustumCulled={false}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={NESTS.eggColor} roughness={0.7} />
        </instancedMesh>
      ) : null}
    </group>
  );
}
