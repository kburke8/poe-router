// Cross-check validation script: ensures all gem names in gem-rewards.ts and classes.ts
// exist in gems.json. Also checks for old/removed gem names and alphabetical sorting.
//
// Usage: npx tsx scripts/validate-gem-rewards.ts

import gemsData from '../src/data/gems.json';
import { QUEST_GEM_TABLES } from '../src/data/gem-rewards';
import { POE_CLASSES } from '../src/data/classes';
import renameMap from '../src/data/gem-rename-map.json';

const allGemNames = new Set([
  ...gemsData.skills.map((g) => g.name),
  ...gemsData.supports.map((g) => g.name),
]);

let errors = 0;

// 1. Check all gem names in quest/vendor rewards exist in gems.json
for (const table of QUEST_GEM_TABLES) {
  for (const [cls, gems] of Object.entries(table.questRewards)) {
    for (const name of gems as string[]) {
      if (!allGemNames.has(name)) {
        console.error(`MISSING: "${name}" in ${table.questId} questRewards[${cls}]`);
        errors++;
      }
    }
  }
  for (const [cls, gems] of Object.entries(table.vendorRewards)) {
    for (const name of gems as string[]) {
      if (!allGemNames.has(name)) {
        console.error(`MISSING: "${name}" in ${table.questId} vendorRewards[${cls}]`);
        errors++;
      }
    }
  }
}

// 2. Check all beach gem names exist in gems.json
for (const cls of POE_CLASSES) {
  if (!allGemNames.has(cls.beachGems.skillGem)) {
    console.error(`MISSING beach skill: "${cls.beachGems.skillGem}" for ${cls.name}`);
    errors++;
  }
  if (!allGemNames.has(cls.beachGems.supportGem)) {
    console.error(`MISSING beach support: "${cls.beachGems.supportGem}" for ${cls.name}`);
    errors++;
  }
}

// 3. Check no OLD gem names from gem-rename-map.json appear
const oldNames = Object.keys(renameMap);
for (const table of QUEST_GEM_TABLES) {
  for (const [cls, gems] of Object.entries(table.questRewards)) {
    for (const name of gems as string[]) {
      if (oldNames.includes(name)) {
        console.error(`OLD NAME: "${name}" (should be "${(renameMap as Record<string, string>)[name]}") in ${table.questId} questRewards[${cls}]`);
        errors++;
      }
    }
  }
  for (const [cls, gems] of Object.entries(table.vendorRewards)) {
    for (const name of gems as string[]) {
      if (oldNames.includes(name)) {
        console.error(`OLD NAME: "${name}" (should be "${(renameMap as Record<string, string>)[name]}") in ${table.questId} vendorRewards[${cls}]`);
        errors++;
      }
    }
  }
}

// 4. Check removed gem "Blade Trap" does not appear
const removedGems = ['Blade Trap'];
for (const table of QUEST_GEM_TABLES) {
  for (const [cls, gems] of Object.entries(table.questRewards)) {
    for (const name of gems as string[]) {
      if (removedGems.includes(name)) {
        console.error(`REMOVED GEM: "${name}" in ${table.questId} questRewards[${cls}]`);
        errors++;
      }
    }
  }
  for (const [cls, gems] of Object.entries(table.vendorRewards)) {
    for (const name of gems as string[]) {
      if (removedGems.includes(name)) {
        console.error(`REMOVED GEM: "${name}" in ${table.questId} vendorRewards[${cls}]`);
        errors++;
      }
    }
  }
}

// 5. Check alphabetical sorting of gem name arrays per class
for (const table of QUEST_GEM_TABLES) {
  for (const [cls, gems] of Object.entries(table.questRewards)) {
    const arr = gems as string[];
    const sorted = [...arr].sort();
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== sorted[i]) {
        console.error(`NOT SORTED: ${table.questId} questRewards[${cls}] - "${arr[i]}" should be "${sorted[i]}" at index ${i}`);
        errors++;
        break;
      }
    }
  }
  for (const [cls, gems] of Object.entries(table.vendorRewards)) {
    const arr = gems as string[];
    const sorted = [...arr].sort();
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== sorted[i]) {
        console.error(`NOT SORTED: ${table.questId} vendorRewards[${cls}] - "${arr[i]}" should be "${sorted[i]}" at index ${i}`);
        errors++;
        break;
      }
    }
  }
}

// Summary
if (errors === 0) {
  console.log('All gem names valid! No errors found.');
} else {
  console.log(`\n${errors} error(s) found.`);
}

process.exit(errors > 0 ? 1 : 0);
