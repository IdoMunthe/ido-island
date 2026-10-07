// Where the figure can walk and how it gets there: the path network from
// the config, every footprint as a circle, and Dijkstra over path vertices
// + start + goal where each edge is checked against the circles with the
// figure's own radius. Pure, so scripts can route exactly as the scene does.
import * as THREE from "three";
import { ISLAND, LANDMARKS, AVATAR, OBSTACLES, LAMPS } from "../island.config.js";

const DEV = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV;

// The walkable network: the loop plus any spurs (ISLAND.spurs), as a list of
// vertices and the links between them. A spur that starts on a loop vertex
// shares that vertex.
const PATH = ISLAND.path.map(([x, z]) => new THREE.Vector2(x, z));
const LINKS = [];
for (let i = 0; i < ISLAND.path.length; i++) {
  const j = (i + 1) % ISLAND.path.length;
  if (!ISLAND.pathClosed && j === 0) break;
  LINKS.push([i, j]);
}
for (const spur of ISLAND.spurs || []) {
  let prev = -1;
  for (const [x, z] of spur) {
    let k = PATH.findIndex((p) => Math.hypot(p.x - x, p.y - z) < 0.05);
    if (k < 0) k = PATH.push(new THREE.Vector2(x, z)) - 1;
    if (prev >= 0 && prev !== k) LINKS.push([prev, k]);
    prev = k;
  }
}
const N = PATH.length;

// Every circle the figure must keep out of, in world space, tagged with the
// place it belongs to (so the final step into that place is allowed).
function buildObstacles() {
  const list = [];
  for (const lm of LANDMARKS) {
    const c = Math.cos(lm.rotation || 0);
    const s = Math.sin(lm.rotation || 0);
    for (const [dx, dz, r] of lm.footprint || []) {
      list.push({ x: lm.at[0] + dx * c + dz * s, z: lm.at[2] - dx * s + dz * c, r, owner: lm.id });
    }
  }
  for (const [x, z, r] of OBSTACLES) list.push({ x, z, r, owner: null });
  for (const [x, z, sc] of ISLAND.trees) list.push({ x, z, r: 0.32 * sc, owner: null });
  for (const p of LAMPS.posts) list.push({ x: p.at[0], z: p.at[1], r: 0.14, owner: null });
  return list;
}
const OBS = buildObstacles();
const R = AVATAR.radius;

// Distance from point p to segment ab (2D).
function segDist(a, b, p) {
  const abx = b.x - a.x;
  const abz = b.y - a.y;
  const l2 = abx * abx + abz * abz;
  let t = l2 > 0 ? ((p.x - a.x) * abx + (p.y - a.y) * abz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + abx * t;
  const cz = a.y + abz * t;
  return Math.hypot(p.x - cx, p.y - cz);
}
const tmpP = new THREE.Vector2();
function segmentClear(a, b, ignoreOwner) {
  for (const o of OBS) {
    if (ignoreOwner && o.owner === ignoreOwner) continue;
    tmpP.set(o.x, o.z);
    if (segDist(a, b, tmpP) < o.r + R) return false;
  }
  return true;
}

// Report path segments that cross something, once, in development.
if (DEV) {
  const bad = [];
  for (const [i, j] of LINKS) {
    if (!segmentClear(PATH[i], PATH[j], null)) bad.push(`${i}→${j} [${PATH[i].x},${PATH[i].y}]→[${PATH[j].x},${PATH[j].y}]`);
  }
  if (bad.length) console.warn("[dating-cv] path segments that cross a footprint (add a waypoint in ISLAND.path / spurs):\n" + bad.join("\n"));
  else console.info("[dating-cv] path: every segment clear of footprints");
}

// Dijkstra over path vertices + start + goal. Edges: consecutive path
// vertices, start→vertex, vertex→goal and start→goal when clear.
export function buildRoute(from, to, fromOwner, toOwner) {
  const nodes = [from, ...PATH, to];
  const S = 0;
  const G = nodes.length - 1;
  const edges = Array.from({ length: nodes.length }, () => []);
  const add = (i, j) => {
    const d = nodes[i].distanceTo(nodes[j]);
    edges[i].push([j, d]);
    edges[j].push([i, d]);
  };
  for (const [i, j] of LINKS) add(1 + i, 1 + j);
  for (let i = 0; i < N; i++) {
    if (segmentClear(from, PATH[i], fromOwner)) add(S, 1 + i);
    if (segmentClear(PATH[i], to, toOwner)) add(1 + i, G);
  }
  if (segmentClear(from, to, fromOwner) && segmentClear(from, to, toOwner)) add(S, G);
  const dist = new Array(nodes.length).fill(Infinity);
  const prev = new Array(nodes.length).fill(-1);
  const done = new Array(nodes.length).fill(false);
  dist[S] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < nodes.length; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break;
    if (u === G) break;
    done[u] = true;
    for (const [v, d] of edges[u]) {
      if (dist[u] + d < dist[v]) {
        dist[v] = dist[u] + d;
        prev[v] = u;
      }
    }
  }
  const route = [];
  if (dist[G] === Infinity) {
    // nowhere clear to go: nearest path vertex, then the goal
    let best = 0;
    for (let i = 1; i < N; i++) if (PATH[i].distanceTo(from) < PATH[best].distanceTo(from)) best = i;
    route.push(from.clone(), PATH[best], to.clone());
  } else {
    for (let v = G; v !== -1; v = prev[v]) route.unshift(nodes[v]);
  }
  const out = [route[0].clone()];
  for (let k = 1; k < route.length; k++) if (route[k].distanceTo(out[out.length - 1]) > 0.05) out.push(route[k].clone());
  return out;
}

export function routeLength(route) {
  let l = 0;
  for (let i = 1; i < route.length; i++) l += route[i].distanceTo(route[i - 1]);
  return l;
}
export function pointAt(route, dist, out, dir) {
  let acc = 0;
  for (let i = 1; i < route.length; i++) {
    const seg = route[i].distanceTo(route[i - 1]);
    if (acc + seg >= dist || i === route.length - 1) {
      const t = seg > 0 ? THREE.MathUtils.clamp((dist - acc) / seg, 0, 1) : 1;
      out.lerpVectors(route[i - 1], route[i], t);
      if (dir) dir.subVectors(route[i], route[i - 1]).normalize();
      return;
    }
    acc += seg;
  }
}

