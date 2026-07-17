import { describe, it, expect } from 'vitest';
import {
  resolveGemName,
  migrateBuildGemNames,
  migratePresetGemNames,
} from '@/lib/gem-migration';
import renameMap328 from '@/data/gem-rename-map.json';
import type { BuildPlan } from '@/types/build';
import type { RegexPreset } from '@/types/regex';

const map328 = renameMap328 as Record<string, string>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function createTestBuild(): BuildPlan {
  return {
    id: 'test-build-1',
    name: 'Test Build',
    className: 'Marauder',
    ascendancy: 'Juggernaut',
    stops: [
      {
        stopId: 'act1-town',
        enabled: true,
        gemPickups: [
          {
            id: 'gp-1',
            gemName: 'Sweep',
            gemColor: 'red',
            source: 'quest_reward',
          },
          {
            id: 'gp-2',
            gemName: 'Lesser Multiple Projectiles Support',
            gemColor: 'green',
            source: 'vendor',
          },
          {
            id: 'gp-3',
            gemName: 'Fireball',
            gemColor: 'blue',
            source: 'quest_reward',
          },
        ],
        notes: '',
      },
      {
        stopId: 'act2-town',
        enabled: true,
        gemPickups: [],
        notes: '',
        droppedGems: ['Sweep'],
      },
    ],
    linkGroups: [
      {
        id: 'lg-1',
        label: 'Main Attack',
        phases: [
          {
            id: 'phase-1',
            fromStopId: 'act1-town',
            gems: [
              {
                gemName: 'Sweep',
                socketColor: 'R',
                alternatives: [
                  {
                    gemName: 'Return Projectiles Support',
                    socketColor: 'G',
                  },
                ],
              },
              { gemName: 'Fireball', socketColor: 'B' },
            ],
          },
        ],
      },
    ],
    gearGoals: [],
    mulePickups: [
      {
        id: 'mule-1',
        gemName: 'Sweep',
        gemColor: 'red',
        source: 'quest_reward',
      },
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    version: 3,
  };
}

function createCleanBuild(): BuildPlan {
  return {
    id: 'clean-build',
    name: 'Clean Build',
    className: 'Witch',
    ascendancy: 'Necromancer',
    stops: [
      {
        stopId: 'act1-town',
        enabled: true,
        gemPickups: [
          {
            id: 'gp-c1',
            gemName: 'Fireball',
            gemColor: 'blue',
            source: 'quest_reward',
          },
        ],
        notes: '',
      },
    ],
    linkGroups: [
      {
        id: 'lg-c1',
        label: 'Main',
        phases: [
          {
            id: 'phase-c1',
            fromStopId: 'act1-town',
            gems: [{ gemName: 'Fireball', socketColor: 'B' }],
          },
        ],
      },
    ],
    gearGoals: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    version: 3,
  };
}

function createTestPreset(): RegexPreset {
  return {
    id: 'preset-1',
    name: 'Test Preset',
    categories: [
      {
        id: 'gems',
        label: 'Gems',
        entries: [
          {
            id: 'entry-1',
            pattern: 'swe',
            sourceName: 'Sweep',
            isExclusion: false,
            enabled: true,
            isCustom: false,
          },
          {
            id: 'entry-2',
            pattern: 'fire',
            sourceName: 'Fireball',
            isExclusion: false,
            enabled: true,
            isCustom: false,
          },
        ],
      },
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveGemName', () => {
  it('maps old gem name to new name', () => {
    expect(resolveGemName('Sweep', map328)).toBe('Holy Sweep');
  });

  it('passes through unknown gem names unchanged', () => {
    expect(resolveGemName('Fireball', map328)).toBe('Fireball');
  });

  it('is idempotent on already-renamed gem names', () => {
    expect(resolveGemName('Holy Sweep', map328)).toBe('Holy Sweep');
  });

  it('passes through gibberish and empty strings (total function)', () => {
    expect(resolveGemName('Totally Fake Gem That Never Existed', map328)).toBe(
      'Totally Fake Gem That Never Existed',
    );
    expect(resolveGemName('', map328)).toBe('');
  });
});

describe('migrateBuildGemNames', () => {
  it('renames GemPickup.gemName (Site 1)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build, map328);

    expect(migrated.stops[0].gemPickups[0].gemName).toBe('Holy Sweep');
    expect(migrated.stops[0].gemPickups[1].gemName).toBe(
      'Multiple Projectiles Support',
    );
    // Unchanged gem
    expect(migrated.stops[0].gemPickups[2].gemName).toBe('Fireball');
  });

  it('renames StopPlan.droppedGems entries (Site 2)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build, map328);

    expect(migrated.stops[1].droppedGems).toEqual(['Holy Sweep']);
  });

  it('renames GemSlot.gemName in linkGroups.phases.gems (Site 3)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build, map328);

    expect(migrated.linkGroups[0].phases[0].gems[0].gemName).toBe(
      'Holy Sweep',
    );
    // Unchanged gem
    expect(migrated.linkGroups[0].phases[0].gems[1].gemName).toBe('Fireball');
  });

  it('renames MulePickup.gemName (Site 4)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build, map328);

    expect(migrated.mulePickups![0].gemName).toBe('Holy Sweep');
  });

  it('renames GemSlot.alternatives[].gemName recursively (Site 5)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build, map328);

    expect(
      migrated.linkGroups[0].phases[0].gems[0].alternatives![0].gemName,
    ).toBe('Returning Projectiles Support');
  });

  it('returns identical result when called twice (idempotent)', () => {
    const build = createTestBuild();
    const first = migrateBuildGemNames(build, map328);
    const second = migrateBuildGemNames(first, map328);

    expect(second).toEqual(first);
  });

  it('does not mutate the input build', () => {
    const build = createTestBuild();
    const originalName = build.stops[0].gemPickups[0].gemName;
    migrateBuildGemNames(build, map328);

    expect(build.stops[0].gemPickups[0].gemName).toBe(originalName);
  });

  it('no-ops on a build with no old gem names', () => {
    const build = createCleanBuild();
    const migrated = migrateBuildGemNames(build, map328);

    expect(migrated.stops[0].gemPickups[0].gemName).toBe('Fireball');
    expect(migrated.linkGroups[0].phases[0].gems[0].gemName).toBe('Fireball');
  });

  it('handles a build with empty stops and link groups', () => {
    const build = { ...createCleanBuild(), stops: [], linkGroups: [] };
    const migrated = migrateBuildGemNames(build, map328);

    expect(migrated.stops).toEqual([]);
    expect(migrated.linkGroups).toEqual([]);
  });
});

describe('migratePresetGemNames', () => {
  it('renames RegexEntry.sourceName', () => {
    const preset = createTestPreset();
    const migrated = migratePresetGemNames(preset, map328);

    expect(migrated.categories[0].entries[0].sourceName).toBe('Holy Sweep');
    // Unchanged
    expect(migrated.categories[0].entries[1].sourceName).toBe('Fireball');
  });

  it('does NOT modify RegexEntry.pattern fields', () => {
    const preset = createTestPreset();
    const migrated = migratePresetGemNames(preset, map328);

    expect(migrated.categories[0].entries[0].pattern).toBe('swe');
    expect(migrated.categories[0].entries[1].pattern).toBe('fire');
  });

  it('skips entries without a sourceName', () => {
    const preset = createTestPreset();
    delete preset.categories[0].entries[0].sourceName;
    const migrated = migratePresetGemNames(preset, map328);

    expect(migrated.categories[0].entries[0].sourceName).toBeUndefined();
    expect(migrated.categories[0].entries[0].pattern).toBe('swe');
  });
});
