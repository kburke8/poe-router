import { describe, it, expect } from 'vitest';
import {
  isGemAvailable,
  getExcludedQuests,
  getNewQuestIdsAtStop,
  getAvailableGems,
} from '@/lib/gem-availability';

describe('isGemAvailable', () => {
  it('returns true for Fireball at a1_after_hillock for Witch (vendor)', () => {
    expect(isGemAvailable('Fireball', 'a1_after_hillock', 'Witch')).toBe(true);
  });

  it('returns false for a gem not yet available at early stop', () => {
    // Herald of Ash is not available at the first stop
    expect(isGemAvailable('Herald of Ash', 'a1_after_hillock', 'Witch')).toBe(false);
  });

  it('returns true for any gem after Lilly Roth (a6_town_arrival)', () => {
    expect(isGemAvailable('Herald of Ash', 'a6_town_arrival', 'Witch')).toBe(true);
    expect(isGemAvailable('Fireball', 'a6_town_arrival', 'Marauder')).toBe(true);
  });

  it('returns false for empty className', () => {
    expect(isGemAvailable('Fireball', 'a1_after_hillock', '')).toBe(false);
  });

  it('Siosa provides cross-class access after a3_after_library', () => {
    // A gem that Witch can buy but Marauder normally can't before Siosa
    // After library (Siosa), Marauder should be able to buy all Acts 1-3 vendor gems from all classes
    const available = isGemAvailable('Freezing Pulse', 'a3_after_library', 'Marauder');
    expect(available).toBe(true);
  });

  it('returns false for gem at stop that doesnt exist', () => {
    expect(isGemAvailable('Fireball', 'nonexistent_stop', 'Witch')).toBe(false);
  });
});

describe('getExcludedQuests', () => {
  it('returns empty set when no stops are disabled', () => {
    expect(getExcludedQuests(new Set())).toEqual(new Set());
  });

  it('excludes a_fixture_of_fate when a3_after_library is disabled', () => {
    const excluded = getExcludedQuests(new Set(['a3_after_library']));
    expect(excluded.has('a_fixture_of_fate')).toBe(true);
  });

  it('excludes sever_the_right_hand when a3_after_gravicius is disabled', () => {
    const excluded = getExcludedQuests(new Set(['a3_after_gravicius']));
    expect(excluded.has('sever_the_right_hand')).toBe(true);
  });
});

describe('getNewQuestIdsAtStop', () => {
  it('returns enemy_at_the_gate for first stop', () => {
    const newQuests = getNewQuestIdsAtStop('a1_after_hillock');
    expect(newQuests).toContain('enemy_at_the_gate');
  });

  it('returns new quests at a1_after_hailrake', () => {
    const newQuests = getNewQuestIdsAtStop('a1_after_hailrake');
    expect(newQuests).toContain('breaking_some_eggs');
    expect(newQuests).toContain('mercy_mission');
    // enemy_at_the_gate was already completed
    expect(newQuests).not.toContain('enemy_at_the_gate');
  });

  it('returns empty for stops with no new quests', () => {
    // a2_town_arrival has same quests as a1_after_merveil
    const newQuests = getNewQuestIdsAtStop('a2_town_arrival');
    expect(newQuests).toHaveLength(0);
  });
});

describe('getAvailableGems', () => {
  it('returns gems for Witch at a1_after_hillock', () => {
    const gems = getAvailableGems('a1_after_hillock', 'Witch');
    expect(gems.length).toBeGreaterThan(0);
    // Should include Fireball
    expect(gems.some((g) => g.gem.name === 'Fireball')).toBe(true);
  });

  it('marks new gems with isNewAtThisStop', () => {
    const gems = getAvailableGems('a1_after_hillock', 'Witch');
    // At the first stop, all gems should be new
    expect(gems.every((g) => g.isNewAtThisStop)).toBe(true);
  });

  it('returns all gems after Lilly Roth', () => {
    const gems = getAvailableGems('a6_town_arrival', 'Witch');
    // Should have many gems (all gems in the game)
    expect(gems.length).toBeGreaterThan(100);
  });

  it('returns empty for empty className', () => {
    expect(getAvailableGems('a1_after_hillock', '')).toEqual([]);
  });
});
