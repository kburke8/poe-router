import type { BuildPlan, GemSlot } from '@/types/build';
import type { RegexPreset } from '@/types/regex';

/**
 * Pure gem-rename functions, parameterized by a rename map so each game
 * patch's map (gem-rename-map.json = 3.28, gem-rename-map-329.json = 3.29)
 * can be applied as its own step in the migration chain (src/lib/migration.ts).
 *
 * All functions are total: unknown gem names pass through unchanged, so a
 * rename pass can never fail or lose data.
 */

export type RenameMap = Record<string, string>;

/**
 * Resolve a gem name through a rename map.
 * Returns the new name if the gem was renamed, otherwise the original name.
 */
export function resolveGemName(name: string, map: RenameMap): string {
  return map[name] ?? name;
}

/**
 * Recursively migrate gem names in a GemSlot and its alternatives.
 */
function migrateGemSlot(slot: GemSlot, map: RenameMap): void {
  slot.gemName = resolveGemName(slot.gemName, map);
  if (slot.alternatives) {
    for (const alt of slot.alternatives) {
      migrateGemSlot(alt, map);
    }
  }
}

/**
 * Migrate all gem name references in a BuildPlan.
 * Returns a new object (does not mutate the input).
 *
 * Covers all 5 gem name sites:
 *   1. stops[].gemPickups[].gemName
 *   2. stops[].droppedGems[]
 *   3. linkGroups[].phases[].gems[].gemName
 *   4. mulePickups[].gemName
 *   5. linkGroups[].phases[].gems[].alternatives[].gemName (recursive)
 */
export function migrateBuildGemNames(build: BuildPlan, map: RenameMap): BuildPlan {
  // Deep clone to avoid mutating the original
  const migrated: BuildPlan = JSON.parse(JSON.stringify(build));

  // Site 1: GemPickup.gemName
  // Arrays may be absent on malformed/hand-edited imports -- tolerate them
  for (const stop of migrated.stops ?? []) {
    for (const pickup of stop.gemPickups ?? []) {
      pickup.gemName = resolveGemName(pickup.gemName, map);
    }

    // Site 2: StopPlan.droppedGems[]
    if (stop.droppedGems) {
      stop.droppedGems = stop.droppedGems.map((n) => resolveGemName(n, map));
    }
  }

  // Site 3 & 5: GemSlot.gemName and GemSlot.alternatives[].gemName
  for (const lg of migrated.linkGroups ?? []) {
    for (const phase of lg.phases ?? []) {
      for (const gem of phase.gems ?? []) {
        migrateGemSlot(gem, map);
      }
    }
  }

  // Site 4: MulePickup.gemName
  if (migrated.mulePickups) {
    for (const mule of migrated.mulePickups) {
      mule.gemName = resolveGemName(mule.gemName, map);
    }
  }

  return migrated;
}

/**
 * Migrate gem name references in a RegexPreset.
 * Only renames sourceName fields -- does NOT modify pattern fields.
 * Returns a new object (does not mutate the input).
 */
export function migratePresetGemNames(preset: RegexPreset, map: RenameMap): RegexPreset {
  const migrated: RegexPreset = JSON.parse(JSON.stringify(preset));

  for (const category of migrated.categories ?? []) {
    for (const entry of category.entries ?? []) {
      if (entry.sourceName) {
        entry.sourceName = resolveGemName(entry.sourceName, map);
      }
    }
  }

  return migrated;
}
