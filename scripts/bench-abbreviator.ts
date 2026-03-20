/**
 * Benchmark the abbreviator with the expanded collision pool.
 * Includes gem-names.json pool, 10-gem subset timing, and false positive validation.
 *
 * Usage: npx tsx scripts/bench-abbreviator.ts
 */

import gemsData from '../src/data/gems.json';
import gemDescriptions from '../src/data/gem-descriptions.json';
import baseItemNames from '../src/data/base-item-names.json';
import gemNamesData from '../src/data/gem-names.json';

const GEM_DESCRIPTION_TEXTS: string[] = Object.entries(gemDescriptions)
  .filter(([key]) => key !== '_metadata')
  .map(([, val]) => val as string);
const BASE_ITEM_NAMES: string[] = (baseItemNames as any).entries;
const GEM_NAMES_POOL: string[] = (gemNamesData as any).entries;

const ALL_GEM_NAMES = [
  ...gemsData.skills.map((g: { name: string }) => g.name),
  ...gemsData.supports.map((g: { name: string }) => g.name),
];

const FULL_EXTRA_POOL = [...GEM_DESCRIPTION_TEXTS, ...BASE_ITEM_NAMES, ...GEM_NAMES_POOL];

console.log('Collision pool sizes:');
console.log(`  Gem descriptions: ${GEM_DESCRIPTION_TEXTS.length}`);
console.log(`  Base item names: ${BASE_ITEM_NAMES.length}`);
console.log(`  Gem names pool: ${GEM_NAMES_POOL.length}`);
console.log(`  Total extra: ${GEM_DESCRIPTION_TEXTS.length + BASE_ITEM_NAMES.length + GEM_NAMES_POOL.length}`);
console.log(`  Gem/item names: ${ALL_GEM_NAMES.length}`);

function patternToRegexStr(pattern: string): string {
  let regexStr = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '^' && i === 0) regexStr += '^';
    else if (ch === '.' && i + 1 < pattern.length && pattern[i + 1] === '+') { regexStr += '.+'; i++; }
    else if (ch === '.') regexStr += '.';
    else regexStr += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return regexStr;
}

function patternMatches(pattern: string, name: string): boolean {
  try {
    return new RegExp(patternToRegexStr(pattern), 'i').test(name);
  } catch {
    return name.toLowerCase().includes(pattern.toLowerCase());
  }
}

function countMatches(pattern: string, allNames: string[]): number {
  let count = 0;
  for (const name of allNames) {
    if (patternMatches(pattern, name)) count++;
  }
  return count;
}

function abbreviate(name: string, allNames: string[], extraPool: string[]): string {
  const lower = name.toLowerCase();
  const filtered = extraPool.filter(s => !s.toLowerCase().includes(lower));
  const fullPool = [...allNames, ...filtered];
  const words = lower.split(/\s+/);
  const isMultiWord = words.length >= 2;

  function tryCrossWord(totalLen: number): string | null {
    for (let leftLen = 2; leftLen <= totalLen - 2; leftLen++) {
      const rightLen = totalLen - leftLen - 1;
      if (rightLen < 2) continue;
      for (let wi = 0; wi < words.length - 1; wi++) {
        if (leftLen > words[wi].length || rightLen > words[wi + 1].length) continue;
        const pattern = words[wi].substring(words[wi].length - leftLen) + '.' + words[wi + 1].substring(0, rightLen);
        if (patternMatches(pattern, name) && countMatches(pattern, fullPool) === 1) return pattern;
      }
    }
    return null;
  }

  function trySubstrings(len: number): string | null {
    for (let start = 0; start <= lower.length - len; start++) {
      const pattern = lower.substring(start, start + len).replace(/ /g, '.');
      if (patternMatches(pattern, name) && countMatches(pattern, fullPool) === 1) return pattern;
    }
    return null;
  }

  function tryPrefix(prefixLen: number): string | null {
    if (prefixLen < 3 || prefixLen > lower.length) return null;
    const pattern = '^' + lower.substring(0, prefixLen).replace(/ /g, '.');
    if (patternMatches(pattern, name) && countMatches(pattern, fullPool) === 1) return pattern;
    return null;
  }

  for (let len = 4; len <= lower.length; len++) {
    if (isMultiWord && len <= 8) { const cw = tryCrossWord(len); if (cw) return cw; }
    const sub = trySubstrings(len); if (sub) return sub;
    const prefix = tryPrefix(len - 1); if (prefix) return prefix;
  }

  if (isMultiWord) {
    for (let totalLen = 6; totalLen <= 14; totalLen++) {
      for (let leftLen = 2; leftLen <= Math.min(totalLen - 4, words[0].length); leftLen++) {
        const rightLen = totalLen - leftLen - 2;
        if (rightLen < 2 || rightLen > 6) continue;
        for (let wi = 1; wi < words.length; wi++) {
          if (rightLen > words[wi].length) continue;
          const pattern = words[0].substring(words[0].length - leftLen) + '.+' + words[wi].substring(0, rightLen);
          if (patternMatches(pattern, name) && countMatches(pattern, fullPool) === 1) return pattern;
        }
      }
    }
  }

  return lower.replace(/ /g, '.');
}

