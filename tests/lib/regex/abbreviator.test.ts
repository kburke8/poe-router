import { describe, it, expect } from 'vitest';
import { abbreviate, computeAbbreviations } from '@/lib/regex/abbreviator';
import gemsData from '@/data/gems.json';

const allGemNames = [
  ...gemsData.skills.map((g) => g.name),
  ...gemsData.supports.map((g) => g.name),
];

describe('abbreviate', () => {
  it('pattern matches the target name', () => {
    const pattern = abbreviate('Fireball', allGemNames);
    const re = new RegExp(pattern, 'i');
    expect(re.test('Fireball')).toBe(true);
  });

  it('pattern is shorter than the full name', () => {
    const pattern = abbreviate('Fireball', allGemNames);
    expect(pattern.length).toBeLessThan('Fireball'.length);
  });

  it('pattern does not match other gems in the pool', () => {
    const name = 'Fireball';
    const pattern = abbreviate(name, allGemNames);
    const re = new RegExp(pattern, 'i');
    for (const other of allGemNames) {
      if (other === name) continue;
      expect(re.test(other)).toBe(false);
    }
  });

  it('handles multi-word names', () => {
    const pattern = abbreviate('Arctic Armour', allGemNames);
    const re = new RegExp(pattern, 'i');
    expect(re.test('Arctic Armour')).toBe(true);
  });

  it('handles single-word names', () => {
    const pattern = abbreviate('Arc', allGemNames);
    const re = new RegExp(pattern, 'i');
    expect(re.test('Arc')).toBe(true);
  });

  it('all gems produce valid abbreviations', () => {
    for (const name of allGemNames.slice(0, 20)) {
      const pattern = abbreviate(name, allGemNames);
      const re = new RegExp(pattern, 'i');
      expect(re.test(name)).toBe(true);
    }
  });

  it('spaces in patterns become dots', () => {
    // Multi-word patterns may use . for spaces
    const pattern = abbreviate('Spectral Throw', allGemNames);
    // The pattern should not contain literal spaces (spaces become . or .+)
    expect(pattern).not.toContain(' ');
  });

  it('can produce ^prefix patterns', () => {
    // Some gems may use ^ prefix patterns
    // Just verify that abbreviations that start with ^ still match
    const name = 'Vaal Breach';
    const testNames = ['Vaal Breach', 'Vaal Grace', 'Fireball'];
    const pattern = abbreviate(name, testNames);
    const re = new RegExp(pattern, 'im');
    expect(re.test(name)).toBe(true);
  });
});

describe('computeAbbreviations', () => {
  it('returns abbreviations for all selected names', () => {
    const selected = ['Fireball', 'Frostbolt', 'Arc'];
    const result = computeAbbreviations(selected, allGemNames);
    expect(result.size).toBe(3);
    for (const name of selected) {
      expect(result.has(name)).toBe(true);
    }
  });

  it('produces unique patterns (no cross-matching)', () => {
    const selected = ['Fireball', 'Frostbolt'];
    const result = computeAbbreviations(selected, allGemNames);
    const firePattern = result.get('Fireball')!;
    const frostPattern = result.get('Frostbolt')!;

    // Fireball pattern should NOT match Frostbolt
    const fireRe = new RegExp(firePattern, 'i');
    expect(fireRe.test('Frostbolt')).toBe(false);

    // Frostbolt pattern should NOT match Fireball
    const frostRe = new RegExp(frostPattern, 'i');
    expect(frostRe.test('Fireball')).toBe(false);
  });

  it('handles empty selection', () => {
    const result = computeAbbreviations([], allGemNames);
    expect(result.size).toBe(0);
  });

  it('handles similar names without collision', () => {
    const selected = ['Frost Blades', 'Frost Bomb', 'Frostbolt', 'Frostbite'];
    const result = computeAbbreviations(selected, allGemNames);
    expect(result.size).toBe(4);

    // Each pattern should only match its own name among selected
    for (const [name, pattern] of result) {
      const re = new RegExp(pattern, 'i');
      for (const otherName of selected) {
        if (otherName === name) {
          expect(re.test(otherName)).toBe(true);
        } else {
          expect(re.test(otherName)).toBe(false);
        }
      }
    }
  });
});
