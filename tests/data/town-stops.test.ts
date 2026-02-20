import { describe, it, expect } from 'vitest';
import {
  TOWN_STOPS,
  GEM_QUESTS,
  getStopById,
  getStopsForAct,
  getActNumbers,
  getDefaultStops,
  getQuestById,
} from '@/data/town-stops';

describe('getStopById', () => {
  it('finds a1_after_hillock', () => {
    const stop = getStopById('a1_after_hillock');
    expect(stop).toBeDefined();
    expect(stop!.label).toBe('After Hillock');
    expect(stop!.actNumber).toBe(1);
  });

  it('finds a3_after_library', () => {
    const stop = getStopById('a3_after_library');
    expect(stop).toBeDefined();
    expect(stop!.actNumber).toBe(3);
  });

  it('finds a6_town_arrival', () => {
    const stop = getStopById('a6_town_arrival');
    expect(stop).toBeDefined();
    expect(stop!.actNumber).toBe(6);
  });

  it('returns undefined for unknown ID', () => {
    expect(getStopById('nonexistent')).toBeUndefined();
  });
});

describe('getStopsForAct', () => {
  it('returns 5 stops for Act 1', () => {
    expect(getStopsForAct(1)).toHaveLength(5);
  });

  it('returns 4 stops for Act 2', () => {
    expect(getStopsForAct(2)).toHaveLength(4);
  });

  it('returns stops for Act 3', () => {
    expect(getStopsForAct(3).length).toBeGreaterThan(0);
  });

  it('returns empty for invalid act', () => {
    expect(getStopsForAct(99)).toHaveLength(0);
  });
});

describe('getActNumbers', () => {
  it('returns acts 1 through 10 sorted', () => {
    const acts = getActNumbers();
    expect(acts).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('getDefaultStops', () => {
  it('returns only defaultEnabled stops', () => {
    const defaults = getDefaultStops();
    expect(defaults.every((s) => s.defaultEnabled)).toBe(true);
  });

  it('includes a1_after_hillock', () => {
    const defaults = getDefaultStops();
    expect(defaults.some((s) => s.id === 'a1_after_hillock')).toBe(true);
  });

  it('excludes a2_town_arrival (not default)', () => {
    const defaults = getDefaultStops();
    expect(defaults.some((s) => s.id === 'a2_town_arrival')).toBe(false);
  });
});

describe('getQuestById', () => {
  it('finds enemy_at_the_gate', () => {
    const q = getQuestById('enemy_at_the_gate');
    expect(q).toBeDefined();
    expect(q!.name).toBe('Enemy at the Gate');
  });

  it('returns undefined for unknown quest', () => {
    expect(getQuestById('nonexistent')).toBeUndefined();
  });
});

describe('data integrity', () => {
  it('all stop IDs are unique', () => {
    const ids = TOWN_STOPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sortOrder is monotonically increasing', () => {
    for (let i = 1; i < TOWN_STOPS.length; i++) {
      expect(TOWN_STOPS[i].sortOrder).toBeGreaterThan(TOWN_STOPS[i - 1].sortOrder);
    }
  });

  it('questsCompleted grows cumulatively (each stop has at least as many as the previous)', () => {
    for (let i = 1; i < TOWN_STOPS.length; i++) {
      expect(TOWN_STOPS[i].questsCompleted.length).toBeGreaterThanOrEqual(
        TOWN_STOPS[i - 1].questsCompleted.length,
      );
    }
  });

  it('all quest IDs are unique', () => {
    const ids = GEM_QUESTS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
