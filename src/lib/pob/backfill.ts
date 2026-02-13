import type { BuildPlan, GemPickup, BuildLinkGroup, LinkGroupPhase, GemSlot } from '@/types/build';
import { createEmptyBuild, createEmptyStopPlan } from '@/types/build';
import { TOWN_STOPS } from '@/data/town-stops';
import { POE_CLASSES } from '@/data/classes';
import { isGemAvailable } from '@/lib/gem-availability';
import { QUEST_GEM_TABLES, type ClassName } from '@/data/gem-rewards';
import type { PobBuild, PobSkillSet, PobSkillGroup } from './parse';
import { matchPobGem, type MatchResult } from './gem-matcher';
import type { Gem } from '@/types/gem';

export interface BackfillWarning {
  type: 'skipped' | 'not_found' | 'lilly_only';
  gemName: string;
  reason: string;
}

export interface BackfillResult {
  build: BuildPlan;
  warnings: BackfillWarning[];
}

interface MatchedGemInfo {
  gem: Gem;
  stopId: string;
}

const AURA_HERALD_TAGS = new Set(['aura', 'herald']);

const stopOrderMap = new Map(TOWN_STOPS.map((s) => [s.id, s.sortOrder]));

/** Level breakpoints mapped to campaign stops. */
const LEVEL_TO_STOP: [number, string][] = [
  [2, 'a1_after_hillock'],
  [4, 'a1_after_hailrake'],
  [8, 'a1_after_dweller'],
  [10, 'a1_after_brutus'],
  [12, 'a1_after_merveil'],
  [16, 'a2_after_chamber_of_sins'],
  [18, 'a2_after_weaver'],
  [24, 'a3_after_tolman'],
  [28, 'a3_after_library'],
  [34, 'a4_after_kaom_daresso'],
  [38, 'a4_after_malachai'],
  [45, 'a6_town_arrival'],
  [50, 'a7_town_arrival'],
  [55, 'a8_town_arrival'],
  [60, 'a9_town_arrival'],
  [65, 'a10_town_arrival'],
];

/** Extract a character level from a skill set title, ignoring timestamps. */
function extractLevel(title: string): number | null {
  // Try "Level XX" pattern first
  const levelMatch = title.match(/Level\s+(\d+)/i);
  if (levelMatch) return parseInt(levelMatch[1], 10);

  // Strip timestamps (H:MM:SS, MM:SS patterns) before looking for standalone numbers
  const withoutTimestamps = title.replace(/\d+:\d+(?::\d+)?/g, '');

  // Try standalone number (not part of other text)
  const standaloneMatch = withoutTimestamps.match(/\b(\d{1,2})\b/);
  if (standaloneMatch) return parseInt(standaloneMatch[1], 10);

  return null;
}

/** Map a character level to the closest campaign stop at or below that level. */
function levelToStopId(level: number): string {
  let bestStop = LEVEL_TO_STOP[0][1];
  for (const [breakpoint, stopId] of LEVEL_TO_STOP) {
    if (level >= breakpoint) {
      bestStop = stopId;
    } else {
      break;
    }
  }
  return bestStop;
}

/** Get quest IDs newly completed at a stop (not at the previous stop). */
function getNewQuestsAtStop(stopId: string): Set<string> {
  const stopIdx = TOWN_STOPS.findIndex((s) => s.id === stopId);
  if (stopIdx < 0) return new Set();
  const stop = TOWN_STOPS[stopIdx];
  const currentQuests = new Set(stop.questsCompleted);
  if (stopIdx === 0) return currentQuests;
  const prevQuests = new Set(TOWN_STOPS[stopIdx - 1].questsCompleted);
  const newQuests = new Set<string>();
  for (const q of currentQuests) {
    if (!prevQuests.has(q)) newQuests.add(q);
  }
  return newQuests;
}

/**
 * Determine whether a gem should be sourced as quest_reward or vendor.
 * Prefers quest_reward when available, tracking used reward sets (one pick per set).
 */
