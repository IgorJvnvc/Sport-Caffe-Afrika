import {
  CanvasTexture, CircleGeometry, ConeGeometry, CylinderGeometry, DoubleSide, Group, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Shape, ShapeGeometry, SpotLight, SRGBColorSpace,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { DARTS } from '../layout';

function makeDart() {
  const dart = new Group();
  const metal = new MeshStandardMaterial({ color: '#a7a49b', metalness: 0.85, roughness: 0.36 });
  const nylon = new MeshStandardMaterial({ color: '#282528', roughness: 0.56 });
  const film = new MeshStandardMaterial({ color: '#b12720', roughness: 0.42, side: DoubleSide });
  const body = (geometry: CylinderGeometry | ConeGeometry, z: number, material = metal) => {
    const mesh = new Mesh(geometry.rotateX(Math.PI / 2), material);
    mesh.position.z = z;
    dart.add(mesh);
  };
  body(new ConeGeometry(0.0023, 0.019, 18), -0.0095, nylon);
  body(new CylinderGeometry(0.0023, 0.0043, 0.012, 24), -0.025);
  body(new CylinderGeometry(0.0043, 0.0043, 0.039, 24), -0.0505);
  body(new CylinderGeometry(0.0043, 0.0025, 0.008, 24), -0.074);
  for (let i = 0; i < 9; i++) body(new CylinderGeometry(0.0044, 0.0044, 0.001, 24), -0.034 - i * 0.0036, nylon);
  body(new CylinderGeometry(0.0025, 0.0018, 0.043, 16), -0.0995, nylon);

  const shape = new Shape().moveTo(0, -0.102).lineTo(0.017, -0.121)
    .quadraticCurveTo(0.023, -0.127, 0.019, -0.138).lineTo(0.012, -0.149).lineTo(0, -0.146).closePath();
  const wing = new ShapeGeometry(shape).rotateX(Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const mesh = new Mesh(wing, film);
    mesh.rotation.z = i * Math.PI / 2;
    dart.add(mesh);
  }
  return dart;
}

function boardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const g = canvas.getContext('2d')!;
  g.translate(512, 512);
  const circle = (radius: number, color: string) => {
    g.beginPath();
    g.arc(0, 0, radius, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
  };
  circle(512, '#17191a');
  const numbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  const step = Math.PI / 10;
  for (const [i, number] of numbers.entries()) {
    const a = -Math.PI / 2 + i * step;
    const light = i % 2 !== 0;
    for (const [inner, outer, color] of [
      [36, 240, light ? '#d3c4a4' : '#24282a'], [240, 260, light ? '#285a44' : '#9d2927'],
      [260, 367, light ? '#d3c4a4' : '#24282a'], [367, 389, light ? '#285a44' : '#9d2927'],
    ] as const) {
      g.beginPath();
      g.arc(0, 0, outer, a - step / 2, a + step / 2);
      g.arc(0, 0, inner, a + step / 2, a - step / 2, true);
      g.closePath();
      g.fillStyle = color;
      g.fill();
      g.strokeStyle = '#17191a';
      g.lineWidth = 3;
      g.stroke();
    }
    g.font = '600 51px Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#e7e1d6';
    g.fillText(String(number), Math.cos(a) * 446, Math.sin(a) * 446);
  }
  circle(36, '#285a44');
  circle(15, '#9d2927');
  for (let y = -385; y <= 385; y += 10) {
    for (let x = -385; x <= 385; x += 10) {
      if (Math.hypot(x, y) > 385) continue;
      g.beginPath();
      g.arc(x, y, 1.65, 0, Math.PI * 2);
      g.fillStyle = '#080909a0';
      g.fill();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createDarts() {
  const group = new Group();
  const { x0, boardR, bull } = DARTS;
  const wall = new Mesh(new PlaneGeometry(5, 3.2), new MeshStandardMaterial({ color: '#211d19', roughness: 0.93 }));
  wall.position.set(x0, 1.5, -0.34);
  const polymer = new MeshStandardMaterial({ color: '#222426', roughness: 0.68 });
  const trim = new MeshStandardMaterial({ color: '#4d4e4b', roughness: 0.52, metalness: 0.45 });
  const piece = (w: number, h: number, d: number, x: number, y: number, z: number, material = polymer) => {
    const mesh = new Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.015), material);
    mesh.position.set(x0 + x, y, z);
    group.add(mesh);
  };
  piece(0.67, 0.94, 0.23, 0, 1.595, -0.14);
  piece(0.59, 1.13, 0.31, 0, 0.565, -0.14);
  piece(0.62, 0.09, 0.28, 0, 1.095, -0.126, trim);
  piece(0.61, 0.47, 0.02, 0, 0.71, 0.022);
  for (const side of [-1, 1]) piece(0.034, 0.63, 0.074, side * 0.307, 1.72, 0.005, trim);

  const display = document.createElement('canvas');
  display.width = 256;
  display.height = 96;
  const g = display.getContext('2d')!;
  const screen = new CanvasTexture(display);
  screen.colorSpace = SRGBColorSpace;
  const score = new Mesh(new PlaneGeometry(0.22, 0.082), new MeshBasicMaterial({ map: screen, toneMapped: false }));
  score.position.set(x0, 1.32, 0.012);
  let lastHit: boolean | undefined;
  function setScore(hit: boolean) {
    if (hit === lastHit) return;
    lastHit = hit;
    g.fillStyle = '#0b1411';
    g.fillRect(0, 0, 256, 96);
    g.fillStyle = '#72a691';
    g.font = '17px monospace';
    g.textAlign = 'center';
    g.fillText('PLAYER 1', 128, 24);
    g.fillStyle = '#c9ffe0';
    g.font = 'bold 48px monospace';
    g.fillText(hit ? '451' : '501', 128, 74);
    screen.needsUpdate = true;
  }
  setScore(false);

  const board = new Group();
  board.position.set(...bull);
  const rim = new Mesh(new CylinderGeometry(boardR + 0.025, boardR + 0.025, 0.046, 80).rotateX(Math.PI / 2), polymer);
  rim.position.z = -0.025;
  const face = new Mesh(new CircleGeometry(boardR, 96),
    new MeshStandardMaterial({ map: boardTexture(), roughness: 0.86 }));
  board.add(rim, face);

  const dart = makeDart();
  const lamp = new SpotLight(0xffd8b0, 19, 0, 0.48, 0.75, 2);
  lamp.position.set(x0 - 0.44, 2.43, 1.2);
  lamp.target.position.set(...bull);
  group.add(wall, score, board, dart, lamp, lamp.target);
  return { group, dart, setScore };
}

export type DartsStation = ReturnType<typeof createDarts>;
