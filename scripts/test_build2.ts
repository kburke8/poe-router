import { abbreviate } from '../src/lib/regex/abbreviator';
import gemsData from '../src/data/gems.json';

const allGemNames = [
  ...gemsData.skills.map((g: { name: string }) => g.name),
  ...gemsData.supports.map((g: { name: string }) => g.name),
];

const pat = abbreviate('Close Combat Support', allGemNames);
console.log('Close Combat Support ->', pat);

function buildRegex(pattern: string): RegExp {
  let r = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '^' && i === 0) r += '^';
    else if (ch === '.' && pattern[i+1] === '+') { r += '.+'; i++; }
    else if (ch === '.') r += '.';
    else r += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(r, 'i');
}

const re = buildRegex(pat);
const prismaticText = `Chooses an element at random and deals damage of that type in an area. Having higher strength makes it more likely to choose fire, higher dexterity makes it more likely to choose cold, and higher intelligence makes it more likely to choose lightning.`;
console.log('Matches Prismatic Burst text:', re.test(prismaticText));
