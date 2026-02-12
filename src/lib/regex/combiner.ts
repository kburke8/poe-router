import type { RegexCategory, RegexEntry } from '@/types/regex';

/**
 * Remove alternatives that are already matched by a shorter alternative.
 *
 * PoE search is substring-based, so if pattern "b-b" is in the list,
 * any pattern containing "b-b" as a substring (e.g. "b-b-b", "b-b-g", "g-b-b")
 * is redundant and can be removed to save characters.
 *
 * Preserves the original ordering of patterns — only filters out redundant
 * alternatives within each entry, and drops entries that become fully subsumed.
 *
 * Works on literal substring checks only (no regex-aware matching).
 */
function removeSubsumed(patterns: string[]): string[] {
  // Collect all unique alternatives sorted by length (shortest first)
  const allAlts = [...new Set(patterns.flatMap((p) => p.split('|')))];
  allAlts.sort((a, b) => a.length - b.length);

  // Build the set of "root" patterns that aren't subsumed by anything shorter
  const roots: string[] = [];
  for (const alt of allAlts) {
    if (!roots.some((r) => alt.includes(r))) {
      roots.push(alt);
    }
  }
  const rootSet = new Set(roots);

  // Walk original patterns in order, keeping only non-subsumed alternatives
  const result: string[] = [];
  for (const pattern of patterns) {
    const surviving = pattern.split('|').filter((alt) => rootSet.has(alt));
    if (surviving.length > 0) {
      result.push(surviving.join('|'));
    }
  }

  return result;
}

// === Gambas pattern condensing ===
//
// Condenses individual "Random X Body/Boots/Gloves/Helmet" entries into
// compact combined patterns at output time.
//
// Pure armor:  `om.{start}.+{endChar}.[bgh]`
//   e.g., `om.e.+n.[bgh]` matches "Random Evasion Body/Boots/Gloves/Helmet"
//
// Hybrid armor: `{endChar of 1st}.and.{start of 2nd}.+{endChar of 2nd}.[bgh]`
//   e.g., `n.and.en.+d.[bgh]` matches "Random Evasion and Energy Shield Body/..."
//
// Weapons: `dom.(x|y)` alternation
//   e.g., `dom.(bow|q)` matches "Random Bow" and "Random Quiver"
//
// The `[bgh]` trick: Body and Boots both start with 'b', Gloves with 'g',
// Helmet with 'h' — so `[bgh]` matches all 4 armor slots while excluding shields.

const ARMOR_SLOTS = new Set(['body', 'boots', 'gloves', 'helmet']);

const PURE_DEFENSE_COMPACT: Record<string, { start: string; endChar: string }> = {
  'Armour': { start: 'ar', endChar: 'r' },
  'Evasion': { start: 'e', endChar: 'n' },
  'Energy Shield': { start: 'en', endChar: 'd' },
};

const HYBRID_DEFENSE_COMPACT: Record<string, { firstEnd: string; secondStart: string; secondEnd: string }> = {
  'Armour and Evasion': { firstEnd: 'r', secondStart: 'e', secondEnd: 'n' },
  'Armour and Energy Shield': { firstEnd: 'r', secondStart: 'en', secondEnd: 'd' },
  'Evasion and Energy Shield': { firstEnd: 'n', secondStart: 'en', secondEnd: 'd' },
};

const WEAPON_GROUPS: { keys: Set<string>; pattern: string }[] = [
  { keys: new Set(['bow', 'quiver']), pattern: 'dom.(bow|q)' },
  { keys: new Set(['wand', 'sceptre']), pattern: 'dom.(wan|sc)' },
];

interface ParsedGambas {
  type: 'pure_armor' | 'hybrid_armor' | 'weapon' | 'other';
  defenseKey?: string;
  slot?: string;
  weaponKey?: string;
}

function parseGambasName(name: string): ParsedGambas {
  if (!name.startsWith('Random ')) return { type: 'other' };
  const rest = name.slice(7);

  for (const slotName of ['Body', 'Boots', 'Gloves', 'Helmet']) {
    if (rest.endsWith(' ' + slotName)) {
      const defense = rest.slice(0, -(slotName.length + 1));
      if (defense.includes(' and ')) {
        return { type: 'hybrid_armor', defenseKey: defense, slot: slotName.toLowerCase() };
      }
      return { type: 'pure_armor', defenseKey: defense, slot: slotName.toLowerCase() };
    }
  }

  // Weapons/other single items
  return { type: 'weapon', weaponKey: rest.toLowerCase() };
}

/**
 * Condense item_gambas entries into compact combined patterns.
 *
 * When all 4 armor slots (body/boots/gloves/helmet) of a defense type are
 * present, replaces them with a single `[bgh]` pattern. Weapon pairs
 * (bow+quiver, wand+sceptre) are combined into `dom.(x|y)` alternations.
 *
 * Entries that can't be grouped are passed through with their original patterns.
 */
