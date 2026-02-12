import { TOWN_STOPS, getStopById, getQuestById } from '@/data/town-stops';
import { QUEST_GEM_TABLES, LILLY_ROTH_QUEST_ID, type ClassName } from '@/data/gem-rewards';
import gemsData from '@/data/gems.json';
import type { Gem } from '@/types/gem';

export interface AvailableGem {
  gem: Gem;
  source: 'quest_reward' | 'vendor';
  isNewAtThisStop: boolean;
  rewardSetId?: string;
}

export interface RewardPickerInfo {
  rewardSetId: string;
  label: string;
  questId: string;
}

function getAllGems(): Gem[] {
  const gems: Gem[] = [];
  if (gemsData.skills) {
    for (const g of gemsData.skills) gems.push(g as Gem);
  }
  if (gemsData.supports) {
    for (const g of gemsData.supports) gems.push(g as Gem);
  }
  return gems;
}

const allGemsCache = getAllGems();

function findGemByName(name: string): Gem | undefined {
  return allGemsCache.find((g) => g.name === name);
}

/**
 * Collect all exclusive quests from disabled stops.
 * These quests should be treated as "not completed" across all stops.
 */
export function getExcludedQuests(disabledStopIds: Set<string>): Set<string> {
  const excluded = new Set<string>();
  for (const stop of TOWN_STOPS) {
    if (disabledStopIds.has(stop.id) && stop.exclusiveQuests) {
      for (const q of stop.exclusiveQuests) excluded.add(q);
    }
  }
  return excluded;
}

/**
 * Remove excluded quests from a quest set.
 */
function subtractExcluded(quests: Set<string>, excluded: Set<string>): Set<string> {
  if (excluded.size === 0) return quests;
  const result = new Set(quests);
  for (const q of excluded) result.delete(q);
  return result;
}

/**
 * Get the set of quest IDs completed at a given stop.
 * When disabledStopIds is provided, exclusive quests from disabled stops are removed.
 */
function getQuestsAtStop(stopId: string, disabledStopIds?: Set<string>): Set<string> {
  const stop = getStopById(stopId);
  if (!stop) return new Set();
  const quests = new Set(stop.questsCompleted);
  if (disabledStopIds && disabledStopIds.size > 0) {
    return subtractExcluded(quests, getExcludedQuests(disabledStopIds));
  }
  return quests;
}

/**
 * Get the previous stop's quest set (for determining "new at this stop").
 */
function getPreviousStopQuests(stopId: string, disabledStopIds?: Set<string>): Set<string> {
  const idx = TOWN_STOPS.findIndex((s) => s.id === stopId);
  if (idx <= 0) return new Set();

  if (disabledStopIds && disabledStopIds.size > 0) {
    const excluded = getExcludedQuests(disabledStopIds);
    // Walk backward skipping disabled stops
    for (let i = idx - 1; i >= 0; i--) {
      if (!disabledStopIds.has(TOWN_STOPS[i].id)) {
        return subtractExcluded(new Set(TOWN_STOPS[i].questsCompleted), excluded);
      }
    }
    return new Set();
  }

  const prevStop = TOWN_STOPS[idx - 1];
  return new Set(prevStop.questsCompleted);
}

/**
 * Collect all vendor gem names available given a set of completed quests and a class.
 */
function getVendorGemNames(questsCompleted: Set<string>, className: ClassName): Set<string> {
  const names = new Set<string>();
  for (const table of QUEST_GEM_TABLES) {
    if (questsCompleted.has(table.questId)) {
      const classVendor = table.vendorRewards[className];
      if (classVendor) {
        for (const gemName of classVendor) {
          names.add(gemName);
        }
      }
    }
  }
  return names;
}

/**
 * Check if a specific gem is available at a given stop for a class.
 */
export function isGemAvailable(gemName: string, stopId: string, className: string): boolean {
  if (!className) return false;
  const questsAtStop = getQuestsAtStop(stopId);

  if (questsAtStop.has(LILLY_ROTH_QUEST_ID)) return true;

  const cls = className as ClassName;

  // Check quest rewards
  for (const table of QUEST_GEM_TABLES) {
    if (!questsAtStop.has(table.questId)) continue;
    const classRewards = table.questRewards[cls];
    if (classRewards?.includes(gemName)) return true;
  }

  // Check vendor availability
  return getVendorGemNames(questsAtStop, cls).has(gemName);
}

/**
 * Get all gems available at a given stop for a given class (both quest and vendor).
 */
