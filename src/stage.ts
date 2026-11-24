import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { gsap } from 'gsap';

export interface Stage {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  /** Ask for a redraw on the next tick. Nothing draws while nothing changes. */
  invalidate(): void;
  /** Draw right now (screenshots, dev tools). */
  renderNow(): void;
  onResize(fn: () => void): void;
}

export function createStage(canvas: HTMLCanvasElement): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.05, 60);

  let dirty = true;
  const resizeListeners: Array<() => void> = [];

  const resize = (): void => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); // the canvas is sized by CSS
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    resizeListeners.forEach((fn) => fn());
    dirty = true;
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const renderNow = (): void => {
    dirty = false;
    renderer.render(scene, camera);
  };
  gsap.ticker.add(() => {
    if (dirty) renderNow();
  });

  return {
    renderer,
    scene,
    camera,
    invalidate: () => {
      dirty = true;
    },
    renderNow,
    onResize: (fn) => {
      resizeListeners.push(fn);
    },
  };
}