export function condenseGambasPatterns(entries: RegexEntry[]): string[] {
  const pureGroups = new Map<string, { slots: Set<string>; entries: RegexEntry[] }>();
  const hybridGroups = new Map<string, { slots: Set<string>; entries: RegexEntry[] }>();
  const weaponEntries: { key: string; entry: RegexEntry }[] = [];
  const otherEntries: RegexEntry[] = [];

  for (const entry of entries) {
    const parsed = parseGambasName(entry.sourceName ?? '');

    if (parsed.type === 'pure_armor' && parsed.defenseKey && parsed.slot) {
      if (!pureGroups.has(parsed.defenseKey)) {
        pureGroups.set(parsed.defenseKey, { slots: new Set(), entries: [] });
      }
      const g = pureGroups.get(parsed.defenseKey)!;
      g.slots.add(parsed.slot);
      g.entries.push(entry);
    } else if (parsed.type === 'hybrid_armor' && parsed.defenseKey && parsed.slot) {
      if (!hybridGroups.has(parsed.defenseKey)) {
        hybridGroups.set(parsed.defenseKey, { slots: new Set(), entries: [] });
      }
      const g = hybridGroups.get(parsed.defenseKey)!;
      g.slots.add(parsed.slot);
      g.entries.push(entry);
    } else if (parsed.type === 'weapon' && parsed.weaponKey) {
      weaponEntries.push({ key: parsed.weaponKey, entry });
    } else {
      otherEntries.push(entry);
    }
  }

  const result: string[] = [];

  // Condense weapon pairs
  const usedWeaponKeys = new Set<string>();
  for (const wg of WEAPON_GROUPS) {
    if ([...wg.keys].every((k) => weaponEntries.some((w) => w.key === k))) {
      result.push(wg.pattern);
      for (const k of wg.keys) usedWeaponKeys.add(k);
    }
  }
  for (const w of weaponEntries) {
    if (!usedWeaponKeys.has(w.key)) {
      result.push(w.entry.pattern);
    }
  }

  // Condense pure armor groups (only when all 4 slots present)
  for (const [defKey, group] of pureGroups) {
    const info = PURE_DEFENSE_COMPACT[defKey];
    if (info && setsEqual(group.slots, ARMOR_SLOTS)) {
      result.push(`om.${info.start}.+${info.endChar}.[bgh]`);
    } else {
      for (const e of group.entries) result.push(e.pattern);
    }
  }

  // Condense hybrid armor groups (only when all 4 slots present)
  for (const [defKey, group] of hybridGroups) {
    const info = HYBRID_DEFENSE_COMPACT[defKey];
    if (info && setsEqual(group.slots, ARMOR_SLOTS)) {
      result.push(`${info.firstEnd}.and.${info.secondStart}.+${info.secondEnd}.[bgh]`);
    } else {
      for (const e of group.entries) result.push(e.pattern);
    }
  }

  // Pass through anything else
  for (const e of otherEntries) result.push(e.pattern);

  return result;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/**
 * Combine all categories into the final regex one-liner.
 *
 * Format: "!<exclusions> <inclusions>"
 *
 * - Exclusions: entries from "dont_ever_show" category (isExclusion=true),
 *   plus any entry in other categories marked as isExclusion
 * - Inclusions: all other enabled entries
 * - Item gambas entries are condensed into compact combined patterns
 * - Join exclusion patterns with |, prefix with !
 * - Join inclusion patterns with |
 * - Subsumed patterns are removed (e.g. "b-b-b" is redundant when "b-b" exists)
 * - Final output: "!excl1|excl2 incl1|incl2|incl3"
 * - If no exclusions: just "incl1|incl2|incl3"
 * - If no inclusions: just "!excl1|excl2"
 */
export function combineCategories(categories: RegexCategory[]): string {
  const exclusions: string[] = [];
  const inclusions: string[] = [];
  const gambasEntries: RegexEntry[] = [];

  for (const category of categories) {
    for (const entry of category.entries) {
      if (!entry.enabled) continue;

      if (category.id === 'dont_ever_show' || entry.isExclusion) {
        exclusions.push(entry.pattern);
      } else if (category.id === 'item_gambas') {
        gambasEntries.push(entry);
      } else {
        inclusions.push(entry.pattern);
      }
    }
  }

  // Condense gambas into compact patterns, then merge into inclusions
  inclusions.push(...condenseGambasPatterns(gambasEntries));

  const parts: string[] = [];

  if (exclusions.length > 0) {
    parts.push('!' + exclusions.join('|'));
  }

  if (inclusions.length > 0) {
    parts.push(removeSubsumed(inclusions).join('|'));
  }

  return parts.join(' ');
}

/**
 * Get character count of the combined regex.
 * PoE has a ~50 char limit in the search box, so this is important to track.
 */
export function getCharCount(combined: string): number {
  return combined.length;
}