export function getAvailableGems(stopId: string, className: string): AvailableGem[] {
  if (!className) return [];

  const questsAtStop = getQuestsAtStop(stopId);
  const previousQuests = getPreviousStopQuests(stopId);
  const cls = className as ClassName;
  const result: AvailableGem[] = [];
  const seen = new Set<string>();

  // After Lilly Roth, all gems are available
  if (questsAtStop.has(LILLY_ROTH_QUEST_ID)) {
    const wasAlreadyLilly = previousQuests.has(LILLY_ROTH_QUEST_ID);
    for (const gem of allGemsCache) {
      result.push({
        gem,
        source: 'vendor',
        isNewAtThisStop: !wasAlreadyLilly && !isGemAvailable(gem.name, TOWN_STOPS[TOWN_STOPS.findIndex((s) => s.id === stopId) - 1]?.id ?? '', className),
      });
    }
    return result;
  }

  // Collect quest reward gems
  for (const table of QUEST_GEM_TABLES) {
    if (!questsAtStop.has(table.questId)) continue;
    const classRewards = table.questRewards[cls];
    if (!classRewards) continue;
    for (const gemName of classRewards) {
      if (seen.has(gemName)) continue;
      seen.add(gemName);
      const gem = findGemByName(gemName);
      if (!gem) continue;

      // Check if it was available before
      let wasPrev = false;
      for (const pt of QUEST_GEM_TABLES) {
        if (!previousQuests.has(pt.questId)) continue;
        if (pt.questRewards[cls]?.includes(gemName) || pt.vendorRewards[cls]?.includes(gemName)) {
          wasPrev = true;
          break;
        }
      }

      result.push({ gem, source: 'quest_reward', isNewAtThisStop: !wasPrev });
    }
  }

  // Collect vendor gems
  for (const table of QUEST_GEM_TABLES) {
    if (!questsAtStop.has(table.questId)) continue;
    const classVendor = table.vendorRewards[cls];
    if (!classVendor) continue;
    for (const gemName of classVendor) {
      if (seen.has(gemName)) continue;
      seen.add(gemName);
      const gem = findGemByName(gemName);
      if (!gem) continue;

      let wasPrev = false;
      for (const pt of QUEST_GEM_TABLES) {
        if (!previousQuests.has(pt.questId)) continue;
        if (pt.questRewards[cls]?.includes(gemName) || pt.vendorRewards[cls]?.includes(gemName)) {
          wasPrev = true;
          break;
        }
      }

      result.push({ gem, source: 'vendor', isNewAtThisStop: !wasPrev });
    }
  }

  return result;
}

/**
 * Get the quest IDs newly completed at this stop (not at the previous stop).
 */
export function getNewQuestIdsAtStop(stopId: string): string[] {
  const questsAtStop = getQuestsAtStop(stopId);
  const previousQuests = getPreviousStopQuests(stopId);
  const result: string[] = [];
  for (const q of questsAtStop) {
    if (!previousQuests.has(q)) result.push(q);
  }
  return result;
}

export function getRewardPickersAtStop(stopId: string, className: string, disabledStopIds?: Set<string>): RewardPickerInfo[] {
  if (!className) return [];
  const questsAtStop = getQuestsAtStop(stopId, disabledStopIds);
  const previousQuests = getPreviousStopQuests(stopId, disabledStopIds);
  const cls = className as ClassName;
  const result: RewardPickerInfo[] = [];

  const newQuests = new Set<string>();
  for (const q of questsAtStop) {
    if (!previousQuests.has(q)) newQuests.add(q);
  }

  for (const table of QUEST_GEM_TABLES) {
    if (!newQuests.has(table.questId)) continue;
    const classRewards = table.questRewards[cls];
    if (!classRewards || classRewards.length === 0) continue;
    const rsId = table.rewardSetId ?? table.questId;
    const label = table.rewardSetLabel ?? (getQuestById(table.questId)?.name ?? table.questId);
    result.push({ rewardSetId: rsId, label, questId: table.questId });
  }

  return result;
}

/**
 * Get quest reward gems available at THIS stop only (not cumulative).
 * These are gems the player can choose from as quest rewards from quests completed at this stop.
 */
export function getQuestRewardsAtStop(stopId: string, className: string, filterRewardSetId?: string, disabledStopIds?: Set<string>): AvailableGem[] {
  if (!className) return [];

  const questsAtStop = getQuestsAtStop(stopId, disabledStopIds);
  const previousQuests = getPreviousStopQuests(stopId, disabledStopIds);
  const cls = className as ClassName;
  const result: AvailableGem[] = [];

  // Quests newly completed at this stop
  const newQuests = new Set<string>();
  for (const q of questsAtStop) {
    if (!previousQuests.has(q)) newQuests.add(q);
  }

  if (newQuests.size === 0) return [];

  for (const table of QUEST_GEM_TABLES) {
    if (!newQuests.has(table.questId)) continue;
    const classRewards = table.questRewards[cls];
    if (!classRewards) continue;

    const rsId = table.rewardSetId ?? table.questId;
    for (const gemName of classRewards) {
      const gem = findGemByName(gemName);
      if (gem) {
        result.push({ gem, source: 'quest_reward', isNewAtThisStop: true, rewardSetId: rsId });
      }
    }
  }

  if (filterRewardSetId) {
    return result.filter((ag) => ag.rewardSetId === filterRewardSetId);
  }

  return result;
}

/**
 * Get all gems this class can BUY from vendors at this stop (cumulative).
 */
export function getVendorGemsAtStop(stopId: string, className: string, disabledStopIds?: Set<string>): AvailableGem[] {
  if (!className) return [];

  const questsAtStop = getQuestsAtStop(stopId, disabledStopIds);
  const previousQuests = getPreviousStopQuests(stopId, disabledStopIds);
  const result: AvailableGem[] = [];

  const cls = className as ClassName;

  // After Lilly Roth, ALL gems are available as vendor
  if (questsAtStop.has(LILLY_ROTH_QUEST_ID)) {
    const wasAlreadyLilly = previousQuests.has(LILLY_ROTH_QUEST_ID);
    const prevVendor = wasAlreadyLilly ? new Set<string>() : getVendorGemNames(previousQuests, cls);
    for (const gem of allGemsCache) {
      const wasPrev = wasAlreadyLilly || prevVendor.has(gem.name);
      result.push({ gem, source: 'vendor', isNewAtThisStop: !wasPrev });
    }
    return result;
  }

  const currentVendor = getVendorGemNames(questsAtStop, cls);
  const prevVendor = getVendorGemNames(previousQuests, cls);

  for (const gemName of currentVendor) {
    const gem = findGemByName(gemName);
    if (!gem) continue;
    result.push({ gem, source: 'vendor', isNewAtThisStop: !prevVendor.has(gemName) });
  }

  return result;
}
