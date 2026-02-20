import { describe, it, expect } from 'vitest';
import { backfillBuild } from '@/lib/pob/backfill';
import type { PobBuild } from '@/lib/pob/parse';

function makePobBuild(overrides?: Partial<PobBuild>): PobBuild {
  return {
    className: 'Witch',
    ascClassName: 'Elementalist',
    skillGroups: [],
    skillSets: [],
    activeSkillSetId: null,
    ...overrides,
  };
}

describe('backfillBuild', () => {
  it('maps class name correctly', () => {
    const pob = makePobBuild({ className: 'Witch' });
    const { build } = backfillBuild(pob, 'Test Build');
    expect(build.className).toBe('Witch');
  });

  it('maps ascendancy correctly', () => {
    const pob = makePobBuild({ ascClassName: 'Elementalist' });
    const { build } = backfillBuild(pob, 'Test Build');
    expect(build.ascendancy).toBe('Elementalist');
  });

  it('initializes stops from TOWN_STOPS', () => {
    const pob = makePobBuild();
    const { build } = backfillBuild(pob, 'Test Build');
    expect(build.stops.length).toBeGreaterThan(0);
    expect(build.stops[0].stopId).toBe('a1_after_hillock');
  });

  it('places gems at earliest available stop', () => {
    const pob = makePobBuild({
      skillGroups: [{
        label: 'Main',
        slot: 'Body Armour',
        enabled: true,
        gems: [
          { nameSpec: 'Fireball', enabled: true },
        ],
      }],
    });
    const { build } = backfillBuild(pob, 'Test Build');

    // Fireball should be placed at a1_after_hillock (earliest for Witch)
    const hillock = build.stops.find((s) => s.stopId === 'a1_after_hillock');
    expect(hillock).toBeDefined();
    expect(hillock!.gemPickups.some((p) => p.gemName === 'Fireball')).toBe(true);
  });

  it('creates link groups with progressive phases', () => {
    const pob = makePobBuild({
      skillGroups: [{
        label: 'Main',
        slot: 'Body Armour',
        enabled: true,
        gems: [
          { nameSpec: 'Fireball', enabled: true },
          { nameSpec: 'Spell Echo', enabled: true },
        ],
      }],
    });
    const { build } = backfillBuild(pob, 'Test Build');
    expect(build.linkGroups.length).toBeGreaterThan(0);
    const mainGroup = build.linkGroups[0];
    expect(mainGroup.phases.length).toBeGreaterThan(0);
  });

  it('generates warnings for Vaal gems', () => {
    const pob = makePobBuild({
      skillGroups: [{
        label: 'Main',
        slot: '',
        enabled: true,
        gems: [
          { nameSpec: 'Fireball', enabled: true },
          { nameSpec: 'Vaal Fireball', enabled: true },
        ],
      }],
    });
    const { warnings } = backfillBuild(pob, 'Test Build');
    expect(warnings.some((w) => w.type === 'skipped' && w.gemName === 'Vaal Fireball')).toBe(true);
  });

  it('generates warnings for unknown gems', () => {
    const pob = makePobBuild({
      skillGroups: [{
        label: 'Main',
        slot: '',
        enabled: true,
        gems: [
          { nameSpec: 'CompletelyFakeGem12345', enabled: true },
        ],
      }],
    });
    const { warnings } = backfillBuild(pob, 'Test Build');
    expect(warnings.some((w) => w.type === 'not_found')).toBe(true);
  });

  it('handles case-insensitive class name', () => {
    const pob = makePobBuild({ className: 'witch' });
    const { build } = backfillBuild(pob, 'Test Build');
    expect(build.className).toBe('Witch');
  });

  it('handles empty skill groups', () => {
    const pob = makePobBuild({ skillGroups: [] });
    const { build, warnings } = backfillBuild(pob, 'Test Build');
    expect(build.linkGroups).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('skips disabled skill groups', () => {
    const pob = makePobBuild({
      skillGroups: [{
        label: 'Disabled',
        slot: '',
        enabled: false,
        gems: [
          { nameSpec: 'Fireball', enabled: true },
        ],
      }],
    });
    const { build } = backfillBuild(pob, 'Test Build');
    expect(build.linkGroups).toHaveLength(0);
  });

  it('skips disabled gems within groups', () => {
    const pob = makePobBuild({
      skillGroups: [{
        label: 'Main',
        slot: '',
        enabled: true,
        gems: [
          { nameSpec: 'Fireball', enabled: true },
          { nameSpec: 'Frostbolt', enabled: false },
        ],
      }],
    });
    const { build } = backfillBuild(pob, 'Test Build');
    const allGemNames = build.stops.flatMap((s) => s.gemPickups.map((p) => p.gemName));
    expect(allGemNames).toContain('Fireball');
    expect(allGemNames).not.toContain('Frostbolt');
  });

  it('handles multi-set level-annotated path', () => {
    const pob = makePobBuild({
      skillSets: [
        {
          id: '1',
          title: 'Level 2',
          skillGroups: [{
            label: 'Early',
            slot: 'Main Hand',
            enabled: true,
            gems: [{ nameSpec: 'Fireball', enabled: true }],
          }],
        },
        {
          id: '2',
          title: 'Level 28',
          skillGroups: [{
            label: 'Mid',
            slot: 'Main Hand',
            enabled: true,
            gems: [
              { nameSpec: 'Fireball', enabled: true },
              { nameSpec: 'Spell Echo', enabled: true },
            ],
          }],
        },
      ],
    });
    const { build } = backfillBuild(pob, 'Test Build');
    // Should create link groups from the multi-set path
    expect(build.linkGroups.length).toBeGreaterThan(0);
  });
});