function determineGemSource(
  gemName: string,
  stopId: string,
  className: string,
  usedRewardSets: Set<string>,
): { source: 'quest_reward' | 'vendor'; rewardSetId?: string } {
  const newQuests = getNewQuestsAtStop(stopId);
  const cls = className as ClassName;

  for (const table of QUEST_GEM_TABLES) {
    if (!newQuests.has(table.questId)) continue;
    const classRewards = table.questRewards[cls];
    if (!classRewards?.includes(gemName)) continue;

    const rsId = table.rewardSetId ?? table.questId;
    if (usedRewardSets.has(rsId)) continue;

    usedRewardSets.add(rsId);
    return { source: 'quest_reward', rewardSetId: rsId };
  }

  return { source: 'vendor' };
}

/** Find the earliest stop where a gem is available for the given class. */
function findEarliestStop(gemName: string, className: string): string | null {
  for (const stop of TOWN_STOPS) {
    if (isGemAvailable(gemName, stop.id, className)) {
      return stop.id;
    }
  }
  return null;
}

/** Map PoB slot names to a friendlier label. */
function slotLabel(slot: string, label: string): string {
  if (label) return label;
  if (slot) return slot;
  return 'Link Group';
}

/** Check if a gem has aura or herald tags. */
function isAuraOrHerald(gem: Gem): boolean {
  return gem.tags.some((t) => AURA_HERALD_TAGS.has(t));
}

/** Check if a support gem has the aura tag (can support auras). */
function isAuraSupport(gem: Gem): boolean {
  return gem.type === 'support' && gem.tags.includes('aura');
}

/**
 * Split a skill group's matched gems into sub-groups based on support compatibility.
 */
function splitBySupport(matchedGems: MatchedGemInfo[]): MatchedGemInfo[][] {
  const actives = matchedGems.filter((mg) => mg.gem.type === 'skill');
  const supports = matchedGems.filter((mg) => mg.gem.type === 'support');

  const regularActives = actives.filter((mg) => !isAuraOrHerald(mg.gem));
  const auraActives = actives.filter((mg) => isAuraOrHerald(mg.gem));

  if (regularActives.length === 0 || auraActives.length === 0) {
    return [matchedGems];
  }

  const auraSupports = supports.filter((mg) => isAuraSupport(mg.gem));
  const otherSupports = supports.filter((mg) => !isAuraSupport(mg.gem));

  const groups: MatchedGemInfo[][] = [];
  groups.push([...regularActives, ...otherSupports]);

  if (auraSupports.length > 0) {
    groups.push([...auraActives, ...auraSupports]);
  } else {
    for (const aura of auraActives) {
      groups.push([aura]);
    }
  }

  return groups;
}

/** Convert a MatchedGemInfo to a GemSlot. */
function toGemSlot(mg: MatchedGemInfo): GemSlot {
  return {
    gemName: mg.gem.name,
    socketColor: mg.gem.color === 'red' ? 'R' : mg.gem.color === 'green' ? 'G' : 'B',
  };
}

/**
 * Build progressive phases for a set of gems as they become available at successive stops.
 * Support gems are held back until at least one active gem is in the link.
 */
function buildProgressivePhases(gems: MatchedGemInfo[]): LinkGroupPhase[] {
  const sorted = [...gems].sort(
    (a, b) => (stopOrderMap.get(a.stopId) ?? 0) - (stopOrderMap.get(b.stopId) ?? 0),
  );

  const phases: LinkGroupPhase[] = [];
  const cumulativeGems: GemSlot[] = [];
  const pendingSupports: MatchedGemInfo[] = [];
  let hasActive = false;
  let lastStopId: string | null = null;

  for (const mg of sorted) {
    const isSupport = mg.gem.type === 'support';

    if (isSupport && !hasActive) {
      pendingSupports.push(mg);
      continue;
    }

    if (!isSupport && !hasActive) {
      hasActive = true;
      for (const ps of pendingSupports) {
        cumulativeGems.push(toGemSlot(ps));
      }
      pendingSupports.length = 0;
    }

    cumulativeGems.push(toGemSlot(mg));

    if (mg.stopId !== lastStopId) {
      phases.push({
        id: crypto.randomUUID(),
        fromStopId: mg.stopId,
        gems: [...cumulativeGems],
      });
      lastStopId = mg.stopId;
    } else {
      phases[phases.length - 1].gems = [...cumulativeGems];
    }
  }

  if (!hasActive && pendingSupports.length > 0) {
    for (const ps of pendingSupports) {
      cumulativeGems.push(toGemSlot(ps));
    }
    const stopId = pendingSupports[0].stopId;
    phases.push({
      id: crypto.randomUUID(),
      fromStopId: stopId,
      gems: [...cumulativeGems],
    });
  }

  return phases;
}

