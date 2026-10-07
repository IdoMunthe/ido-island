// Tiny damped-spring integrator used by every 3D object. Each spring is a
// plain object: v (value), t (target), vel, k (stiffness), c (damping).
export function spring(v, k, c) {
  return { v, t: v, vel: 0, k, c };
}

export function step(s, dt) {
  const a = s.k * (s.t - s.v) - s.c * s.vel;
  s.vel += a * dt;
  s.v += s.vel * dt;
  return Math.abs(s.t - s.v) > 0.0005 || Math.abs(s.vel) > 0.0005;
}

export function stepAll(springs, dt) {
  let moving = false;
  for (const key in springs) moving = step(springs[key], dt) || moving;
  return moving;
}

// Frames can be long after an idle stretch (frameloop="demand"); clamp so
// springs never explode.
export function clampDt(dt) {
  return Math.min(dt || 0.016, 1 / 30);
}

// Deterministic pseudo-random in [0, 1) from an integer seed.
export function seeded(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
