/**
 * Fetch gem descriptions, base item names, and stat translations from RePoE.
 * These are used as collision pool data for the regex abbreviator.
 *
 * Usage: npx tsx scripts/fetch-repoe-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const REPOE_BASE = 'https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data';

async function fetchJSON(filename: string): Promise<any> {
  const url = `${REPOE_BASE}/${filename}`;
  console.log(`Fetching ${url}...`);
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
  return res.json();
}

/**
 * Extract gem descriptions from RePoE gems.min.json.
 * Path: [gemId].active_skill.description
 */
function extractGemDescriptions(gemsData: Record<string, any>): Record<string, string> {
  const descriptions: Record<string, string> = {};
  for (const [, gem] of Object.entries(gemsData)) {
    const name = gem?.active_skill?.display_name;
    const desc = gem?.active_skill?.description;
    if (name && desc && typeof desc === 'string' && desc.length > 10) {
      descriptions[name] = desc;
    }
  }
  return descriptions;
}

/** Item classes that appear in PoE item search (equipment, flasks, jewels, etc.) */
const EQUIPMENT_ITEM_CLASSES = new Set([
  'Amulet', 'Ring', 'Belt',
  'Body Armour', 'Boots', 'Gloves', 'Helmet', 'Shield',
  'Bow', 'Claw', 'Dagger', 'Rune Dagger', 'One Hand Axe', 'One Hand Mace',
  'One Hand Sword', 'Sceptre', 'Staff', 'Warstaff', 'Thrusting One Hand Sword',
  'Two Hand Axe', 'Two Hand Mace', 'Two Hand Sword', 'Wand',
  'Quiver', 'Flask', 'LifeFlask', 'ManaFlask', 'HybridFlask', 'UtilityFlask',
  'Jewel', 'AbyssJewel',
]);

/**
 * Extract base item names from RePoE base_items.min.json.
 * Only include released equipment items (not div cards, maps, currency, etc.)
 */
function extractBaseItemNames(baseItems: Record<string, any>): string[] {
  const names = new Set<string>();
  for (const [, item] of Object.entries(baseItems)) {
    if (!item?.name || item.release_state !== 'released' || item.name.length < 2) continue;
    if (!EQUIPMENT_ITEM_CLASSES.has(item.item_class)) continue;
    names.add(item.name);
  }
  return Array.from(names).sort();
}

/**
 * Extract human-readable stat translation strings from RePoE.
 * Aggressively filtered to keep only entries most likely to cause
 * abbreviation collisions (short-to-medium mod lines).
 * The abbreviator tests every candidate pattern against the full pool,
 * so keeping this under ~2000 entries is important for performance.
 */
function extractStatTranslations(translations: any[]): string[] {
  const strings = new Set<string>();
  const sampleValues = ['10', '5', '20', '3'];

  for (const entry of translations) {
    const english = entry?.English;
    if (!Array.isArray(english)) continue;

    for (const variant of english) {
      let text = variant?.string;
      if (!text || typeof text !== 'string') continue;

      // Replace {0}, {1}, etc. with sample numbers
      text = text.replace(/\{(\d+)\}/g, (_: string, idx: string) => {
        return sampleValues[parseInt(idx)] || '10';
      });

      // Only keep very short strings (most collision-prone with 4-8 char patterns)
      // Longer mod lines are too specific to collide with short abbreviations
      if (text.length < 10 || text.length > 35) continue;
      // Skip entries that are just numbers or formatting
      if (/^\d+%?$/.test(text.trim())) continue;
      // Skip entries with special formatting markers or newlines
      if (text.includes('%s%') || text.includes('N/A') || text.includes('\n')) continue;
      // Skip niche league/mechanic-specific entries
      if (/Heist|Legion|Delve|Delirium|Expedition|Sanctum|Ultimatum|Blight|Harvest|Bestiary|Incursion|Betrayal|Synthesis|Ritual|Scourge|Sentinel|Crucible|Affliction|Necropolis/i.test(text)) continue;
      // Skip cluster jewel / Atlas specific entries
      if (/Cluster|Atlas|Watchstone|Maven|Sextant|Pantheon/i.test(text)) continue;

      strings.add(text);
    }
  }

  return Array.from(strings).sort();
}

async function main() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');

  // Fetch all three in parallel
  const [gemsRaw, baseItemsRaw, statTransRaw] = await Promise.all([
    fetchJSON('gems.min.json'),
    fetchJSON('base_items.min.json'),
    fetchJSON('stat_translations.min.json'),
  ]);

  // Extract gem descriptions
  const gemDescriptions = extractGemDescriptions(gemsRaw);
  const gemDescPath = path.join(dataDir, 'gem-descriptions.json');
  fs.writeFileSync(gemDescPath, JSON.stringify(gemDescriptions, null, 2));
  console.log(`Saved ${Object.keys(gemDescriptions).length} gem descriptions to gem-descriptions.json`);

  // Extract base item names
  const baseItemNames = extractBaseItemNames(baseItemsRaw);
  const baseItemsPath = path.join(dataDir, 'base-item-names.json');
  fs.writeFileSync(baseItemsPath, JSON.stringify(baseItemNames, null, 2));
  console.log(`Saved ${baseItemNames.length} base item names to base-item-names.json`);

  // Extract stat translations
  const statTranslations = extractStatTranslations(statTransRaw);
  const statTransPath = path.join(dataDir, 'stat-translations.json');
  fs.writeFileSync(statTransPath, JSON.stringify(statTranslations, null, 2));
  console.log(`Saved ${statTranslations.length} stat translations to stat-translations.json`);

  // Show some examples
  console.log('\n--- Gem Description Examples ---');
  const gemExamples = Object.entries(gemDescriptions).slice(0, 3);
  for (const [name, desc] of gemExamples) {
    console.log(`  ${name}: "${(desc as string).substring(0, 80)}..."`);
  }

  console.log('\n--- Base Item Name Examples ---');
  for (const name of baseItemNames.slice(0, 15)) {
    console.log(`  ${name}`);
  }

  console.log('\n--- Stat Translation Examples ---');
  for (const text of statTranslations.slice(0, 10)) {
    console.log(`  ${text}`);
  }
}

main().catch(console.error);
