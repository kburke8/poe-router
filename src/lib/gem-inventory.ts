import type { BuildPlan } from '@/types/build';
import { TOWN_STOPS } from '@/data/town-stops';
import { getBeachGems } from '@/data/classes';

const stopOrderMap = new Map(TOWN_STOPS.map((s) => [s.id, s.sortOrder]));

/**
 * Returns the set of gem names "in inventory" at a given stop.
 * Walks all enabled stops up to and including `stopId` (by TOWN_STOPS sortOrder),
 * collecting gem pickups. Beach gems and mule gems are included at all stops.
 */
export function getInventoryAtStop(build: BuildPlan, stopId: string): Set<string> {
  const inventory = new Set<string>();
  const targetOrder = stopOrderMap.get(stopId);

  // For custom stops, use afterStopId for ordering
  const stopPlan = build.stops.find((s) => s.stopId === stopId);
  const effectiveOrder = targetOrder ?? (stopPlan?.afterStopId ? (stopOrderMap.get(stopPlan.afterStopId) ?? 0) + 0.5 : 0);

  // Add beach gems (available from the start)
  const beachGems = getBeachGems(build.className);
  if (beachGems) {
    inventory.add(beachGems.skillGem);
    inventory.add(beachGems.supportGem);
  }

  // Add mule gems (available from the start via mule character)
  if (build.muleClassName) {
    const muleBeach = getBeachGems(build.muleClassName);
    if (muleBeach) {
      inventory.add(muleBeach.skillGem);
      inventory.add(muleBeach.supportGem);
    }
  }
  if (build.mulePickups) {
    for (const mp of build.mulePickups) {
      inventory.add(mp.gemName);
    }
  }

  // Walk all stops in order, collecting gem pickups
  for (const stop of build.stops) {
    if (!stop.enabled) continue;

    let order: number;
    if (stop.isCustom && stop.afterStopId) {
      order = (stopOrderMap.get(stop.afterStopId) ?? 0) + 0.5;
    } else {
      order = stopOrderMap.get(stop.stopId) ?? 0;
    }

    if (order > effectiveOrder) continue;

    for (const pickup of stop.gemPickups) {
      inventory.add(pickup.gemName);
    }
  }

  return inventory;
}
