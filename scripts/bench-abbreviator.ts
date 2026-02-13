/**
 * Benchmark the abbreviator with the expanded collision pool.
 * Compares patterns with and without RePoE data.
 *
 * Usage: npx tsx scripts/bench-abbreviator.ts
 */

import gemsData from '../src/data/gems.json';
import gemDescriptions from '../src/data/gem-descriptions.json';
import baseItemNames from '../src/data/base-item-names.json';

const GEM_DESCRIPTION_TEXTS: string[] = Object.values(gemDescriptions);
const BASE_ITEM_NAMES: string[] = baseItemNames as string[];

const ALL_GEM_NAMES = [
  ...gemsData.skills.map((g: { name: string }) => g.name),
  ...gemsData.supports.map((g: { name: string }) => g.name),
];

console.log('Collision pool sizes:');
console.log(`  Gem descriptions: ${GEM_DESCRIPTION_TEXTS.length}`);
console.log(`  Base item names: ${BASE_ITEM_NAMES.length}`);
console.log(`  Total extra: ${GEM_DESCRIPTION_TEXTS.length + BASE_ITEM_NAMES.length}`);
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

// Run benchmark: ALL gems with the full pool
console.log(`\nBenchmarking all ${ALL_GEM_NAMES.length} gems with RePoE collision pool...`);
const start = performance.now();

const results: Array<{ name: string; pattern: string }> = [];
for (const name of ALL_GEM_NAMES) {
  const pattern = abbreviate(name, ALL_GEM_NAMES, [...GEM_DESCRIPTION_TEXTS, ...BASE_ITEM_NAMES]);
  results.push({ name, pattern });
}

const elapsed = performance.now() - start;
console.log(`Done in ${(elapsed / 1000).toFixed(1)}s (${(elapsed / ALL_GEM_NAMES.length).toFixed(1)}ms per gem)\n`);

// Show patterns that are longer than 6 chars (might indicate the expanded pool is too strict)
const longPatterns = results.filter(r => r.pattern.length > 6);
console.log(`Patterns > 6 chars: ${longPatterns.length} of ${results.length}`);
for (const { name, pattern } of longPatterns.slice(0, 20)) {
  console.log(`  ${name.padEnd(40)} -> ${pattern}`);
}

// Show all results
console.log('\n--- All Abbreviation Patterns ---');
for (const { name, pattern } of results) {
  console.log(`  ${name.padEnd(40)} -> ${pattern} (${pattern.length} chars)`);
}
