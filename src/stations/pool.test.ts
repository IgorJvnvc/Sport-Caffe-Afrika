import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { expect, it } from 'vitest';
import { POOL } from '../layout';
import { cornerCap, pocketedSlab, poolPockets, sidePocketCap } from './pool';

it('leaves clearance for the ball through all six pockets of the bed and cabinet', () => {
  expect(poolPockets).toHaveLength(6);
  const material = new MeshBasicMaterial();
  for (const slab of [pocketedSlab(0.63, 1.175, 0.025), pocketedSlab(0.695, 1.255, 0.19)]) {
    const mesh = new Mesh(slab, material);
    const ray = new Raycaster(new Vector3(0, 1, 0), new Vector3(0, -1, 0));
    expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
    for (const [x, z] of poolPockets) {
      for (const [dx, dz] of [[0, 0], [POOL.ballR, 0], [0, -POOL.ballR]]) {
        ray.ray.origin.set(x + dx, 1, z + dz);
        expect(ray.intersectObject(mesh)).toHaveLength(0);
      }
    }
    slab.dispose();
  }
  material.dispose();
});

it('closes the outside of each side pocket without obstructing the ball', () => {
  const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0));
  const material = new MeshBasicMaterial();
  for (const side of [-1, 1]) {
    const cap = new Mesh(sidePocketCap(side), material);
    ray.ray.origin.set(side * (POOL.halfW + 0.115), 1, 0);
    expect(ray.intersectObject(cap).length).toBeGreaterThan(0);
    ray.ray.origin.set(side * (Math.abs(POOL.pocket[0]) + POOL.ballR), 1, 0);
    expect(ray.intersectObject(cap)).toHaveLength(0);
    cap.geometry.dispose();
  }
  material.dispose();
});

it('joins the outer rail corners without filling their pocket openings', () => {
  const material = new MeshBasicMaterial();
  const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0));
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const cap = new Mesh(cornerCap(side, end), material);
      ray.ray.origin.set(side * 0.67, 1, end * 1.23);
      expect(ray.intersectObject(cap).length).toBeGreaterThan(0);
      for (const dx of [-POOL.ballR, 0, POOL.ballR]) {
        ray.ray.origin.set(side * Math.abs(POOL.pocket[0]) + dx, 1, end * POOL.pocket[2]);
        expect(ray.intersectObject(cap)).toHaveLength(0);
      }
      cap.geometry.dispose();
    }
  }
  material.dispose();
});
