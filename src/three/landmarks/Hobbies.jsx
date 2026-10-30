// Hobbies: a music corner (guitar on a stand, upright piano), a badminton
// court (net, racket, shuttle), an outdoor gym (bench, rack, barbell,
// dumbbells) and a chess table (a flat stone with a board on it, a game
// part-played, two stools). One card covers all four. The figure sits at
// the piano. When Hobbies is selected the father and a brother come over
// from the family and play (Family.jsx): each move they announce on the
// bus slides a piece here — a short lift and slide to a neighbouring
// square, now and then taking a piece, which goes to the pile beside the
// board. It is not legal chess; it is a game being played.
import { useContext, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Landmark } from "./Landmark.jsx";
import { PALETTE, CHESS } from "../island.config.js";
import { IslandContext } from "../islandContext.js";
import { paintChessboard, toTexture } from "../textures.js";
import { seeded } from "../springs.js";
import { Guitar } from "./parts/Guitar.jsx";
import { Piano } from "./parts/Piano.jsx";
import { Racket, Shuttle } from "./parts/Racket.jsx";
import { Barbell, Dumbbell } from "./parts/Weights.jsx";

export function Hobbies({ config }) {
  return (
    <Landmark config={config} labelHeight={1.8} ringRadius={2.3}>
      {/* ---- badminton court, centre ---- */}
      <group>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.0, 1.0]} />
          <meshStandardMaterial color={PALETTE.court} roughness={1} />
        </mesh>
        {[
          [0, 0.49, 2.0, 0.03],
          [0, -0.49, 2.0, 0.03],
          [-0.985, 0, 0.03, 1.0],
          [0.985, 0, 0.03, 1.0],
          [-0.5, 0, 0.03, 1.0],
          [0.5, 0, 0.03, 1.0],
        ].map(([x, z, w, d], i) => (
          <mesh key={i} position={[x, 0.026, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial color={PALETTE.courtLine} roughness={1} />
          </mesh>
        ))}
        {[-0.55, 0.55].map((z, i) => (
          <mesh key={i} position={[0, 0.3, z]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.02, 0.28, 1.1]} />
          <meshStandardMaterial color={PALETTE.net} roughness={1} transparent opacity={0.72} />
        </mesh>
        <mesh position={[0, 0.565, 0]}>
          <boxGeometry args={[0.03, 0.03, 1.12]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={1} />
        </mesh>
        <Racket position={[0.62, 0.03, -0.22]} rotation={[-Math.PI / 2, 0, 0.7]} scale={1.1} />
        <Shuttle position={[0.35, 0.02, 0.28]} rotation={[0.5, 0, 0.35]} />
      </group>

      {/* ---- music corner, left ---- */}
      <group position={[-1.55, 0, 0.1]} rotation={[0, 0.5, 0]}>
        <RoundedBox args={[1.4, 0.06, 1.2]} radius={0.012} position={[0, 0.03, 0]} receiveShadow castShadow>
          <meshStandardMaterial color={PALETTE.wood} roughness={0.95} />
        </RoundedBox>
        <Piano position={[-0.3, 0.06, -0.3]} scale={0.95} />
        <Guitar position={[0.42, 0.06, 0.12]} rotation={[0, -0.5, 0]} scale={0.95} />
      </group>

      {/* ---- outdoor gym, south ---- */}
      <group position={[0.2, 0, 1.35]}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.4, 1.2]} />
          <meshStandardMaterial color={PALETTE.path} roughness={1} />
        </mesh>
        {/* bench */}
        <RoundedBox args={[0.34, 0.08, 1.0]} radius={0.015} position={[0, 0.3, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.pin} roughness={0.7} />
        </RoundedBox>
        {[-0.4, 0.4].map((z, i) => (
          <mesh key={i} position={[0, 0.13, z]} castShadow>
            <boxGeometry args={[0.3, 0.26, 0.05]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        {/* rack with the barbell resting on it */}
        {[-0.42, 0.42].map((x, i) => (
          <mesh key={i} position={[x, 0.45, -0.42]} castShadow>
            <boxGeometry args={[0.05, 0.9, 0.05]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        {[-0.42, 0.42].map((x, i) => (
          <mesh key={i} position={[x, 0.88, -0.42]} castShadow>
            <boxGeometry args={[0.07, 0.04, 0.09]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        <Barbell position={[0, 0.92, -0.42]} />
        <Dumbbell position={[0.5, 0.06, 0.3]} rotation={[0, 0.3, 0]} />
        <Dumbbell position={[0.5, 0.06, 0.48]} rotation={[0, -0.2, 0]} />
      </group>

      {/* ---- chess table, east: its footprint and the players' stools are
           in the config (LANDMARKS hobbies.footprint, VISITS.hobbies) ---- */}
      <ChessTable position={CHESS.table.at} rotation={[0, CHESS.table.yaw, 0]} />
    </Landmark>
  );
}

// ---------------------------------------------------------------- chess
const BOARD = CHESS.board; // the board, metres across
const SQ = BOARD / 8;
const TOP = CHESS.table.top; // the stone's top
const CREAM = "#efe4cc";
const DARK = "#3f2d20";
const STONE = "#9b9791";

// The ranks run along x — white (cream) sits on the +x stool, black on the
// −x stool — and the files along z. A game in its middle: white has
// castled and pushed in the centre; black has a knight out and a bishop
// developed. A few pieces are already off the board, on the stone beside it.
const ON_BOARD = [
  ["king", "g1", false], ["queen", "d1", false], ["rook", "a1", false], ["rook", "f1", false], ["bishop", "c4", false], ["knight", "f3", false],
  ["pawn", "a2", false], ["pawn", "b2", false], ["pawn", "e4", false], ["pawn", "g2", false], ["pawn", "h2", false],
  ["king", "g8", true], ["queen", "d8", true], ["rook", "a8", true], ["rook", "f8", true], ["bishop", "e7", true], ["knight", "c6", true],
  ["pawn", "a7", true], ["pawn", "b7", true], ["pawn", "d6", true], ["pawn", "f7", true], ["pawn", "g7", true],
];
// the piles beside the board: taken white pieces on black's side and the
// other way round; the first three slots of each are already used
const PILE = {
  white: [[-0.24, 0.17], [-0.24, 0.11], [-0.25, 0.04], [-0.25, -0.03], [-0.25, -0.1], [-0.25, -0.17]],
  black: [[0.24, -0.16], [0.25, -0.1], [0.24, -0.02], [0.24, 0.05], [0.24, 0.12], [0.24, 0.19]],
};
const TAKEN = [
  ["pawn", false, 0], ["pawn", false, 1], ["bishop", false, 2],
  ["pawn", true, 0], ["pawn", true, 1], ["knight", true, 2],
];

const squareXZ = (r, f) => [(3.5 - r) * SQ, (f - 3.5) * SQ];
function parse(name) {
  return [Number(name[1]) - 1, name.charCodeAt(0) - 97]; // [rank, file]
}

// Simple turned clay shapes, legible as chess at a glance: a base, a body
// and the one feature that names the piece.
function Piece({ kind, dark }) {
  const mat = <meshStandardMaterial color={dark ? DARK : CREAM} roughness={0.75} />;
  let top = null;
  switch (kind) {
    case "pawn":
      top = (
        <mesh position={[0, 0.022, 0]} castShadow>
          <sphereGeometry args={[0.0085, 8, 6]} />
          {mat}
        </mesh>
      );
      break;
    case "rook":
      top = (
        <>
          <mesh position={[0, 0.024, 0]} castShadow>
            <cylinderGeometry args={[0.009, 0.01, 0.026, 10]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.022, 0.007, 0.022]} />
            {mat}
          </mesh>
        </>
      );
      break;
    case "knight":
      top = (
        <>
          <mesh position={[0, 0.022, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.01, 0.022, 10]} />
            {mat}
          </mesh>
          <mesh position={[0.004, 0.04, 0]} rotation={[0, 0, -0.55]} castShadow>
            <boxGeometry args={[0.011, 0.024, 0.012]} />
            {mat}
          </mesh>
        </>
      );
      break;
    case "bishop":
      top = (
        <>
          <mesh position={[0, 0.028, 0]} castShadow>
            <coneGeometry args={[0.0105, 0.034, 10]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.048, 0]}>
            <sphereGeometry args={[0.0035, 6, 5]} />
            {mat}
          </mesh>
        </>
      );
      break;
    case "queen":
      top = (
        <>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.0075, 0.011, 0.038, 10]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.054, 0]}>
            <sphereGeometry args={[0.007, 8, 6]} />
            {mat}
          </mesh>
        </>
      );
      break;
    case "king":
      top = (
        <>
          <mesh position={[0, 0.032, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.0115, 0.042, 10]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.004, 0.014, 0.004]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.061, 0]}>
            <boxGeometry args={[0.011, 0.004, 0.004]} />
            {mat}
          </mesh>
        </>
      );
      break;
    default:
      break;
  }
  return (
    <>
      <mesh position={[0, 0.006, 0]} castShadow>
        <cylinderGeometry args={[0.011, 0.0135, 0.012, 10]} />
        {mat}
      </mesh>
      {top}
    </>
  );
}

function ChessTable({ position, rotation }) {
  const { bus } = useContext(IslandContext);
  const board = useMemo(() => toTexture(paintChessboard(256)), []);
  useEffect(() => () => board.dispose(), [board]);
  const refs = useRef([]);
  const game = useRef(null);
  if (!game.current) {
    const pieces = ON_BOARD.map(([kind, sq, dark]) => {
      const [r, f] = parse(sq);
      const [x, z] = squareXZ(r, f);
      return { kind, dark, r, f, x, z, y: TOP + 0.0105, taken: false };
    });
    TAKEN.forEach(([kind, dark, slot]) => {
      const [x, z] = PILE[dark ? "black" : "white"][slot];
      pieces.push({ kind, dark, r: -1, f: -1, x, z, y: TOP, taken: true });
    });
    game.current = { pieces, used: { white: 3, black: 3 }, seq: 0, anim: null, rnd: seeded(13) };
  }
  const all = game.current.pieces;

  // One move: a random piece of the side to move slides to a free
  // neighbouring square; now and then it takes a neighbour instead, which
  // lifts off to the pile beside the board.
  const startMove = (g, side) => {
    const dark = side === 1;
    const occ = new Map(all.filter((p) => !p.taken).map((p) => [`${p.r},${p.f}`, p]));
    const mine = all.filter((p) => !p.taken && p.dark === dark).sort(() => g.rnd() - 0.5);
    const steps = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const pileOf = (p) => PILE[p.dark ? "black" : "white"];
    const pileKey = (p) => (p.dark ? "black" : "white");
    for (const p of mine) {
      const moves = [];
      const takes = [];
      for (const [dr, df] of steps) {
        const r = p.r + dr;
        const f = p.f + df;
        if (r < 0 || r > 7 || f < 0 || f > 7) continue;
        const o = occ.get(`${r},${f}`);
        if (!o) moves.push([r, f]);
        else if (o.dark !== dark && o.kind !== "king") takes.push(o);
      }
      const wantTake = takes.length && g.rnd() < CHESS.capture && g.used[pileKey(takes[0])] < pileOf(takes[0]).length;
      if (wantTake) {
        const o = takes[Math.floor(g.rnd() * takes.length)];
        const slot = pileOf(o)[g.used[pileKey(o)]++];
        g.anim = { t: 0, piece: p, from: [p.x, p.z], to: squareXZ(o.r, o.f), r: o.r, f: o.f, captured: { piece: o, from: [o.x, o.z], to: slot } };
        o.taken = true;
        o.r = -1;
        o.f = -1;
        return;
      }
      if (moves.length) {
        const [r, f] = moves[Math.floor(g.rnd() * moves.length)];
        g.anim = { t: 0, piece: p, from: [p.x, p.z], to: squareXZ(r, f), r, f, captured: null };
        return;
      }
    }
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt || 0.016, 1 / 30);
    const g = game.current;
    const ev = bus?.chess;
    if (ev && ev.seq !== g.seq && !g.anim) {
      g.seq = ev.seq;
      startMove(g, ev.side);
    }
    const a = g.anim;
    if (a) {
      a.t += dt;
      const k = Math.min(1, a.t / CHESS.slide);
      const e = k * k * (3 - 2 * k);
      a.piece.x = a.from[0] + (a.to[0] - a.from[0]) * e;
      a.piece.z = a.from[1] + (a.to[1] - a.from[1]) * e;
      a.piece.y = TOP + 0.0105 + CHESS.lift * Math.sin(k * Math.PI);
      if (a.captured) {
        const c = a.captured;
        const kc = Math.min(1, a.t / (CHESS.slide * 1.4));
        const ec = kc * kc * (3 - 2 * kc);
        c.piece.x = c.from[0] + (c.to[0] - c.from[0]) * ec;
        c.piece.z = c.from[1] + (c.to[1] - c.from[1]) * ec;
        c.piece.y = TOP + 0.0105 + CHESS.lift * 2.2 * Math.sin(kc * Math.PI) - 0.0105 * ec;
      }
      if (k >= 1 && (!a.captured || a.t >= CHESS.slide * 1.4)) {
        a.piece.r = a.r;
        a.piece.f = a.f;
        a.piece.y = TOP + 0.0105;
        g.anim = null;
      }
    }
    all.forEach((p, i) => refs.current[i]?.position.set(p.x, p.y, p.z));
  });

  return (
    <group position={position} rotation={rotation}>
      {/* a flat stone for a table */}
      <mesh position={[0, TOP / 2, 0]} rotation={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.66, TOP, 0.5]} />
        <meshStandardMaterial color={STONE} roughness={1} />
      </mesh>
      {/* the board: a thin wooden slab with the squares painted on */}
      <mesh position={[0, TOP + 0.005, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOARD + 0.02, 0.01, BOARD + 0.02]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      <mesh position={[0, TOP + 0.0105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BOARD, BOARD]} />
        <meshStandardMaterial map={board} roughness={0.85} />
      </mesh>
      {all.map((p, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={[p.x, p.y, p.z]}>
          <Piece kind={p.kind} dark={p.dark} />
        </group>
      ))}
      {/* two stools, one each side of the board */}
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} position={[sgn * CHESS.table.stool, CHESS.table.seat / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.07, 0.085, CHESS.table.seat, 10]} />
          <meshStandardMaterial color={PALETTE.wood} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
