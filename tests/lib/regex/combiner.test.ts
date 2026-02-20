import { describe, it, expect } from 'vitest';
import { combineCategories, condenseGambasPatterns, getCharCount } from '@/lib/regex/combiner';
import type { RegexCategory, RegexEntry } from '@/types/regex';

function makeEntry(pattern: string, opts?: Partial<RegexEntry>): RegexEntry {
  return {
    id: crypto.randomUUID(),
    pattern,
    isExclusion: false,
    enabled: true,
    isCustom: false,
    ...opts,
  };
}

function makeCategory(id: string, entries: RegexEntry[]): RegexCategory {
  return { id: id as RegexCategory['id'], label: id, entries };
}

describe('combineCategories', () => {
  it('joins inclusions with |', () => {
    const cats = [makeCategory('gems', [makeEntry('fire'), makeEntry('frost')])];
    expect(combineCategories(cats)).toBe('fire|frost');
  });

  it('prefixes exclusions with !', () => {
    const cats = [makeCategory('dont_ever_show', [makeEntry('flask')])];
    expect(combineCategories(cats)).toBe('!flask');
  });

  it('combines exclusions and inclusions with space', () => {
    const cats = [
      makeCategory('dont_ever_show', [makeEntry('flask')]),
      makeCategory('gems', [makeEntry('fire')]),
    ];
    expect(combineCategories(cats)).toBe('!flask fire');
  });

  it('skips disabled entries', () => {
    const cats = [makeCategory('gems', [
      makeEntry('fire'),
      makeEntry('frost', { enabled: false }),
    ])];
    expect(combineCategories(cats)).toBe('fire');
  });

  it('handles isExclusion in non-exclusion category', () => {
    const cats = [makeCategory('gems', [
      makeEntry('fire'),
      makeEntry('flask', { isExclusion: true }),
    ])];
    const result = combineCategories(cats);
    expect(result).toContain('!flask');
    expect(result).toContain('fire');
  });

  it('returns empty string for no entries', () => {
    expect(combineCategories([])).toBe('');
  });

  it('removes subsumed patterns', () => {
    // "b-b" subsumes "b-b-g" because "b-b" is a substring of "b-b-g"
    const cats = [makeCategory('links', [
      makeEntry('b-b'),
      makeEntry('b-b-g'),
    ])];
    const result = combineCategories(cats);
    expect(result).toBe('b-b');
  });
});

describe('condenseGambasPatterns', () => {
  it('condenses 4 pure armor slots into compact pattern', () => {
    const entries: RegexEntry[] = [
      makeEntry('ev_body', { sourceName: 'Random Evasion Body' }),
      makeEntry('ev_boots', { sourceName: 'Random Evasion Boots' }),
      makeEntry('ev_gloves', { sourceName: 'Random Evasion Gloves' }),
      makeEntry('ev_helmet', { sourceName: 'Random Evasion Helmet' }),
    ];
    const result = condenseGambasPatterns(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('om.e.+n.[bgh]');
  });

  it('condenses 4 hybrid armor slots into compact pattern', () => {
    const entries: RegexEntry[] = [
      makeEntry('ae_body', { sourceName: 'Random Armour and Evasion Body' }),
      makeEntry('ae_boots', { sourceName: 'Random Armour and Evasion Boots' }),
      makeEntry('ae_gloves', { sourceName: 'Random Armour and Evasion Gloves' }),
      makeEntry('ae_helmet', { sourceName: 'Random Armour and Evasion Helmet' }),
    ];
    const result = condenseGambasPatterns(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('r.and.e.+n.[bgh]');
  });

  it('does not condense incomplete groups', () => {
    const entries: RegexEntry[] = [
      makeEntry('ev_body', { sourceName: 'Random Evasion Body' }),
      makeEntry('ev_boots', { sourceName: 'Random Evasion Boots' }),
      // Missing gloves and helmet
    ];
    const result = condenseGambasPatterns(entries);
    expect(result).toHaveLength(2);
    expect(result).toContain('ev_body');
    expect(result).toContain('ev_boots');
  });

  it('condenses weapon pairs (bow+quiver)', () => {
    const entries: RegexEntry[] = [
      makeEntry('bow_pattern', { sourceName: 'Random Bow' }),
      makeEntry('quiver_pattern', { sourceName: 'Random Quiver' }),
    ];
    const result = condenseGambasPatterns(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('dom.(bow|q)');
  });

  it('passes through non-gambas entries', () => {
    const entries: RegexEntry[] = [
      makeEntry('custom_pattern', { sourceName: 'Some Other Item' }),
    ];
    const result = condenseGambasPatterns(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('custom_pattern');
  });
});

describe('getCharCount', () => {
  it('returns length of string', () => {
    expect(getCharCount('hello')).toBe(5);
  });

  it('returns 0 for empty string', () => {
    expect(getCharCount('')).toBe(0);
  });

  it('counts special chars', () => {
    expect(getCharCount('!a|b c')).toBe(6);
  });
});
