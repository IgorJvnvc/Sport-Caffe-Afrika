import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three';

export function feltTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const g = canvas.getContext('2d')!;
  const pixels = g.createImageData(128, 128);
  let seed = 7;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const shade = 235 + (seed >>> 28);
    pixels.data.set([shade, shade, shade, 255], i);
  }
  g.putImageData(pixels, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(7, 7);
  tex.anisotropy = 8;
  return tex;
}

let shadowTexture: CanvasTexture | undefined;

export function contactShadow(size: number) {
  if (!shadowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const g = canvas.getContext('2d')!;
    const gradient = g.createRadialGradient(32, 32, 3, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.42)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gradient;
    g.fillRect(0, 0, 64, 64);
    shadowTexture = new CanvasTexture(canvas);
  }
  const shadow = new Mesh(new PlaneGeometry(size, size).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
  return shadow;
}

/** The 8-ball: black with two white number discs. Drawn at 2:1, so the discs are circular on the sphere's equator. */
export function ballTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0b0b0d';
  g.fillRect(0, 0, c.width, c.height);
  g.font = '700 84px Arial, Helvetica, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const x of [256, 768]) {
    g.fillStyle = '#f4f1ea';
    g.beginPath();
    g.arc(x, 256, 66, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#0b0b0d';
    g.fillText('8', x, 262);
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
