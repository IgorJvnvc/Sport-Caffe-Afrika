import { describe, expect, it } from 'vitest';
import { arc, hop, keys, rollAngle, span, wobble } from './paths';

describe('paths', () => {
  it('arc is 0 at both ends and peaks in the middle', () => {
    expect(arc(0, 0.3)).toBe(0);
    expect(arc(1, 0.3)).toBe(0);
    expect(arc(0.5, 0.3)).toBeCloseTo(0.3);
  });

  it('hop lands exactly on its endpoints and lifts in between', () => {
    expect(hop([0, 0, 0], [2, 1, 0], 0, 0.5)).toEqual([0, 0, 0]);
    expect(hop([0, 0, 0], [2, 1, 0], 1, 0.5)).toEqual([2, 1, 0]);
    expect(hop([0, 0, 0], [2, 0, 0], 0.5, 0.5)[1]).toBeCloseTo(0.5);
  });

  it('one circumference of travel is exactly one turn', () => {
    expect(rollAngle(2 * Math.PI * 0.03, 0.03)).toBeCloseTo(2 * Math.PI);
  });

  it('wobble is silent before the hit and dies away after', () => {
    expect(wobble(0, 1, 0.5, 1)).toBe(0);
    expect(wobble(-3, 1, 0.5, 1)).toBe(0);
    expect(Math.abs(wobble(12.25, 1, 0.5, 1))).toBeLessThan(Math.abs(wobble(0.25, 1, 0.5, 1)));
  });

  it('span clamps to 0..1', () => {
    expect(span(-5, 0, 10)).toBe(0);
    expect(span(5, 0, 10)).toBe(0.5);
    expect(span(50, 0, 10)).toBe(1);
  });

  it('keys passes through its keyframes and holds outside them', () => {
    const frames: Array<[number, number]> = [
      [0, 0],
      [1, 10],
      [2, 0],
    ];
    expect(keys(-1, frames)).toBe(0);
    expect(keys(1, frames)).toBe(10);
    expect(keys(5, frames)).toBe(0);
    expect(keys(0.5, frames)).toBeGreaterThan(0);
    expect(keys(0.5, frames)).toBeLessThan(10);
  });
});
