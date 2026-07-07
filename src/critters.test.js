import { describe, it, expect } from 'vitest';
import { CRITTERS, pickCritters } from './critters.js';

describe('pickCritters', () => {
  it('returns the requested count with no duplicates', () => {
    const picked = pickCritters(10);
    expect(picked).toHaveLength(10);
    expect(new Set(picked.map((c) => c.name)).size).toBe(10);
  });

  it('only returns entries from the known pool', () => {
    const names = new Set(CRITTERS.map((c) => c.name));
    const picked = pickCritters(10);
    for (const c of picked) expect(names.has(c.name)).toBe(true);
  });

  it('produces a different order across calls (not deterministic)', () => {
    const runs = new Set();
    for (let i = 0; i < 10; i++) {
      runs.add(pickCritters(CRITTERS.length).map((c) => c.name).join(','));
    }
    // Extremely unlikely all 10 shuffles land identically if the shuffle works.
    expect(runs.size).toBeGreaterThan(1);
  });
});
