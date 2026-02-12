import { abbreviate } from '../src/lib/regex/abbreviator';
import gemsData from '../src/data/gems.json';

const allGemNames = [
  ...gemsData.skills.map((g: { name: string }) => g.name),
  ...gemsData.supports.map((g: { name: string }) => g.name),
];

// The 3 gems whose patterns caused false positives
const problemGems = ['Faster Attacks Support', 'Mirage Archer Support', "Sniper's Mark"];

for (const gem of problemGems) {
  const pattern = abbreviate(gem, allGemNames);
  console.log(`${gem} -> "${pattern}"`);
}

// Also test all 22 gems from the user's regex to see new patterns
const allTestGems = [
  'Galvanic Arrow', 'Momentum Support', 'LMP Support', 'Burning Arrow',
  'Dash', 'Frostblink', 'Shrapnel Ballista', 'Herald of Ash',
  'Herald of Ice', 'Frenzy', 'Blood Rage', 'Anger',
  'Trinity Support', 'Manaforged Arrows', 'Arrow Nova Support',
  'Faster Attacks Support', 'Lightning Arrow', 'Mirage Archer Support',
  "Sniper's Mark", 'Blink Arrow', 'Elemental Dmg w/ Attacks', 'Haste',
];

console.log('\nAll 22 gem patterns:');
for (const gem of allTestGems) {
  const pattern = abbreviate(gem, allGemNames);
  console.log(`  ${gem} -> "${pattern}"`);
}

// Now test the new patterns against the 4 false-positive gem texts
const fpTexts: Record<string, string> = {
  'Flicker Strike': `Item Class: Skill Gems Rarity: Gem Flicker Strike Attack, Melee, Strike, Movement, Duration Level: 13 Cost: 7 Mana Cooldown Time: 2.00 sec Attack Speed: 120% of base Attack Damage: 302.5% of base Effectiveness of Added Damage: 302% Requirements: Level: 51 Dex: 115 Teleports the character to a nearby monster and attacks with a melee weapon. If no specific monster is targeted, one is picked at random. Grants a buff that increases movement speed for a duration. The cooldown can be bypassed by expending a Frenzy Charge. Base duration is 3.00 seconds 10% increased Attack Speed per Frenzy Charge 15% chance to gain a Frenzy Charge on Hit Buff grants 20% increased Movement Speed Experience: 1,296,745/2,353,679 Place into an item socket of the right colour to gain this skill. Right click to remove from a socket.`,
  'Unearth': `Item Class: Skill Gems Rarity: Gem Unearth Spell, Projectile, AoE, Physical Level: 13 Cost: 8 Mana Cast Time: 0.30 sec Critical Strike Chance: 6.00% Effectiveness of Added Damage: 140% Requirements: Level: 51 Dex: 72 Int: 50 Fires a projectile that will pierce through enemies to impact the ground at the targeted location, creating a Bone Archer corpse where it lands. Deals 222 to 332 Physical Damage Projectiles Pierce all Targets Spawned corpses are Level 51 Maximum of 10 corpses allowed Experience: 1,296,745/2,353,679 Place into an item socket of the right colour to gain this skill. Right click to remove from a socket.`,
  'Ice Spear': `Item Class: Skill Gems Rarity: Gem Ice Spear Critical, Spell, Projectile, Cold Level: 12 Cost: 18 Mana Cast Time: 0.70 sec Critical Strike Chance: 7.00% Effectiveness of Added Damage: 130% Requirements: Level: 50 Int: 113 Launches shards of ice in rapid succession. After travelling a short distance they change to a second form, which moves much faster and pierces through enemies. Deals 218 to 326 Cold Damage Fires 2 Projectiles Second form has 600% increased Critical Strike Chance Second form has +41% to Critical Strike Multiplier Second form has 300% more Projectile Speed Experience: 1,955,219/2,151,030 Place into an item socket of the right colour to gain this skill. Right click to remove from a socket.`,
  'Summon Reaper': `Item Class: Skill Gems Rarity: Gem Summon Reaper Physical, Minion, Spell Level: 1 Cost: 15 Mana Cooldown Time: 4.00 sec Cast Time: 0.60 sec Requirements: Level: 28 Int: 67 Summons a powerful Reaper which uses a variety of slashing area attacks. The Reaper's presence weakens your other minions, and it will consume them to temporarily empower and heal itself. Using this skill while the Reaper is already summoned causes it to dash to the targeted location and perform a powerful attack. Maximum 1 Summoned Reaper Minion's Attacks have 50% chance to inflict Bleeding Minion deals 30% more Damage with Bleeding Reaper causes your Non-Reaper Minions to deal 20% less Damage Reaper causes your Non-Reaper Minions to have 20% less Maximum Life Experience: 1/199,345 Place into an item socket of the right colour to gain this skill. Right click to remove from a socket.`,
};

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

console.log('\nCollision test with new patterns:');
let anyCollision = false;
for (const [fpGem, fpText] of Object.entries(fpTexts)) {
  const matches: string[] = [];
  for (const gem of allTestGems) {
    const pattern = abbreviate(gem, allGemNames);
    const re = buildRegex(pattern);
    if (re.test(fpText)) {
      matches.push(`  "${pattern}" (${gem}) matches in ${fpGem}`);
    }
  }
  if (matches.length > 0) {
    anyCollision = true;
    for (const m of matches) console.log(m);
  }
}
if (!anyCollision) {
  console.log('  ZERO false positives! All patterns are clean.');
}
