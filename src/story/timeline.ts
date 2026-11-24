import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LABELS, snapTime } from './beats';

export interface Timeline {
  /** The master clock, 0..100. Written by the scrub, read by everything. */
  clock: { t: number };
  st: ScrollTrigger;
  /** Jump the page's scroll position to clock time `t`. */
  scrollToTime(t: number): void;
}

/**
 * GSAP only maps scroll position to the clock here: pin, scrub smoothing and snapping.
 * What the clock *means* lives in pose.ts, so it never depends on tween state.
 */
export function createTimeline(trigger: HTMLElement, onTime: (t: number) => void): Timeline {
  gsap.registerPlugin(ScrollTrigger);

  const clock = { t: 0 };
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: '+=700%',
      pin: true,
      scrub: 1,
      snap: {
        snapTo: (progress: number, self?: ScrollTrigger) => snapTime(progress * 100, self?.direction ?? 1) / 100,
        inertia: false, // decide from where scrolling stopped, not from where it would have coasted to
        duration: { min: 0.4, max: 1.6 },
        delay: 0.2,
        ease: 'power2.inOut',
      },
    },
    onUpdate: () => onTime(clock.t),
  });
  tl.to(clock, { t: 100, duration: 100 });
  for (const [name, at] of Object.entries(LABELS)) tl.addLabel(name, at);

  const st = tl.scrollTrigger!;
  return {
    clock,
    st,
    scrollToTime: (t) => window.scrollTo(0, st.start + (t / 100) * (st.end - st.start)),
  };
}
