import type { Stage } from './stage';
import { LABELS } from './story/beats';
import type { Timeline } from './story/timeline';

interface AfrikaDev {
  /** Render the scene at clock time `t`, bypassing scroll. Deterministic: this is what the storyboard uses. */
  seek(t: number): number;
  /** Really scroll the page to clock time `t` (exercises scrub and snap). */
  scrollTo(t: number): void;
  /** Current clock time. */
  t(): number;
  scrollY(): number;
  /** Draw calls, triangles and live resources from the last rendered frame. */
  info(): { calls: number; triangles: number; geometries: number; textures: number };
  labels: typeof LABELS;
}

declare global {
  interface Window {
    __afrika?: AfrikaDev;
  }
}

/** Dev-only inspection hook (never installed in production builds). */
export function installDev(d: { stage: Stage; apply: (t: number) => void; timeline: Timeline }): void {
  window.__afrika = {
    seek(t) {
      d.timeline.clock.t = t;
      document.documentElement.classList.add('still'); // no CSS transitions, so frames are deterministic
      d.apply(t);
      d.stage.renderNow();
      return t;
    },
    scrollTo: (t) => d.timeline.scrollToTime(t),
    t: () => d.timeline.clock.t,
    scrollY: () => window.scrollY,
    info() {
      const i = d.stage.renderer.info;
      return {
        calls: i.render.calls,
        triangles: i.render.triangles,
        geometries: i.memory.geometries,
        textures: i.memory.textures,
      };
    },
    labels: LABELS,
  };
}
