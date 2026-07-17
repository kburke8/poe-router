import gemsData from '@/data/gems.json';

/**
 * Set of all gem names in the current database. Names outside this set are
 * "orphans" -- e.g. a gem removed from the game, or a name from a future
 * patch this app version doesn't know. Orphans are kept in build data and
 * flagged in the UI, never deleted (see the migration design in
 * src/lib/migration.ts).
 */
const knownGemNames = new Set<string>([
  ...gemsData.skills.map((g) => g.name),
  ...gemsData.supports.map((g) => g.name),
]);

export function isKnownGemName(name: string): boolean {
  // Empty slots are placeholders, not orphans
  if (!name) return true;
  return knownGemNames.has(name);
}
