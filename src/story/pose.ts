import { Vector3 } from 'three';
import { DARTS, POOL, RIGS, TENNIS, fitRig, mixRig } from '../layout';
import type { Rig } from '../layout';
import type { Stage } from '../stage';
import type { DartsStation } from '../stations/darts';
import type { PoolStation } from '../stations/pool';
import type { TennisStation } from '../stations/tennis';
import type { Ui } from '../ui';
import { T, sceneAt } from './beats';
import { arc, easeIn, easeInOut, easeOut, hop, keys, lerp, lerp3, rollAngle, span, wobble } from './paths';
import type { Vec3 } from './paths';

/**
 * The whole story as one pure function: clock time in, scene out. Nothing here remembers anything
 * between calls, so scrolling forwards, backwards, jumping or snapping always lands on the right frame.
 * Pacing lives in beats.ts, coordinates in layout.ts.
 */

// ---- Pool: the 8-ball rolls from the far end to the pocket rim, then drops in. -----------------------------------
const rollDx = POOL.pocket[0] - POOL.ballStart[0];
const rollDz = POOL.pocket[2] - POOL.ballStart[2];
const rollNorm = Math.hypot(rollDx, rollDz);
const dirX = rollDx / rollNorm;
const dirZ = rollDz / rollNorm;
const poolRim: Vec3 = [POOL.pocket[0] - dirX * 0.05, POOL.ballStart[1], POOL.pocket[2] - dirZ * 0.05];
const poolPit: Vec3 = [POOL.pocket[0], POOL.pocket[1] - 0.18, POOL.pocket[2]];
const rollLen = Math.hypot(poolRim[0] - POOL.ballStart[0], poolRim[2] - POOL.ballStart[2]);

// ---- Table tennis: a chain of hops. Each node is a hit or a bounce; `apex` lifts the hop that leaves it. ----------
interface Node {
  t: number;
  p: Vec3;
  apex: number;
}
const NODES: Node[] = [
  { t: T.cut1, p: TENNIS.drop, apex: 0 }, // ball appears and falls
  { t: T.bounceA1, p: TENNIS.bounceA, apex: 0.1 },
  { t: T.hitA1, p: TENNIS.hitA, apex: 0.3 },
  { t: T.bounceB1, p: TENNIS.bounceB, apex: 0.1 },
  { t: T.hitB1, p: TENNIS.hitB, apex: 0.3 },
  { t: T.bounceA2, p: TENNIS.bounceA, apex: 0.1 },
  { t: T.hitA2, p: TENNIS.hitA, apex: 0.3 },
  { t: T.bounceB2, p: TENNIS.bounceB, apex: 0.1 },
  { t: T.hitB2, p: TENNIS.hitB, apex: 0 }, // the smash: leaves the table for the lens
];

/** Racket lean (rad, forwards = towards the net): wind up, hit at `leanHit`, follow through, relax. */
const swing = (hits: number[]): Array<[number, number]> =>
  hits.flatMap((h): Array<[number, number]> => [
    [h - 1.8, 0],
    [h - 0.9, -0.95],
    [h, TENNIS.leanHit],
    [h + 0.6, 0.85],
    [h + 1.8, 0],
  ]);
const swingA = swing([T.hitA1, T.hitA2]);
const swingB = swing([T.hitB1, T.hitB2]);

// ---- Darts: one arcing flight from the lens to the bullseye, then a quiver. ---------------------------------------
const dartPath = (u: number): Vec3 => {
  const p = lerp3(DARTS.start, DARTS.tip, easeIn(u, 1.15));
  p[1] += arc(u, 0.08);
  return p;
};

