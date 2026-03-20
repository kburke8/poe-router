/**
 * Unified data pipeline for PoE gem data and collision pool generation.
 * Fetches from repoe-fork.github.io and produces:
 * - gems.json (filtered, transformed gem database)
 * - gem-names.json (broad collision pool of all released gem names)
 * - gem-descriptions.json (gem description texts for collision pool)
 * - base-item-names.json (equipment base item names for collision pool)
 * - stat-translations.json (stat mod text for collision pool)
 * - gem-diff.json (diff report for programmatic consumption)
 *
 * Usage: npx tsx scripts/fetch-repoe-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GemColor = 'red' | 'green' | 'blue';
type GemType = 'skill' | 'support';

interface Gem {
  id: string;
  name: string;
  color: GemColor;
  type: GemType;
  tags: string[];
}

interface RePoEGemMinimal {
  active_skill?: {
    description: string;
    display_name: string;
    id: string;
    is_manually_casted: boolean;
    is_skill_totem: boolean;
    types: string[];
  };
  base_item: {
    display_name: string;
    id: string;
    max_level: number;
    release_state: 'released' | 'unreleased' | 'legacy';
  } | null;
  color: 'r' | 'g' | 'b' | 'w';
  display_name: string;
  is_support: boolean;
  tags: string[];
  discriminator?: string;
  support_gem?: { letter: string; supports_gems_only: boolean };
}

interface DiffResult {
  added: string[];
  removed: string[];
  renamed: { old: string; new: string }[];
  unchanged: string[];
  stats: {
    total_old: number;
    total_new: number;
    added_count: number;
    removed_count: number;
    renamed_count: number;
    unchanged_count: number;
  };
}

interface Metadata {
  _metadata: {
    generated: string;
    source: string;
    entryCount: number;
    poeVersion: string;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPOE_BASE = 'https://repoe-fork.github.io';

const COLOR_MAP: Record<string, GemColor> = { r: 'red', g: 'green', b: 'blue' };

const WHITE_GEM_WHITELIST = new Set(['Convocation', 'Detonate Mines']);

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

async function fetchJSON(filename: string): Promise<any> {
  const url = `${REPOE_BASE}/${filename}`;
  console.log(`Fetching ${url}...`);
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
  return res.json();
}

/**
 * Convert gem name to kebab_snake ID.
 * Lowercases, removes apostrophes, replaces non-alphanumeric with underscore,
 * trims leading/trailing underscores.
 */
function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Build version metadata for a data file.
 */
function withMetadata(source: string, entryCount: number): Metadata {
  return {
    _metadata: {
      generated: new Date().toISOString(),
      source,
      entryCount,
      poeVersion: '3.28',
    },
  };
}

// ---------------------------------------------------------------------------
// Gem filtering
// ---------------------------------------------------------------------------

/**
 * Determine whether a gem entry from RePoE should be included in gems.json.
 * Returns { include, reason } where reason documents why it was excluded.
 */
function shouldIncludeGem(gem: RePoEGemMinimal): { include: boolean; reason?: string } {
  if (!gem.base_item) return { include: false, reason: 'no_base_item' };
  if (gem.base_item.release_state !== 'released') return { include: false, reason: 'unreleased' };
  if (gem.discriminator) return { include: false, reason: 'transfigured' };
  if (gem.display_name.startsWith('Vaal ')) return { include: false, reason: 'vaal' };
  if (gem.tags?.includes('exceptional')) return { include: false, reason: 'exceptional' };
  if (gem.tags?.includes('awakened')) return { include: false, reason: 'awakened' };
  if (gem.base_item.id?.includes('Royale')) return { include: false, reason: 'royale' };
  if (gem.display_name !== gem.base_item.display_name) return { include: false, reason: 'name_mismatch' };
  if (gem.display_name.startsWith('[')) return { include: false, reason: 'internal' };
  if (gem.display_name.startsWith('Playtest')) return { include: false, reason: 'playtest' };
  if (gem.color === 'w') {
    if (!WHITE_GEM_WHITELIST.has(gem.display_name)) {
      return { include: false, reason: 'white' };
    }
  }
  return { include: true };
}

// ---------------------------------------------------------------------------
// Gem extraction
// ---------------------------------------------------------------------------

/**
 * Extract and transform gems from RePoE data into the app's Gem format.
 * Filters, deduplicates, and splits into skills/supports.
 */
