import { ACESFilmicToneMapping, Color, FogExp2, HemisphereLight, PMREMGenerator } from 'three';
import type { Scene, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const NIGHT = '#07060a';

/** Scene-wide look: a dark room, a little fog for depth, a dim environment so metal and polish have something to reflect. */
export function applyLook(scene: Scene, renderer: WebGLRenderer): void {
  scene.background = new Color(NIGHT);
  scene.fog = new FogExp2(NIGHT, 0.05);
  scene.add(new HemisphereLight(0x6b7aa3, 0x1a120d, 0.35));

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35; // dim: this is a night room, the lamps do the real work
  pmrem.dispose();

  renderer.toneMapping = ACESFilmicToneMapping;
}
