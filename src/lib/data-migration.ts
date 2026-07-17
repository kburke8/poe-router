import { db, type BackupRecord } from '@/db/database';
import { downloadJson, exportToJson, type ExportData } from '@/lib/export';
import { migrateBuildToCurrent, migratePresetToCurrent } from '@/lib/migration';
import { CURRENT_BUILD_VERSION } from '@/types/build';
import { toast } from 'sonner';

const MIGRATION_KEY = `data-migration-v${CURRENT_BUILD_VERSION}`;

/** How many automatic pre-migration backups to retain. */
const MAX_BACKUPS = 5;

/**
 * Run the data migration chain over all stored builds and presets if needed.
 *
 * - localStorage flag is a fast-skip optimization only; correctness comes
 *   from per-record version stamps (imported old JSON migrates on import).
 * - Before writing anything, a full snapshot is stored in the backups table
 *   (restorable from the dashboard) and offered as a download.
 * - Records with a version above CURRENT_BUILD_VERSION (written by a newer
 *   app sharing this browser origin) are left untouched.
 */
export async function runDataMigrationIfNeeded(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY) === 'done') return;

  const builds = await db.builds.toArray();
  const presets = await db.regexPresets.toArray();

  const migratedBuilds = builds.map((b) => ({ before: b, after: migrateBuildToCurrent(b) }));
  const migratedPresets = presets.map((p) => ({ before: p, after: migratePresetToCurrent(p) }));

  const changedBuilds = migratedBuilds.filter((m) => m.after !== m.before);
  const changedPresets = migratedPresets.filter((m) => m.after !== m.before);

  if (changedBuilds.length === 0 && changedPresets.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'done');
    return;
  }

  // Snapshot everything before writing
  const backupData: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    regexPresets: presets,
    builds,
    runs: await db.runs.toArray(),
    customGems: await db.customGems.toArray(),
    customItems: await db.customItems.toArray(),
  };
  await saveBackup(backupData, `migration to v${CURRENT_BUILD_VERSION}`);

  toast(`Builds updated for patch data v${CURRENT_BUILD_VERSION}`, {
    description: 'A backup was saved and can be restored from the dashboard.',
    action: {
      label: 'Download Backup',
      onClick: () => downloadJson(backupData, 'poe-planner-pre-migration-backup.json'),
    },
    duration: 10000,
  });

  // Write migrated records -- abort without setting the flag on failure so
  // the migration retries on next load.
  try {
    for (const { after } of changedBuilds) {
      await db.builds.put(after);
    }
    for (const { after } of changedPresets) {
      await db.regexPresets.put(after);
    }
  } catch {
    return;
  }

  localStorage.setItem(MIGRATION_KEY, 'done');
}

/** Store a snapshot in the backups table, pruning to the newest MAX_BACKUPS. */
async function saveBackup(data: ExportData, reason: string): Promise<void> {
  const record: BackupRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    reason,
    data: exportToJson(data),
  };
  await db.backups.add(record);

  const all = await db.backups.orderBy('createdAt').reverse().toArray();
  for (const stale of all.slice(MAX_BACKUPS)) {
    await db.backups.delete(stale.id);
  }
}

export async function listBackups(): Promise<Omit<BackupRecord, 'data'>[]> {
  const all = await db.backups.orderBy('createdAt').reverse().toArray();
  return all.map(({ id, createdAt, reason }) => ({ id, createdAt, reason }));
}

/**
 * Restore a stored backup. Records are put back and then re-migrated to the
 * current version (the snapshot predates the migration that triggered it).
 * Existing records with the same ids are overwritten; records created after
 * the backup are left alone.
 */
export async function restoreBackup(backupId: string): Promise<void> {
  const backup = await db.backups.get(backupId);
  if (!backup) throw new Error('Backup not found');

  const data = JSON.parse(backup.data) as ExportData;
  for (const build of data.builds ?? []) {
    await db.builds.put(migrateBuildToCurrent(build));
  }
  for (const preset of data.regexPresets ?? []) {
    await db.regexPresets.put(migratePresetToCurrent(preset));
  }
  for (const run of data.runs ?? []) {
    await db.runs.put(run);
  }
  for (const gem of data.customGems ?? []) {
    await db.customGems.put(gem);
  }
  for (const item of data.customItems ?? []) {
    await db.customItems.put(item);
  }
}
