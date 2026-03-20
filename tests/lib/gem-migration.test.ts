import { describe, it, expect } from 'vitest';
import {
  resolveGemName,
  migrateBuildGemNames,
  migratePresetGemNames,
  checkIfMigrationNeeded,
} from '@/lib/gem-migration';
import type { BuildPlan } from '@/types/build';
import type { RegexPreset } from '@/types/regex';

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

function createCleanPreset(): RegexPreset {
  return {
    id: 'preset-clean',
    name: 'Clean Preset',
    categories: [
      {
        id: 'gems',
        label: 'Gems',
        entries: [
          {
            id: 'entry-c1',
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
    expect(resolveGemName('Sweep')).toBe('Holy Sweep');
  });

  it('passes through unknown gem names unchanged', () => {
    expect(resolveGemName('Fireball')).toBe('Fireball');
  });

  it('is idempotent on already-renamed gem names', () => {
    expect(resolveGemName('Holy Sweep')).toBe('Holy Sweep');
  });
});

describe('migrateBuildGemNames', () => {
  it('renames GemPickup.gemName (Site 1)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build);

    expect(migrated.stops[0].gemPickups[0].gemName).toBe('Holy Sweep');
    expect(migrated.stops[0].gemPickups[1].gemName).toBe(
      'Multiple Projectiles Support',
    );
    // Unchanged gem
    expect(migrated.stops[0].gemPickups[2].gemName).toBe('Fireball');
  });

  it('renames StopPlan.droppedGems entries (Site 2)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build);

    expect(migrated.stops[1].droppedGems).toEqual(['Holy Sweep']);
  });

  it('renames GemSlot.gemName in linkGroups.phases.gems (Site 3)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build);

    expect(migrated.linkGroups[0].phases[0].gems[0].gemName).toBe(
      'Holy Sweep',
    );
    // Unchanged gem
    expect(migrated.linkGroups[0].phases[0].gems[1].gemName).toBe('Fireball');
  });

  it('renames MulePickup.gemName (Site 4)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build);

    expect(migrated.mulePickups![0].gemName).toBe('Holy Sweep');
  });

  it('renames GemSlot.alternatives[].gemName recursively (Site 5)', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build);

    expect(
      migrated.linkGroups[0].phases[0].gems[0].alternatives![0].gemName,
    ).toBe('Returning Projectiles Support');
  });

  it('updates updatedAt timestamp', () => {
    const build = createTestBuild();
    const migrated = migrateBuildGemNames(build);

    expect(migrated.updatedAt).not.toBe('2025-01-01T00:00:00.000Z');
    // Should be a valid ISO string
    expect(() => new Date(migrated.updatedAt)).not.toThrow();
  });

  it('returns identical result when called twice (idempotent)', () => {
    const build = createTestBuild();
    const first = migrateBuildGemNames(build);
    const second = migrateBuildGemNames(first);

    // Compare gem names, not updatedAt (timestamp changes)
    expect(second.stops[0].gemPickups[0].gemName).toBe(
      first.stops[0].gemPickups[0].gemName,
    );
    expect(second.stops[1].droppedGems).toEqual(first.stops[1].droppedGems);
    expect(second.linkGroups[0].phases[0].gems[0].gemName).toBe(
      first.linkGroups[0].phases[0].gems[0].gemName,
    );
    expect(second.mulePickups![0].gemName).toBe(
      first.mulePickups![0].gemName,
    );
    expect(
      second.linkGroups[0].phases[0].gems[0].alternatives![0].gemName,
    ).toBe(
      first.linkGroups[0].phases[0].gems[0].alternatives![0].gemName,
    );
  });

  it('does not mutate the input build', () => {
    const build = createTestBuild();
    const originalName = build.stops[0].gemPickups[0].gemName;
    migrateBuildGemNames(build);

    expect(build.stops[0].gemPickups[0].gemName).toBe(originalName);
  });

  it('no-ops on a build with no old gem names', () => {
    const build = createCleanBuild();
    const migrated = migrateBuildGemNames(build);

    expect(migrated.stops[0].gemPickups[0].gemName).toBe('Fireball');
    expect(migrated.linkGroups[0].phases[0].gems[0].gemName).toBe('Fireball');
  });
});

describe('migratePresetGemNames', () => {
  it('renames RegexEntry.sourceName', () => {
    const preset = createTestPreset();
    const migrated = migratePresetGemNames(preset);

    expect(migrated.categories[0].entries[0].sourceName).toBe('Holy Sweep');
    // Unchanged
    expect(migrated.categories[0].entries[1].sourceName).toBe('Fireball');
  });

  it('does NOT modify RegexEntry.pattern fields', () => {
    const preset = createTestPreset();
    const migrated = migratePresetGemNames(preset);

    expect(migrated.categories[0].entries[0].pattern).toBe('swe');
    expect(migrated.categories[0].entries[1].pattern).toBe('fire');
  });

  it('updates updatedAt timestamp', () => {
    const preset = createTestPreset();
    const migrated = migratePresetGemNames(preset);

    expect(migrated.updatedAt).not.toBe('2025-01-01T00:00:00.000Z');
  });

  it('no-ops on preset with no old gem names', () => {
    const preset = createCleanPreset();
    const migrated = migratePresetGemNames(preset);

    expect(migrated.categories[0].entries[0].sourceName).toBe('Fireball');
  });
});

describe('checkIfMigrationNeeded', () => {
  it('returns true when builds contain old gem names', () => {
    const builds = [createTestBuild()];
    const presets: RegexPreset[] = [];
    expect(checkIfMigrationNeeded(builds, presets)).toBe(true);
  });

  it('returns true when presets contain old gem names', () => {
    const builds: BuildPlan[] = [];
    const presets = [createTestPreset()];
    expect(checkIfMigrationNeeded(builds, presets)).toBe(true);
  });

  it('returns false when no old gem names exist', () => {
    const builds = [createCleanBuild()];
    const presets = [createCleanPreset()];
    expect(checkIfMigrationNeeded(builds, presets)).toBe(false);
  });

  it('returns false for empty data', () => {
    expect(checkIfMigrationNeeded([], [])).toBe(false);
  });
});
