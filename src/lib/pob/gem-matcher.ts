import gemsData from '@/data/gems.json';
import { resolveGemNameAllPatches } from '@/lib/migration';
import type { Gem } from '@/types/gem';
import type { PobGem } from './parse';

export type MatchResult =
  | { status: 'matched'; gem: Gem }
  | { status: 'skipped'; reason: string; nameSpec: string }
  | { status: 'not_found'; nameSpec: string };

const ALT_QUALITY_PREFIXES = ['Anomalous ', 'Divergent ', 'Phantasmal '];

function getAllGems(): Gem[] {
  const gems: Gem[] = [];
  for (const g of gemsData.skills) gems.push(g as Gem);
  for (const g of gemsData.supports) gems.push(g as Gem);
  return gems;
}

const allGems = getAllGems();

function findByName(name: string): Gem | undefined {
  // Exact match
  const exact = allGems.find((g) => g.name === name);
  if (exact) return exact;

  // Case-insensitive
  const lower = name.toLowerCase();
  return allGems.find((g) => g.name.toLowerCase() === lower);
}

/**
 * Match a PoB gem entry to our gem database.
 */
export function matchPobGem(pobGem: PobGem): MatchResult {
  const { nameSpec, skillId, gemId } = pobGem;

  // Item-granted skills have skillId but no gemId
  if (skillId && !gemId) {
    return { status: 'skipped', reason: 'Item-granted skill', nameSpec };
  }

  // Skip Vaal gems
  if (nameSpec.startsWith('Vaal ')) {
    return { status: 'skipped', reason: 'Vaal gem', nameSpec };
  }

  // Try direct match
  const direct = findByName(nameSpec);
  if (direct) return { status: 'matched', gem: direct };

  // PoB often omits " Support" suffix — try appending it
  const withSupport = findByName(nameSpec + ' Support');
  if (withSupport) return { status: 'matched', gem: withSupport };

  // Strip alternate quality prefixes and retry
  for (const prefix of ALT_QUALITY_PREFIXES) {
    if (nameSpec.startsWith(prefix)) {
      const stripped = nameSpec.slice(prefix.length);
      const match = findByName(stripped) ?? findByName(stripped + ' Support');
      if (match) return { status: 'matched', gem: match };
    }
  }

  // Resolve historical names through every patch's rename map (chained
  // renames included), so any old PoB export still matches.
  const renamedDirect = resolveGemNameAllPatches(nameSpec);
  if (renamedDirect !== nameSpec) {
    const match = findByName(renamedDirect);
    if (match) return { status: 'matched', gem: match };
  }

  // Also try with " Support" suffix on the rename lookup
  const renamedWithSupport = resolveGemNameAllPatches(nameSpec + ' Support');
  if (renamedWithSupport !== nameSpec + ' Support') {
    const match = findByName(renamedWithSupport);
    if (match) return { status: 'matched', gem: match };
  }

  return { status: 'not_found', nameSpec };
}
