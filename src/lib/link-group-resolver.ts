import type { BuildLinkGroup, LinkGroupPhase } from '@/types/build';
import { TOWN_STOPS } from '@/data/town-stops';

export interface ResolvedLinkGroup {
  buildLinkGroup: BuildLinkGroup;
  activePhase: LinkGroupPhase;
  isPhaseStart: boolean;
}

const stopSortOrder = new Map(TOWN_STOPS.map((s) => [s.id, s.sortOrder]));

function getSortOrder(stopId: string): number {
  return stopSortOrder.get(stopId) ?? Infinity;
}

/**
 * Find the active phase for a link group at a given stop.
 * Returns the latest phase whose fromStopId is at or before the stop (by sortOrder).
 */
export function resolvePhaseAtStop(
  lg: BuildLinkGroup,
  stopId: string,
): { phase: LinkGroupPhase; isExactMatch: boolean } | null {
  const targetOrder = getSortOrder(stopId);

  // Sort phases by their stop's sortOrder
  const sorted = [...lg.phases].sort(
    (a, b) => getSortOrder(a.fromStopId) - getSortOrder(b.fromStopId),
  );

  let bestPhase: LinkGroupPhase | null = null;
  for (const phase of sorted) {
    if (getSortOrder(phase.fromStopId) <= targetOrder) {
      bestPhase = phase;
    } else {
      break;
    }
  }

  if (!bestPhase) return null;

  return {
    phase: bestPhase,
    isExactMatch: bestPhase.fromStopId === stopId,
  };
}

/**
 * Resolve all link groups for a given stop, returning which phase is active
 * and whether this stop is where the phase starts.
 */
export function resolveLinkGroupsAtStop(
  buildLinkGroups: BuildLinkGroup[],
  stopId: string,
): ResolvedLinkGroup[] {
  const results: ResolvedLinkGroup[] = [];

  for (const blg of buildLinkGroups) {
    const resolved = resolvePhaseAtStop(blg, stopId);
    if (!resolved) continue;

    results.push({
      buildLinkGroup: blg,
      activePhase: resolved.phase,
      isPhaseStart: resolved.isExactMatch,
    });
  }

  return results;
}

/**
 * Get the phase that comes before the given phase in a link group (by stop order).
 */
export function getPreviousPhase(
  lg: BuildLinkGroup,
  phase: LinkGroupPhase,
): LinkGroupPhase | null {
  const sorted = [...lg.phases].sort(
    (a, b) => getSortOrder(a.fromStopId) - getSortOrder(b.fromStopId),
  );

  const idx = sorted.findIndex((p) => p.id === phase.id);
  if (idx <= 0) return null;
  return sorted[idx - 1];
}
