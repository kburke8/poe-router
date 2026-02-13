/**
 * Regex abbreviation engine for PoE item/gem names.
 *
 * Generates the shortest unique regex pattern that matches a given name
 * and no others in a list, for use in PoE's item search box.
 *
 * PoE search matches against the ENTIRE item text (name, class, mods,
 * rarity suffix, requirements, etc.), so patterns must avoid matching
 * common game text fragments.
 */

import gemDescriptions from '@/data/gem-descriptions.json';
import baseItemNames from '@/data/base-item-names.json';

/**
 * Collision pool data from RePoE (Repository of Path of Exile):
 * - Gem descriptions: in-game tooltip text for all active/support skills
 * - Base item names: all equipment base types (weapons, armor, jewelry, flasks)
 *
 * Regenerate with: npx tsx scripts/fetch-repoe-data.ts
 */
const GEM_DESCRIPTION_TEXTS: string[] = Object.values(gemDescriptions);
const BASE_ITEM_NAMES: string[] = baseItemNames;

/**
 * Non-gem text that appears in PoE item tooltips (mod lines, item classes,
 * flask suffixes, base type names, etc.). Combined with gem descriptions
 * to form the full collision pool.
 */
const POE_ITEM_TEXT_SAMPLES = [
  // Magic items with "of the ..." suffixes - these generate "X of the Y" patterns
  'Coral Amulet of the Whelpling',
  'Jade Amulet of the Mongoose',
  'Lapis Amulet of the Fox',
  'Gold Amulet of the Falcon',
  'Onyx Amulet of the Ox',
  'Agate Amulet of the Lion',
  'Citrine Amulet of the Bear',
  'Turquoise Amulet of the Tiger',
  'Amber Amulet of the Whale',
  'Paua Amulet of the Leviathan',
  'Iron Ring of the Lizard',
  'Coral Ring of the Salamander',
  'Sapphire Ring of the Yeti',
  'Topaz Ring of the Lynx',
  'Ruby Ring of the Drake',
  'Diamond Ring of the Dragon',
  'Gold Ring of the Phoenix',
  'Moonstone Ring of the Glacier',
  'Two-Stone Ring of the Storm',
  'Prismatic Ring of the Tempest',
  'Amethyst Ring of the Inferno',
  'Unset Ring of the Volcano',
  'Rustic Sash of the Hearth',
  'Chain Belt of the Kiln',
  'Leather Belt of the Furnace',
  'Heavy Belt of the Goat',
  'Cloth Belt of the Avalanche',
  'Studded Belt of the Blizzard',
  'Crystal Belt of the Maelstrom',
  'Restoring Chain Belt of the Salamander',
  'Rotund Flask of the Cloud',
  'Caustic Flask of the Squall',
  // Prefix-suffix combos with common words
  'Humming Topaz Ring of the Thunder',
  'Sizzling Ruby Ring of the Magma',
  'Frosted Sapphire Ring of the Ice',
  'Buzzing Two-Stone Ring of the Polar',
  // Mod lines - these create lots of common substrings
  'Regenerate 2.5 Life per second',
  'Regenerate 4.0 Life per second',
  'Regenerate 1.0 Mana per second',
  '+20 to maximum Life',
  '+30 to maximum Mana',
  '+25 to maximum Energy Shield',
  'Adds 1 to 4 Physical Damage to Attacks',
  'Adds 3 to 7 Fire Damage to Attacks',
  'Adds 2 to 5 Cold Damage to Attacks',
  'Adds 1 to 12 Lightning Damage to Attacks',
  'Adds 3 to 7 Fire Damage to Spells',
  '+6% to Fire Resistance',
  '+12% to Cold Resistance',
  '+10% to Lightning Resistance',
  '+8% to Chaos Resistance',
  '+6% to all Elemental Resistances',
  '10% increased Attack Speed',
  '8% increased Cast Speed',
  '10% increased Movement Speed',
  '15% increased Critical Strike Chance',
  '+10 to Strength',
  '+10 to Dexterity',
  '+10 to Intelligence',
  '+5 to all Attributes',
  '50% increased Armour',
  '30% increased Evasion Rating',
  '20% increased Energy Shield',
  '+100 to Armour',
  '+50 to Evasion Rating',
  '10% increased Rarity of Items found',
  '5% increased Quantity of Items found',
  '+2 Life gained on Kill',
  '+2 Mana gained on Kill',
  '+5 Life gained for each Enemy hit by Attacks',
  '15% increased Global Critical Strike Chance',
  '20% increased Spell Damage',
  '15% increased Melee Damage',
  '10% increased Projectile Damage',
  '12% increased Area Damage',
  '15% increased Elemental Damage with Attack Skills',
  '20% increased Flask Life Recovery rate',
  '20% increased Flask Mana Recovery rate',
  '10% increased Flask Recovery Speed',
  '20% increased Flask Charges gained',
  // Item class lines
  'Item Class: Amulets',
  'Item Class: Rings',
  'Item Class: Belts',
  'Item Class: Body Armours',
  'Item Class: Helmets',
  'Item Class: Gloves',
  'Item Class: Boots',
  'Item Class: Shields',
  'Item Class: Quivers',
  'Item Class: Bows',
  'Item Class: Wands',
  'Item Class: Daggers',
  'Item Class: Claws',
  'Item Class: Swords',
  'Item Class: Axes',
  'Item Class: Maces',
  'Item Class: Sceptres',
  'Item Class: Staves',
  'Item Class: Jewels',
  'Item Class: Flasks',
  // Rarity lines
  'Rarity: Normal',
  'Rarity: Magic',
  'Rarity: Rare',
  'Rarity: Unique',
  // Requirements / level
  'Item Level: 14',
  'Item Level: 68',
  'Item Level: 83',
  'Requirements: Level: 5',
  'Requirements: Level: 60',
  // Socketed gem text
  'Socketed Gems are Supported by Level 20',
  // Common mod text that generates short false-positive patterns
  // "ly.f" patterns (from adverbs + words starting with f)
  'really fast hitting',
  'heavily fortified armour',
  'only for melee skills',
  'Rally forth with power',
  'costly feat of strength',
  'Socketed Gems are Supported by Level 20 Holy Flame',
  'Deadly Fury granted',
  'formerly wielded',
  'Completely frozen solid',
  // "me.w" patterns (words ending in -me + w words)
  'Damage with Attacks',
  'Flame was extinguished',
  'Game was originally',
  'some weird modifiers',
  'Time worn equipment',
  'Frame works properly',
  'Melee Weapon Range',
  'Name: Winterheart',
  // "d.of.i" / "ld.of.i" patterns
  'Kind of important',
  'end of its duration',
  'ward of ice elementals',
  'Speed of impact increased',
  'Gold of incredible value',
  'Shield of ice protection',
  'world of infinite power',
  // Generic common PoE text that produces false positives
  'Supported by Level',
  'Socketed Gems',
  'while affected by',
  'Nearby Enemies have',
  'Minions have increased',
  'Attacks have additional',
  'per Frenzy Charge',
  'per Power Charge',
  'per Endurance Charge',
  'chance to Ignite',
  'chance to Freeze',
  'chance to Shock',
  'chance to Poison',
  'chance to Bleed',
  // Common gem description text
  'collides with walls',
  'Throws a spectral copy of your melee weapon',
  'bouncing if it collides',
  'Fires a projectile that',
  'deals damage in an area',
  'enemies in its path',
  'applying a debuff',
  'modifiers to number of Projectiles',
  'Effectiveness of Added Damage',
  'Attack Speed: 120% of base',
  'Attack Damage: 154% of base',
  'Place into an item socket of the right colour',
  'Right click to remove from a socket',
  'spirals through rotations',
  // Flask suffixes
  'of Rejuvenation',
  'of Restoration',
  'of Staunching',
  'of Warding',
  'of Grounding',
  'of Dousing',
  'of Heat',
  'of Curing',
  'of Reflexes',
  // Common base types (so patterns don't match base names)
  'Coral Amulet',
  'Jade Amulet',
  'Lapis Amulet',
  'Gold Amulet',
  'Onyx Amulet',
  'Agate Amulet',
  'Citrine Amulet',
  'Turquoise Amulet',
  'Amber Amulet',
  'Paua Amulet',
  'Iron Ring',
  'Coral Ring',
  'Sapphire Ring',
  'Topaz Ring',
  'Ruby Ring',
  'Diamond Ring',
  'Gold Ring',
  'Moonstone Ring',
  'Two-Stone Ring',
  'Prismatic Ring',
  'Amethyst Ring',
  'Unset Ring',
  'Rustic Sash',
  'Chain Belt',
  'Leather Belt',
  'Heavy Belt',
  'Cloth Belt',
  'Studded Belt',
  'Crystal Belt',
  // Common gem description phrases - short patterns often match these
  'and deals damage',
  'and deals spell damage',
  'and deals fire damage',
  'and deals cold damage',
  'and deals lightning damage',
  'and deals chaos damage',
  'and deals physical damage',
  'and deals area damage',
  'Withered Debuffs the first',
  'targeted destination',
  'deals base damage',
  'cold damage over time',
  'chaos damage over time',
  'fire damage over time',
  'increased duration',
  'reduced duration',
  'base duration is',
  'spell damage to enemies',
  'deals damage in an area around',
  'deals damage to enemies',
  'fire damage per second',
  'cold damage per second',
  'lightning damage per second',
  'chaos damage per second',
  // "nding/ng m" patterns - "spending mana" in Manaforged Arrows and other gem descriptions
  'spending mana',
  'after spending a total of',
  // "once" - extremely common word in gem descriptions (e.g., "once after spending", "once per second")
  'once after spending',
  'once per second',
  'once every',
  'triggered once',
  // Gem sub-skill names and description phrases that cause collisions
  'Trigger Combust the first time',
  'uses a rolling charge',
  'Targets under the wall are damaged',
  'colliding with the wall',
  'collide with this wall',
  'collided with the wall',
  'single Wall of Force',
  'reapplied to same target',
  'arcane skills, Vaal skills',
  'support arcane skills',
  // "of Co..." patterns - extremely common in gem text
  'Effect of Cold Ailments',
  'of Cold Damage Converted',
  'of Cold Damage as Extra',
  'burst of cold in a targeted',
  'area of consecrated ground',
  'radius of Consecrated Ground',
  'of corpse Maximum Life',
  'If Consuming a corpse',
  'of the corpse',
  // "-owing" patterns - extremely common in English (Throwing, growing, slowing, etc.)
  'Trap Throwing Speed',
  'Mine Throwing Speed',
  'growing pattern',
  'slowing their movement',
  'following the target',
  'showing the path',
  'allowing enemies to',
  'arrow near it',
  // "r att" / "or attacks" patterns
  'or attacks that use bows',
  'or attacks used by',
  'your attack speed',
  'triggered attacks or attacks',
  'both attacks and spells',
  'block Attack Damage',
  // "Mirage Warriors" and "linked" from General's Cry
  'Mirage Warriors from nearby',
  'summoned by General',
  'a linked attack skill',
  // "tning a" patterns - "lightning a..." in descriptions
  'lightning and chaos',
  'Lightning around you',
  'Lightning Ailments',
  'lightning damage in an area',
  // "with Attacks" patterns (from support gem descriptions + quiver implicits)
  'Hit with Attacks',
  'Life per Enemy Hit with Attacks',
  'Damage with Attacks and Spells',
  // "Snipe" gem name collision
  'Snipe Attack Projectile',
  'per Snipe Stage',
  // "ster a" / "monster and" / "faster and" patterns
  'a nearby monster and attacks with',
  'moves much faster and pierces through',
  'faster and faster',
  'monster at random',
  // "rche" / "Archer" in descriptions
  'Bone Archer corpse where it lands',
  'creating a Bone Archer',
  // "rage a" / "age ar" patterns - Rage is a common mechanic keyword,
  // and "damage around" appears in virtually every AoE gem description
  'grants rage and prevents',
  'Consumes Rage at an accelerating',
  'Rage per second',
  'loss of Rage',
  'Maximum Rage',
  'Rage Effect',
  'damage around each target',
  'damage around where it lands',
  'area damage around it',
  'dealing damage around it',
  'splash damage around',
  // "per'" / "Reaper's" in descriptions
  "The Reaper's presence weakens",
  "Reaper's Dash attack",
  // "sand" - Sand Stance is referenced in many melee/stance gems
  'in Sand Stance',
  'Sand Stance by default',
  'Sand bladestorms move slowly',
  'angle while in Sand Stance',
  'Blood Stance and Sand Stance',
  // "leed." / "Bleeding" - extremely common in physical/melee gem descriptions
  'Bleeding Experience',
  'Immunity to Bleeding',
  'bleeding enemies',
  'inflict Bleeding',
  'cause Bleeding',
  'causes Bleeding',
  'Damage with Bleeding',
  'causing a bleeding debuff',
  'bleeding in Blood Stance',
  // "omba" - "combat" appears in banner/warcry descriptions
  'melee combat to use this skill',
  'from melee combat',
  // "ee.p" / "Melee Physical" - extremely common in melee gem descriptions
  'Melee Physical Damage',
  'melee physical damage',
  'more Melee Physical',
  // "d.sl" / "and slows" - common in DoT/debuff descriptions
  'and slows their movement',
  'and slows enemies',
  // "vuln" / "vulnerable" - common in curse/mark descriptions
  'more vulnerable to Critical',
  'vulnerable to damage',
  // "fist" in other gem names
  'Crushing Fist Attack',
  'armoured fist to slam',
  // "ar.s" / "ards" / "ares" - words ending in -ards, -ares are common
  'thrust outwards',
  'slowly forwards and',
  'Shares a cooldown with',
  'rewards the player',
  // "clos" / "close" / "closer" / "choose c" - extremely common proximity words
  'enemies closer to you',
  'Enemies close in front',
  'close to the target',
  'Close to enemies',
  'likely to choose cold',
  'likely to choose fire',
  // "od.a" / "Pod applies" etc
  'Spore Pod applies',
  'Pod deals chaos damage',
  // More common description phrases
  'damage over time to enemies',
  'time to enemies',
  'of Physical Damage Converted',
  'of Lightning Damage Converted',
  'Damage Converted to Fire Damage',
  'Damage Converted to Cold Damage',
  'Damage Converted to Chaos Damage',
  'of your maximum Life',
  'the right colour to gain',
  'remove from a socket',
  // Weapon/armor item class texts with "Class:" prefix so `.` wildcards collide correctly
  // (in-game these appear as "Item Class: Two Hand Axes" etc.)
  'Class: One Hand Swords', 'Class: One Hand Axes', 'Class: One Hand Maces',
  'Class: Two Hand Swords', 'Class: Two Hand Axes', 'Class: Two Hand Maces',
  'Class: Thrusting One Hand Swords',
  'Class: Claws', 'Class: Daggers', 'Class: Rune Daggers',
  'Class: Bows', 'Class: Wands', 'Class: Sceptres', 'Class: Quivers',
  'Class: Staves', 'Class: Warstaves',
  'Class: Body Armours', 'Class: Helmets', 'Class: Gloves', 'Class: Boots', 'Class: Shields',
  // Also the item description lines (slightly different wording)
  'Two Handed Sword', 'Two Handed Axe', 'Two Handed Mace',
  'One Hand Sword', 'One Hand Axe', 'One Hand Mace',
  // Common gem description words that collide with "dom." gambas patterns
  'randomised', 'randomized',
  // "al.th" patterns — "Spectral Throw" abbreviation collides with common description text
  'crystal that pulses',
  'deal that much',
  'deal the damage',
  'deal their damage',
  'steal their',
  'rical theorem',
  // "ed.co" patterns — "Added Cold" abbreviation collides with many common texts
  // "increased Cooldown" appears in support gem descriptions (Automation, Prismatic Burst, etc.)
  'increased Cooldown Recovery Rate',
  'increased Cooldown Recovery',
  'reduced Cooldown Recovery Rate',
  'reduced Cooldown Recovery',
  'decreased Cooldown Recovery',
  // "Spawned corpses" appears in corpse gems (Unearth, Desecrate, etc.)
  'Spawned corpses are Level',
  'Spawned corpses have',
  // "targeted corpse" appears in Cremation and similar corpse-consuming gems
  'targeted corpse explodes',
  'targeted corpse',
  'selected corpse',
  // Armor base types with "ed Co" substring
  'Rusted Coif',
  'Gilded Coif',
  // "Added Cold Damage Support" collision prevention — this gem name shares text with
  // ubiquitous stat lines. Samples are IN-CONTEXT (not standalone "added Cold Damage")
  // so they don't start with "added" and won't block ^prefix patterns.
  'Supported Skills have 8 to 12 added Cold Damage',
  'have 2 to 3 added Cold Damage per Frenzy Charge',
  '225 to 418 Added Cold Damage',
  'Cold Damage Supported Skills',
  'increased Cold Damage',
  'reduced Cold Damage',
  'and Cold Resistance',
  'and Cold Damage',
  'Fire and Cold',
  'Lightning and Cold',
];

