// Checks the welcome sign on the gate without a browser, so a blank sign
// can't get to a visitor unnoticed. Run:  node scripts/signcheck.mjs
//   1. the text is set in content.js and splits into its two lines
//   2. the painter is wired: painted onto a colour-managed CanvasTexture
//      that is assigned as the material's map, on both faces
//   3. the board is inside the camera's view from the overview and from
//      the gate's own card pose, facing each camera, at a legible size
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { content } from "../src/content.js";
import { LANDMARKS, CAMERA } from "../src/three/island.config.js";
import { splitWelcome, WELCOME } from "../src/three/textures.js";

const fails = [];
const ok = (cond, msg) => (cond ? console.log("  ok   " + msg) : (fails.push(msg), console.log("  FAIL " + msg)));

// 1. text
const text = content.spec?.gateSign;
ok(typeof text === "string" && text.trim().length > 0, `gateSign is set: ${JSON.stringify(text)}`);
const { small, name } = splitWelcome(text);
ok(name.length > 0, `name line: ${JSON.stringify(name)}`);
ok(small.length > 0, `small line: ${JSON.stringify(small)} (starts with "welcome to")`);

// 2. wiring (static)
const gateSrc = readFileSync(new URL("../src/three/landmarks/Gate.jsx", import.meta.url), "utf8");
const texSrc = readFileSync(new URL("../src/three/textures.js", import.meta.url), "utf8");
ok(/paintWelcome\(text/.test(gateSrc) && /toTexture\(paintWelcome/.test(gateSrc), "Gate.jsx paints the sign with paintWelcome → toTexture");
ok(/map=\{sign\}/.test(gateSrc), "Gate.jsx assigns the texture as the material's map");
ok(/colorSpace = THREE\.SRGBColorSpace/.test(texSrc) && /needsUpdate = true/.test(texSrc), "toTexture sets SRGBColorSpace and needsUpdate");
ok(/ctx\.fillStyle = "#000000";\s*ctx\.strokeStyle = "#000000";/.test(texSrc), "the name is painted in black on the cream board");
ok(/map=\{sign\}[^\n]*onUpdate=\{remap\}/.test(gateSrc), "the sign material recompiles when the texture arrives (onUpdate={remap}); without it the board stays blank");
const gate = LANDMARKS.find((l) => l.id === "gate");
const sign = gate?.sign;
ok(!!sign, "gate.sign geometry is in the config");
ok(sign?.twoSided && /SIGN\.twoSided \? \[1, -1\] : \[1\]/.test(gateSrc), "painted on both faces (twoSided) so the approach side reads too");

// 3. geometry: where the board is, which way it faces
const yaw = (gate.rotation || 0) + (sign.rotation || 0);
const c = Math.cos(gate.rotation || 0);
const s = Math.sin(gate.rotation || 0);
const post = new THREE.Vector3(gate.at[0] + sign.at[0] * c + sign.at[2] * s, 0, gate.at[2] - sign.at[0] * s + sign.at[2] * c);
const centre = post.clone().add(new THREE.Vector3(0, sign.top - sign.height / 2, 0));
const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)); // board's local +x in world
const normal = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); // board's front (+z) in world
const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => centre.clone().addScaledVector(right, (sx * sign.width) / 2).add(new THREE.Vector3(0, (sy * sign.height) / 2, 0))));
console.log(`sign board ${sign.width}×${sign.height} m, centre (${centre.x.toFixed(2)}, ${centre.y.toFixed(2)}, ${centre.z.toFixed(2)}), letters ≈ ${(sign.height * WELCOME.nameSize * WELCOME.capHeight).toFixed(2)} m tall`);

function pose(name, position, target, minPx) {
  const cam = new THREE.PerspectiveCamera(CAMERA.fov, 16 / 9, 0.1, 120);
  cam.position.copy(position);
  cam.lookAt(target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  const inside = corners.every((p) => frustum.containsPoint(p));
  const view = centre.clone().sub(position);
  const dist = view.length();
  view.normalize();
  const facing = -view.dot(normal); // > 0: the front faces this camera
  // how far the camera looks down, less the board leaning back toward it
  const elev = Math.max(0, Math.asin(-view.y) - (facing > 0 ? sign.lean || 0 : 0));
  const pxPerMetre = 1080 / (2 * dist * Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2)));
  const letterPx = pxPerMetre * sign.height * WELCOME.nameSize * WELCOME.capHeight * Math.cos(elev);
  const boardPx = pxPerMetre * sign.width * Math.abs(facing);
  console.log(`${name}: ${dist.toFixed(1)} m away, looking down ${THREE.MathUtils.radToDeg(elev).toFixed(0)}°, ${facing > 0 ? "front" : "back"} face (${Math.abs(facing).toFixed(2)}), board ≈ ${boardPx.toFixed(0)} px wide, letters ≈ ${letterPx.toFixed(0)} px tall at 1080p`);
  ok(inside, `${name}: all four corners inside the view`);
  ok(facing > 0.3 || (sign.twoSided && Math.abs(facing) > 0.3), `${name}: a painted face points at the camera`);
  ok(letterPx >= minPx, `${name}: letters at least ${minPx} px tall (${letterPx.toFixed(0)})`);
}

const ov = CAMERA.overview;
const ovTarget = new THREE.Vector3(...ov.target);
const ovPos = new THREE.Vector3(ovTarget.x + ov.distance * Math.sin(ov.polar) * Math.sin(ov.azimuth), ovTarget.y + ov.distance * Math.cos(ov.polar), ovTarget.z + ov.distance * Math.sin(ov.polar) * Math.cos(ov.azimuth));
pose("overview", ovPos, ovTarget, 18);
const gc = gate.camera;
const gTarget = new THREE.Vector3(gate.at[0] + gc.lookAt[0], gate.at[1] + gc.lookAt[1], gate.at[2] + gc.lookAt[2]);
const gPos = new THREE.Vector3(gTarget.x + gc.distance * Math.sin(gc.polar) * Math.sin(gc.azimuth), gTarget.y + gc.distance * Math.cos(gc.polar), gTarget.z + gc.distance * Math.sin(gc.polar) * Math.cos(gc.azimuth));
pose("gate card", gPos, gTarget, 40);

console.log(fails.length ? `\n${fails.length} check(s) failed` : "\nsign: all checks pass");
process.exit(fails.length ? 1 : 0);
