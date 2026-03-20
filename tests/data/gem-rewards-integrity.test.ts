import { describe, it, expect } from 'vitest';
import gemsData from '../../src/data/gems.json';
import { QUEST_GEM_TABLES } from '@/data/gem-rewards';

const allGemNames = new Set([
  ...gemsData.skills.map((g) => g.name),
  ...gemsData.supports.map((g) => g.name),
]);

/** Search all tables for a gem name, returning locations found */
function findGemInTables(gemName: string): { questId: string; type: string; className: string }[] {
  const results: { questId: string; type: string; className: string }[] = [];
  for (const table of QUEST_GEM_TABLES) {
    for (const [cls, gems] of Object.entries(table.questRewards)) {
      if ((gems as string[]).includes(gemName)) {
        results.push({ questId: table.questId, type: 'questRewards', className: cls });
      }
    }
    for (const [cls, gems] of Object.entries(table.vendorRewards)) {
      if ((gems as string[]).includes(gemName)) {
        results.push({ questId: table.questId, type: 'vendorRewards', className: cls });
      }
    }
  }
  return results;
}

describe('gem-rewards.ts integrity', () => {
  it('all gem names in quest rewards exist in gems.json', () => {
    const missing: string[] = [];
    for (const table of QUEST_GEM_TABLES) {
      for (const [cls, gems] of Object.entries(table.questRewards)) {
        for (const name of gems as string[]) {
          if (!allGemNames.has(name)) {
            missing.push(`"${name}" in ${table.questId} questRewards[${cls}]`);
          }
        }
      }
    }
    expect(missing, `Missing gems:\n${missing.join('\n')}`).toEqual([]);
  });

  it('all gem names in vendor rewards exist in gems.json', () => {
    const missing: string[] = [];
    for (const table of QUEST_GEM_TABLES) {
      for (const [cls, gems] of Object.entries(table.vendorRewards)) {
        for (const name of gems as string[]) {
          if (!allGemNames.has(name)) {
            missing.push(`"${name}" in ${table.questId} vendorRewards[${cls}]`);
          }
        }
      }
    }
    expect(missing, `Missing gems:\n${missing.join('\n')}`).toEqual([]);
  });

  it('no old/renamed gem names remain', () => {
    const oldNames = ['Sweep', 'Lesser Multiple Projectiles Support'];
    for (const oldName of oldNames) {
      const locations = findGemInTables(oldName);
      expect(locations, `Old gem name "${oldName}" found at: ${JSON.stringify(locations)}`).toEqual([]);
    }
  });

  it('removed gem Blade Trap does not appear', () => {
    const locations = findGemInTables('Blade Trap');
    expect(locations, `Removed gem "Blade Trap" found at: ${JSON.stringify(locations)}`).toEqual([]);
  });

  it('gem arrays are alphabetically sorted', () => {
    const unsorted: string[] = [];
    for (const table of QUEST_GEM_TABLES) {
      for (const [cls, gems] of Object.entries(table.questRewards)) {
        const arr = gems as string[];
        const sorted = [...arr].sort();
        if (JSON.stringify(arr) !== JSON.stringify(sorted)) {
          unsorted.push(`${table.questId} questRewards[${cls}]`);
        }
      }
      for (const [cls, gems] of Object.entries(table.vendorRewards)) {
        const arr = gems as string[];
        const sorted = [...arr].sort();
        if (JSON.stringify(arr) !== JSON.stringify(sorted)) {
          unsorted.push(`${table.questId} vendorRewards[${cls}]`);
        }
      }
    }
    expect(unsorted, `Unsorted arrays:\n${unsorted.join('\n')}`).toEqual([]);
  });

  it('Holy Sweep appears in THE_SIRENS_CADENCE', () => {
    const locations = findGemInTables('Holy Sweep');
    const sirensEntries = locations.filter((l) => l.questId === 'the_sirens_cadence');
    expect(sirensEntries.length).toBeGreaterThan(0);
  });

  it('Multiple Projectiles Support appears in THE_CAGED_BRUTE_NESSA', () => {
    const locations = findGemInTables('Multiple Projectiles Support');
    const nessaEntries = locations.filter((l) => l.questId === 'the_caged_brute_nessa');
    expect(nessaEntries.length).toBeGreaterThan(0);
  });

  it('new Templar gems appear in correct quests', () => {
    // Holy Strike in enemy_at_the_gate vendor
    const holyStrike = findGemInTables('Holy Strike');
    expect(
      holyStrike.some((l) => l.questId === 'enemy_at_the_gate' && l.type === 'vendorRewards' && l.className === 'Templar'),
      'Holy Strike should be in enemy_at_the_gate vendorRewards[Templar]'
    ).toBe(true);

    // Shield of Light in intruders_in_black
    const shieldOfLight = findGemInTables('Shield of Light');
    expect(
      shieldOfLight.some((l) => l.questId === 'intruders_in_black'),
      'Shield of Light should be in intruders_in_black'
    ).toBe(true);

    // Exemplar Support in sharp_and_cruel
    const exemplar = findGemInTables('Exemplar Support');
    expect(
      exemplar.some((l) => l.questId === 'sharp_and_cruel'),
      'Exemplar Support should be in sharp_and_cruel'
    ).toBe(true);

    // Divine Blast in sever_the_right_hand
    const divineBlast = findGemInTables('Divine Blast');
    expect(
      divineBlast.some((l) => l.questId === 'sever_the_right_hand'),
      'Divine Blast should be in sever_the_right_hand'
    ).toBe(true);

    // Blessed Call Support and Excommunicate Support in a_fixture_of_fate
    const blessedCall = findGemInTables('Blessed Call Support');
    expect(
      blessedCall.some((l) => l.questId === 'a_fixture_of_fate'),
      'Blessed Call Support should be in a_fixture_of_fate'
    ).toBe(true);

    const excommunicate = findGemInTables('Excommunicate Support');
    expect(
      excommunicate.some((l) => l.questId === 'a_fixture_of_fate'),
      'Excommunicate Support should be in a_fixture_of_fate'
    ).toBe(true);
  });
});
