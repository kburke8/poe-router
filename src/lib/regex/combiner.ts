import type { RegexCategory } from '@/types/regex';

/**
 * Combine all categories into the final regex one-liner.
 *
 * Format: "!<exclusions> <inclusions>"
 *
 * - Exclusions: entries from "dont_ever_show" category (isExclusion=true),
 *   plus any entry in other categories marked as isExclusion
 * - Inclusions: all other enabled entries
 * - Join exclusion patterns with |, prefix with !
 * - Join inclusion patterns with |
 * - Final output: "!excl1|excl2 incl1|incl2|incl3"
 * - If no exclusions: just "incl1|incl2|incl3"
 * - If no inclusions: just "!excl1|excl2"
 */
export function combineCategories(categories: RegexCategory[]): string {
  const exclusions: string[] = [];
  const inclusions: string[] = [];

  for (const category of categories) {
    for (const entry of category.entries) {
      if (!entry.enabled) continue;

      if (category.id === 'dont_ever_show' || entry.isExclusion) {
        exclusions.push(entry.pattern);
      } else {
        inclusions.push(entry.pattern);
      }
    }
  }

  const parts: string[] = [];

  if (exclusions.length > 0) {
    parts.push('!' + exclusions.join('|'));
  }

  if (inclusions.length > 0) {
    parts.push(inclusions.join('|'));
  }

  return parts.join(' ');
}

/**
 * Get character count of the combined regex.
 * PoE has a ~50 char limit in the search box, so this is important to track.
 */
export function getCharCount(combined: string): number {
  return combined.length;
}
