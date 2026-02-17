import { QUEST_GEM_TABLES, type ClassName } from '@/data/gem-rewards';
import type { GemPickup } from '@/types/build';

interface GemCost {
  currency: string;
  shortName: string;
}

const WISDOM: GemCost = { currency: 'Scroll of Wisdom', shortName: 'Wisdom' };
const TRANS: GemCost = { currency: 'Orb of Transmutation', shortName: 'Trans' };
const ALT: GemCost = { currency: 'Orb of Alteration', shortName: 'Alt' };
const CHANCE: GemCost = { currency: 'Orb of Chance', shortName: 'Chance' };
const ALCH: GemCost = { currency: 'Orb of Alchemy', shortName: 'Alch' };
const REGRET: GemCost = { currency: 'Orb of Regret', shortName: 'Regret' };

// Vendor gem costs by quest milestone (not strictly by act).
// Costs increase at specific quest thresholds, not at act boundaries.
const QUEST_COST: Record<string, GemCost> = {
  // Act 1 early — Wisdom Scroll
  enemy_at_the_gate:   WISDOM,
  breaking_some_eggs:  WISDOM,
  mercy_mission:       WISDOM,
  // Act 1 late — Orb of Transmutation
  the_caged_brute:       TRANS,
  the_caged_brute_nessa: TRANS,
  the_sirens_cadence:    TRANS,
  // Act 2 — Orb of Alteration
  intruders_in_black: ALT,
  sharp_and_cruel:    ALT,
  // Act 3 early (Lost in Love, Fixture of Fate) — still Alteration
  lost_in_love:       ALT,
  a_fixture_of_fate:  ALT,
  // Act 3 late (Gravicius onward) — Orb of Chance
  sever_the_right_hand: CHANCE,
  // Act 4 — Orb of Alchemy
  breaking_the_seal:    ALCH,
  the_eternal_nightmare: ALCH,
  // Act 6+ (Lilly Roth) — Orb of Regret
  fallen_from_grace: REGRET,
};

function questToCost(questId: string): GemCost {
  return QUEST_COST[questId] ?? REGRET;
}

/**
 * Determine the vendor purchase cost for a gem based on which quest
 * first made it available as a vendor reward for the given class.
 */
export function getGemVendorCost(gemName: string, className: string): GemCost | null {
  const cls = className as ClassName;

  for (const table of QUEST_GEM_TABLES) {
    const vendorGems = table.vendorRewards[cls];
    if (!vendorGems?.includes(gemName)) continue;
    return questToCost(table.questId);
  }

  // Gem not found as vendor reward — might be quest-reward-only (free)
  return null;
}

interface AggregatedCost {
  currency: string;
  shortName: string;
  count: number;
}

/**
 * Summarize vendor costs for a set of gem pickups at a stop.
 * Groups by currency and returns aggregated totals.
 */
export function summarizeVendorCosts(
  vendorPickups: GemPickup[],
  className: string,
): AggregatedCost[] {
  const counts = new Map<string, { cost: GemCost; count: number }>();

  for (const pickup of vendorPickups) {
    const cost = getGemVendorCost(pickup.gemName, className);
    if (!cost) continue;

    const existing = counts.get(cost.shortName);
    if (existing) {
      existing.count++;
    } else {
      counts.set(cost.shortName, { cost, count: 1 });
    }
  }

  return [...counts.values()].map(({ cost, count }) => ({
    currency: cost.currency,
    shortName: cost.shortName,
    count,
  }));
}
