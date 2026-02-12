export interface TownStop {
  id: string;
  label: string;
  actNumber: number;
  questsCompleted: string[];
  defaultEnabled: boolean;
  sortOrder: number;
  /** Quests that are only completed if this stop is enabled (optional side-quests).
   *  When this stop is disabled, these quests are removed from all stops' effective quest lists. */
  exclusiveQuests?: string[];
}

export interface GemQuest {
  id: string;
  name: string;
  actNumber: number;
  npcName: string;
  sortOrder: number;
}

// All quests that give gem rewards (quest reward or vendor unlock)
export const GEM_QUESTS: GemQuest[] = [
  // Act 1
  { id: 'enemy_at_the_gate', name: 'Enemy at the Gate', actNumber: 1, npcName: 'Tarkleigh', sortOrder: 1 },
  { id: 'breaking_some_eggs', name: 'Breaking Some Eggs', actNumber: 1, npcName: 'Nessa', sortOrder: 2 },
  { id: 'mercy_mission', name: 'Mercy Mission', actNumber: 1, npcName: 'Nessa', sortOrder: 3 },
  { id: 'the_caged_brute', name: 'The Caged Brute', actNumber: 1, npcName: 'Tarkleigh', sortOrder: 4 },
  { id: 'the_caged_brute_nessa', name: 'The Caged Brute (Nessa)', actNumber: 1, npcName: 'Nessa', sortOrder: 4.5 },
  { id: 'the_sirens_cadence', name: "The Siren's Cadence", actNumber: 1, npcName: 'Nessa', sortOrder: 5 },
  // Act 2
  { id: 'intruders_in_black', name: 'Intruders in Black', actNumber: 2, npcName: 'Greust', sortOrder: 6 },
  { id: 'sharp_and_cruel', name: 'Sharp and Cruel', actNumber: 2, npcName: 'Silk', sortOrder: 7 },
  // Act 3
  { id: 'lost_in_love', name: 'Lost in Love', actNumber: 3, npcName: 'Maramoa', sortOrder: 8 },
  { id: 'a_fixture_of_fate', name: 'A Fixture of Fate', actNumber: 3, npcName: 'Siosa', sortOrder: 9 },
  { id: 'sever_the_right_hand', name: 'Sever the Right Hand', actNumber: 3, npcName: 'Maramoa', sortOrder: 10 },
  // Act 4
  { id: 'breaking_the_seal', name: 'Breaking the Seal', actNumber: 4, npcName: 'Oyun', sortOrder: 11 },
  { id: 'the_eternal_nightmare', name: 'The Eternal Nightmare', actNumber: 4, npcName: 'Tasuni', sortOrder: 12 },
  // Act 6 - Lilly Roth sells ALL gems after this
  { id: 'fallen_from_grace', name: 'Fallen from Grace', actNumber: 6, npcName: 'Lilly Roth', sortOrder: 13 },
];

