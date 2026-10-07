// Water: a standard PBR surface (so it reflects the sky's environment map
// with a proper Fresnel falloff and mirrors the sunset), with gentle sine
// waves injected into the vertex shader and a scrolling ripple bump map.
// The shore is a paler band painted into the colour map that fades out
// from the island — no ring, no hard edge.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ISLAND, LIFE, WATER } from "../island.config.js";
import { paintRipples, paintShore, toTexture } from "../textures.js";

const SIZE = 120;

export function Water() {
  const mat = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uHeight: { value: WATER.waveHeight } }), []);
  const bump = useMemo(() => toTexture(paintRipples(), { srgb: false, repeat: 24 }), []);
  const shore = useMemo(() => toTexture(paintShore(SIZE, ISLAND.radius, WATER.shore, "#ffffff", WATER.shoreColor)), []);
  useEffect(
    () => () => {
      bump.dispose();
      shore.dispose();
    },
    [bump, shore]
  );

  const onBeforeCompile = useMemo(
    () => (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uHeight = uniforms.uHeight;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform float uHeight;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float w = sin(position.x * 0.9 + uTime * 1.1) * uHeight + sin(position.y * 1.3 - uTime * 0.9) * uHeight * 0.8 + sin((position.x + position.y) * 0.5 + uTime * 0.6) * uHeight * 0.6;
          transformed.z += w;`
        );
    },
    [uniforms]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime * LIFE.waterSpeed;
    uniforms.uTime.value = t;
    uniforms.uHeight.value = WATER.waveHeight;
    bump.offset.set(t * WATER.rippleSpeed, t * WATER.rippleSpeed * 0.7);
    if (mat.current) {
      mat.current.color.set(WATER.color);
      mat.current.roughness = WATER.roughness;
      mat.current.metalness = WATER.metalness;
      mat.current.envMapIntensity = WATER.envMapIntensity;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.85, 0]} receiveShadow>
      <planeGeometry args={[SIZE, SIZE, 110, 110]} />
      <meshStandardMaterial ref={mat} color={WATER.color} map={shore} roughness={WATER.roughness} metalness={WATER.metalness} bumpMap={bump} bumpScale={0.02} envMapIntensity={WATER.envMapIntensity} onBeforeCompile={onBeforeCompile} />
    </mesh>
  );
}
