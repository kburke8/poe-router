import { describe, it, expect } from 'vitest';
import {
  generateLinkPatterns,
  generateColorLinkPatterns,
  THREE_LINK_PATTERN,
  POE_329_LAUNCH,
  findPrimarySkillGem,
} from '@/lib/regex/generate-from-build';
import { makeGemSlot, makePhase, makeLinkGroup, makeMinimalBuild } from '../../helpers/fixtures';

const BEFORE_LAUNCH = new Date(POE_329_LAUNCH.getTime() - 1);
const AT_LAUNCH = POE_329_LAUNCH;

describe('generateLinkPatterns (date switch)', () => {
  const groups = [makeLinkGroup('2L', [makePhase('a1_after_hillock', [
    makeGemSlot('Fireball', 'B'),
    makeGemSlot('Frostbolt', 'G'),
  ])])];

  it('uses colour permutations before 3.29 launch', () => {
    const patterns = generateLinkPatterns(groups, BEFORE_LAUNCH);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].pattern).toBe('b-g|g-b');
    expect(patterns[0].linkSize).toBe(2);
  });

  it('uses the universal colour-agnostic pattern from launch onward', () => {
    const patterns = generateLinkPatterns(groups, AT_LAUNCH);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].pattern).toBe(THREE_LINK_PATTERN);
    expect(patterns[0].linkSize).toBe(3);
    expect(patterns[0].sourceName).toBe('3-Link+');
  });

  it('universal pattern is emitted even with no link groups (post-launch)', () => {
    expect(generateLinkPatterns([], AT_LAUNCH)).toHaveLength(1);
  });

  it('universal pattern matches linked sockets but not unlinked groups', () => {
    // "-" joins linked sockets in item text; " " separates unlinked groups
    const re = new RegExp(THREE_LINK_PATTERN);
    expect(re.test('Sockets: W-W-W')).toBe(true);   // 3L, white (3.29 default)
    expect(re.test('Sockets: B-G-G-R')).toBe(true); // 4L contains a 3L
    expect(re.test('Sockets: W-W W')).toBe(false);  // 2L + 1L
    expect(re.test('Sockets: W W W')).toBe(false);  // three unlinked
    expect(re.test('Sockets: W-W')).toBe(false);    // plain 2L
  });
});

describe('generateColorLinkPatterns (pre-3.29 behaviour)', () => {
  it('generates permutations for 2L', () => {
    const groups = [makeLinkGroup('2L', [makePhase('a1_after_hillock', [
      makeGemSlot('Fireball', 'B'),
      makeGemSlot('Frostbolt', 'G'),
    ])])];
    const patterns = generateColorLinkPatterns(groups);
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
    const patterns = generateColorLinkPatterns(groups);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].pattern).toBe('b-b-g|b-g-b|g-b-b');
  });

  it('skips 1L and 4L+ groups', () => {
    const groups = [
      makeLinkGroup('1L', [makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')])]),
      makeLinkGroup('4L', [makePhase('a1_after_hillock', [
        makeGemSlot('Fireball', 'B'),
        makeGemSlot('Frostbolt', 'B'),
        makeGemSlot('Arc', 'G'),
        makeGemSlot('Spark', 'B'),
      ])]),
    ];
    expect(generateColorLinkPatterns(groups)).toHaveLength(0);
  });

  it('handles empty phases', () => {
    expect(generateColorLinkPatterns([makeLinkGroup('Empty', [])])).toHaveLength(0);
  });

  it('deduplicates identical patterns across groups', () => {
    const groups = [
      makeLinkGroup('A', [makePhase('a1_after_hillock', [makeGemSlot('G1', 'B'), makeGemSlot('G2', 'G')])]),
      makeLinkGroup('B', [makePhase('a1_after_hillock', [makeGemSlot('G3', 'B'), makeGemSlot('G4', 'G')])]),
    ];
    expect(generateColorLinkPatterns(groups)).toHaveLength(1);
  });

  it('generates BBB as single permutation', () => {
    const groups = [makeLinkGroup('BBB', [makePhase('a1_after_hillock', [
      makeGemSlot('G1', 'B'),
      makeGemSlot('G2', 'B'),
      makeGemSlot('G3', 'B'),
    ])])];
    expect(generateColorLinkPatterns(groups)[0].pattern).toBe('b-b-b');
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
