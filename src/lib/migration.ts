import type {
  BuildPlan,
  BuildPlanV2,
  BuildPlanV1,
  BuildLinkGroup,
  StopPlanV2,
  GearGoal,
  LinkGroupV2,
} from '@/types/build';
import { CURRENT_BUILD_VERSION } from '@/types/build';
import type { RegexPreset } from '@/types/regex';
import { TOWN_STOPS } from '@/data/town-stops';
import {
  migrateBuildGemNames,
  migratePresetGemNames,
  resolveGemName,
  type RenameMap,
} from '@/lib/gem-migration';
import renameMap328 from '@/data/gem-rename-map.json';
import renameMap329 from '@/data/gem-rename-map-329.json';

/**
 * Migrate a V1 (act-based) build to V2 (stop-based).
 * Maps old ActPlan gem setups to link groups at the first stop of each act.
 * Gear goals are promoted from per-act to build-level.
 * Skill transitions are dropped (replaced by the stop-based workflow).
 */
export function migrateBuildV1toV2(v1: BuildPlanV1): BuildPlanV2 {
  // Collect all gear goals from all acts into build-level
  const gearGoals: GearGoal[] = [];
  for (const act of v1.acts) {
    for (const goal of act.gearGoals) {
      gearGoals.push({
        id: goal.id,
        slot: goal.slot,
        description: goal.description,
        acquired: goal.acquired,
      });
    }
  }

  // Create stop plans - map act data to the first stop of each act
  const stops: StopPlanV2[] = TOWN_STOPS.map((townStop) => {
    const actPlan = v1.acts.find((a) => a.actNumber === townStop.actNumber);

    // Only populate the first stop of each act with the old act data
    const isFirstStopOfAct = TOWN_STOPS.filter((s) => s.actNumber === townStop.actNumber)[0]?.id === townStop.id;

    const linkGroups: LinkGroupV2[] = [];
    if (actPlan && isFirstStopOfAct) {
      for (const setup of actPlan.gemSetups) {
        linkGroups.push({
          id: setup.id,
          label: setup.notes || '',
          gems: setup.socketColors.map((color, i) => ({
            gemName: setup.gems[i] || '',
            socketColor: color,
          })),
          notes: '',
        });
      }
    }

    return {
      stopId: townStop.id,
      enabled: townStop.defaultEnabled,
      gemPickups: [],
      linkGroups,
      notes: actPlan && isFirstStopOfAct ? actPlan.notes : '',
    };
  });

  return {
    id: v1.id,
    name: v1.name,
    className: v1.className,
    ascendancy: v1.ascendancy,
    regexPresetId: v1.regexPresetId,
    stops,
    gearGoals,
    createdAt: v1.createdAt,
    updatedAt: v1.updatedAt,
    version: 2,
  };
}

/**
 * Migrate a V2 build (per-stop link groups) to V3 (build-level link groups
 * with phases). Each stop's link groups become build-level groups with a
 * single phase anchored at that stop.
 */
export function migrateBuildV2toV3(v2: BuildPlanV2): BuildPlan {
  const linkGroups: BuildLinkGroup[] = [];
  for (const stop of v2.stops) {
    for (const lg of stop.linkGroups ?? []) {
      linkGroups.push({
        id: lg.id,
        label: lg.label ?? '',
        phases: [
          {
            id: crypto.randomUUID(),
            fromStopId: stop.stopId,
            gems: lg.gems,
            notes: lg.notes,
          },
        ],
      });
    }
  }

  return {
    id: v2.id,
    name: v2.name,
    className: v2.className,
    ascendancy: v2.ascendancy,
    regexPresetId: v2.regexPresetId,
    stops: v2.stops.map((s) => ({
      stopId: s.stopId,
      enabled: s.enabled,
      gemPickups: s.gemPickups,
      notes: s.notes,
    })),
    linkGroups,
    gearGoals: v2.gearGoals,
    createdAt: v2.createdAt,
    updatedAt: v2.updatedAt,
    version: 3,
  };
}

