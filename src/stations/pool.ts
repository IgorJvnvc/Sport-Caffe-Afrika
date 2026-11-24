import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SpotLight,
  Path,
  Shape,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { POOL } from '../layout';
import { ballTexture, contactShadow, feltTexture } from '../textures';

export interface PoolStation {
  group: Group;
  /** The hero 8-ball. Moved and spun by story/pose.ts. */
  ball: Mesh<SphereGeometry, MeshPhysicalMaterial>;
  shadow: ReturnType<typeof contactShadow>;
}

export const poolPockets = [-1, 1].flatMap((side) =>
  [-POOL.pocket[2], 0, POOL.pocket[2]].map((z) => [side * Math.abs(POOL.pocket[0]), z] as const),
);

export function pocketedSlab(width: number, length: number, depth: number) {
  const shape = new Shape().moveTo(-width, -length).lineTo(width, -length)
    .lineTo(width, length).lineTo(-width, length).closePath();
  for (const [x, z] of poolPockets) {
    shape.holes.push(new Path().absarc(x, -z, POOL.pocketR, 0, Math.PI * 2, true));
  }
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 20 })
    .rotateX(-Math.PI / 2).translate(0, -depth, 0);
}

export function cornerCap(side: number, end: number) {
  const x = Math.abs(POOL.pocket[0]);
  const z = POOL.pocket[2];
  const radius = POOL.pocketR + 0.003;
  const outerX = POOL.halfW + 0.1295;
  const outerZ = POOL.halfL + 0.1295;
  const startZ = POOL.halfL - 0.092;
  const start = Math.asin((startZ - z) / radius);
  const shape = new Shape().moveTo(side * outerX, -end * startZ);
  // The cap joins both rails outside the mouth; the curved edge leaves the ball path open.
  for (let i = 0; i <= 40; i++) {
    const angle = start + (Math.PI - start) * i / 40;
    shape.lineTo(side * (x + radius * Math.cos(angle)), -end * (z + radius * Math.sin(angle)));
  }
  shape.lineTo(side * (x - radius), -end * outerZ)
    .lineTo(side * outerX, -end * outerZ).closePath();
  return new ExtrudeGeometry(shape, { depth: 0.069, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 })
    .rotateX(-Math.PI / 2).translate(0, -0.072, 0);
}

export function sidePocketCap(side: number) {
  const x = Math.abs(POOL.pocket[0]);
  const radius = POOL.pocketR + 0.003;
  const inside = POOL.halfW + 0.0245;
  const outside = POOL.halfW + 0.1295;
  const end = 0.094;
  const arc = Math.acos((inside - x) / radius);
  const shape = new Shape().moveTo(side * inside, -end);
  for (let i = 0; i <= 40; i++) {
    const a = arc * (1 - i / 20);
    shape.lineTo(side * (x + radius * Math.cos(a)), -radius * Math.sin(a));
  }
  shape.lineTo(side * inside, end).lineTo(side * outside, end)
    .lineTo(side * outside, -end).closePath();
  return new ExtrudeGeometry(shape, { depth: 0.069, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 })
    .rotateX(-Math.PI / 2).translate(0, -0.072, 0);
}