/**
 * Check if a pattern (as a substring) matches a name (case-insensitive).
 * The `.` character acts as a wildcard matching any single character.
 */
function patternToRegexStr(pattern: string): string {
  let regexStr = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '^' && i === 0) {
      regexStr += '^';
    } else if (ch === '.' && i + 1 < pattern.length && pattern[i + 1] === '+') {
      regexStr += '.+';
      i++; // skip the +
    } else if (ch === '.') {
      regexStr += '.';
    } else {
      regexStr += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return regexStr;
}

function patternMatches(pattern: string, name: string): boolean {
  try {
    const re = new RegExp(patternToRegexStr(pattern), 'i');
    return re.test(name);
  } catch {
    return name.toLowerCase().includes(pattern.toLowerCase());
  }
}

/**
 * Count how many names in the list the pattern matches.
 */
function countMatches(pattern: string, allNames: string[]): number {
  let count = 0;
  for (const name of allNames) {
    if (patternMatches(pattern, name)) {
      count++;
    }
  }
  return count;
}

/**
 * Given a name and a list of all names, produce the shortest regex pattern
 * that uniquely matches this name and no others.
 *
 * Algorithm:
 * 1. Try all substrings of length 4+ (shortest first)
 * 2. Try ^prefix patterns (anchored to line start, very selective)
 * 3. Try cross-word patterns with "." wildcard (e.g., "ame.t")
 * 4. Try .+ spanning patterns across word gaps (e.g., "ed.+dest")
 * 5. Fallback to full lowercase name
 *
 * Supports PoE regex features: . (any char), .+ (one or more), ^ (line start)
 */
