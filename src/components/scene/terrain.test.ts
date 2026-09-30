import { describe, expect, it } from 'vitest';
import { heightAt, insideRing } from './terrain';

describe('terrain', () => {
  it('has a tall central range and low wide edges', () => {
    let peak = 0;
    for (let x = -3; x < 3; x += 0.1) for (let z = -2; z < 2; z += 0.1) peak = Math.max(peak, heightAt(x, z));
    expect(peak).toBeGreaterThan(2.5);
    expect(heightAt(-7, 0)).toBeLessThan(0.5);
    expect(heightAt(7, 0)).toBeLessThan(0.5);
  });

  it('classifies continent interiors and oceans', () => {
    const ring = [[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]];
    expect(insideRing(2, 2, ring)).toBe(true);
    expect(insideRing(8, 2, ring)).toBe(false);
  });
});
