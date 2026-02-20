import { describe, it, expect } from 'vitest';
import { POE_CLASSES, getAscendancies, getBeachGems } from '@/data/classes';

describe('getAscendancies', () => {
  it('returns Marauder ascendancies', () => {
    expect(getAscendancies('Marauder')).toEqual(['Juggernaut', 'Berserker', 'Chieftain']);
  });

  it('returns Scion ascendancy', () => {
    expect(getAscendancies('Scion')).toEqual(['Ascendant']);
  });

  it('returns Witch ascendancies', () => {
    expect(getAscendancies('Witch')).toEqual(['Necromancer', 'Elementalist', 'Occultist']);
  });

  it('returns empty array for unknown class', () => {
    expect(getAscendancies('UnknownClass')).toEqual([]);
  });
});

describe('getBeachGems', () => {
  it('returns Witch beach gems', () => {
    const gems = getBeachGems('Witch');
    expect(gems).toEqual({ skillGem: 'Fireball', supportGem: 'Arcane Surge Support' });
  });

  it('returns Marauder beach gems', () => {
    const gems = getBeachGems('Marauder');
    expect(gems).toEqual({ skillGem: 'Heavy Strike', supportGem: 'Ruthless Support' });
  });

  it('returns null for unknown class', () => {
    expect(getBeachGems('UnknownClass')).toBeNull();
  });
});

describe('data integrity', () => {
  it('has exactly 7 classes', () => {
    expect(POE_CLASSES).toHaveLength(7);
  });

  it('all classes have non-empty beachGems', () => {
    for (const cls of POE_CLASSES) {
      expect(cls.beachGems.skillGem).toBeTruthy();
      expect(cls.beachGems.supportGem).toBeTruthy();
    }
  });

  it('all classes have at least one ascendancy', () => {
    for (const cls of POE_CLASSES) {
      expect(cls.ascendancies.length).toBeGreaterThan(0);
    }
  });
});