export function abbreviate(name: string, allNames: string[]): string {
  const lower = name.toLowerCase();

  // Combine gem/item names with common PoE text so patterns avoid matching
  // item descriptions, mod text, suffixes, etc.
  // Exclude text samples that contain the target name — those are variants of
  // the same base item (e.g., "Iron Ring of the Lizard" when abbreviating
  // "Iron Ring"), so matching them is intended, not a collision.
  const filteredSamples = POE_ITEM_TEXT_SAMPLES.filter(
    (s) => !s.toLowerCase().includes(lower),
  );
  const filteredGemDescs = GEM_DESCRIPTION_TEXTS.filter(
    (s) => !s.toLowerCase().includes(lower),
  );
  const filteredBaseItems = BASE_ITEM_NAMES.filter(
    (s) => !s.toLowerCase().includes(lower),
  );
  const fullPool = [...allNames, ...filteredSamples, ...filteredGemDescs, ...filteredBaseItems];

  const words = lower.split(/\s+/);
  const isMultiWord = words.length >= 2;

  // Helper: try cross-word patterns at a given total length.
  // leftPart from END of word[i], rightPart from START of word[i+1], '.' for space.
  function tryCrossWord(totalLen: number): string | null {
    for (let leftLen = 2; leftLen <= totalLen - 2; leftLen++) {
      const rightLen = totalLen - leftLen - 1;
      if (rightLen < 2) continue;
      for (let wi = 0; wi < words.length - 1; wi++) {
        if (leftLen > words[wi].length) continue;
        if (rightLen > words[wi + 1].length) continue;
        const leftPart = words[wi].substring(words[wi].length - leftLen);
        const rightPart = words[wi + 1].substring(0, rightLen);
        const pattern = leftPart + '.' + rightPart;
        if (patternMatches(pattern, name) && countMatches(pattern, fullPool) === 1) {
          return pattern;
        }
      }
    }
    return null;
  }

  // Helper: try plain substrings at a given length (spaces become '.').
  function trySubstrings(len: number): string | null {
    for (let start = 0; start <= lower.length - len; start++) {
      const sub = lower.substring(start, start + len);
      const pattern = sub.replace(/ /g, '.');
      if (patternMatches(pattern, name) && countMatches(pattern, fullPool) === 1) {
        return pattern;
      }
    }
    return null;
  }

  // Helper: try ^prefix pattern at a given prefix length.
  function tryPrefix(prefixLen: number): string | null {
    if (prefixLen < 3 || prefixLen > lower.length) return null;
    const sub = lower.substring(0, prefixLen);
    const pattern = '^' + sub.replace(/ /g, '.');
    if (patternMatches(pattern, name) && countMatches(pattern, fullPool) === 1) {
      return pattern;
    }
    return null;
  }

  // Main search: at each length, try cross-word, substrings, and ^prefix patterns.
  // ^prefix is checked alongside substrings because it's equally compact and very
  // selective in PoE (anchored to line start), which helps when gem names share
  // extensive text with common stat lines.
  for (let len = 4; len <= lower.length; len++) {
    if (isMultiWord && len <= 8) {
      const cw = tryCrossWord(len);
      if (cw) return cw;
    }
    const sub = trySubstrings(len);
    if (sub) return sub;
    // ^prefix of (len-1) chars produces a pattern of total length len (including ^)
    const prefix = tryPrefix(len - 1);
    if (prefix) return prefix;
  }

  // Try .+ spanning patterns across word gaps
  if (isMultiWord) {
    for (let totalLen = 6; totalLen <= 14; totalLen++) {
      for (let leftLen = 2; leftLen <= Math.min(totalLen - 4, words[0].length); leftLen++) {
        const rightLen = totalLen - leftLen - 2;
        if (rightLen < 2 || rightLen > 6) continue;
        for (let wi = 1; wi < words.length; wi++) {
          if (rightLen > words[wi].length) continue;
          const leftPart = words[0].substring(words[0].length - leftLen);
          const rightPart = words[wi].substring(0, rightLen);
          const pattern = leftPart + '.+' + rightPart;
          if (patternMatches(pattern, name) && countMatches(pattern, fullPool) === 1) {
            return pattern;
          }
        }
      }
    }
  }

  // Fallback to full lowercase name (spaces become '.')
  return lower.replace(/ /g, '.');
}

