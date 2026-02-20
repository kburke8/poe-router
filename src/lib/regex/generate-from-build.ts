import type { BuildPlan, BuildLinkGroup, SocketColor } from '@/types/build';
import type { RegexPreset } from '@/types/regex';
import { abbreviate, computeAbbreviations } from './abbreviator';
import gemsData from '@/data/gems.json';
import itemsData from '@/data/items.json';
import type { Gem, GemColor, Item, ItemDatabase } from '@/types/gem';

const allGems: Gem[] = [
  ...(gemsData.skills as Gem[]),
  ...(gemsData.supports as Gem[]),
];

const allGemNames = allGems.map((g) => g.name);

const allItemNames = Object.values(itemsData as ItemDatabase)
  .flat()
  .map((i) => i.name);

const gambasItems = (itemsData as ItemDatabase).gambas as Item[];

export interface LinkPattern {
  pattern: string;
  sourceName: string;
  linkSize: number;
}

/**
 * Generate all unique permutations of an array (handles duplicate elements).
 * For [b,b,g] returns [[b,b,g],[b,g,b],[g,b,b]].
 */
function uniquePermutations(arr: string[]): string[][] {
  if (arr.length <= 1) return [[...arr]];
  const result: string[][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < arr.length; i++) {
    if (seen.has(arr[i])) continue;
    seen.add(arr[i]);
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of uniquePermutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

/**
 * Generate exact socket color search patterns from build link groups.
 * Handles 2-links and 3-links. Uses the last phase of each link group.
 *
 * Generates all unique permutations of each link group's socket colors,
 * joined with `|` into a single pattern per link group.
 *
 * Examples:
 * - BBG (3L) → "b-b-g|b-g-b|g-b-b" (3 permutations)
 * - BBB (3L) → "b-b-b" (1 permutation)
 * - BG  (2L) → "b-g|g-b" (2 permutations)
 * - BB  (2L) → "b-b" (1 permutation)
 *
 * All patterns are lowercase. 1-link groups are skipped.
 */
export function generateLinkPatterns(linkGroups: BuildLinkGroup[]): LinkPattern[] {
  const seen = new Set<string>(); // dedup by pattern
  const results: LinkPattern[] = [];

  for (const lg of linkGroups) {
    if (lg.phases.length === 0) continue;

    // Check all phases so earlier link sizes (e.g. 3L before a group grows to 4L)
    // still produce patterns.
    for (const phase of lg.phases) {
      const gemCount = phase.gems.length;

      // Skip 1-links and 4+ links
      if (gemCount < 2 || gemCount > 3) continue;

      const colors = phase.gems.map((g) => g.socketColor.toLowerCase()).sort();
      const sourceName = lg.label || `${gemCount}L`;

      const perms = uniquePermutations(colors);
      const pattern = perms.map((p) => p.join('-')).join('|');

      if (seen.has(pattern)) continue;
      seen.add(pattern);

      results.push({ pattern, sourceName, linkSize: gemCount });
    }
  }

  return results;
}

// === Gambas auto-generation ===

type DefenseType = 'armour' | 'evasion' | 'energy_shield';

interface PrimarySkillGem {
  name: string;
  color: GemColor;
  tags: string[];
}

/**
 * Find the primary skill gem from the build's link groups.
 * Picks the link group with the most gems in its last phase,
 * then returns the first skill-type gem found in that group.
 */
export function findPrimarySkillGem(build: BuildPlan): PrimarySkillGem | null {
  let bestGroup: BuildLinkGroup | null = null;
  let bestCount = 0;

  for (const lg of build.linkGroups) {
    if (lg.phases.length === 0) continue;
    const lastPhase = lg.phases[lg.phases.length - 1];
    if (lastPhase.gems.length > bestCount) {
      bestCount = lastPhase.gems.length;
      bestGroup = lg;
    }
  }

  if (!bestGroup) return null;

  const lastPhase = bestGroup.phases[bestGroup.phases.length - 1];
  for (const slot of lastPhase.gems) {
    const gemData = allGems.find(
      (g) => g.name === slot.gemName && g.type === 'skill',
    );
    if (gemData) {
      return { name: gemData.name, color: gemData.color, tags: gemData.tags };
    }
  }

  return null;
}

const COLOR_TO_DEFENSE: Record<GemColor, DefenseType> = {
  red: 'armour',
  green: 'evasion',
  blue: 'energy_shield',
};

const SOCKET_TO_GEM_COLOR: Record<SocketColor, GemColor | null> = {
  R: 'red',
  G: 'green',
  B: 'blue',
  W: null,
};

interface GambasEntry {
  itemId: string;
  enabled: boolean;
}

const ALL_MELEE_WEAPON_GAMBAS = [
  'random_one_hand_sword', 'random_one_hand_axe', 'random_one_hand_mace',
  'random_two_hand_sword', 'random_two_hand_axe', 'random_two_hand_mace',
  'random_claw', 'random_dagger', 'random_rune_dagger', 'random_rapier',
];

/**
 * Get weapon gambas entries based on gem tags.
 * Bow/spell builds get their specific weapons enabled.
 * Melee builds get all weapons added but disabled (unchecked),
 * so users can opt-in to whichever weapon type they need.
 */
function getWeaponGambas(gem: PrimarySkillGem): GambasEntry[] {
  if (gem.tags.includes('bow')) {
    return [
      { itemId: 'random_bow', enabled: true },
      { itemId: 'random_quiver', enabled: true },
    ];
  }
  if (gem.tags.includes('spell') && !gem.tags.includes('melee')) {
    return [
      { itemId: 'random_wand', enabled: true },
      { itemId: 'random_sceptre', enabled: true },
    ];
  }
  // Melee / generic: include melee weapons unchecked
  return ALL_MELEE_WEAPON_GAMBAS.map((itemId) => ({ itemId, enabled: false }));
}

/**
 * Build a hybrid defense ID with the two types in canonical order
 * (armour < evasion < energy_shield).
 */
function hybridId(a: DefenseType, b: DefenseType, slot: string): string {
  const order: DefenseType[] = ['armour', 'evasion', 'energy_shield'];
  const [first, second] = order.indexOf(a) < order.indexOf(b) ? [a, b] : [b, a];
  return `random_${first}_and_${second}_${slot}`;
}

/**
 * Get armor gambas entries for body/helmet/gloves/boots based on socket colors
 * from the main link group.
 *
 * - If one color dominates (pure or favored): pure defense of that color
 * - If two colors are tied: hybrid base of those two
 * - Three-way tie: falls back to the primary skill gem's color
 */
function getArmorGambas(build: BuildPlan, gem: PrimarySkillGem): GambasEntry[] {
  // Find the best link group (same logic as findPrimarySkillGem)
  let bestGroup: BuildLinkGroup | null = null;
  let bestCount = 0;
  for (const lg of build.linkGroups) {
    if (lg.phases.length === 0) continue;
    const lastPhase = lg.phases[lg.phases.length - 1];
    if (lastPhase.gems.length > bestCount) {
      bestCount = lastPhase.gems.length;
      bestGroup = lg;
    }
  }

  if (!bestGroup) return [];

  const lastPhase = bestGroup.phases[bestGroup.phases.length - 1];
  const counts: Record<GemColor, number> = { red: 0, green: 0, blue: 0 };
  for (const slot of lastPhase.gems) {
    const gemColor = SOCKET_TO_GEM_COLOR[slot.socketColor];
    if (gemColor) counts[gemColor]++;
  }

  const sorted = (['red', 'green', 'blue'] as GemColor[])
    .map((c) => ({ color: c, count: counts[c] }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  if (sorted.length === 0) return [];

  const slots = ['body', 'helmet', 'gloves', 'boots'];
  const entries: GambasEntry[] = [];

  const isTwoWayTie =
    sorted.length >= 2 &&
    sorted[0].count === sorted[1].count &&
    (sorted.length < 3 || sorted[1].count > sorted[2].count);

  if (isTwoWayTie) {
    // Split colors (e.g., 2B2G) → hybrid base
    const def1 = COLOR_TO_DEFENSE[sorted[0].color];
    const def2 = COLOR_TO_DEFENSE[sorted[1].color];
    for (const slot of slots) {
      entries.push({ itemId: hybridId(def1, def2, slot), enabled: true });
    }
  } else {
    // One dominant color, or 3-way tie (fall back to gem color)
    const defColor =
      sorted[0].count > (sorted[1]?.count ?? 0)
        ? sorted[0].color
        : gem.color;
    const defense = COLOR_TO_DEFENSE[defColor];
    for (const slot of slots) {
      entries.push({ itemId: `random_${defense}_${slot}`, enabled: true });
    }
  }

  return entries;
}

/**
 * Generate the full list of gambas entries for a build.
 */
function generateGambasEntries(build: BuildPlan): GambasEntry[] {
  const gem = findPrimarySkillGem(build);
  if (!gem) return [];

  return [
    ...getWeaponGambas(gem),
    ...getArmorGambas(build, gem),
  ];
}

// === Smart item suggestions ===

const allItems = Object.values(itemsData as ItemDatabase).flat() as Item[];

/**
 * Generate smart item suggestions based on the primary skill gem.
 * - Attack builds: Iron Ring (flat phys damage implicit)
 * - Bow builds: Serrated Arrow Quiver (adds arrows)
 */
function generateSmartItems(gem: PrimarySkillGem | null): string[] {
  if (!gem) return [];
  const items: string[] = [];

  if (gem.tags.includes('attack')) {
    items.push('iron_ring');
  }
  if (gem.tags.includes('bow')) {
    items.push('serrated_arrow_quiver');
  }

  return items;
}

// === Exclusion auto-generation ===
//
// Works with the ExclusionPanel's item class block system. Instead of adding
// individual exclusion entries, we compute which item class IDs to toggle ON
// and build the single `lass:.(st|war|fl|...)` pattern.

const FLASK_SKILLS = new Set(['Poisonous Concoction', 'Explosive Concoction']);

/** Item class abbreviations matching ExclusionPanel's ITEM_CLASSES (lass:. group). */
const CLASS_ABBRS: Record<string, string> = {
  staves: 'st', two_hand: 'tw', warstaves: 'war', one_hand: 'one',
  rune_daggers: 'ru', thrusting: 'th', sceptres: 'sc', claws: 'cl',
  shields: 'shi', bows: 'bow', wands: 'wan', daggers: 'da', quivers: 'qu',
};

/** Standalone patterns for classes that don't work with lass:. (e.g., "Life Flasks"). */
const CLASS_STANDALONE: Record<string, string> = {
  flasks: 'flask',
};

const CLASS_BLOCK_SOURCE = '__class_block__';

/**
 * Determine which item classes to exclude based on the build's primary skill gem.
 *
 * - Always: staves, warstaves
 * - Flasks: unless flask skill (Poisonous/Explosive Concoction)
 * - Never: thrusting (rapiers used cross-build for movement skills)
 * - Bow builds: one_hand, two_hand, sceptres, claws, wands, daggers, rune_daggers
 * - Spell builds: one_hand, two_hand, claws, daggers, rune_daggers, bows, quivers
 * - Melee with weapon tags: bows, quivers, wands, plus specific classes not matching tags
 * - Generic melee (no weapon tags): bows, quivers, wands only
 */
function generateExcludedClassIds(gem: PrimarySkillGem | null): string[] {
  const excluded: string[] = ['staves', 'warstaves'];

  if (!gem || !FLASK_SKILLS.has(gem.name)) {
    excluded.push('flasks');
  }

  if (!gem) return excluded;

  if (gem.tags.includes('bow')) {
    excluded.push('one_hand', 'two_hand', 'sceptres', 'claws', 'wands', 'daggers', 'rune_daggers');
  } else if (gem.tags.includes('spell') && !gem.tags.includes('melee')) {
    excluded.push('one_hand', 'two_hand', 'claws', 'daggers', 'rune_daggers', 'bows', 'quivers');
  } else {
    // Melee build — always exclude ranged/caster
    excluded.push('bows', 'quivers', 'wands');

    // If gem has specific weapon type tags, exclude ineligible weapon classes
    const hasWeaponTag = ['sword', 'axe', 'mace', 'claw', 'dagger'].some((t) => gem.tags.includes(t));
    if (hasWeaponTag) {
      if (!gem.tags.includes('claw')) excluded.push('claws');
      if (!gem.tags.includes('dagger')) excluded.push('daggers', 'rune_daggers');
      if (!gem.tags.includes('mace')) excluded.push('sceptres');
    }
  }

  return excluded;
}

function buildClassBlockPattern(classIds: string[]): string {
  const abbrs = classIds.map((id) => CLASS_ABBRS[id]).filter(Boolean);
  const standalones = classIds.map((id) => CLASS_STANDALONE[id]).filter(Boolean);

  const parts: string[] = [];
  if (abbrs.length > 0) {
    parts.push(`lass:.(${abbrs.join('|')})`);
  }
  parts.push(...standalones);

  return parts.join('|');
}

/**
 * Generate vendor regex for a build: populates 'gems', 'links', 'items', 'item_gambas', and 'dont_ever_show' categories.
 * Returns the preset ID that was created or reused.
 */
export async function generateBuildRegex(
  build: BuildPlan,
  presets: RegexPreset[],
  actions: {
    createPreset: (name: string) => Promise<string>;
    setActivePreset: (id: string) => void;
    clearCategory: (categoryId: 'gems' | 'links' | 'items' | 'item_gambas' | 'dont_ever_show') => Promise<void>;
    addEntry: (
      categoryId: 'gems' | 'links' | 'items' | 'item_gambas' | 'dont_ever_show',
      entry: {
        pattern: string;
        sourceId?: string;
        sourceName: string;
        isExclusion: boolean;
        enabled: boolean;
        isCustom: boolean;
        linkSize?: number;
      },
    ) => Promise<void>;
  },
): Promise<string> {
  // Collect vendor gem names
  const vendorGemNames = [
    ...new Set(
      build.stops
        .flatMap((s) => s.gemPickups)
        .filter((p) => p.source === 'vendor')
        .map((p) => p.gemName)
    ),
  ];

  // Compute link patterns
  const linkPatterns = generateLinkPatterns(build.linkGroups);

  // Compute gambas entries
  const gambasEntries = generateGambasEntries(build);

  // Create new preset or reuse linked one
  let presetId = build.regexPresetId;
  if (presetId && presets.find((p) => p.id === presetId)) {
    actions.setActivePreset(presetId);
    await actions.clearCategory('gems');
    await actions.clearCategory('links');
    await actions.clearCategory('items');
    await actions.clearCategory('item_gambas');
    await actions.clearCategory('dont_ever_show');
  } else {
    presetId = await actions.createPreset(`${build.name} - Regex`);
  }

  actions.setActivePreset(presetId);

  // Add gem entries
  if (vendorGemNames.length > 0) {
    const abbreviations = computeAbbreviations(vendorGemNames, allGemNames);
    for (const [gemName, pattern] of abbreviations) {
      await actions.addEntry('gems', {
        pattern,
        sourceName: gemName,
        isExclusion: false,
        enabled: true,
        isCustom: false,
      });
    }
  }

  // Add link entries
  for (const lp of linkPatterns) {
    await actions.addEntry('links', {
      pattern: lp.pattern,
      sourceName: lp.sourceName,
      isExclusion: false,
      enabled: true,
      isCustom: false,
      linkSize: lp.linkSize,
    });
  }

  // Add smart item entries
  const gemForItems = findPrimarySkillGem(build);
  const smartItemIds = generateSmartItems(gemForItems);
  for (const itemId of smartItemIds) {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) continue;
    const pattern = abbreviate(item.name, allItemNames);
    await actions.addEntry('items', {
      pattern,
      sourceName: item.name,
      isExclusion: false,
      enabled: true,
      isCustom: false,
    });
  }

  // Add gambas entries (individual items; condensed at output by combiner)
  for (const ge of gambasEntries) {
    const item = gambasItems.find((i) => i.id === ge.itemId);
    if (!item) continue;
    const pattern = abbreviate(item.name, allItemNames);
    await actions.addEntry('item_gambas', {
      pattern,
      sourceName: item.name,
      isExclusion: false,
      enabled: ge.enabled,
      isCustom: false,
    });
  }

  // Add exclusion class block (toggles item classes in the ExclusionPanel)
  const gem = findPrimarySkillGem(build);
  const excludedClassIds = generateExcludedClassIds(gem);
  if (excludedClassIds.length > 0) {
    const pattern = buildClassBlockPattern(excludedClassIds);
    await actions.addEntry('dont_ever_show', {
      pattern,
      sourceId: CLASS_BLOCK_SOURCE,
      sourceName: 'Item Class Block',
      isExclusion: true,
      enabled: true,
      isCustom: false,
    });
  }

  return presetId;
}

/**
 * Check whether the build has any content worth generating regex for.
 */
export function hasBuildRegexContent(build: BuildPlan): boolean {
  const hasVendorGems = build.stops
    .flatMap((s) => s.gemPickups)
    .some((p) => p.source === 'vendor');

  const hasLinkGroups = build.linkGroups.some((lg) =>
    lg.phases.some((phase) => phase.gems.length >= 2 && phase.gems.length <= 3),
  );

  const hasClassName = !!build.className;

  return hasVendorGems || hasLinkGroups || hasClassName;
}
