import type { BuildPlan, BuildLinkGroup } from '@/types/build';
import type { RegexPreset } from '@/types/regex';
import { computeAbbreviations } from './abbreviator';
import gemsData from '@/data/gems.json';
import type { Gem } from '@/types/gem';

const allGemNames = [
  ...(gemsData.skills as Gem[]),
  ...(gemsData.supports as Gem[]),
].map((g) => g.name);

export interface LinkPattern {
  pattern: string;
  sourceName: string;
}

/**
 * Generate sorted socket color patterns from build link groups.
 * Uses the last phase of each link group (the "final" socket configuration).
 */
export function generateLinkPatterns(linkGroups: BuildLinkGroup[]): LinkPattern[] {
  const seen = new Set<string>();
  const patterns: LinkPattern[] = [];

  for (const lg of linkGroups) {
    if (lg.phases.length === 0) continue;

    // Use the last phase (latest/final socket configuration)
    const lastPhase = lg.phases[lg.phases.length - 1];
    const colors = lastPhase.gems
      .map((g) => g.socketColor)
      .sort()
      .join('-');

    if (!colors || seen.has(colors)) continue;
    seen.add(colors);

    const sourceName = lg.label || `${lastPhase.gems.length}L`;
    patterns.push({ pattern: colors, sourceName });
  }

  return patterns;
}

/**
 * Generate vendor regex for a build: populates 'gems' and 'links' categories.
 * Returns the preset ID that was created or reused.
 */
export async function generateBuildRegex(
  build: BuildPlan,
  presets: RegexPreset[],
  actions: {
    createPreset: (name: string) => Promise<string>;
    setActivePreset: (id: string) => void;
    clearCategory: (categoryId: 'gems' | 'links') => Promise<void>;
    addEntry: (
      categoryId: 'gems' | 'links',
      entry: { pattern: string; sourceName: string; isExclusion: boolean; enabled: boolean; isCustom: boolean },
    ) => Promise<void>;
  },
): Promise<string> {
  // Collect vendor gem names
  const vendorGemNames = [
    ...new Set(
      build.stops
        .flatMap((s) => s.gemPickups)
        .filter((p) => p.source === 'vendor')
        .map((p) => p.gemName)
    ),
  ];

  // Compute link patterns
  const linkPatterns = generateLinkPatterns(build.linkGroups);

  // Create new preset or reuse linked one
  let presetId = build.regexPresetId;
  if (presetId && presets.find((p) => p.id === presetId)) {
    actions.setActivePreset(presetId);
    await actions.clearCategory('gems');
    await actions.clearCategory('links');
  } else {
    presetId = await actions.createPreset(`${build.name} - Regex`);
  }

  actions.setActivePreset(presetId);

  // Add gem entries
  if (vendorGemNames.length > 0) {
    const abbreviations = computeAbbreviations(vendorGemNames, allGemNames);
    for (const [gemName, pattern] of abbreviations) {
      await actions.addEntry('gems', {
        pattern,
        sourceName: gemName,
        isExclusion: false,
        enabled: true,
        isCustom: false,
      });
    }
  }

  // Add link entries
  for (const lp of linkPatterns) {
    await actions.addEntry('links', {
      pattern: lp.pattern,
      sourceName: lp.sourceName,
      isExclusion: false,
      enabled: true,
      isCustom: false,
    });
  }

  return presetId;
}

/**
 * Check whether the build has any content worth generating regex for.
 */
export function hasBuildRegexContent(build: BuildPlan): boolean {
  const hasVendorGems = build.stops
    .flatMap((s) => s.gemPickups)
    .some((p) => p.source === 'vendor');

  const hasLinkGroups = build.linkGroups.some(
    (lg) => lg.phases.length > 0 && lg.phases.some((p) => p.gems.length > 0),
  );

  return hasVendorGems || hasLinkGroups;
}
