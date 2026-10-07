// Post-processing by tier. "full": ambient occlusion (N8AO), tilt-shift,
// bloom, vignette, a hair of chromatic aberration. "lite": bloom and
// vignette. "off": nothing (touch devices). Values are POST in the config.
import { EffectComposer, N8AO, TiltShift2, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { POST } from "../island.config.js";

export function Effects({ tier }) {
  const p = POST[tier] || POST.off;
  if (!p.ao && !p.tiltShift && !p.bloom && !p.vignette && !p.chroma) return null;
  return (
    <EffectComposer multisampling={0} disableNormalPass>
      {p.ao ? <N8AO aoRadius={p.ao.radius} intensity={p.ao.intensity} distanceFalloff={p.ao.falloff} quality={p.ao.quality} halfRes /> : null}
      {p.tiltShift ? <TiltShift2 blur={p.tiltShift.blur} taper={p.tiltShift.taper} offset={p.tiltShift.offset} samples={8} /> : null}
      {p.bloom ? <Bloom intensity={p.bloom.intensity} luminanceThreshold={p.bloom.threshold} luminanceSmoothing={p.bloom.smoothing} mipmapBlur /> : null}
      {p.chroma ? <ChromaticAberration offset={[p.chroma, p.chroma]} radialModulation modulationOffset={0.4} blendFunction={BlendFunction.NORMAL} /> : null}
      {p.vignette ? <Vignette offset={p.vignette.offset} darkness={p.vignette.darkness} eskil={false} /> : null}
    </EffectComposer>
  );
}
