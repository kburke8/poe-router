import type { BuildPlan } from '@/types/build';
import { TOWN_STOPS } from '@/data/town-stops';
import { getBeachGems } from '@/data/classes';

const stopOrderMap = new Map(TOWN_STOPS.map((s) => [s.id, s.sortOrder]));

/**
 * Returns gem names "in inventory" at a given stop as an array (preserving duplicates).
 * If you pick up the same gem twice (quest reward + vendor), both copies appear.
 * Walks all enabled stops up to and including `stopId` (by TOWN_STOPS sortOrder),
 * collecting gem pickups. Beach gems and mule gems are included at all stops.
 */
export function getInventoryAtStop(build: BuildPlan, stopId: string): string[] {
  const counts = new Map<string, number>();
  const targetOrder = stopOrderMap.get(stopId);

  // For custom stops, use afterStopId for ordering
  const stopPlan = build.stops.find((s) => s.stopId === stopId);
  const effectiveOrder = targetOrder ?? (stopPlan?.afterStopId ? (stopOrderMap.get(stopPlan.afterStopId) ?? 0) + 0.5 : 0);

  const addGem = (name: string) => counts.set(name, (counts.get(name) ?? 0) + 1);
  const removeGem = (name: string) => {
    const c = counts.get(name) ?? 0;
    if (c <= 1) counts.delete(name);
    else counts.set(name, c - 1);
  };

  // Add beach gems (available from the start)
  const beachGems = getBeachGems(build.className);
  if (beachGems) {
    addGem(beachGems.skillGem);
    addGem(beachGems.supportGem);
  }

  // Add mule gems (available from the start via mule character)
  if (build.muleClassName) {
    const muleBeach = getBeachGems(build.muleClassName);
    if (muleBeach) {
      addGem(muleBeach.skillGem);
      addGem(muleBeach.supportGem);
    }
  }
  if (build.mulePickups) {
    for (const mp of build.mulePickups) {
      addGem(mp.gemName);
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
      addGem(pickup.gemName);
    }

    // Remove gems dropped at this stop
    if (stop.droppedGems) {
      for (const name of stop.droppedGems) {
        removeGem(name);
      }
    }
  }

  // Expand counts back to array with duplicates
  const result: string[] = [];
  for (const [name, count] of counts) {
    for (let i = 0; i < count; i++) result.push(name);
  }
  return result;
}
