import renameMap from '@/data/gem-rename-map.json';
import { db } from '@/db/database';
import { downloadJson, type ExportData } from '@/lib/export';
import { toast } from 'sonner';
import type { BuildPlan, GemSlot } from '@/types/build';
import type { RegexPreset } from '@/types/regex';

const map = renameMap as Record<string, string>;
const oldNames = new Set(Object.keys(map));

const MIGRATION_KEY = 'gem-migration-v328';

// ---------------------------------------------------------------------------
// Pure functions (unit-testable)
// ---------------------------------------------------------------------------

/**
 * Resolve a gem name through the rename map.
 * Returns the new name if the gem was renamed, otherwise the original name.
 */
export function resolveGemName(name: string): string {
  return map[name] ?? name;
}

/**
 * Recursively migrate gem names in a GemSlot and its alternatives.
 */
function migrateGemSlot(slot: GemSlot): void {
  slot.gemName = resolveGemName(slot.gemName);
  if (slot.alternatives) {
    for (const alt of slot.alternatives) {
      migrateGemSlot(alt);
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
export function migrateBuildGemNames(build: BuildPlan): BuildPlan {
  // Deep clone to avoid mutating the original
  const migrated: BuildPlan = JSON.parse(JSON.stringify(build));

  // Site 1: GemPickup.gemName
  for (const stop of migrated.stops) {
    for (const pickup of stop.gemPickups) {
      pickup.gemName = resolveGemName(pickup.gemName);
    }

    // Site 2: StopPlan.droppedGems[]
    if (stop.droppedGems) {
      stop.droppedGems = stop.droppedGems.map(resolveGemName);
    }
  }

  // Site 3 & 5: GemSlot.gemName and GemSlot.alternatives[].gemName
  for (const lg of migrated.linkGroups) {
    for (const phase of lg.phases) {
      for (const gem of phase.gems) {
        migrateGemSlot(gem);
      }
    }
  }

  // Site 4: MulePickup.gemName
  if (migrated.mulePickups) {
    for (const mule of migrated.mulePickups) {
      mule.gemName = resolveGemName(mule.gemName);
    }
  }

  migrated.updatedAt = new Date().toISOString();
  return migrated;
}

/**
 * Migrate gem name references in a RegexPreset.
 * Only renames sourceName fields -- does NOT modify pattern fields.
 * Returns a new object (does not mutate the input).
 */
export function migratePresetGemNames(preset: RegexPreset): RegexPreset {
  const migrated: RegexPreset = JSON.parse(JSON.stringify(preset));

  for (const category of migrated.categories) {
    for (const entry of category.entries) {
      if (entry.sourceName) {
        entry.sourceName = resolveGemName(entry.sourceName);
      }
    }
  }

  migrated.updatedAt = new Date().toISOString();
  return migrated;
}

/**
 * Check if any builds or presets contain gem names that need migration.
 * Scans all 5 gem name sites in builds and sourceName in presets.
 */
export function checkIfMigrationNeeded(
  builds: BuildPlan[],
  presets: RegexPreset[],
): boolean {
  // Check builds
  for (const build of builds) {
    for (const stop of build.stops) {
      // Site 1: gemPickups
      for (const pickup of stop.gemPickups) {
        if (oldNames.has(pickup.gemName)) return true;
      }
      // Site 2: droppedGems
      if (stop.droppedGems) {
        for (const name of stop.droppedGems) {
          if (oldNames.has(name)) return true;
        }
      }
    }

    // Site 3 & 5: linkGroups gems + alternatives
    for (const lg of build.linkGroups) {
      for (const phase of lg.phases) {
        for (const gem of phase.gems) {
          if (hasOldGemName(gem)) return true;
        }
      }
    }

    // Site 4: mulePickups
    if (build.mulePickups) {
      for (const mule of build.mulePickups) {
        if (oldNames.has(mule.gemName)) return true;
      }
    }
  }

  // Check presets
  for (const preset of presets) {
    for (const category of preset.categories) {
      for (const entry of category.entries) {
        if (entry.sourceName && oldNames.has(entry.sourceName)) return true;
      }
    }
  }

  return false;
}

/**
 * Recursively check if a GemSlot or its alternatives contain old gem names.
 */
function hasOldGemName(slot: GemSlot): boolean {
  if (oldNames.has(slot.gemName)) return true;
  if (slot.alternatives) {
    for (const alt of slot.alternatives) {
      if (hasOldGemName(alt)) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Orchestrator (uses browser APIs -- not unit-tested)
// ---------------------------------------------------------------------------

/**
 * Run gem rename migration if needed.
 *
 * Checks localStorage flag first (fast no-op if already done).
 * If migration needed: creates backup with toast download link,
 * then transforms all builds and presets in IndexedDB.
 * Only marks complete after ALL migrations succeed.
 */
export async function runGemMigrationIfNeeded(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY) === 'done') return;

  // Load all data from Dexie
  const builds = await db.builds.toArray();
  const presets = await db.regexPresets.toArray();

  // Check if migration is actually needed
  if (!checkIfMigrationNeeded(builds, presets)) {
    localStorage.setItem(MIGRATION_KEY, 'done');
    return;
  }

  // Create backup with all tables before migration
  const runs = await db.runs.toArray();
  const customGems = await db.customGems.toArray();
  const customItems = await db.customItems.toArray();
  const backupData: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    regexPresets: presets,
    builds,
    runs,
    customGems,
    customItems,
  };

  // Show toast with download action
  toast('Pre-migration backup created for patch 3.28', {
    action: {
      label: 'Download Backup',
      onClick: () =>
        downloadJson(backupData, 'poe-planner-pre-migration-backup.json'),
    },
    duration: 10000,
  });

  // Migrate builds -- wrap each in try/catch, abort on failure
  try {
    for (const build of builds) {
      const migrated = migrateBuildGemNames(build);
      await db.builds.put(migrated);
    }

    for (const preset of presets) {
      const migrated = migratePresetGemNames(preset);
      await db.regexPresets.put(migrated);
    }
  } catch {
    // Do NOT set the localStorage flag -- retry on next load
    return;
  }

  // All migrations succeeded
  localStorage.setItem(MIGRATION_KEY, 'done');
}
