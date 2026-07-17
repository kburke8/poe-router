import Dexie, { type Table } from 'dexie';
import type { RegexPreset } from '@/types/regex';
import type { BuildPlan } from '@/types/build';
import type { RunRecord } from '@/types/history';
import type { Gem, Item } from '@/types/gem';

/** Full-database snapshot taken automatically before a data migration runs. */
export interface BackupRecord {
  id: string;
  createdAt: string;
  /** What triggered the backup, e.g. 'migration to v5'. */
  reason: string;
  /** JSON string of an ExportData payload (same format as manual exports). */
  data: string;
}

export class PoeDatabase extends Dexie {
  regexPresets!: Table<RegexPreset, string>;
  builds!: Table<BuildPlan, string>;
  runs!: Table<RunRecord, string>;
  customGems!: Table<Gem, string>;
  customItems!: Table<Item, string>;
  backups!: Table<BackupRecord, string>;

  constructor() {
    super('poe-planner');
    this.version(3).stores({
      regexPresets: 'id, name',
      builds: 'id, name, className',
      runs: 'id, buildPlanId, date',
      customGems: 'id, name',
      customItems: 'id, name',
    });
    this.version(4).stores({
      backups: 'id, createdAt',
    });
  }
}

export const db = new PoeDatabase();
