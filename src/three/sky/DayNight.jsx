// The sun's day, and the night after it. One place computes the hour →
// sun direction, colours and intensities (DAY.keyframes in the config) and
// writes them into a ref every frame; the sky, lights, fog, water and lamps
// read that ref imperatively, so nothing re-renders as the light changes.
import { createContext, useContext, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky, Stars, Environment } from "@react-three/drei";
import * as THREE from "three";
import { DAY, LIGHTS, ENVIRONMENT, PALETTE, ISLAND, RENDER } from "../island.config.js";
import { sample, sunFor, autoHour, makeFrame, localHourNow } from "./daymath.js";
import { setAmbienceNight } from "../../audio/ambience.js";

// The sun's shadow camera covers the whole island plus a margin of beach.
const SHADOW_EXTENT = ISLAND.radius * 1.45;

export const DayContext = createContext(null);
export const useDay = () => useContext(DayContext);

export function DayNight({ hourRef, tier, children }) {
  const { scene, gl } = useThree();
  const day = useRef({
    hour: 12,
    elevation: 1,
    lights: 0, // 0 by day → 1 at night, for lamps and windows
    night: 0,
    sunDir: new THREE.Vector3(0, 1, 0),
    sunPos: new THREE.Vector3(0, 40, 0),
    moonDir: new THREE.Vector3(0, -1, 0),
    frame: makeFrame(),
  });
  const sunLight = useRef();
  const hemi = useRef();
  const amb = useRef();
  const skyRef = useRef();
  const envSkyRef = useRef();
  const domeRef = useRef();
  const starsRef = useRef();
  const moonRef = useRef();
  const sunDiscRef = useRef();
  const fog = useMemo(() => new THREE.Fog(PALETTE.skyHorizon, RENDER.fog[0], RENDER.fog[1]), []);

  // The automatic day starts at the visitor's local time and then runs a
  // full 24 hours every DAY.cycleMinutes real minutes.
  const startHour = useMemo(() => localHourNow(), []);
  useFrame((state) => {
    const d = day.current;
    const hour = autoHour(startHour, state.clock.elapsedTime);
    d.hour = hour;
    sample(hour, d.frame);
    d.elevation = sunFor(hour, d.sunDir);
    d.sunPos.copy(d.sunDir).multiplyScalar(DAY.sunDistance);
    d.moonDir.set(-d.sunDir.x, Math.max(0.15, -d.sunDir.y), -d.sunDir.z * 0.6 + 0.4).normalize();
    d.night = d.frame.night;
    d.lights = THREE.MathUtils.smoothstep(-d.elevation, -DAY.lightsOn[0], -DAY.lightsOn[1]);
    setAmbienceNight(d.lights);

    // exposure, fog
    gl.toneMappingExposure = d.frame.exposure * RENDER.exposure;
    if (scene.fog !== fog) scene.fog = fog;
    fog.color.copy(d.frame.fog);
    if (scene.environmentIntensity !== undefined) scene.environmentIntensity = ENVIRONMENT.intensity * (1 - d.night * 0.6);

    // the one shadow-casting light: the sun by day, the moon by night
    const L = sunLight.current;
    if (L) {
      const sunUp = d.sunDir.y > 0.02;
      const dir = sunUp ? d.sunDir : d.moonDir;
      L.position.copy(dir).multiplyScalar(18);
      L.target.position.set(0, 0, 0);
      L.target.updateMatrixWorld();
      if (sunUp) {
        L.color.copy(d.frame.sun);
        L.intensity = d.frame.sunIntensity * LIGHTS.sun.intensity * 0.38;
      } else {
        L.color.set(DAY.moon.color);
        L.intensity = d.frame.moonIntensity;
      }
    }
    if (hemi.current) {
      hemi.current.color.copy(d.frame.hemiSky);
      hemi.current.groundColor.copy(d.frame.hemiGround);
      hemi.current.intensity = d.frame.hemiIntensity;
    }
    if (amb.current) amb.current.intensity = d.frame.ambient;

    // sky shaders (main and the one baked into the environment map)
    const skyEl = Math.max(-0.035, d.sunDir.y);
    [skyRef.current, envSkyRef.current].forEach((sky) => {
      if (!sky) return;
      const u = sky.material.uniforms;
      u.sunPosition.value.set(d.sunDir.x, skyEl, d.sunDir.z);
      u.turbidity.value = d.frame.turbidity;
      u.rayleigh.value = d.frame.rayleigh;
      u.mieCoefficient.value = 0.004 + 0.012 * (1 - Math.min(1, Math.max(0, d.sunDir.y * 3)));
      u.mieDirectionalG.value = 0.85;
    });
    if (domeRef.current) domeRef.current.material.opacity = d.night;
    if (starsRef.current) {
      starsRef.current.visible = d.night > 0.05;
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.004;
    }
    if (moonRef.current) {
      moonRef.current.position.copy(d.moonDir).multiplyScalar(DAY.sunDistance * 0.9);
      moonRef.current.visible = d.night > 0.05;
      moonRef.current.material.opacity = Math.min(1, d.night * 1.4);
    }
    if (sunDiscRef.current) {
      sunDiscRef.current.position.copy(d.sunPos).multiplyScalar(0.95);
      sunDiscRef.current.visible = d.sunDir.y > -0.05;
      sunDiscRef.current.material.color.copy(d.frame.sun);
    }
  });

  const shadowSize = tier === "off" ? LIGHTS.shadowMapTouch : LIGHTS.shadowMap;
  const dome = useMemo(() => new THREE.Color(DAY.nightZenith), []);
  const horizon = useMemo(() => new THREE.Color(DAY.nightHorizon), []);

  return (
    <DayContext.Provider value={day}>
      {/* sky, drawn behind everything */}
      <Sky ref={skyRef} distance={450000} sunPosition={[1, 0.5, 0.5]} turbidity={3} rayleigh={1} mieCoefficient={0.005} mieDirectionalG={0.85} />
      {/* night dome: deep blue, never black; fades in over dusk */}
      <mesh ref={domeRef} scale={90} renderOrder={-1}>
        <sphereGeometry args={[1, 24, 12]} />
        <nightDomeMaterial zenith={dome} horizon={horizon} side={THREE.BackSide} transparent depthWrite={false} fog={false} />
      </mesh>
      <group ref={starsRef} visible={false}>
        <Stars radius={70} depth={20} count={DAY.stars.count} factor={DAY.stars.factor} saturation={0.1} fade speed={0.4} />
      </group>
      <mesh ref={moonRef} visible={false}>
        <sphereGeometry args={[DAY.moon.size, 20, 14]} />
        <meshBasicMaterial color={DAY.moon.color} transparent opacity={0} fog={false} />
      </mesh>
      <mesh ref={sunDiscRef}>
        <sphereGeometry args={[1.5, 16, 12]} />
        <meshBasicMaterial color="#fff2dc" fog={false} />
      </mesh>

      {/* lights */}
      <ambientLight ref={amb} intensity={LIGHTS.ambient.intensity} color={LIGHTS.ambient.color} />
      <hemisphereLight ref={hemi} args={[LIGHTS.hemisphere.sky, LIGHTS.hemisphere.ground, LIGHTS.hemisphere.intensity]} />
      <directionalLight
        ref={sunLight}
        position={[8, 12, 6]}
        intensity={LIGHTS.sun.intensity}
        color={LIGHTS.sun.color}
        castShadow={tier !== "off"}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-radius={4}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />

      {/* image-based light baked from the same sky, re-rendered every frame at 64px */}
      {tier !== "off" ? (
        <Environment frames={Infinity} resolution={ENVIRONMENT.resolution} background={false}>
          <Sky ref={envSkyRef} distance={800} sunPosition={[1, 0.5, 0.5]} turbidity={3} rayleigh={1} mieCoefficient={0.005} mieDirectionalG={0.85} />
          <mesh position={[0, -60, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[400, 400]} />
            <meshBasicMaterial color={PALETTE.waterDeep} />
          </mesh>
        </Environment>
      ) : null}
      {children}
    </DayContext.Provider>
  );
}

// A cheap vertical-gradient material for the night dome.
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

const NightDomeMaterial = shaderMaterial(
  { zenith: new THREE.Color(DAY.nightZenith), horizon: new THREE.Color(DAY.nightHorizon), opacity: 0 },
  /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
  /* glsl */ `
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform float opacity;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 col = mix(horizon, zenith, pow(h, 0.55));
    gl_FragColor = vec4(col, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`
);
extend({ NightDomeMaterial });
