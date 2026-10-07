// A campfire that is only there at night: a ring of stones, three logs, ash
// and charred ground, a flame drawn by a shader (upward-scrolling noise
// shaping irregular licks — bright and wide at the base, thinning and
// reddening to the tip) on three crossed planes, a handful of embers that
// drift up with a little wander and wink out, and ONE warm point light
// whose flicker is the same noise that drives the flame. Everything fades
// with DAY.lightsOn like the lamps; by day nothing is drawn. FIRE in the
// config; the "off" tier gets fewer flame planes and no embers.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FIRE, PALETTE } from "../island.config.js";
import { useDay } from "../sky/DayNight.jsx";
import { seeded } from "../springs.js";

// 1-D value noise, deterministic, for the flicker: layered so it is never
// a clean sine and never symmetric.
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function vnoise(t) {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}
export function flickerAt(t) {
  const n = vnoise(t * 3.1) * 0.5 + vnoise(t * 7.7 + 5) * 0.3 + vnoise(t * 17.3 + 9) * 0.2;
  // skewed: mostly bright with quick dips
  return 1 - FIRE.flicker * Math.pow(n, 1.6);
}

const FLAME_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FLAME_FRAG = `
  uniform float uTime;
  uniform float uFade;
  uniform float uFlicker;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int k = 0; k < 3; k++) { v += a * vnoise(p); p *= 2.1; a *= 0.5; } return v; }
  void main() {
    float y = vUv.y;
    float x = vUv.x * 2.0 - 1.0;
    // two noise fields scrolling upward at different speeds
    float n = fbm(vec2(vUv.x * 3.0 + uTime * 0.25, y * 2.5 - uTime * 1.5));
    float n2 = fbm(vec2(vUv.x * 6.0 - uTime * 0.6, y * 4.0 - uTime * 2.3));
    // the body: wide at the base, narrowing to the tip, bent by the noise
    float width = (1.0 - y * 0.85) * (0.7 + 0.3 * uFlicker);
    float body = 1.0 - smoothstep(width * 0.5, width, abs(x + (n - 0.5) * 1.1 * (0.2 + y)));
    // irregular licks eating into the top
    float lick = smoothstep(0.0, 0.3, (1.0 - y) - (n2 - 0.5) * 1.0 * (0.25 + y));
    float a = body * lick * (1.0 - y * 0.6) * uFade;
    vec3 base = vec3(1.0, 0.95, 0.65);
    vec3 mid = vec3(1.0, 0.52, 0.12);
    vec3 tip = vec3(0.8, 0.16, 0.02);
    vec3 col = mix(mix(base, mid, smoothstep(0.0, 0.45, y)), tip, smoothstep(0.45, 1.0, y));
    col *= 0.9 + 0.6 * n2;
    gl_FragColor = vec4(col * a, a);
  }
`;

