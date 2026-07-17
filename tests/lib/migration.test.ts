import { describe, it, expect } from 'vitest';
import {
  MIGRATIONS,
  migrateBuildToCurrent,
  migratePresetToCurrent,
  migrateBuildV2toV3,
  resolveGemNameAllPatches,
} from '@/lib/migration';
import { parseImportFile } from '@/lib/export';
import { CURRENT_BUILD_VERSION } from '@/types/build';
import type { BuildPlan, BuildPlanV1, BuildPlanV2 } from '@/types/build';
import type { RegexPreset } from '@/types/regex';

// ---------------------------------------------------------------------------
// Fixtures — frozen shapes from each historical version
// ---------------------------------------------------------------------------

function createV1Build(): BuildPlanV1 {
  return {
    id: 'v1-build',
    name: 'Ancient Build',
    className: 'Marauder',
    ascendancy: 'Juggernaut',
    acts: [
      {
        actNumber: 1,
        gemSetups: [
          {
            id: 'setup-1',
            gems: ['Sweep', 'Added Fire Damage Support'],
            socketColors: ['R', 'R'],
            notes: 'main',
          },
        ],
        skillTransitions: [],
        gearGoals: [
          { id: 'goal-1', slot: 'weapon', description: '2h mace', acquired: false },
        ],
        notes: 'act 1 notes',
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    version: undefined,
  };
}

function createV2Build(): BuildPlanV2 {
  return {
    id: 'v2-build',
    name: 'Old Build',
    className: 'Witch',
    ascendancy: 'Necromancer',
    stops: [
      {
        stopId: 'act1-town',
        enabled: true,
        gemPickups: [
          { id: 'gp-1', gemName: 'Sweep', gemColor: 'red', source: 'quest_reward' },
        ],
        linkGroups: [
          {
            id: 'lg-1',
            label: 'Main',
            gems: [
              { gemName: 'Sweep', socketColor: 'R' },
              { gemName: 'Dark Pact', socketColor: 'B' },
            ],
            notes: 'links',
          },
        ],
        notes: '',
      },
    ],
    gearGoals: [],
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    version: 2,
  };
}

function createV3Build(overrides: Partial<BuildPlan> = {}): BuildPlan {
  return {
    id: 'v3-build',
    name: 'Pre-3.28 Build',
    className: 'Templar',
    ascendancy: 'Inquisitor',
    stops: [
      {
        stopId: 'act1-town',
        enabled: true,
        gemPickups: [
          { id: 'gp-1', gemName: 'Sweep', gemColor: 'red', source: 'quest_reward' },
          { id: 'gp-2', gemName: 'Dark Pact', gemColor: 'blue', source: 'vendor' },
        ],
        notes: '',
      },
    ],
    linkGroups: [],
    gearGoals: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    version: 3,
    ...overrides,
  };
}

function createPreset(overrides: Partial<RegexPreset> = {}): RegexPreset {
  return {
    id: 'preset-1',
    name: 'Preset',
    categories: [
      {
        id: 'gems',
        label: 'Gems',
        entries: [
          {
            id: 'e1',
            pattern: 'dark',
            sourceName: 'Dark Pact',
            isExclusion: false,
            enabled: true,
            isCustom: false,
          },
        ],
      },
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Chain consistency
// ---------------------------------------------------------------------------

describe('MIGRATIONS registry', () => {
  it('is strictly ascending and ends at CURRENT_BUILD_VERSION', () => {
    for (let i = 1; i < MIGRATIONS.length; i++) {
      expect(MIGRATIONS[i].to).toBeGreaterThan(MIGRATIONS[i - 1].to);
    }
    expect(MIGRATIONS[MIGRATIONS.length - 1].to).toBe(CURRENT_BUILD_VERSION);
  });
});

// ---------------------------------------------------------------------------
// migrateBuildToCurrent
// ---------------------------------------------------------------------------

describe('migrateBuildToCurrent', () => {
  it('migrates a V3 build through every rename step to the current version', () => {
    const migrated = migrateBuildToCurrent(createV3Build());

    expect(migrated.version).toBe(CURRENT_BUILD_VERSION);
    expect(migrated.stops[0].gemPickups[0].gemName).toBe('Holy Sweep'); // 3.28 step
    expect(migrated.stops[0].gemPickups[1].gemName).toBe('Dark Bargain'); // 3.29 step
  });

  it('applies only the missing steps to a partially-migrated build', () => {
    // Version 4 = 3.28 renames already applied; "Sweep" must NOT be renamed
    // again (it's stale data at v4, kept to prove the 3.28 step is skipped)
    const migrated = migrateBuildToCurrent(createV3Build({ version: 4 }));

    expect(migrated.version).toBe(CURRENT_BUILD_VERSION);
    expect(migrated.stops[0].gemPickups[0].gemName).toBe('Sweep');
    expect(migrated.stops[0].gemPickups[1].gemName).toBe('Dark Bargain');
  });

  it('returns the record untouched (same reference) when already current', () => {
    const build = createV3Build({ version: CURRENT_BUILD_VERSION });
    expect(migrateBuildToCurrent(build)).toBe(build);
  });

  it('never lowers a version written by a newer app', () => {
    const future = createV3Build({ version: CURRENT_BUILD_VERSION + 10 });
    const result = migrateBuildToCurrent(future);

    expect(result).toBe(future);
    expect(result.version).toBe(CURRENT_BUILD_VERSION + 10);
    // Gem names untouched — we don't half-understand newer data
    expect(result.stops[0].gemPickups[0].gemName).toBe('Sweep');
  });

  it('does not mutate the input record', () => {
    const build = createV3Build();
    migrateBuildToCurrent(build);

    expect(build.version).toBe(3);
    expect(build.stops[0].gemPickups[0].gemName).toBe('Sweep');
  });

  it('passes unknown gem names through instead of failing', () => {
    const build = createV3Build();
    build.stops[0].gemPickups[0].gemName = 'Gem Deleted By GGG';
    const migrated = migrateBuildToCurrent(build);

    expect(migrated.version).toBe(CURRENT_BUILD_VERSION);
    expect(migrated.stops[0].gemPickups[0].gemName).toBe('Gem Deleted By GGG');
  });

  it('normalizes a V1 (act-based) build all the way to current', () => {
    const migrated = migrateBuildToCurrent(createV1Build());

    expect(migrated.version).toBe(CURRENT_BUILD_VERSION);
    expect(migrated.stops.length).toBeGreaterThan(0);
    // The act-1 gem setup became a build-level link group, renamed by 3.28
    const allSlotNames = migrated.linkGroups.flatMap((lg) =>
      lg.phases.flatMap((p) => p.gems.map((g) => g.gemName)),
    );
    expect(allSlotNames).toContain('Holy Sweep');
  });

  it('normalizes a V2 build (per-stop link groups) to current', () => {
    const migrated = migrateBuildToCurrent(createV2Build());

    expect(migrated.version).toBe(CURRENT_BUILD_VERSION);
    // Per-stop link group hoisted to build level with a phase at that stop
    expect(migrated.linkGroups).toHaveLength(1);
    expect(migrated.linkGroups[0].phases[0].fromStopId).toBe('act1-town');
    const names = migrated.linkGroups[0].phases[0].gems.map((g) => g.gemName);
    expect(names).toEqual(['Holy Sweep', 'Dark Bargain']);
    // Per-stop linkGroups field is gone from the V3 shape
    expect('linkGroups' in migrated.stops[0]).toBe(false);
  });

  it('stamps a version on a versionless V3-shaped record', () => {
    const build = createV3Build();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (build as any).version;
    const migrated = migrateBuildToCurrent(build);

    expect(migrated.version).toBe(CURRENT_BUILD_VERSION);
    expect(migrated.stops[0].gemPickups[0].gemName).toBe('Holy Sweep');
  });
});

describe('migrateBuildV2toV3', () => {
  it('preserves stop data and hoists link groups', () => {
    const v3 = migrateBuildV2toV3(createV2Build());

    expect(v3.version).toBe(3);
    expect(v3.stops[0].gemPickups[0].gemName).toBe('Sweep'); // no renames here
    expect(v3.linkGroups[0].label).toBe('Main');
    expect(v3.linkGroups[0].phases[0].notes).toBe('links');
  });

  it('handles a V2 build with no link groups anywhere', () => {
    const v2 = createV2Build();
    v2.stops[0].linkGroups = [];
    const v3 = migrateBuildV2toV3(v2);

    expect(v3.linkGroups).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// migratePresetToCurrent
// ---------------------------------------------------------------------------

describe('migratePresetToCurrent', () => {
  it('applies rename steps and stamps the current version', () => {
    const migrated = migratePresetToCurrent(createPreset());

    expect(migrated.version).toBe(CURRENT_BUILD_VERSION);
    expect(migrated.categories[0].entries[0].sourceName).toBe('Dark Bargain');
    expect(migrated.categories[0].entries[0].pattern).toBe('dark'); // untouched
  });

  it('returns the preset untouched when already current', () => {
    const preset = createPreset({ version: CURRENT_BUILD_VERSION });
    expect(migratePresetToCurrent(preset)).toBe(preset);
  });

  it('never lowers a version written by a newer app', () => {
    const preset = createPreset({ version: CURRENT_BUILD_VERSION + 1 });
    const result = migratePresetToCurrent(preset);

    expect(result).toBe(preset);
    expect(result.categories[0].entries[0].sourceName).toBe('Dark Pact');
  });
});

// ---------------------------------------------------------------------------
// resolveGemNameAllPatches
// ---------------------------------------------------------------------------

describe('resolveGemNameAllPatches', () => {
  it('resolves names from each patch era', () => {
    expect(resolveGemNameAllPatches('Sweep')).toBe('Holy Sweep');
    expect(resolveGemNameAllPatches('Dark Pact')).toBe('Dark Bargain');
    expect(resolveGemNameAllPatches('Minion Pact Support')).toBe('Communion Support');
  });

  it('passes through current and unknown names', () => {
    expect(resolveGemNameAllPatches('Fireball')).toBe('Fireball');
    expect(resolveGemNameAllPatches('Dark Bargain')).toBe('Dark Bargain');
    expect(resolveGemNameAllPatches('Not A Real Gem')).toBe('Not A Real Gem');
  });
});

// ---------------------------------------------------------------------------
// Import path — old and adversarial files
// ---------------------------------------------------------------------------

describe('parseImportFile migration', () => {
  it('migrates builds and presets from an old export on the way in', () => {
    const file = JSON.stringify({
      version: 1,
      exportedAt: '2025-01-01T00:00:00.000Z',
      builds: [createV3Build()],
      regexPresets: [createPreset()],
    });
    const data = parseImportFile(file);

    expect(data.builds![0].version).toBe(CURRENT_BUILD_VERSION);
    expect(data.builds![0].stops[0].gemPickups[0].gemName).toBe('Holy Sweep');
    expect(data.regexPresets![0].version).toBe(CURRENT_BUILD_VERSION);
    expect(data.regexPresets![0].categories[0].entries[0].sourceName).toBe('Dark Bargain');
  });

  it('rejects builds written by a newer app version with a clear message', () => {
    const file = JSON.stringify({
      version: 1,
      exportedAt: '2025-01-01T00:00:00.000Z',
      builds: [createV3Build({ version: CURRENT_BUILD_VERSION + 5 })],
    });

    expect(() => parseImportFile(file)).toThrow(/newer version/);
    expect(() => parseImportFile(file)).toThrow(/Pre-3\.28 Build/);
  });
});
