import { describe, expect, it } from 'vitest';
import { flashAt, sceneAt, snapTime, veilAt } from './beats';

describe('snapTime', () => {
  it('never snaps inside a scene, so slow scrubbing stays free', () => {
    expect(snapTime(10, 1)).toBe(10);
    expect(snapTime(30.5, 1)).toBe(30.5);
    expect(snapTime(45, 1)).toBe(45);
    expect(snapTime(75, -1)).toBe(75);
  });

  it('glides forward to the next scene after a key moment', () => {
    expect(snapTime(35, 1)).toBe(40);
    expect(snapTime(60, 1)).toBe(72);
    expect(snapTime(90, 1)).toBe(100);
  });

  it('returns to the previous resting frame when scrolling back', () => {
    expect(snapTime(35, -1)).toBe(30);
    expect(snapTime(60, -1)).toBe(56);
  });

  it('leaves the final stretch alone when scrolling back', () => {
    expect(snapTime(90, -1)).toBe(90);
  });

  it('does not glide for the last few pixels', () => {
    expect(snapTime(39.8, 1)).toBe(39.8);
  });
});

describe('cuts', () => {
  it('veil is black exactly at the pool to table tennis cut', () => {
    expect(veilAt(0)).toBe(0);
    expect(veilAt(36)).toBe(1);
    expect(veilAt(40)).toBe(0);
  });

  it('flash is white exactly at the table tennis to darts cut', () => {
    expect(flashAt(0)).toBe(0);
    expect(flashAt(67)).toBe(1);
    expect(flashAt(72)).toBe(0);
  });

  it('the scene changes at the cuts', () => {
    expect(sceneAt(35.9)).toBe('pool');
    expect(sceneAt(36)).toBe('tennis');
    expect(sceneAt(66.9)).toBe('tennis');
    expect(sceneAt(67)).toBe('darts');
  });
});
