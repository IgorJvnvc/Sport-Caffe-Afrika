import { installDev } from './dev';
import { applyLook } from './look';
import { createStage } from './stage';
import { createDarts } from './stations/darts';
import { createPool } from './stations/pool';
import { createTennis } from './stations/tennis';
import { createStory } from './story/pose';
import { createTimeline } from './story/timeline';
import { createUi } from './ui';

const root = document.querySelector<HTMLElement>('#story')!;
const stage = createStage(root.querySelector<HTMLCanvasElement>('#stage')!);
applyLook(stage.scene, stage.renderer);

const pool = createPool();
const tennis = createTennis();
const darts = createDarts();
stage.scene.add(pool.group, tennis.group, darts.group);

const story = createStory({ stage, pool, tennis, darts, ui: createUi(root) });
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let timeline: ReturnType<typeof createTimeline> | undefined;
const syncMotion = () => {
  if (motion.matches) {
    timeline?.st.kill();
    timeline = undefined;
    delete window.__afrika;
    story.apply(0);
  } else {
    timeline = createTimeline(root, story.apply);
    story.apply(timeline.clock.t);
    if (import.meta.env.DEV) installDev({ stage, apply: story.apply, timeline });
  }
};
stage.onResize(() => story.apply(timeline?.clock.t ?? 0));
motion.addEventListener('change', syncMotion);
syncMotion();
stage.renderNow();