export function Campfire({ tier = "full", position = FIRE.local }) {
  const day = useDay();
  const root = useRef();
  const light = useRef();
  const flames = useRef([]);
  const embers = useRef();
  const rnd = useMemo(() => seeded(91), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uFade: { value: 0 }, uFlicker: { value: 1 } }), []);
  const emberCount = tier === "off" ? 0 : FIRE.embers.count;
  const planes = tier === "off" ? 2 : 3;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const flameGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(FIRE.flameWidth, FIRE.flameHeight, 1, 1);
    g.translate(0, FIRE.flameHeight / 2, 0);
    return g;
  }, []);
  const parts = useMemo(
    () =>
      Array.from({ length: emberCount }).map((_, i) => ({
        t: rnd() * 2, // where in its life it is
        life: FIRE.embers.life[0] + rnd() * (FIRE.embers.life[1] - FIRE.embers.life[0]),
        x: (rnd() - 0.5) * 0.22,
        z: (rnd() - 0.5) * 0.22,
        seed: i * 3.7,
        size: 0.006 + rnd() * 0.008,
      })),
    [emberCount, rnd]
  );
  const stones = useMemo(
    () =>
      Array.from({ length: FIRE.stones }).map((_, i) => {
        const a = (i / FIRE.stones) * Math.PI * 2 + rnd() * 0.3;
        return { x: Math.sin(a) * FIRE.ringRadius, z: Math.cos(a) * FIRE.ringRadius, s: 0.05 + rnd() * 0.03, r: rnd() * Math.PI, y: rnd() * 0.5 + 0.7 };
      }),
    [rnd]
  );

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt || 0.016, 1 / 30);
    const t = state.clock.elapsedTime;
    const on = day?.current.lights ?? 0;
    const g = root.current;
    if (!g) return;
    if (on < 0.01) {
      if (g.visible) g.visible = false;
      return;
    }
    if (!g.visible) g.visible = true;
    const fl = flickerAt(t);
    uniforms.uTime.value = t;
    uniforms.uFade.value = on;
    uniforms.uFlicker.value = fl;
    flames.current.forEach((m, i) => {
      if (!m) return;
      const f2 = flickerAt(t * 1.3 + i * 4.1);
      m.scale.set(1, 0.85 + 0.25 * f2, 1);
    });
    if (light.current) light.current.intensity = FIRE.light.intensity * on * (0.7 + 0.3 * fl);
    // embers: born low in the fire, rise, wander, fade and wink out
    if (embers.current && parts.length) {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.t += dt;
        if (p.t > p.life) {
          p.t = 0;
          p.life = FIRE.embers.life[0] + rnd() * (FIRE.embers.life[1] - FIRE.embers.life[0]);
          p.x = (rnd() - 0.5) * 0.22;
          p.z = (rnd() - 0.5) * 0.22;
        }
        const k = p.t / p.life;
        const y = 0.15 + k * FIRE.embers.rise * (0.8 + 0.4 * vnoise(p.seed));
        const wx = (vnoise(t * 1.7 + p.seed) - 0.5) * FIRE.embers.wander * k;
        const wz = (vnoise(t * 1.3 + p.seed + 50) - 0.5) * FIRE.embers.wander * k;
        const s = p.size * (1 - k * k) * on * (k < 0.1 ? k / 0.1 : 1);
        dummy.position.set(p.x + wx, y, p.z + wz);
        dummy.scale.setScalar(Math.max(0.0001, s));
        dummy.updateMatrix();
        embers.current.setMatrixAt(i, dummy.matrix);
      }
      embers.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={root} position={position} visible={false}>
      {/* charred ground and ash */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[FIRE.ringRadius + 0.14, 24]} />
        <meshStandardMaterial color="#3a3531" roughness={1} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[FIRE.ringRadius - 0.06, 20]} />
        <meshStandardMaterial color="#6b6560" roughness={1} />
      </mesh>
      {/* ring of stones */}
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, s.s * 0.8, s.z]} rotation={[0, s.r, 0]} scale={[1.3, s.y, 1]} castShadow={tier !== "off"}>
          <dodecahedronGeometry args={[s.s, 0]} />
          <meshStandardMaterial color={i % 3 ? "#8b8985" : "#a09a92"} roughness={1} />
        </mesh>
      ))}
      {/* logs, crossed */}
      {[
        [0.0, 0.05, 0, 0.6],
        [0.02, 0.1, 0, -0.5],
        [-0.03, 0.15, 0, 0.1],
      ].map(([x, y, z, ry], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, ry, Math.PI / 2 - 0.15 * (i - 1)]} castShadow={tier !== "off"}>
          <cylinderGeometry args={[0.045, 0.05, 0.42, 8]} />
          <meshStandardMaterial color={i === 1 ? "#4a3a2c" : PALETTE.woodDark} roughness={0.95} />
        </mesh>
      ))}
      {/* the flame: crossed planes with the shader, anchored at the base */}
      {Array.from({ length: planes }).map((_, i) => (
        <mesh key={i} ref={(m) => (flames.current[i] = m)} geometry={flameGeo} position={[0, 0.12, 0]} rotation={[0, (i / planes) * Math.PI, 0]} frustumCulled={false}>
          <shaderMaterial vertexShader={FLAME_VERT} fragmentShader={FLAME_FRAG} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* embers */}
      {emberCount ? (
        <instancedMesh ref={embers} args={[undefined, undefined, emberCount]} frustumCulled={false}>
          <sphereGeometry args={[1, 6, 5]} />
          <meshBasicMaterial color="#ffb347" toneMapped={false} />
        </instancedMesh>
      ) : null}
      {/* the one light, flickering with the flame */}
      <pointLight ref={light} position={[0, FIRE.light.height, 0]} color={FIRE.light.color} intensity={0} distance={FIRE.light.distance} decay={2} />
    </group>
  );
}
