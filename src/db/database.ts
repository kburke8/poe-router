import Dexie, { type Table } from 'dexie';
import type { RegexPreset } from '@/types/regex';
import type { BuildPlan } from '@/types/build';
import type { RunRecord } from '@/types/history';
import type { Gem, Item } from '@/types/gem';

export class PoeDatabase extends Dexie {
  regexPresets!: Table<RegexPreset, string>;
  builds!: Table<BuildPlan, string>;
  runs!: Table<RunRecord, string>;
  customGems!: Table<Gem, string>;
  customItems!: Table<Item, string>;

  constructor() {
    super('poe-planner');
    this.version(3).stores({
      regexPresets: 'id, name',
      builds: 'id, name, className',
      runs: 'id, buildPlanId, date',
      customGems: 'id, name',
      customItems: 'id, name',
    });
  }
}

export const db = new PoeDatabase();