export function createStory(d: { stage: Stage; pool: PoolStation; tennis: TennisStation; darts: DartsStation; ui: Ui }) {
  const { stage, pool, tennis, darts, ui } = d;
  const camera = stage.camera;
  const axis = new Vector3(dirZ, 0, -dirX);

  const applyRig = (r: Rig): void => {
    camera.position.set(r.pos[0], r.pos[1], r.pos[2]);
    camera.lookAt(r.look[0], r.look[1], r.look[2]);
    const fov = r.fov;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  };

  /** Moves and spins the 8-ball for clock time t; returns where it is (the camera keeps it in frame). */
  const placePoolBall = (t: number): Vec3 => {
    const travel = span(t, 0, T.rollEnd);
    const s = travel * (1.48 - 0.48 * travel);
    const drop = span(t, T.rollEnd, T.dropEnd);
    let p: Vec3;
    let distance: number;
    if (drop === 0) {
      p = lerp3(POOL.ballStart, poolRim, s);
      distance = s * rollLen;
    } else {
      const advance = easeOut(drop, 2);
      p = [
        lerp(poolRim[0], poolPit[0], advance),
        lerp(poolRim[1], poolPit[1], easeIn(drop)), // gravity
        lerp(poolRim[2], poolPit[2], advance),
      ];
      distance = rollLen + advance * 0.05;
    }
    pool.ball.position.set(p[0], p[1], p[2]);
    // Rolling without slipping turns the ball about (up x direction of travel).
    pool.ball.quaternion.setFromAxisAngle(axis, rollAngle(distance, POOL.ballR));
    pool.ball.material.color.setScalar(1 - 0.92 * easeIn(drop));
    pool.shadow.position.set(p[0] + dirX * 0.024, POOL.feltY + 0.0015, p[2] + dirZ * 0.024);
    pool.shadow.material.opacity = 1 - span(s, 0.94, 1);
    return p;
  };

  const poolRig = (t: number, ball: Vec3): Rig => {
    let r: Rig;
    if (t < T.rollEnd) r = mixRig(RIGS.poolStart, RIGS.poolRim, easeInOut(span(t, 0, T.rollEnd)));
    else if (t < T.plunge) r = mixRig(RIGS.poolRim, RIGS.poolAbove, easeInOut(span(t, T.rollEnd, T.plunge)));
    else r = mixRig(RIGS.poolAbove, RIGS.poolPit, easeIn(span(t, T.plunge, T.cut1))); // under the rising veil
    return { ...r, look: lerp3(r.look, ball, 0.55) }; // keep the ball in frame
  };

  const tennisRig = (t: number): Rig =>
    t < T.hitB2 ? mixRig(RIGS.tennisA, RIGS.tennisB, easeInOut(span(t, T.cut1, T.hitB2))) : RIGS.tennisB;

  const dartsRig = (t: number): Rig =>
    t < T.impact ? mixRig(RIGS.dartsA, RIGS.dartsB, easeInOut(span(t, T.cut2, T.impact))) : RIGS.dartsB;

  const tennisBallAt = (t: number, cam: Rig): Vec3 => {
    const last = NODES[NODES.length - 1];
    if (t >= last.t) {
      // The smash: from the racket straight at the lens, accelerating.
      const f = new Vector3(cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]).normalize();
      const lens: Vec3 = [cam.pos[0] + f.x * 0.22, cam.pos[1] + f.y * 0.22, cam.pos[2] + f.z * 0.22];
      const u = span(t, last.t, T.cut2);
      const p = lerp3(last.p, lens, easeOut(u, 1.25));
      p[1] += arc(u, 0.12) * (1 - u);
      return p;
    }
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i];
      const b = NODES[i + 1];
      if (t <= b.t) {
        const u = span(t, a.t, b.t);
        // First leg is a free fall straight down onto the table; the rest are hops.
        if (i === 0) return [lerp(a.p[0], b.p[0], u), lerp(a.p[1], b.p[1], easeIn(u)), lerp(a.p[2], b.p[2], u)];
        return hop(a.p, b.p, u, a.apex);
      }
    }
    return last.p;
  };

  const placeTennis = (t: number, cam: Rig): void => {
    const p = tennisBallAt(t, cam);
    tennis.ball.position.set(p[0], p[1], p[2]);
    // After the smash the ball grows to fill the lens (perspective alone would not get there in time).
    tennis.ball.scale.setScalar(t > T.hitB2 ? 1 + 11 * easeIn(span(t, T.hitB2, T.cut2), 3) : 1);
    const height = Math.max(0, p[1] - TENNIS.tableY - TENNIS.ballR);
    tennis.shadow.visible = Math.abs(p[0] - TENNIS.x0) < TENNIS.halfL - 0.07 && Math.abs(p[2]) < TENNIS.halfW - 0.07;
    tennis.shadow.position.set(p[0], TENNIS.tableY + 0.002, p[2]);
    tennis.shadow.scale.setScalar(1 + height);
    tennis.shadow.material.opacity = 0.9 * Math.exp(-6 * height);
    tennis.racketA.rotation.z = -keys(t, swingA);
    tennis.racketB.rotation.z = keys(t, swingB);
  };

  const placeDarts = (t: number): void => {
    const u = span(t, T.dartStart, T.impact);
    const p = dartPath(u);
    // Aim along the direction of travel, sampled either side of u (kept clear of the very end).
    const uc = Math.min(u, 0.97);
    const a = dartPath(Math.max(0, uc - 0.02));
    const b = dartPath(Math.min(1, uc + 0.02));
    darts.dart.position.set(p[0], p[1], p[2]);
    darts.dart.lookAt(p[0] + b[0] - a[0], p[1] + b[1] - a[1], p[2] + b[2] - a[2]);
    darts.dart.rotateZ(u * 3.1);

    const dt = t - T.impact;
    if (dt > 0) {
      darts.dart.rotateX(wobble(dt, 0.065, 0.85, 1.15)); // pivot stays at the embedded tip
      darts.dart.rotateY(wobble(dt, 0.035, 0.85, 0.95));
    }
    darts.setScore(dt >= 0);
  };

  const apply = (t: number): void => {
    const scene = sceneAt(t);
    pool.group.visible = scene === 'pool';
    tennis.group.visible = scene === 'tennis';
    darts.group.visible = scene === 'darts';

    let raw: Rig;
    if (scene === 'pool') raw = poolRig(t, placePoolBall(t));
    else if (scene === 'tennis') raw = tennisRig(t);
    else raw = dartsRig(t);

    const rig = fitRig(raw, camera.aspect);
    if (scene === 'tennis') placeTennis(t, rig);
    if (scene === 'darts') placeDarts(t);

    applyRig(rig);
    ui.apply(t, scene);
    stage.invalidate();
  };

  return { apply };
}