// --- 10-gem subset benchmark (COLL-03 performance requirement: under 500ms) ---
const subset10 = ALL_GEM_NAMES.slice(0, 10);
console.log(`\n10-gem benchmark (${subset10.map(n => n).join(', ')})...`);
const start10 = performance.now();
for (const name of subset10) {
  abbreviate(name, ALL_GEM_NAMES, FULL_EXTRA_POOL);
}
const elapsed10 = performance.now() - start10;
console.log(`10-gem benchmark: ${elapsed10.toFixed(1)}ms (requirement: under 500ms)`);

// --- Full benchmark: ALL gems with the full pool ---
console.log(`\nBenchmarking all ${ALL_GEM_NAMES.length} gems with RePoE collision pool...`);
const start = performance.now();

const results: Array<{ name: string; pattern: string }> = [];
for (const name of ALL_GEM_NAMES) {
  const pattern = abbreviate(name, ALL_GEM_NAMES, FULL_EXTRA_POOL);
  results.push({ name, pattern });
}

const elapsed = performance.now() - start;
console.log(`Done in ${(elapsed / 1000).toFixed(1)}s (${(elapsed / ALL_GEM_NAMES.length).toFixed(1)}ms per gem)\n`);

// --- False positive check ---
// Check each pattern against the FULL collision pool (not just gem names).
// Inter-gem-name collisions (e.g., "arc" matching "Arcane Cloak") are expected
// and resolved by computeAbbreviations() at batch time. Here we check for
// unintended matches against the extra pool (descriptions, base items, gem names pool).
let falsePositiveCount = 0;
const falsePositives: Array<{ name: string; pattern: string; matched: string }> = [];
for (const { name, pattern } of results) {
  const lower = name.toLowerCase();
  // Check against extra pool entries that don't contain the target name
  const relevantPool = FULL_EXTRA_POOL.filter(s => !s.toLowerCase().includes(lower));
  for (const poolEntry of relevantPool) {
    if (patternMatches(pattern, poolEntry)) {
      falsePositiveCount++;
      falsePositives.push({ name, pattern, matched: poolEntry });
    }
  }
}
console.log(`False positives (extra pool): ${falsePositiveCount}`);
if (falsePositives.length > 0) {
  console.log('  Collisions with pool entries:');
  for (const { name, pattern, matched } of falsePositives.slice(0, 20)) {
    console.log(`    "${pattern}" for "${name}" also matches "${matched}"`);
  }
}

// Also report inter-gem-name collisions (informational, resolved by computeAbbreviations)
let interGemCollisions = 0;
const interGemDetails: Array<{ name: string; pattern: string; matched: string }> = [];
for (const { name, pattern } of results) {
  for (const otherName of ALL_GEM_NAMES) {
    if (otherName === name) continue;
    if (patternMatches(pattern, otherName)) {
      interGemCollisions++;
      interGemDetails.push({ name, pattern, matched: otherName });
    }
  }
}
console.log(`Inter-gem collisions (resolved by computeAbbreviations): ${interGemCollisions}`);
if (interGemDetails.length > 0) {
  for (const { name, pattern, matched } of interGemDetails.slice(0, 10)) {
    console.log(`    "${pattern}" for "${name}" also matches "${matched}"`);
  }
}

// Show patterns that are longer than 6 chars (might indicate the expanded pool is too strict)
const longPatterns = results.filter(r => r.pattern.length > 6);
console.log(`\nPatterns > 6 chars: ${longPatterns.length} of ${results.length}`);
for (const { name, pattern } of longPatterns.slice(0, 20)) {
  console.log(`  ${name.padEnd(40)} -> ${pattern}`);
}

// Show all results
console.log('\n--- All Abbreviation Patterns ---');
for (const { name, pattern } of results) {
  console.log(`  ${name.padEnd(40)} -> ${pattern} (${pattern.length} chars)`);
}
