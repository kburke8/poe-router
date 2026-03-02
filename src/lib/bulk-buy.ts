import type { BuildPlan } from '@/types/build';
import { computeAbbreviations } from '@/lib/regex/abbreviator';
import gemsData from '@/data/gems.json';
import type { Gem } from '@/types/gem';

const allGems: Gem[] = [
  ...(gemsData.skills as Gem[]),
  ...(gemsData.supports as Gem[]),
];
const allGemNames = allGems.map((g) => g.name);

const BULK_BUY_STOPS: Record<string, 'siosa' | 'lily'> = {
  a3_after_library: 'siosa',
  a6_town_arrival: 'lily',
};

/** Returns the bulk buy vendor at a stop, or null if not a bulk buy stop. */
export function getBulkBuyVendor(stopId: string): 'siosa' | 'lily' | null {
  return BULK_BUY_STOPS[stopId] ?? null;
}

/** Returns a map of stopId -> vendor gem names[] for each enabled bulk buy stop. */
export function getBulkBuyGemsByStop(build: BuildPlan): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const stop of build.stops) {
    if (!stop.enabled) continue;
    if (!getBulkBuyVendor(stop.stopId)) continue;
    const vendorGems = stop.gemPickups
      .filter((p) => p.source === 'vendor')
      .map((p) => p.gemName);
    if (vendorGems.length > 0) {
      result.set(stop.stopId, vendorGems);
    }
  }
  return result;
}

/** Returns the set of all vendor gem names across all enabled bulk buy stops. */
export function getAllBulkBuyGemNames(build: BuildPlan): Set<string> {
  const names = new Set<string>();
  for (const [, gems] of getBulkBuyGemsByStop(build)) {
    for (const name of gems) names.add(name);
  }
  return names;
}

/**
 * Returns the set of gem names that appear ONLY at bulk buy stops (vendor source).
 * Gems that also appear as vendor pickups at non-bulk stops stay in the main regex.
 */
export function getExclusiveBulkBuyGemNames(build: BuildPlan): Set<string> {
  const bulkBuyNames = getAllBulkBuyGemNames(build);
  if (bulkBuyNames.size === 0) return bulkBuyNames;

  // Find vendor gem names at non-bulk-buy stops
  const nonBulkVendorNames = new Set<string>();
  for (const stop of build.stops) {
    if (!stop.enabled) continue;
    if (getBulkBuyVendor(stop.stopId)) continue;
    for (const p of stop.gemPickups) {
      if (p.source === 'vendor') nonBulkVendorNames.add(p.gemName);
    }
  }

  // Only keep gems exclusive to bulk buy stops
  const exclusive = new Set<string>();
  for (const name of bulkBuyNames) {
    if (!nonBulkVendorNames.has(name)) exclusive.add(name);
  }
  return exclusive;
}

/** Compute a regex string for a set of gem names (joined with |). */
export function computeBulkBuyRegex(gemNames: string[]): string {
  if (gemNames.length === 0) return '';
  const abbreviations = computeAbbreviations(gemNames, allGemNames);
  return [...abbreviations.values()].join('|');
}
