import { describe, it, expect } from 'vitest';
import { matchPobGem } from '@/lib/pob/gem-matcher';

describe('matchPobGem', () => {
  it('matches exact gem name', () => {
    const result = matchPobGem({ nameSpec: 'Fireball', enabled: true });
    expect(result.status).toBe('matched');
    if (result.status === 'matched') {
      expect(result.gem.name).toBe('Fireball');
    }
  });

  it('appends Support suffix when missing', () => {
    const result = matchPobGem({ nameSpec: 'Spell Echo', enabled: true });
    expect(result.status).toBe('matched');
    if (result.status === 'matched') {
      expect(result.gem.name).toBe('Spell Echo Support');
    }
  });

  it('skips Vaal gems', () => {
    const result = matchPobGem({ nameSpec: 'Vaal Fireball', enabled: true });
    expect(result.status).toBe('skipped');
    if (result.status === 'skipped') {
      expect(result.reason).toBe('Vaal gem');
    }
  });

  it('skips item-granted skills (has skillId but no gemId)', () => {
    const result = matchPobGem({ nameSpec: 'Some Item Skill', enabled: true, skillId: 'skill1' });
    expect(result.status).toBe('skipped');
    if (result.status === 'skipped') {
      expect(result.reason).toBe('Item-granted skill');
    }
  });

  it('strips Anomalous prefix', () => {
    const result = matchPobGem({ nameSpec: 'Anomalous Fireball', enabled: true });
    expect(result.status).toBe('matched');
    if (result.status === 'matched') {
      expect(result.gem.name).toBe('Fireball');
    }
  });

  it('strips Divergent prefix', () => {
    const result = matchPobGem({ nameSpec: 'Divergent Arc', enabled: true });
    expect(result.status).toBe('matched');
    if (result.status === 'matched') {
      expect(result.gem.name).toBe('Arc');
    }
  });

  it('returns not_found for unknown gem', () => {
    const result = matchPobGem({ nameSpec: 'CompletelyFakeGem12345', enabled: true });
    expect(result.status).toBe('not_found');
  });

  it('handles case-insensitive matching', () => {
    const result = matchPobGem({ nameSpec: 'fireball', enabled: true });
    expect(result.status).toBe('matched');
    if (result.status === 'matched') {
      expect(result.gem.name).toBe('Fireball');
    }
  });

  it('matches well-known support gems', () => {
    const supports = [
      'Added Fire Damage',
      'Faster Casting',
      'Concentrated Effect',
      'Elemental Focus',
    ];
    for (const name of supports) {
      const result = matchPobGem({ nameSpec: name, enabled: true });
      expect(result.status).toBe('matched');
      if (result.status === 'matched') {
        expect(result.gem.name).toBe(`${name} Support`);
        expect(result.gem.type).toBe('support');
      }
    }
  });

  it('does not skip gems with both gemId and skillId', () => {
    const result = matchPobGem({ nameSpec: 'Fireball', enabled: true, gemId: 'gem1', skillId: 'skill1' });
    expect(result.status).toBe('matched');
  });
});