// All possible town stops across acts 1-10
export const TOWN_STOPS: TownStop[] = [
  // Act 1
  {
    id: 'a1_after_hillock',
    label: 'After Hillock',
    actNumber: 1,
    questsCompleted: ['enemy_at_the_gate'],
    defaultEnabled: true,
    sortOrder: 1,
  },
  {
    id: 'a1_after_hailrake',
    label: 'After Hailrake',
    actNumber: 1,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission'],
    defaultEnabled: true,
    sortOrder: 2,
  },
  {
    id: 'a1_after_dweller',
    label: 'After Dweller',
    actNumber: 1,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute_nessa'],
    defaultEnabled: false,
    sortOrder: 3,
  },
  {
    id: 'a1_after_brutus',
    label: 'After Brutus',
    actNumber: 1,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa'],
    defaultEnabled: true,
    sortOrder: 4,
  },
  {
    id: 'a1_after_merveil',
    label: 'After Fairgreaves',
    actNumber: 1,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence'],
    defaultEnabled: true,
    sortOrder: 5,
  },

  // Act 2
  {
    id: 'a2_town_arrival',
    label: 'Town Arrival',
    actNumber: 2,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence'],
    defaultEnabled: false,
    sortOrder: 6,
  },
  {
    id: 'a2_after_chamber_of_sins',
    label: 'After Chamber of Sins',
    actNumber: 2,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black'],
    defaultEnabled: true,
    sortOrder: 7,
  },
  {
    id: 'a2_after_weaver',
    label: 'After Weaver',
    actNumber: 2,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel'],
    defaultEnabled: true,
    sortOrder: 8,
  },
  {
    id: 'a2_before_vaal',
    label: 'Before Vaal Oversoul',
    actNumber: 2,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel'],
    defaultEnabled: false,
    sortOrder: 9,
  },

  // Act 3
  {
    id: 'a3_town_arrival',
    label: 'Town Arrival',
    actNumber: 3,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel'],
    defaultEnabled: false,
    sortOrder: 10,
  },
  {
    id: 'a3_after_tolman',
    label: 'After Tolman (Lost in Love)',
    actNumber: 3,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love'],
    defaultEnabled: true,
    sortOrder: 11,
  },
  {
    id: 'a3_after_library',
    label: 'After Library (Fixture of Fate)',
    actNumber: 3,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate'],
    defaultEnabled: true,
    sortOrder: 12,
    exclusiveQuests: ['a_fixture_of_fate'],
  },
  {
    id: 'a3_after_gravicius',
    label: 'After Gravicius',
    actNumber: 3,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand'],
    defaultEnabled: true,
    sortOrder: 13,
    exclusiveQuests: ['sever_the_right_hand'],
  },

  // Act 4
  {
    id: 'a4_town_arrival',
    label: 'Town Arrival',
    actNumber: 4,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand'],
    defaultEnabled: false,
    sortOrder: 14,
  },
  {
    id: 'a4_after_kaom_daresso',
    label: 'After Kaom/Daresso',
    actNumber: 4,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal'],
    defaultEnabled: true,
    sortOrder: 15,
  },
  {
    id: 'a4_after_malachai',
    label: 'After Malachai',
    actNumber: 4,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare'],
    defaultEnabled: true,
    sortOrder: 16,
  },

  // Act 5
  {
    id: 'a5_town_arrival',
    label: 'Town Arrival',
    actNumber: 5,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare'],
    defaultEnabled: true,
    sortOrder: 17,
  },
  {
    id: 'a5_before_kitava',
    label: 'Before Kitava',
    actNumber: 5,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare'],
    defaultEnabled: false,
    sortOrder: 18,
  },

  // Act 6 - After Fallen from Grace, Lilly Roth sells ALL gems
  {
    id: 'a6_town_arrival',
    label: 'Town Arrival (Lilly Roth)',
    actNumber: 6,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: true,
    sortOrder: 19,
  },
  {
    id: 'a6_mid',
    label: 'Mid Act',
    actNumber: 6,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: false,
    sortOrder: 20,
  },

  // Act 7
  {
    id: 'a7_town_arrival',
    label: 'Town Arrival',
    actNumber: 7,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: true,
    sortOrder: 21,
  },
  {
    id: 'a7_mid',
    label: 'Mid Act',
    actNumber: 7,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: false,
    sortOrder: 22,
  },

  // Act 8
  {
    id: 'a8_town_arrival',
    label: 'Town Arrival',
    actNumber: 8,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: true,
    sortOrder: 23,
  },
  {
    id: 'a8_mid',
    label: 'Mid Act',
    actNumber: 8,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: false,
    sortOrder: 24,
  },

  // Act 9
  {
    id: 'a9_town_arrival',
    label: 'Town Arrival',
    actNumber: 9,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: true,
    sortOrder: 25,
  },
  {
    id: 'a9_mid',
    label: 'Mid Act',
    actNumber: 9,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: false,
    sortOrder: 26,
  },

  // Act 10
  {
    id: 'a10_town_arrival',
    label: 'Town Arrival',
    actNumber: 10,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: true,
    sortOrder: 27,
  },
  {
    id: 'a10_before_kitava',
    label: 'Before Kitava',
    actNumber: 10,
    questsCompleted: ['enemy_at_the_gate', 'breaking_some_eggs', 'mercy_mission', 'the_caged_brute', 'the_caged_brute_nessa', 'the_sirens_cadence', 'intruders_in_black', 'sharp_and_cruel', 'lost_in_love', 'a_fixture_of_fate', 'sever_the_right_hand', 'breaking_the_seal', 'the_eternal_nightmare', 'fallen_from_grace'],
    defaultEnabled: false,
    sortOrder: 28,
  },
];

export function getStopById(id: string): TownStop | undefined {
  return TOWN_STOPS.find((s) => s.id === id);
}

export function getStopsForAct(actNumber: number): TownStop[] {
  return TOWN_STOPS.filter((s) => s.actNumber === actNumber);
}

export function getDefaultStops(): TownStop[] {
  return TOWN_STOPS.filter((s) => s.defaultEnabled);
}

export function getQuestById(id: string): GemQuest | undefined {
  return GEM_QUESTS.find((q) => q.id === id);
}

export function getActNumbers(): number[] {
  const acts = new Set(TOWN_STOPS.map((s) => s.actNumber));
  return [...acts].sort((a, b) => a - b);
}
