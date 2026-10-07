// Where the bird nests sit: pure maths shared by the scene (Nests.jsx) and
// scripts/map.mjs (which checks them). A nest is seated in the crown of one
// of the island's trees (ISLAND.trees), on the tree's main canopy blob, at a
// bearing round the crown and an elevation above its equator, with the
// cup's floor NESTS.sink metres inside the foliage so the rim stands
// clear. The trees sway about their canopy pivot (IslandBase.jsx:
// rotation.z = sin(t·0.8 + i·1.3) · LIFE.treeSway), and the scene applies the
// same sway to each nest every frame.
import { ISLAND, NESTS, LIFE } from "../island.config.js";

// The canopy as IslandBase.jsx builds it, in the tree's own (unscaled) units:
// the pivot the crown sways about and the three blobs above it.
export const CANOPY = {
  pivot: [0, 0.9, 0],
  blobs: [
    { c: [0, 0.35, 0], r: 0.55 },
    { c: [0.3, 0.6, 0.15], r: 0.4 },
    { c: [-0.28, 0.65, -0.1], r: 0.36 },
  ],
  trunk: { r: 0.1, h: 0.9 },
};

// One entry per nest: the tree, its position and scale, the nest's rest
// position in the crown's own units (`local`, relative to the pivot), its
// yaw (the wire's tail points back toward the trunk) and its world position
// when the tree is still.
export function nestPlacements() {
  const main = CANOPY.blobs[0];
  return (NESTS.nests || [])
    .filter((n) => ISLAND.trees[n.tree])
    .map((n) => {
      const [tx, tz, s] = ISLAND.trees[n.tree];
      const b = n.bearing ?? 0;
      const up = n.up ?? 0.2;
      // out from the crown's centre along (bearing, up) to the crown's outer
      // surface — the farthest blob the ray leaves — then `sink` metres back
      // in (tree units), so the cup's floor is in the foliage and its opening
      // is not
      const u = [Math.sin(b) * Math.cos(up), Math.sin(up), Math.cos(b) * Math.cos(up)];
      let tMax = main.r;
      for (const blob of CANOPY.blobs) {
        const dc = [blob.c[0] - main.c[0], blob.c[1] - main.c[1], blob.c[2] - main.c[2]];
        const along = dc[0] * u[0] + dc[1] * u[1] + dc[2] * u[2];
        const perp2 = dc[0] * dc[0] + dc[1] * dc[1] + dc[2] * dc[2] - along * along;
        const disc = blob.r * blob.r - perp2;
        if (disc >= 0) tMax = Math.max(tMax, along + Math.sqrt(disc));
      }
      const d = tMax - NESTS.sink / s;
      const local = [main.c[0] + d * u[0], main.c[1] + d * u[1], main.c[2] + d * u[2]];
      const world = [tx + s * (CANOPY.pivot[0] + local[0]), s * (CANOPY.pivot[1] + local[1]), tz + s * (CANOPY.pivot[2] + local[2])];
      // yaw so the wire's tail (built along local +x) points toward the trunk
      const yaw = b + Math.PI / 2;
      return { tree: n.tree, treeAt: [tx, tz], scale: s, bearing: b, up, local, world, yaw };
    });
}

// The sway of tree i at time t, as IslandBase.jsx applies it.
export function treeSway(i, t) {
  return Math.sin(t * 0.8 + i * 1.3) * LIFE.treeSway;
}

