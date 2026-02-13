/**
 * Scrape gem description text from poedb.tw og:description meta tags.
 *
 * Usage: npx tsx scripts/scrape-gem-texts.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import gemsData from '../src/data/gems.json';

const OUR_GEMS = [
  ...gemsData.skills.map((g: { name: string }) => g.name),
  ...gemsData.supports.map((g: { name: string }) => g.name),
];

function gemToSlug(name: string): string {
  return name.replace(/'/g, '%27').replace(/ /g, '_');
}

async function fetchGemDescription(gemName: string): Promise<string | null> {
  const slug = gemToSlug(gemName);
  const url = `https://poedb.tw/us/${slug}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PoE-Router/1.0 (gem-text-scraper)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // og:description has the in-game tooltip text
    const match = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (match) {
      const desc = match[1].trim();
      if (!desc.startsWith('PoEDB') && !desc.includes('things come out each league') && desc.length > 20) {
        return desc;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function main() {
  const results: Record<string, string> = {};
  let success = 0;
  let fail = 0;
  const failed: string[] = [];

  // Test first 3 to validate
  console.log('Testing first 3 gems...');
  for (const name of OUR_GEMS.slice(0, 3)) {
    const desc = await fetchGemDescription(name);
    console.log(`  ${name}: ${desc ? `"${desc.substring(0, 60)}..."` : 'FAILED'}`);
  }
  console.log('');

  console.log(`Scraping ${OUR_GEMS.length} gem descriptions from poedb.tw...`);
  console.log('(batches of 3, 500ms delay)\n');

  for (let i = 0; i < OUR_GEMS.length; i += 3) {
    const batch = OUR_GEMS.slice(i, i + 3);
    const promises = batch.map(async (gemName) => {
      const desc = await fetchGemDescription(gemName);
      if (desc) {
        results[gemName] = desc;
        success++;
      } else {
        failed.push(gemName);
        fail++;
      }
    });

    await Promise.all(promises);

    if ((i + 3) % 30 === 0 || i + 3 >= OUR_GEMS.length) {
      const pct = Math.round(((i + 3) / OUR_GEMS.length) * 100);
      console.log(`  ${Math.min(i + 3, OUR_GEMS.length)}/${OUR_GEMS.length} (${pct}%) - ${success} ok, ${fail} failed`);
    }

    if (i + 3 < OUR_GEMS.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\nResults: ${success} ok, ${fail} failed`);
  if (failed.length > 0 && failed.length <= 30) {
    console.log(`Failed: ${failed.join(', ')}`);
  } else if (failed.length > 30) {
    console.log(`Failed ${failed.length} gems (first 10): ${failed.slice(0, 10).join(', ')}`);
  }

  const outPath = path.join(__dirname, '..', 'src', 'data', 'gem-descriptions.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved ${success} descriptions to src/data/gem-descriptions.json`);

  // Verify
  const data = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const genericCount = Object.values(data).filter((v: any) => v.includes('PoEDB') || v.includes('things come out')).length;
  console.log(`Verification: ${genericCount} generic entries (should be 0)`);

  const examples = Object.entries(data).slice(0, 5);
  console.log('\nExamples:');
  for (const [name, desc] of examples) {
    console.log(`  ${name}: "${(desc as string).substring(0, 80)}"`);
  }
}

main().catch(console.error);
