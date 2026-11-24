/** Pure math for the story. No Three.js in here, so it can be unit-tested and reasoned about on its own. */
export type Vec3 = [number, number, number];

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Progress of `t` through [t0, t1], clamped to 0..1. */
export const span = (t: number, t0: number, t1: number): number => clamp01((t - t0) / (t1 - t0));

export const easeIn = (u: number, power = 2): number => Math.pow(u, power);
export const easeOut = (u: number, power = 2): number => 1 - Math.pow(1 - u, power);
export const easeInOut = (u: number): number => u * u * (3 - 2 * u);

/** Parabola: 0 at both ends, `apex` at u = 0.5. */
export const arc = (u: number, apex: number): number => 4 * apex * u * (1 - u);

/** A hop between two points, lifted `apex` above the straight line at its middle. */
export const hop = (from: Vec3, to: Vec3, u: number, apex: number): Vec3 => {
  const p = lerp3(from, to, u);
  p[1] += arc(u, apex);
  return p;
};

/** Rolling without slipping: the angle (rad) a ball of `radius` has turned after travelling `distance`. */
export const rollAngle = (distance: number, radius: number): number => distance / radius;

/** Damped sine, 0 for t <= 0. `decay` is per unit of t, `freq` in cycles per unit of t. */
export const wobble = (t: number, amp: number, decay: number, freq: number): number =>
  t <= 0 ? 0 : amp * Math.exp(-decay * t) * Math.sin(2 * Math.PI * freq * t);

/**
 * Smooth keyframes [[t, value], ...], sorted by t. Cubic Hermite, so speed carries through
 * each key instead of stopping on it (a racket must swing *through* the ball).
 * Holds the first and last value outside the range.
 */
export const keys = (t: number, frames: ReadonlyArray<readonly [number, number]>): number => {
  const n = frames.length;
  if (t <= frames[0][0]) return frames[0][1];
  if (t >= frames[n - 1][0]) return frames[n - 1][1];
  let i = 1;
  while (t > frames[i][0]) i++;
  const [t0, v0] = frames[i - 1];
  const [t1, v1] = frames[i];
  const h = t1 - t0;
  // Tangent at each end of the segment: slope across the neighbours, flat at the ends of the list.
  const m0 = i - 1 === 0 ? 0 : (v1 - frames[i - 2][1]) / (t1 - frames[i - 2][0]);
  const m1 = i === n - 1 ? 0 : (frames[i + 1][1] - v0) / (frames[i + 1][0] - t0);
  const s = (t - t0) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * h * m1;
};