/**
 * Match all gems in a skill group, placing pickups and collecting warnings.
 * Returns the matched gem infos for link group building.
 */
function matchSkillGroupGems(
  sg: PobSkillGroup,
  className: string,
  build: BuildPlan,
  placedGems: Map<string, string>,
  warnings: BackfillWarning[],
  usedRewardSets: Set<string>,
): MatchedGemInfo[] {
  const matchedGems: MatchedGemInfo[] = [];

  for (const pobGem of sg.gems) {
    if (!pobGem.enabled) continue;

    const result: MatchResult = matchPobGem(pobGem);

    if (result.status === 'skipped') {
      warnings.push({ type: 'skipped', gemName: result.nameSpec, reason: result.reason });
      continue;
    }

    if (result.status === 'not_found') {
      warnings.push({ type: 'not_found', gemName: result.nameSpec, reason: 'Gem not found in database' });
      continue;
    }

    const gem = result.gem;
    let stopId: string | undefined = placedGems.get(gem.name);

    if (!stopId) {
      stopId = findEarliestStop(gem.name, className) ?? undefined;

      if (!stopId) {
        stopId = 'a6_town_arrival';
        warnings.push({ type: 'lilly_only', gemName: gem.name, reason: 'Only available from Lilly Roth (Act 6)' });
      }

      const stop = build.stops.find((s) => s.stopId === stopId);
      if (stop) {
        stop.enabled = true;
        const { source, rewardSetId } = determineGemSource(gem.name, stopId, className, usedRewardSets);
        const pickup: GemPickup = {
          id: crypto.randomUUID(),
          gemName: gem.name,
          gemColor: gem.color,
          source,
          rewardSetId,
        };
        stop.gemPickups.push(pickup);
        placedGems.set(gem.name, stopId);
      }
    }

    matchedGems.push({ gem, stopId });
  }

  return matchedGems;
}

/**
 * Process skill groups from a single skill set (or flat list) into link groups
 * using progressive phases based on gem availability.
 */
function buildLinkGroupsFromSkillGroups(
  skillGroups: PobSkillGroup[],
  className: string,
  build: BuildPlan,
  placedGems: Map<string, string>,
  warnings: BackfillWarning[],
  usedRewardSets: Set<string>,
): BuildLinkGroup[] {
  const linkGroups: BuildLinkGroup[] = [];

  for (const sg of skillGroups) {
    if (!sg.enabled) continue;

    const matchedGems = matchSkillGroupGems(sg, className, build, placedGems, warnings, usedRewardSets);
    if (matchedGems.length === 0) continue;

    const subGroups = splitBySupport(matchedGems);
    const baseLabel = slotLabel(sg.slot, sg.label);

    for (const subGroup of subGroups) {
      const phases = buildProgressivePhases(subGroup);
      if (phases.length === 0) continue;

      linkGroups.push({
        id: crypto.randomUUID(),
        label: baseLabel,
        phases,
      });
    }
  }

  return linkGroups;
}

/**
 * Process multiple skill sets with level annotations into link groups
 * where each skill set becomes a phase snapshot per slot.
 */
