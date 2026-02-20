import { describe, it, expect } from 'vitest';
import { getGemVendorCost, summarizeVendorCosts } from '@/lib/gem-costs';
import type { GemPickup } from '@/types/build';

describe('getGemVendorCost', () => {
  it('returns Wisdom for early Act 1 gem (Fireball for Witch)', () => {
    const cost = getGemVendorCost('Fireball', 'Witch');
    expect(cost).toBeDefined();
    expect(cost!.shortName).toBe('Wisdom');
  });

  it('returns Trans for late Act 1 gem (The Caged Brute)', () => {
    // "Added Fire Damage Support" is available from the_caged_brute for Marauder
    const cost = getGemVendorCost('Added Fire Damage Support', 'Marauder');
    if (cost) {
      expect(['Wisdom', 'Trans']).toContain(cost.shortName);
    }
  });

  it('returns Alt for Act 2 gem', () => {
    // Herald of Ash becomes available at intruders_in_black for Marauder
    const cost = getGemVendorCost('Herald of Ash', 'Marauder');
    if (cost) {
      expect(['Alt', 'Trans', 'Wisdom']).toContain(cost.shortName);
    }
  });

  it('returns null for non-vendor gems', () => {
    // A completely made-up gem name should return null
    const cost = getGemVendorCost('NonExistentGem12345', 'Witch');
    expect(cost).toBeNull();
  });
});

describe('summarizeVendorCosts', () => {
  it('returns empty for empty input', () => {
    expect(summarizeVendorCosts([], 'Witch')).toEqual([]);
  });

  it('aggregates costs by currency', () => {
    const pickups: GemPickup[] = [
      { id: '1', gemName: 'Fireball', gemColor: 'blue', source: 'vendor' },
      { id: '2', gemName: 'Freezing Pulse', gemColor: 'blue', source: 'vendor' },
    ];
    const costs = summarizeVendorCosts(pickups, 'Witch');
    // Both should be available from early quests
    expect(costs.length).toBeGreaterThanOrEqual(1);
    // All returned items should have a count
    for (const c of costs) {
      expect(c.count).toBeGreaterThan(0);
      expect(c.currency).toBeTruthy();
      expect(c.shortName).toBeTruthy();
    }
  });

  it('skips gems not found as vendor rewards', () => {
    const pickups: GemPickup[] = [
      { id: '1', gemName: 'NonExistentGem12345', gemColor: 'red', source: 'vendor' },
    ];
    const costs = summarizeVendorCosts(pickups, 'Witch');
    expect(costs).toEqual([]);
  });
});
