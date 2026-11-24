import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SpotLight,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TENNIS } from '../layout';
import { contactShadow } from '../textures';

export interface TennisStation {
  group: Group;
  /** The ping-pong ball. Moved by story/pose.ts. */
  ball: Mesh<SphereGeometry, MeshStandardMaterial>;
  shadow: ReturnType<typeof contactShadow>;
  /** Pivot at the grip. pose.ts swings it about Z (towards the net = forwards). */
  racketA: Group;
  racketB: Group;
}

/** One racket. Red rubber faces the net, black on the back. Built at the grip pivot, blade `racketLen` above. */
function makeRacket(flip: boolean): Group {
  const pivot = new Group();
  const model = new Group();
  const wood = new MeshStandardMaterial({ color: '#c8955a', roughness: 0.6 });
  const red = new MeshStandardMaterial({ color: '#b3141f', roughness: 0.8 });
  const black = new MeshStandardMaterial({ color: '#111114', roughness: 0.8 });

  // Cylinder materials are [side, top cap, bottom cap]. After rotating to lie along X, the bottom cap faces +X.
  const blade = new Mesh(new CylinderGeometry(0.079, 0.079, TENNIS.bladeHalfThickness * 2, 40)
    .rotateZ(Math.PI / 2).scale(1, 1.07, 0.96), [wood, black, red]);
  blade.position.y = TENNIS.racketLen;
  const handle = new Mesh(new RoundedBoxGeometry(0.025, 0.12, 0.029, 2, 0.007), wood);
  handle.position.y = 0.06;

  model.add(blade, handle);
  if (flip) model.rotation.y = Math.PI; // racket B faces -X, towards the net from the right
  pivot.add(model);
  return pivot;
}

export function createTennis(): TennisStation {
  const group = new Group();
  const { x0, tableY, halfL, halfW, netH, ballR, racketLen, leanHit, hitA, hitB } = TENNIS;

  const floor = new Mesh(new PlaneGeometry(45, 45), new MeshStandardMaterial({ color: '#0c0b0e', roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.x = x0;

  const top = new Mesh(
    new RoundedBoxGeometry(halfL * 2, 0.03, halfW * 2, 2, 0.004),
    new MeshStandardMaterial({ color: '#214877', roughness: 0.8 }),
  );
  top.position.set(x0, tableY - 0.015, 0);

  const frame = new MeshStandardMaterial({ color: '#303238', roughness: 0.52, metalness: 0.48 });
  const line = new MeshStandardMaterial({ color: '#e7ebed', roughness: 0.94 });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, material = frame) => {
    const mesh = new Mesh(new BoxGeometry(w, h, d), material);
    mesh.position.set(x0 + x, y, z);
    group.add(mesh);
    return mesh;
  };
  for (const side of [-1, 1]) {
    box(halfL * 2 - 0.02, 0.001, 0.02, 0, tableY + 0.001, side * (halfW - 0.018), line);
    box(0.02, 0.001, halfW * 2 - 0.056, side * (halfL - 0.018), tableY + 0.001, 0, line);
    box(halfL * 2 - 0.16, 0.068, 0.035, 0, tableY - 0.06, side * (halfW - 0.09));
    box(0.043, 0.045, halfW * 2 - 0.24, side * 0.99, 0.25, 0);
    for (const end of [-1, 1]) {
      box(0.045, tableY - 0.045, 0.045, side * 0.99, (tableY - 0.045) / 2, end * 0.60);
      box(0.065, 0.023, 0.065, side * 0.99, 0.014, end * 0.60);
    }
    box(0.028, netH + 0.01, 0.031, 0, tableY + netH / 2, side * (halfW + 0.068));
    box(0.084, 0.028, 0.12, 0, tableY - 0.014, side * (halfW + 0.01));
  }
  box(halfL * 2 - 0.056, 0.001, 0.004, 0, tableY + 0.001, 0, line);
  box(0.014, 0.012, halfW * 2 + 0.136, 0, tableY + netH - 0.006, 0, line);
  const grid = document.createElement('canvas');
  grid.width = 512;
  grid.height = 48;
  const g = grid.getContext('2d')!;
  g.fillStyle = '#b3c3ca';
  for (let x = 0; x < grid.width; x += 4) g.fillRect(x, 0, 1, grid.height);
  for (let y = 0; y < grid.height; y += 4) g.fillRect(0, y, grid.width, 1);
  const net = new Mesh(new PlaneGeometry(halfW * 2 + 0.136, netH).rotateY(Math.PI / 2),
    new MeshStandardMaterial({ map: new CanvasTexture(grid), side: DoubleSide, transparent: true, depthWrite: false }));
  net.position.set(x0, tableY + netH / 2, 0);

  const ball = new Mesh(
    new SphereGeometry(ballR, 32, 24),
    new MeshStandardMaterial({ color: '#f6f4ee', roughness: 0.4 }),
  );

  // Place the ball one radius beyond the rubber surface, not inside the blade.
  const contact = ballR + TENNIS.bladeHalfThickness;
  const reach = racketLen * Math.sin(leanHit) + contact * Math.cos(leanHit);
  const rise = racketLen * Math.cos(leanHit) - contact * Math.sin(leanHit);
  const racketA = makeRacket(false);
  racketA.position.set(
    hitA[0] - reach,
    hitA[1] - rise,
    hitA[2],
  );
  const racketB = makeRacket(true);
  racketB.position.set(
    hitB[0] + reach,
    hitB[1] - rise,
    hitB[2],
  );

  const lamp = new SpotLight(0xffc98a, 30, 0, 1.0, 0.6, 2);
  lamp.position.set(x0, 2.6, 0.5);
  lamp.target.position.set(x0, tableY, 0);

  const shadow = contactShadow(0.13);
  group.add(floor, top, net, ball, shadow, racketA, racketB, lamp, lamp.target);
  return { group, ball, shadow, racketA, racketB };
}
