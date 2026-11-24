import { easeIn, easeOut, span } from './paths';

/**
 * Moments on the master clock. One unit = 1% of the story's scroll length (tune pacing here).
 * Everything on screen is a pure function of this clock, so it scrubs forwards and backwards.
 */
export const T = {
  rollEnd: 30, // 8-ball reaches the pocket rim
  plunge: 34, // camera is over the pocket mouth and starts to dive in
  dropEnd: 36, // ball is at the bottom of the pocket
  cut1: 36, // behind the black veil: pool -> table tennis
  revealEnd: 39.5, // veil is gone
  bounceA1: 39, // table tennis rally: first bounce, then hit / bounce alternating
  hitA1: 41.5,
  bounceB1: 44.5,
  hitB1: 47,
  bounceA2: 50,
  hitA2: 52.5,
  bounceB2: 55.5,
  hitB2: 58, // the last hit: smashes the ball at the lens
  flashStart: 62, // white builds as the ball fills the screen
  cut2: 67, // behind the white flash: table tennis -> darts
  flashEnd: 72,
  dartStart: 68, // dart leaves the lens
  impact: 84, // dart lands in the bullseye
  ctaOn: 92,
  end: 100,
} as const;

export type SceneKey = 'pool' | 'tennis' | 'darts';

export const sceneAt = (t: number): SceneKey => (t < T.cut1 ? 'pool' : t < T.cut2 ? 'tennis' : 'darts');

/** Black overlay: rises into the pocket, clears as the table tennis table appears. */
export const veilAt = (t: number): number =>
  t < T.cut1 ? easeIn(span(t, 33, T.cut1)) : 1 - easeOut(span(t, T.cut1, T.revealEnd));

/** White overlay: builds as the ball fills the lens, clears as the dart flies out. */
export const flashAt = (t: number): number =>
  t < T.cut2 ? easeIn(span(t, T.flashStart, T.cut2)) : 1 - easeOut(span(t, T.cut2, T.flashEnd));

/** Resting frames the page can settle on. Used by the nav and by snapping. */
export const LABELS = { pool: 0, rim: 30, tennis: 40, ready: 56, darts: 72, end: 100 } as const;

/**
 * Snap zones. Scrolling inside a scene is never snapped, so slow scrubbing stays free.
 * Stop just after a key moment (pocket drop, last hit, bullseye) and the page glides on.
 */
const ZONES: ReadonlyArray<{ from: number; to: number; fwd: number; back: number | null }> = [
  { from: 31, to: 40, fwd: 40, back: 30 }, // after the ball tips into the pocket -> table tennis
  { from: 58.5, to: 72, fwd: 72, back: 56 }, // after the last hit -> darts
  { from: 85, to: 100, fwd: 100, back: null }, // after the bullseye -> reservation call to action
];

/** Where the clock should come to rest if scrolling stops at `t` (dir: 1 forwards, -1 backwards). */
export const snapTime = (t: number, dir: number): number => {
  for (const z of ZONES) {
    // Within 0.4 of the target is already "there": no glide for a few pixels.
    if (t >= z.from && t < z.to - 0.4) return dir >= 0 ? z.fwd : (z.back ?? t);
  }
  return t;
};