// ===========================================================================
// Unified migration chain
//
// One monotonically increasing version integer per record (see
// CURRENT_BUILD_VERSION in types/build.ts). Steps 4+ are numbered data
// migrations; shape migrations (V1/V2 -> V3) normalize first. Every step is
// total -- unknown gem names pass through -- so migration can never fail.
// ===========================================================================

interface MigrationStep {
  /** Version this step produces. */
  to: number;
  description: string;
  migrateBuild?: (b: BuildPlan) => BuildPlan;
  migratePreset?: (p: RegexPreset) => RegexPreset;
}

/** Rename maps in patch order. Append future patches here. */
const RENAME_MAPS: RenameMap[] = [
  renameMap328 as RenameMap,
  renameMap329 as RenameMap,
];

export const MIGRATIONS: MigrationStep[] = [
  {
    to: 4,
    description: '3.28 gem renames',
    migrateBuild: (b) => migrateBuildGemNames(b, renameMap328 as RenameMap),
    migratePreset: (p) => migratePresetGemNames(p, renameMap328 as RenameMap),
  },
  {
    to: 5,
    description: '3.29 gem renames (Dark Pact -> Dark Bargain)',
    migrateBuild: (b) => migrateBuildGemNames(b, renameMap329 as RenameMap),
    migratePreset: (p) => migratePresetGemNames(p, renameMap329 as RenameMap),
  },
];

/**
 * Resolve a gem name through every patch's rename map in order, so names
 * from any historical version (old builds, old PoB exports) reach their
 * current form -- including chained renames (A->B in one patch, B->C in a
 * later one).
 */
export function resolveGemNameAllPatches(name: string): string {
  return RENAME_MAPS.reduce((n, map) => resolveGemName(n, map), name);
}

/** Shape of a build record whose version we don't know yet. */
type AnyBuildRecord = BuildPlan | BuildPlanV2 | BuildPlanV1;

function normalizeShape(record: AnyBuildRecord): BuildPlan {
  // V1: act-based, no version field
  if ('acts' in record && Array.isArray(record.acts)) {
    return migrateBuildV2toV3(migrateBuildV1toV2(record as BuildPlanV1));
  }
  // V2: per-stop link groups
  if ((record as BuildPlanV2).version === 2) {
    return migrateBuildV2toV3(record as BuildPlanV2);
  }
  const build = record as BuildPlan;
  // Defensive: pre-chain records without a version but with V3 shape
  if (typeof build.version !== 'number') {
    return {
      ...build,
      version: 3,
      stops: build.stops ?? [],
      linkGroups: build.linkGroups ?? [],
      gearGoals: build.gearGoals ?? [],
    };
  }
  return build;
}

/**
 * Migrate a build record of any historical version to the current version.
 * - Never lowers a version: records at or above CURRENT_BUILD_VERSION are
 *   returned untouched (a record above it was written by a newer app).
 * - Never throws on unknown gem names; they pass through and are surfaced
 *   as "unknown gem" in the UI instead.
 */
export function migrateBuildToCurrent(record: AnyBuildRecord): BuildPlan {
  let build = normalizeShape(record);
  if (build.version >= CURRENT_BUILD_VERSION) return build;

  // Don't mutate the caller's record when stamping versions
  build = { ...build };
  for (const step of MIGRATIONS) {
    if (step.to <= build.version) continue;
    if (step.migrateBuild) build = step.migrateBuild(build);
    build.version = step.to;
  }
  return build;
}

/**
 * Migrate a regex preset to the current version. Absent version = 0
 * (pre-versioning); rename steps are idempotent so re-application is safe.
 */
export function migratePresetToCurrent(preset: RegexPreset): RegexPreset {
  const version = preset.version ?? 0;
  if (version >= CURRENT_BUILD_VERSION) return preset;

  let migrated = preset;
  for (const step of MIGRATIONS) {
    if (step.to <= version) continue;
    if (step.migratePreset) migrated = step.migratePreset(migrated);
  }
  return { ...migrated, version: CURRENT_BUILD_VERSION };
}