function extractGems(gemsData: Record<string, RePoEGemMinimal>): { skills: Gem[]; supports: Gem[] } {
  const filterStats: Record<string, number> = {};
  const seen = new Set<string>();
  const gems: Gem[] = [];

  for (const [, gem] of Object.entries(gemsData)) {
    const result = shouldIncludeGem(gem);
    if (!result.include) {
      const reason = result.reason || 'unknown';
      filterStats[reason] = (filterStats[reason] || 0) + 1;
      continue;
    }

    // Deduplicate by display_name (first occurrence wins for Phase Run, Arctic Armour, Lightning Tendrils)
    if (seen.has(gem.display_name)) {
      filterStats['duplicate'] = (filterStats['duplicate'] || 0) + 1;
      continue;
    }
    seen.add(gem.display_name);

    gems.push({
      id: nameToId(gem.display_name),
      name: gem.display_name,
      color: COLOR_MAP[gem.color] ?? 'blue', // fallback for whitelisted white gems
      type: gem.is_support ? 'support' : 'skill',
      tags: gem.tags ?? [],
    });
  }

  // Log filter statistics
  console.log('\n--- Filter Statistics ---');
  let totalExcluded = 0;
  for (const [reason, count] of Object.entries(filterStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${count}`);
    totalExcluded += count;
  }
  console.log(`  TOTAL excluded: ${totalExcluded}`);
  console.log(`  TOTAL included: ${gems.length}`);

  const skills = gems.filter((g) => g.type === 'skill').sort((a, b) => a.name.localeCompare(b.name));
  const supports = gems.filter((g) => g.type === 'support').sort((a, b) => a.name.localeCompare(b.name));

  return { skills, supports };
}

/**
 * Extract all released gem display names for the collision pool.
 * This is intentionally broader than extractGems -- includes Vaal, transfigured, etc.
 */
function extractGemNames(gemsData: Record<string, RePoEGemMinimal>): string[] {
  const names = new Set<string>();
  for (const [, gem] of Object.entries(gemsData)) {
    if (gem.base_item && gem.base_item.release_state === 'released') {
      names.add(gem.display_name);
    }
  }
  return Array.from(names).sort();
}

// ---------------------------------------------------------------------------
// Diff generation
// ---------------------------------------------------------------------------

/**
 * Generate a diff between current and new gem databases.
 */
function generateDiff(
  currentGems: { skills: Gem[]; supports: Gem[] },
  newGems: { skills: Gem[]; supports: Gem[] },
  renameMap: Record<string, string>
): DiffResult {
  const oldNames = new Set([
    ...currentGems.skills.map((g) => g.name),
    ...currentGems.supports.map((g) => g.name),
  ]);
  const newNames = new Set([
    ...newGems.skills.map((g) => g.name),
    ...newGems.supports.map((g) => g.name),
  ]);

  // Track renames
  const renamed: { old: string; new: string }[] = [];
  const renameOlds = new Set<string>();
  const renameNews = new Set<string>();

  for (const [oldName, newName] of Object.entries(renameMap)) {
    if (oldNames.has(oldName) && newNames.has(newName)) {
      renamed.push({ old: oldName, new: newName });
      renameOlds.add(oldName);
      renameNews.add(newName);
    }
  }

  const added = Array.from(newNames)
    .filter((n) => !oldNames.has(n) && !renameNews.has(n))
    .sort();
  const removed = Array.from(oldNames)
    .filter((n) => !newNames.has(n) && !renameOlds.has(n))
    .sort();
  const unchanged = Array.from(newNames)
    .filter((n) => oldNames.has(n) && !renameNews.has(n))
    .sort();

  return {
    added,
    removed,
    renamed,
    unchanged,
    stats: {
      total_old: oldNames.size,
      total_new: newNames.size,
      added_count: added.length,
      removed_count: removed.length,
      renamed_count: renamed.length,
      unchanged_count: unchanged.length,
    },
  };
}

/**
 * Print a human-readable diff summary to console.
 */
function printDiffSummary(diff: DiffResult): void {
  console.log('\n========================================');
  console.log(`Diff: ${diff.stats.added_count} added, ${diff.stats.removed_count} removed, ${diff.stats.renamed_count} renamed, ${diff.stats.unchanged_count} unchanged`);
  console.log('========================================');

  if (diff.added.length > 0) {
    console.log('\nADDED:');
    for (const name of diff.added) {
      console.log(`  + ${name}`);
    }
  }

  if (diff.removed.length > 0) {
    console.log('\nREMOVED:');
    for (const name of diff.removed) {
      console.log(`  - ${name}`);
    }
  }

  if (diff.renamed.length > 0) {
    console.log('\nRENAMED:');
    for (const r of diff.renamed) {
      console.log(`  ${r.old} -> ${r.new}`);
    }
  }

  console.log(`\nTotal: ${diff.stats.total_old} old -> ${diff.stats.total_new} new`);
}

// ---------------------------------------------------------------------------
// Collision pool extractors (existing logic preserved)
// ---------------------------------------------------------------------------

/**
 * Extract gem descriptions from RePoE gems data.
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
      if (text.length < 10 || text.length > 35) continue;
      if (/^\d+%?$/.test(text.trim())) continue;
      if (text.includes('%s%') || text.includes('N/A') || text.includes('\n')) continue;
      if (/Heist|Legion|Delve|Delirium|Expedition|Sanctum|Ultimatum|Blight|Harvest|Bestiary|Incursion|Betrayal|Synthesis|Ritual|Scourge|Sentinel|Crucible|Affliction|Necropolis/i.test(text)) continue;
      if (/Cluster|Atlas|Watchstone|Maven|Sextant|Pantheon/i.test(text)) continue;

      strings.add(text);
    }
  }

  return Array.from(strings).sort();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');

  // Fetch all sources in parallel
  const [gemsRaw, baseItemsRaw, statTransRaw] = await Promise.all([
    fetchJSON('gems_minimal.min.json'),
    fetchJSON('base_items.min.json'),
    fetchJSON('stat_translations.min.json'),
  ]);

  // Read current gems.json for diff comparison
  const currentGemsPath = path.join(dataDir, 'gems.json');
  let currentGems: { skills: Gem[]; supports: Gem[] } = { skills: [], supports: [] };
  try {
    const raw = JSON.parse(fs.readFileSync(currentGemsPath, 'utf-8'));
    currentGems = { skills: raw.skills || [], supports: raw.supports || [] };
  } catch {
    console.log('No existing gems.json found, treating as fresh generation.');
  }

  // Read rename map
  const renameMapPath = path.join(dataDir, 'gem-rename-map.json');
  let renameMap: Record<string, string> = {};
  try {
    renameMap = JSON.parse(fs.readFileSync(renameMapPath, 'utf-8'));
  } catch {
    console.log('No gem-rename-map.json found, skipping rename detection.');
  }

  // --- Extract gems ---
  const newGems = extractGems(gemsRaw);
  const totalGems = newGems.skills.length + newGems.supports.length;
  console.log(`\nExtracted: ${newGems.skills.length} skills + ${newGems.supports.length} supports = ${totalGems} total`);

  // --- Generate and print diff ---
  const diff = generateDiff(currentGems, newGems, renameMap);
  printDiffSummary(diff);

  // --- Write gems.json ---
  const gemsSource = `${REPOE_BASE}/gems_minimal.min.json`;
  const gemsOutput = {
    ...withMetadata(gemsSource, totalGems),
    skills: newGems.skills,
    supports: newGems.supports,
  };
  fs.writeFileSync(currentGemsPath, JSON.stringify(gemsOutput, null, 2));
  console.log(`\nSaved ${totalGems} gems to gems.json`);

  // --- Write gem-names.json ---
  const gemNames = extractGemNames(gemsRaw);
  const gemNamesOutput = {
    ...withMetadata(gemsSource, gemNames.length),
    entries: gemNames,
  };
  fs.writeFileSync(path.join(dataDir, 'gem-names.json'), JSON.stringify(gemNamesOutput, null, 2));
  console.log(`Saved ${gemNames.length} gem names to gem-names.json`);

  // --- Write gem-descriptions.json ---
  const gemDescriptions = extractGemDescriptions(gemsRaw);
  const descCount = Object.keys(gemDescriptions).length;
  const gemDescOutput = {
    ...withMetadata(gemsSource, descCount),
    ...gemDescriptions,
  };
  fs.writeFileSync(path.join(dataDir, 'gem-descriptions.json'), JSON.stringify(gemDescOutput, null, 2));
  console.log(`Saved ${descCount} gem descriptions to gem-descriptions.json`);

  // --- Write base-item-names.json ---
  const baseItemNames = extractBaseItemNames(baseItemsRaw);
  const baseItemsOutput = {
    ...withMetadata(`${REPOE_BASE}/base_items.min.json`, baseItemNames.length),
    entries: baseItemNames,
  };
  fs.writeFileSync(path.join(dataDir, 'base-item-names.json'), JSON.stringify(baseItemsOutput, null, 2));
  console.log(`Saved ${baseItemNames.length} base item names to base-item-names.json`);

  // --- Write stat-translations.json ---
  const statTranslations = extractStatTranslations(statTransRaw);
  const statTransOutput = {
    ...withMetadata(`${REPOE_BASE}/stat_translations.min.json`, statTranslations.length),
    entries: statTranslations,
  };
  fs.writeFileSync(path.join(dataDir, 'stat-translations.json'), JSON.stringify(statTransOutput, null, 2));
  console.log(`Saved ${statTranslations.length} stat translations to stat-translations.json`);

  // --- Write gem-diff.json ---
  fs.writeFileSync(path.join(dataDir, 'gem-diff.json'), JSON.stringify(diff, null, 2));
  console.log(`Saved diff report to gem-diff.json`);

  // --- Final summary ---
  console.log('\n========================================');
  console.log('Pipeline complete. Output files:');
  console.log(`  gems.json           : ${totalGems} gems (${newGems.skills.length} skills + ${newGems.supports.length} supports)`);
  console.log(`  gem-names.json      : ${gemNames.length} names (collision pool)`);
  console.log(`  gem-descriptions.json: ${descCount} descriptions`);
  console.log(`  base-item-names.json: ${baseItemNames.length} base items`);
  console.log(`  stat-translations.json: ${statTranslations.length} stat translations`);
  console.log(`  gem-diff.json       : ${diff.stats.added_count} added, ${diff.stats.removed_count} removed, ${diff.stats.renamed_count} renamed`);
  console.log('========================================');
}

main().catch(console.error);
