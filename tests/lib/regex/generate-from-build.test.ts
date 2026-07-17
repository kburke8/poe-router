import { describe, it, expect } from 'vitest';
import { generateLinkPatterns, THREE_LINK_PATTERN, findPrimarySkillGem } from '@/lib/regex/generate-from-build';
import { makeGemSlot, makePhase, makeLinkGroup, makeMinimalBuild } from '../../helpers/fixtures';

describe('generateLinkPatterns', () => {
  // As of 3.29, sockets are colour-agnostic: one universal 3-link+ pattern
  // replaces the old per-build colour permutations.
  it('returns the single colour-agnostic 3-link+ pattern', () => {
    const patterns = generateLinkPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].pattern).toBe(THREE_LINK_PATTERN);
    expect(patterns[0].pattern).toBe('.-.-.');
    expect(patterns[0].linkSize).toBe(3);
    expect(patterns[0].sourceName).toBe('3-Link+');
  });

  it('pattern matches linked sockets but not unlinked groups', () => {
    // "-" joins linked sockets in item text; " " separates unlinked groups
    const re = new RegExp(THREE_LINK_PATTERN);
    expect(re.test('Sockets: W-W-W')).toBe(true);   // 3L, white (3.29 default)
    expect(re.test('Sockets: B-G-G-R')).toBe(true); // 4L contains a 3L
    expect(re.test('Sockets: W-W W')).toBe(false);  // 2L + 1L
    expect(re.test('Sockets: W W W')).toBe(false);  // three unlinked
    expect(re.test('Sockets: W-W')).toBe(false);    // plain 2L
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
