import { describe, it, expect } from 'vitest';
import { generateLinkPatterns, findPrimarySkillGem } from '@/lib/regex/generate-from-build';
import { makeGemSlot, makePhase, makeLinkGroup, makeMinimalBuild } from '../../helpers/fixtures';

describe('generateLinkPatterns', () => {
  it('generates permutations for 2L', () => {
    const groups = [makeLinkGroup('2L', [makePhase('a1_after_hillock', [
      makeGemSlot('Fireball', 'B'),
      makeGemSlot('Frostbolt', 'G'),
    ])])];
    const patterns = generateLinkPatterns(groups);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].pattern).toBe('b-g|g-b');
    expect(patterns[0].linkSize).toBe(2);
  });

  it('generates permutations for 3L (BBG)', () => {
    const groups = [makeLinkGroup('3L', [makePhase('a1_after_hillock', [
      makeGemSlot('Fireball', 'B'),
      makeGemSlot('Frostbolt', 'B'),
      makeGemSlot('Arc', 'G'),
    ])])];
    const patterns = generateLinkPatterns(groups);
    expect(patterns).toHaveLength(1);
    // BBG sorted → b,b,g → permutations: b-b-g, b-g-b, g-b-b
    expect(patterns[0].pattern).toBe('b-b-g|b-g-b|g-b-b');
  });

  it('skips 1L groups', () => {
    const groups = [makeLinkGroup('1L', [makePhase('a1_after_hillock', [
      makeGemSlot('Fireball', 'B'),
    ])])];
    const patterns = generateLinkPatterns(groups);
    expect(patterns).toHaveLength(0);
  });

  it('skips 4L+ groups', () => {
    const groups = [makeLinkGroup('4L', [makePhase('a1_after_hillock', [
      makeGemSlot('Fireball', 'B'),
      makeGemSlot('Frostbolt', 'B'),
      makeGemSlot('Arc', 'G'),
      makeGemSlot('Spark', 'B'),
    ])])];
    const patterns = generateLinkPatterns(groups);
    expect(patterns).toHaveLength(0);
  });

  it('handles empty phases', () => {
    const groups = [makeLinkGroup('Empty', [])];
    const patterns = generateLinkPatterns(groups);
    expect(patterns).toHaveLength(0);
  });

  it('uses last phase of multi-phase link group', () => {
    const groups = [makeLinkGroup('Test', [
      makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')]),
      makePhase('a3_after_library', [makeGemSlot('Fireball', 'B'), makeGemSlot('Frostbolt', 'G')]),
    ])];
    const patterns = generateLinkPatterns(groups);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].pattern).toBe('b-g|g-b');
  });

  it('deduplicates identical patterns', () => {
    const groups = [
      makeLinkGroup('A', [makePhase('a1_after_hillock', [makeGemSlot('G1', 'B'), makeGemSlot('G2', 'G')])]),
      makeLinkGroup('B', [makePhase('a1_after_hillock', [makeGemSlot('G3', 'B'), makeGemSlot('G4', 'G')])]),
    ];
    const patterns = generateLinkPatterns(groups);
    // Both have same color combo (BG), should be deduplicated
    expect(patterns).toHaveLength(1);
  });

  it('generates BBB as single permutation', () => {
    const groups = [makeLinkGroup('BBB', [makePhase('a1_after_hillock', [
      makeGemSlot('G1', 'B'),
      makeGemSlot('G2', 'B'),
      makeGemSlot('G3', 'B'),
    ])])];
    const patterns = generateLinkPatterns(groups);
    expect(patterns[0].pattern).toBe('b-b-b');
  });
});

describe('findPrimarySkillGem', () => {
  it('finds skill gem from largest link group', () => {
    const build = makeMinimalBuild({
      linkGroups: [
        makeLinkGroup('Small', [makePhase('a1_after_hillock', [
          makeGemSlot('Arc', 'B'),
        ])]),
        makeLinkGroup('Big', [makePhase('a1_after_hillock', [
          makeGemSlot('Fireball', 'B'),
          makeGemSlot('Spell Echo Support', 'B'),
          makeGemSlot('Elemental Focus Support', 'B'),
        ])]),
      ],
    });
    const gem = findPrimarySkillGem(build);
    expect(gem).not.toBeNull();
    expect(gem!.name).toBe('Fireball');
  });

  it('returns null for empty build', () => {
    const build = makeMinimalBuild({ linkGroups: [] });
    expect(findPrimarySkillGem(build)).toBeNull();
  });

  it('returns null for supports-only group', () => {
    const build = makeMinimalBuild({
      linkGroups: [
        makeLinkGroup('Supports', [makePhase('a1_after_hillock', [
          makeGemSlot('Spell Echo Support', 'B'),
          makeGemSlot('Elemental Focus Support', 'B'),
        ])]),
      ],
    });
    expect(findPrimarySkillGem(build)).toBeNull();
  });

  it('includes tags from gem data', () => {
    const build = makeMinimalBuild({
      linkGroups: [
        makeLinkGroup('Main', [makePhase('a1_after_hillock', [
          makeGemSlot('Fireball', 'B'),
          makeGemSlot('Spell Echo Support', 'B'),
        ])]),
      ],
    });
    const gem = findPrimarySkillGem(build);
    expect(gem).not.toBeNull();
    expect(gem!.tags).toBeDefined();
    expect(gem!.tags.length).toBeGreaterThan(0);
  });
});
