import { T, flashAt, veilAt } from './story/beats';
import type { SceneKey } from './story/beats';

export interface Ui {
  /** Syncs every DOM overlay to clock time `t`. Cheap to call every frame: only writes what changed. */
  apply(t: number, scene: SceneKey): void;
}

export function createUi(root: HTMLElement): Ui {
  const find = (selector: string): HTMLElement => root.querySelector<HTMLElement>(selector)!;
  const veil = find('.veil');
  const flash = find('.flash');
  const cta = find('.cta');
  const hint = find('.hint');

  let lastScene: SceneKey | '' = '';
  let lastVeil = -1;
  let lastFlash = -1;
  let lastCta: boolean | null = null;
  let lastHint: boolean | null = null;

  return {
    apply(t, scene) {
      if (scene !== lastScene) {
        root.dataset.scene = scene; // CSS shows the matching caption
        lastScene = scene;
      }
      const v = veilAt(t);
      if (v !== lastVeil) {
        veil.style.opacity = String(v);
        lastVeil = v;
      }
      const f = flashAt(t);
      if (f !== lastFlash) {
        flash.style.opacity = String(f);
        lastFlash = f;
      }
      const ctaOn = t >= T.ctaOn;
      if (ctaOn !== lastCta) {
        cta.classList.toggle('is-on', ctaOn);
        lastCta = ctaOn;
      }
      const hintOff = t >= 2;
      if (hintOff !== lastHint) {
        hint.classList.toggle('is-off', hintOff);
        lastHint = hintOff;
      }
    },
  };
}