/**
 * Batch compute abbreviations ensuring no collisions between selected entries.
 *
 * For each selected name, compute its abbreviation against allNames.
 * Then verify no two abbreviations match the same name.
 * If collision found, extend the shorter one until unique.
 */
export function computeAbbreviations(
  selectedNames: string[],
  allNames: string[],
): Map<string, string> {
  const result = new Map<string, string>();

  // First pass: compute initial abbreviations
  for (const name of selectedNames) {
    result.set(name, abbreviate(name, allNames));
  }

  // Second pass: resolve collisions between abbreviations
  // Two abbreviations "collide" if one pattern matches another selected name
  let changed = true;
  let iterations = 0;
  const maxIterations = 20;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    const entries = Array.from(result.entries());
    for (let i = 0; i < entries.length; i++) {
      const [nameA, patternA] = entries[i];
      for (let j = i + 1; j < entries.length; j++) {
        const [nameB, patternB] = entries[j];

        // Check if patternA also matches nameB
        const aMatchesB = patternMatches(patternA, nameB);
        // Check if patternB also matches nameA
        const bMatchesA = patternMatches(patternB, nameA);

        if (aMatchesB) {
          // Extend patternA to be longer
          const extended = extendAbbreviation(nameA, patternA, allNames, [nameB]);
          if (extended !== patternA) {
            result.set(nameA, extended);
            changed = true;
          }
        }
        if (bMatchesA) {
          const extended = extendAbbreviation(nameB, patternB, allNames, [nameA]);
          if (extended !== patternB) {
            result.set(nameB, extended);
            changed = true;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Extend an abbreviation so it no longer matches any of the excludeNames.
 */
function extendAbbreviation(
  name: string,
  currentPattern: string,
  allNames: string[],
  excludeNames: string[],
): string {
  const lower = name.toLowerCase();
  const filteredSamples = POE_ITEM_TEXT_SAMPLES.filter(
    (s) => !s.toLowerCase().includes(lower),
  );
  const filteredGemDescs = GEM_DESCRIPTION_TEXTS.filter(
    (s) => !s.toLowerCase().includes(lower),
  );
  const filteredBaseItems = BASE_ITEM_NAMES.filter(
    (s) => !s.toLowerCase().includes(lower),
  );
  const fullPool = [...allNames, ...filteredSamples, ...filteredGemDescs, ...filteredBaseItems];

  // Try longer substrings starting from current pattern length + 1
  const startLen = currentPattern.length + 1;
  for (let len = startLen; len <= lower.length; len++) {
    for (let start = 0; start <= lower.length - len; start++) {
      const sub = lower.substring(start, start + len);
      const pattern = sub.replace(/ /g, '.');
      // Must match original name and not match any exclude names
      if (!patternMatches(pattern, name)) continue;
      const matchesExcluded = excludeNames.some((ex) => patternMatches(pattern, ex));
      if (!matchesExcluded && countMatches(pattern, fullPool) === 1) {
        return pattern;
      }
    }
  }

  // Try ^prefix patterns as fallback
  for (let len = 3; len <= Math.min(lower.length, 12); len++) {
    const sub = lower.substring(0, len);
    const pattern = '^' + sub.replace(/ /g, '.');
    if (!patternMatches(pattern, name)) continue;
    const matchesExcluded = excludeNames.some((ex) => patternMatches(pattern, ex));
    if (!matchesExcluded && countMatches(pattern, fullPool) === 1) {
      return pattern;
    }
  }

  return lower.replace(/ /g, '.');
}
