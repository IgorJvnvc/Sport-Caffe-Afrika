import { lerp, lerp3 } from './story/paths';
import type { Vec3 } from './story/paths';

/**
 * World layout. Metres, +Y up, all coordinates absolute. The three stations sit 40 m apart
 * along X so they never share a frame; only the active one is visible at any moment.
 */

export const POOL = {
  x0: 0,
  feltY: 0.8,
  halfW: 0.56,
  halfL: 1.12,
  ballR: 0.03,
  pocketR: 0.075,
  pocket: [-0.545, 0.8, 1.095] as Vec3, // near-left corner pocket, centre, at felt height
  ballStart: [0.2, 0.83, -0.95] as Vec3, // ball centre at t = 0
};

export const TENNIS = {
  x0: 40,
  tableY: 0.76,
  halfL: 1.37,
  halfW: 0.7625,
  netH: 0.1525,
  ballR: 0.02,
  bladeHalfThickness: 0.008,
  racketLen: 0.176, // grip pivot to blade centre
  leanHit: 0.436, // racket lean (rad, towards the net) at the moment of contact
  drop: [39.45, 1.5, 0.1] as Vec3, // where the ball appears, above the first bounce
  bounceA: [39.45, 0.78, 0.1] as Vec3,
  bounceB: [40.55, 0.78, -0.1] as Vec3,
  hitA: [38.8, 0.98, 0.06] as Vec3,
  hitB: [41.2, 0.98, -0.06] as Vec3,
};

export const DARTS = {
  x0: 80,
  boardR: 0.225,
  bull: [80, 1.73, 0.03] as Vec3, // centre of the board face
  tip: [80, 1.73, 0.026] as Vec3, // dart tip seats 4 mm into the face
  start: [80.34, 1.54, 1.48] as Vec3,
};

export interface Rig {
  pos: Vec3;
  look: Vec3;
  fov: number;
}

export const RIGS = {
  poolStart: { pos: [-0.84, 1.57, 2.65], look: [0.02, 1.04, -0.22], fov: 44 } as Rig,
  // Above the rail, looking down into the corner; then over the pocket mouth; then the plunge into it.
  poolRim: { pos: [-0.2, 1.25, 1.62], look: [-0.5, 0.8, 1.05], fov: 34 } as Rig,
  poolAbove: { pos: [-0.545, 1.0, 1.25], look: [-0.545, 0.7, 1.095], fov: 44 } as Rig,
  poolPit: { pos: [-0.545, 0.7, 1.095], look: [-0.545, 0.1, 1.0], fov: 55 } as Rig,
  // Table tennis: side-on and wide enough to hold both rackets and the whole table.
  tennisA: { pos: [40.65, 1.75, 3.65], look: [40, 0.92, 0], fov: 39 } as Rig,
  tennisB: { pos: [40.4, 1.6, 3.55], look: [40, 0.91, 0], fov: 39 } as Rig,
  // Darts: at the throw line, easing towards the board.
  dartsA: { pos: [80.47, 1.62, 2.08], look: [80, 1.49, 0.03], fov: 41 } as Rig,
  dartsB: { pos: [79.3, 1.75, 1.48], look: [80, 1.57, 0.03], fov: 37 } as Rig,
};

export const mixRig = (a: Rig, b: Rig, u: number): Rig => ({
  pos: lerp3(a.pos, b.pos, u),
  look: lerp3(a.look, b.look, u),
  fov: lerp(a.fov, b.fov, u),
});

const REF_ASPECT = 1.6;

/** Narrow screens get the camera pulled back so the subject still fits across. (Refined for portrait in Step 7.) */
export const fitRig = (r: Rig, aspect: number): Rig => {
  const k = Math.min(3.2, Math.max(1, REF_ASPECT / aspect));
  if (k === 1) return r;
  return {
    ...r,
    pos: [
      r.look[0] + (r.pos[0] - r.look[0]) * k,
      r.look[1] + (r.pos[1] - r.look[1]) * k,
      r.look[2] + (r.pos[2] - r.look[2]) * k,
    ],
  };
};