function buildLinkGroupsFromSkillSets(
  skillSets: PobSkillSet[],
  className: string,
  build: BuildPlan,
  placedGems: Map<string, string>,
  warnings: BackfillWarning[],
  usedRewardSets: Set<string>,
): BuildLinkGroup[] {
  // Extract levels and sort skill sets by level
  const setsWithLevels: { set: PobSkillSet; level: number; stopId: string }[] = [];

  for (const ss of skillSets) {
    const level = extractLevel(ss.title);
    if (level !== null) {
      setsWithLevels.push({ set: ss, level, stopId: levelToStopId(level) });
    }
  }

  setsWithLevels.sort((a, b) => a.level - b.level);

  // First pass: match all gems across all sets to place pickups
  for (const { set } of setsWithLevels) {
    for (const sg of set.skillGroups) {
      if (!sg.enabled) continue;
      matchSkillGroupGems(sg, className, build, placedGems, warnings, usedRewardSets);
    }
  }

  // Second pass: build link groups per sub-group with phases from each skill set.
  // Key = slot + sorted active gem names (so phases track across sets).
  const groupPhases = new Map<string, { label: string; phases: LinkGroupPhase[] }>();

  for (const { set, stopId } of setsWithLevels) {
    for (const sg of set.skillGroups) {
      if (!sg.enabled) continue;

      const matched: { gem: Gem; slot: GemSlot }[] = [];
      for (const pobGem of sg.gems) {
        if (!pobGem.enabled) continue;
        const result = matchPobGem(pobGem);
        if (result.status !== 'matched') continue;
        matched.push({
          gem: result.gem,
          slot: {
            gemName: result.gem.name,
            socketColor: result.gem.color === 'red' ? 'R' : result.gem.color === 'green' ? 'G' : 'B',
          },
        });
      }

      if (matched.length === 0) continue;

      const slotName = sg.slot || sg.label || 'Link Group';
      const actives = matched.filter((m) => m.gem.type === 'skill');
      const supports = matched.filter((m) => m.gem.type === 'support');

      // Split into sub-groups: supports make links, standalone actives are 1L each
      const subGroups: GemSlot[][] = [];
      if (supports.length > 0) {
        // Supports + all actives they can support form a link
        subGroups.push([...actives.map((m) => m.slot), ...supports.map((m) => m.slot)]);
      } else {
        // No supports — each active is a standalone 1L
        for (const a of actives) {
          subGroups.push([a.slot]);
        }
      }

      for (const gems of subGroups) {
        // Key by slot + sorted active names for cross-set phase tracking
        const activeNames = gems
          .filter((g) => actives.some((a) => a.slot.gemName === g.gemName))
          .map((g) => g.gemName)
          .sort()
          .join('+');
        const key = `${slotName}::${activeNames}`;

        const phase: LinkGroupPhase = {
          id: crypto.randomUUID(),
          fromStopId: stopId,
          gems,
        };

        const existing = groupPhases.get(key);
        if (existing) {
          // Only add a new phase if gems actually changed
          const prev = existing.phases[existing.phases.length - 1];
          const prevKey = prev.gems.map((g) => g.gemName).sort().join(',');
          const newKey = gems.map((g) => g.gemName).sort().join(',');
          if (prevKey !== newKey) {
            existing.phases.push(phase);
          }
        } else {
          groupPhases.set(key, { label: slotName, phases: [phase] });
        }
      }
    }
  }

  // Convert to link groups
  const linkGroups: BuildLinkGroup[] = [];
  for (const [, { label, phases }] of groupPhases) {
    if (phases.length === 0) continue;
    linkGroups.push({
      id: crypto.randomUUID(),
      label,
      phases,
    });
  }

  return linkGroups;
}

export function backfillBuild(
  pobBuild: PobBuild,
  buildName: string,
): BackfillResult {
  const warnings: BackfillWarning[] = [];
  const id = crypto.randomUUID();
  const build = createEmptyBuild(id);
  build.name = buildName;

  // Map PoB class name to our class name
  const classInfo = POE_CLASSES.find(
    (c) => c.name.toLowerCase() === pobBuild.className.toLowerCase(),
  );
  build.className = classInfo?.name ?? pobBuild.className;

  // Map ascendancy
  if (pobBuild.ascClassName && pobBuild.ascClassName !== 'None') {
    const asc = classInfo?.ascendancies.find(
      (a) => a.toLowerCase() === pobBuild.ascClassName.toLowerCase(),
    );
    build.ascendancy = asc ?? pobBuild.ascClassName;
  }

  // Initialize stops from TOWN_STOPS with default enabled states
  build.stops = TOWN_STOPS.map((ts) => {
    const stop = createEmptyStopPlan(ts.id);
    stop.enabled = ts.defaultEnabled;
    return stop;
  });

  const placedGems = new Map<string, string>();
  const usedRewardSets = new Set<string>();

  // Check if we have multiple skill sets with level annotations
  const hasLevelSets =
    pobBuild.skillSets.length > 1 &&
    pobBuild.skillSets.some((ss) => extractLevel(ss.title) !== null);

  if (hasLevelSets) {
    build.linkGroups = buildLinkGroupsFromSkillSets(
      pobBuild.skillSets,
      build.className,
      build,
      placedGems,
      warnings,
      usedRewardSets,
    );
  } else {
    build.linkGroups = buildLinkGroupsFromSkillGroups(
      pobBuild.skillGroups,
      build.className,
      build,
      placedGems,
      warnings,
      usedRewardSets,
    );
  }

  return { build, warnings };
}