export function createPool(): PoolStation {
  const group = new Group();
  const { feltY, halfW, halfL, ballR, pocketR } = POOL;

  const floor = new Mesh(new PlaneGeometry(45, 45), new MeshStandardMaterial({ color: '#0c0b0e', roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;

  const fibers = feltTexture();
  const cloth = new MeshStandardMaterial({ color: '#185c45', roughness: 0.97, map: fibers, bumpMap: fibers, bumpScale: 0.001 });
  const walnut = new MeshPhysicalMaterial({ color: '#4b281a', roughness: 0.42, clearcoat: 0.35 });
  const rubber = new MeshStandardMaterial({ color: '#14100e', roughness: 0.92 });
  const brass = new MeshStandardMaterial({ color: '#b69a67', metalness: 0.65, roughness: 0.38 });
  const capFinish = new MeshStandardMaterial({ color: '#29231f', roughness: 0.55 });
  const felt = new Mesh(pocketedSlab(halfW + 0.07, halfL + 0.055, 0.025), cloth);
  felt.position.y = feltY;
  const skirt = new Mesh(pocketedSlab(halfW + 0.135, halfL + 0.135, 0.19), walnut);
  skirt.position.y = feltY - 0.024;

  const rail = (width: number, length: number, x: number, z: number, alongZ: boolean) => {
    const top = new Mesh(new RoundedBoxGeometry(width, 0.076, length, 2, 0.013), walnut);
    top.position.set(x, feltY + 0.016, z);
    const cushion = new Mesh(new RoundedBoxGeometry(alongZ ? 0.041 : width, 0.046,
      alongZ ? length : 0.041, 2, 0.012), cloth);
    cushion.position.set(alongZ ? Math.sign(x) * (halfW + 0.014) : x, feltY + 0.016,
      alongZ ? z : Math.sign(z) * (halfL + 0.014));
    group.add(top, cushion);
    for (const offset of [-0.24, 0, 0.24]) {
      const sight = new Mesh(new BoxGeometry(0.011, 0.002, 0.011), brass);
      sight.position.set(x + (alongZ ? 0 : offset), feltY + 0.055, z + (alongZ ? offset : 0));
      sight.rotation.y = Math.PI / 4;
      group.add(sight);
    }
  };
  for (const side of [-1, 1]) {
    const sideCap = new Mesh(sidePocketCap(side), capFinish);
    sideCap.position.y = feltY + 0.054;
    group.add(sideCap);
    for (const end of [-1, 1]) {
      rail(0.105, halfL - 0.18, side * (halfW + 0.077), end * (halfL / 2), true);
      const cap = new Mesh(cornerCap(side, end), capFinish);
      cap.position.y = feltY + 0.054;
      const leg = new Mesh(new RoundedBoxGeometry(0.155, 0.57, 0.175, 2, 0.014), walnut);
      leg.position.set(side * 0.47, 0.315, end * 0.94);
      const foot = new Mesh(new CylinderGeometry(0.066, 0.079, 0.03, 24), rubber);
      foot.position.set(leg.position.x, 0.015, leg.position.z);
      group.add(cap, leg, foot);
    }
    rail(halfW * 2 - 0.18, 0.105, 0, side * (halfL + 0.077), false);
  }
  const cupGeometry = new CylinderGeometry(pocketR, pocketR * 0.82, 0.22, 40, 1, true);
  const liner = rubber.clone();
  liner.side = DoubleSide;
  for (const [x, z] of poolPockets) {
    const cup = new Mesh(cupGeometry, liner);
    cup.position.set(x, feltY - 0.11, z);
    const bottom = new Mesh(new CircleGeometry(pocketR, 40), rubber);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.set(x, feltY - 0.22, z);
    group.add(cup, bottom);
  }

  const ball = new Mesh(
    new SphereGeometry(ballR, 48, 32),
    new MeshPhysicalMaterial({ map: ballTexture(), roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.14 }),
  );

  const lamp = new SpotLight(0xffc98a, 13, 0, 1.0, 0.6, 2);
  lamp.target.position.set(0, feltY, 0);

  const shade = new Mesh(new CylinderGeometry(0.1, 0.24, 0.115, 40, 1, true), liner);
  shade.position.set(0, 2.03, 0);
  const bulb = new Mesh(new CircleGeometry(0.216, 40), new MeshStandardMaterial({ emissive: '#ffd7a0', emissiveIntensity: 2 }));
  bulb.rotation.x = Math.PI / 2;
  bulb.position.set(0, 1.975, 0);
  const stem = new Mesh(new BoxGeometry(0.013, 0.85, 0.013), rubber);
  stem.position.set(0, 2.51, 0);
  lamp.position.set(0, 1.96, 0);
  const shadow = contactShadow(0.17);
  group.add(floor, felt, skirt, ball, shadow, shade, bulb, stem, lamp, lamp.target);
  return { group, ball, shadow };
}
