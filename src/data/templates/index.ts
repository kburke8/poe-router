import type { BuildPlan, StopPlan, GemPickup, BuildLinkGroup, LinkGroupPhase } from '@/types/build';
import { TOWN_STOPS } from '@/data/town-stops';

export interface BuildTemplate {
  id: string;
  name: string;
  description: string;
  className: string;
  ascendancy: string;
  tags: string[];
  build: BuildPlan;
}

// Helper to create a stop plan with enabled state matching TOWN_STOPS defaults
function makeStops(): StopPlan[] {
  return TOWN_STOPS.map((ts) => ({
    stopId: ts.id,
    enabled: ts.defaultEnabled,
    gemPickups: [],
    notes: '',
  }));
}

// Helper to add a gem pickup to a specific stop
function addPickup(
  stops: StopPlan[],
  stopId: string,
  pickup: Omit<GemPickup, 'id'> & { id: string },
) {
  const stop = stops.find((s) => s.stopId === stopId);
  if (stop) stop.gemPickups.push(pickup);
}

// Helper to create a link group phase
function phase(id: string, fromStopId: string, gems: LinkGroupPhase['gems']): LinkGroupPhase {
  return { id, fromStopId, gems };
}

// =============================================================================
// Template 1: SRS Witch (Necromancer)
// =============================================================================

function createSrsWitch(): BuildPlan {
  const stops = makeStops();

  // Act 1 - After Hillock: Freezing Pulse + Arcane Surge Support
  addPickup(stops, 'a1_after_hillock', {
    id: 'srs-pickup-001',
    gemName: 'Freezing Pulse',
    gemColor: 'blue',
    source: 'quest_reward',
    rewardSetId: 'enemy_at_the_gate',
  });
  addPickup(stops, 'a1_after_hillock', {
    id: 'srs-pickup-002',
    gemName: 'Arcane Surge Support',
    gemColor: 'blue',
    source: 'vendor',
  });

  // Act 1 - After Hailrake: SRS + Frostblink + Summon Phantasm Support
  addPickup(stops, 'a1_after_hailrake', {
    id: 'srs-pickup-003',
    gemName: 'Summon Raging Spirit',
    gemColor: 'blue',
    source: 'quest_reward',
    rewardSetId: 'breaking_some_eggs',
  });
  addPickup(stops, 'a1_after_hailrake', {
    id: 'srs-pickup-004',
    gemName: 'Frostblink',
    gemColor: 'blue',
    source: 'quest_reward',
    rewardSetId: 'breaking_some_eggs_movement',
  });
  addPickup(stops, 'a1_after_hailrake', {
    id: 'srs-pickup-005',
    gemName: 'Summon Phantasm Support',
    gemColor: 'blue',
    source: 'quest_reward',
    rewardSetId: 'mercy_mission',
  });

  // Act 1 - After Brutus: Minion Damage + Melee Splash + Flame Dash
  addPickup(stops, 'a1_after_brutus', {
    id: 'srs-pickup-006',
    gemName: 'Minion Damage Support',
    gemColor: 'blue',
    source: 'quest_reward',
    rewardSetId: 'the_caged_brute_nessa',
  });
  addPickup(stops, 'a1_after_brutus', {
    id: 'srs-pickup-007',
    gemName: 'Melee Splash Support',
    gemColor: 'red',
    source: 'vendor',
  });
  addPickup(stops, 'a1_after_brutus', {
    id: 'srs-pickup-008',
    gemName: 'Flame Dash',
    gemColor: 'blue',
    source: 'quest_reward',
    rewardSetId: 'the_caged_brute',
  });

  // Act 1 - After Fairgreaves: Flesh Offering
  addPickup(stops, 'a1_after_merveil', {
    id: 'srs-pickup-009',
    gemName: 'Flesh Offering',
    gemColor: 'blue',
    source: 'quest_reward',
    rewardSetId: 'the_sirens_cadence',
  });

  // Act 2 - After Chamber of Sins: Desecrate
  addPickup(stops, 'a2_after_chamber_of_sins', {
    id: 'srs-pickup-010',
    gemName: 'Desecrate',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'intruders_in_black',
  });

  // Act 2 - After Weaver: Minion Speed Support
  addPickup(stops, 'a2_after_weaver', {
    id: 'srs-pickup-011',
    gemName: 'Minion Speed Support',
    gemColor: 'blue',
    source: 'quest_reward',
    rewardSetId: 'sharp_and_cruel',
  });

  // Act 4 - After Malachai: Spell Echo Support
  addPickup(stops, 'a4_after_malachai', {
    id: 'srs-pickup-012',
    gemName: 'Spell Echo Support',
    gemColor: 'blue',
    source: 'quest_reward',
    rewardSetId: 'the_eternal_nightmare',
  });

  // Link Groups
  const linkGroups: BuildLinkGroup[] = [
    // Main SRS link group with phases
    {
      id: 'srs-lg-001',
      label: 'SRS',
      phases: [
        // Phase 1: Early leveling with Freezing Pulse
        phase('srs-ph-001', 'a1_after_hillock', [
          { gemName: 'Freezing Pulse', socketColor: 'B' },
          { gemName: 'Arcane Surge Support', socketColor: 'B' },
        ]),
        // Phase 2: Transition to SRS after Hailrake
        phase('srs-ph-002', 'a1_after_hailrake', [
          { gemName: 'Summon Raging Spirit', socketColor: 'B' },
          { gemName: 'Summon Phantasm Support', socketColor: 'B' },
        ]),
        // Phase 3: Add Minion Damage + Melee Splash after Brutus
        phase('srs-ph-003', 'a1_after_brutus', [
          { gemName: 'Summon Raging Spirit', socketColor: 'B' },
          { gemName: 'Minion Damage Support', socketColor: 'B' },
          { gemName: 'Melee Splash Support', socketColor: 'R' },
          { gemName: 'Summon Phantasm Support', socketColor: 'B' },
        ]),
        // Phase 4: Add Spell Echo in Act 4
        phase('srs-ph-004', 'a4_after_malachai', [
          { gemName: 'Summon Raging Spirit', socketColor: 'B' },
          { gemName: 'Minion Damage Support', socketColor: 'B' },
          { gemName: 'Melee Splash Support', socketColor: 'R' },
          { gemName: 'Spell Echo Support', socketColor: 'B' },
        ]),
      ],
    },
    // Utility: Flesh Offering + Desecrate
    {
      id: 'srs-lg-002',
      label: 'Offerings',
      phases: [
        phase('srs-ph-005', 'a2_after_chamber_of_sins', [
          { gemName: 'Flesh Offering', socketColor: 'B' },
          { gemName: 'Desecrate', socketColor: 'G' },
        ]),
      ],
    },
    // Movement: Flame Dash
    {
      id: 'srs-lg-003',
      label: 'Movement',
      phases: [
        phase('srs-ph-006', 'a1_after_brutus', [
          { gemName: 'Flame Dash', socketColor: 'B' },
        ]),
      ],
    },
  ];

  return {
    id: 'template-srs-witch-001',
    name: 'SRS Witch (Necromancer)',
    className: 'Witch',
    ascendancy: 'Necromancer',
    stops,
    linkGroups,
    gearGoals: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    version: 3,
  };
}

// =============================================================================
// Template 2: Lightning Arrow Ranger (Deadeye)
// =============================================================================

function createLaRanger(): BuildPlan {
  const stops = makeStops();

  // Act 1 - After Hillock: Burning Arrow + Momentum Support
  addPickup(stops, 'a1_after_hillock', {
    id: 'la-pickup-001',
    gemName: 'Burning Arrow',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'enemy_at_the_gate',
  });
  addPickup(stops, 'a1_after_hillock', {
    id: 'la-pickup-002',
    gemName: 'Momentum Support',
    gemColor: 'green',
    source: 'vendor',
  });

  // Act 1 - After Hailrake: Mirage Archer + Pierce Support
  addPickup(stops, 'a1_after_hailrake', {
    id: 'la-pickup-003',
    gemName: 'Mirage Archer Support',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'mercy_mission',
  });
  addPickup(stops, 'a1_after_hailrake', {
    id: 'la-pickup-004',
    gemName: 'Pierce Support',
    gemColor: 'green',
    source: 'vendor',
  });

  // Act 1 - After Brutus: Added Cold Damage + Blink Arrow
  addPickup(stops, 'a1_after_brutus', {
    id: 'la-pickup-005',
    gemName: 'Added Cold Damage Support',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'the_caged_brute_nessa',
  });
  addPickup(stops, 'a1_after_brutus', {
    id: 'la-pickup-006',
    gemName: 'Blink Arrow',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'the_caged_brute',
  });

  // Act 1 - After Fairgreaves: Lightning Arrow
  addPickup(stops, 'a1_after_merveil', {
    id: 'la-pickup-007',
    gemName: 'Lightning Arrow',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'the_sirens_cadence',
  });

  // Act 2 - After Chamber of Sins: Herald of Ice
  addPickup(stops, 'a2_after_chamber_of_sins', {
    id: 'la-pickup-008',
    gemName: 'Herald of Ice',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'intruders_in_black',
  });

  // Act 2 - After Weaver: Elemental Damage with Attacks Support
  addPickup(stops, 'a2_after_weaver', {
    id: 'la-pickup-009',
    gemName: 'Elemental Damage with Attacks Support',
    gemColor: 'red',
    source: 'quest_reward',
    rewardSetId: 'sharp_and_cruel',
  });

  // Act 6 - Lilly Roth: Added Lightning Damage Support
  addPickup(stops, 'a6_town_arrival', {
    id: 'la-pickup-010',
    gemName: 'Added Lightning Damage Support',
    gemColor: 'blue',
    source: 'vendor',
  });

  const linkGroups: BuildLinkGroup[] = [
    {
      id: 'la-lg-001',
      label: 'Lightning Arrow',
      phases: [
        // Phase 1: Burning Arrow early
        phase('la-ph-001', 'a1_after_hillock', [
          { gemName: 'Burning Arrow', socketColor: 'G' },
          { gemName: 'Momentum Support', socketColor: 'G' },
        ]),
        // Phase 2: Add Mirage Archer + Pierce
        phase('la-ph-002', 'a1_after_hailrake', [
          { gemName: 'Burning Arrow', socketColor: 'G' },
          { gemName: 'Mirage Archer Support', socketColor: 'G' },
          { gemName: 'Pierce Support', socketColor: 'G' },
        ]),
        // Phase 3: Transition to Lightning Arrow
        phase('la-ph-003', 'a1_after_merveil', [
          { gemName: 'Lightning Arrow', socketColor: 'G' },
          { gemName: 'Mirage Archer Support', socketColor: 'G' },
          { gemName: 'Added Cold Damage Support', socketColor: 'G' },
          { gemName: 'Pierce Support', socketColor: 'G' },
        ]),
        // Phase 4: Swap in Elemental Damage with Attacks
        phase('la-ph-004', 'a2_after_weaver', [
          { gemName: 'Lightning Arrow', socketColor: 'G' },
          { gemName: 'Mirage Archer Support', socketColor: 'G' },
          { gemName: 'Elemental Damage with Attacks Support', socketColor: 'R' },
          { gemName: 'Added Cold Damage Support', socketColor: 'G' },
        ]),
        // Phase 5: Final setup with Added Lightning
        phase('la-ph-005', 'a6_town_arrival', [
          { gemName: 'Lightning Arrow', socketColor: 'G' },
          { gemName: 'Mirage Archer Support', socketColor: 'G' },
          { gemName: 'Elemental Damage with Attacks Support', socketColor: 'R' },
          { gemName: 'Added Lightning Damage Support', socketColor: 'B' },
        ]),
      ],
    },
    // Aura: Herald of Ice
    {
      id: 'la-lg-002',
      label: 'Auras',
      phases: [
        phase('la-ph-006', 'a2_after_chamber_of_sins', [
          { gemName: 'Herald of Ice', socketColor: 'G' },
        ]),
      ],
    },
    // Movement: Blink Arrow
    {
      id: 'la-lg-003',
      label: 'Movement',
      phases: [
        phase('la-ph-007', 'a1_after_brutus', [
          { gemName: 'Blink Arrow', socketColor: 'G' },
        ]),
      ],
    },
  ];

  return {
    id: 'template-la-ranger-001',
    name: 'Lightning Arrow Ranger (Deadeye)',
    className: 'Ranger',
    ascendancy: 'Deadeye',
    stops,
    linkGroups,
    gearGoals: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    version: 3,
  };
}

// =============================================================================
// Template 3: Toxic Rain Ranger (Pathfinder)
// =============================================================================

function createTrRanger(): BuildPlan {
  const stops = makeStops();

  // Act 1 - After Hillock: Caustic Arrow + Momentum Support
  addPickup(stops, 'a1_after_hillock', {
    id: 'tr-pickup-001',
    gemName: 'Caustic Arrow',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'enemy_at_the_gate',
  });
  addPickup(stops, 'a1_after_hillock', {
    id: 'tr-pickup-002',
    gemName: 'Momentum Support',
    gemColor: 'green',
    source: 'vendor',
  });

  // Act 1 - After Hailrake: Mirage Archer + Pierce
  addPickup(stops, 'a1_after_hailrake', {
    id: 'tr-pickup-003',
    gemName: 'Mirage Archer Support',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'mercy_mission',
  });
  addPickup(stops, 'a1_after_hailrake', {
    id: 'tr-pickup-004',
    gemName: 'Pierce Support',
    gemColor: 'green',
    source: 'vendor',
  });

  // Act 1 - After Brutus: Void Manipulation + Blink Arrow
  addPickup(stops, 'a1_after_brutus', {
    id: 'tr-pickup-005',
    gemName: 'Void Manipulation Support',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'the_caged_brute_nessa',
  });
  addPickup(stops, 'a1_after_brutus', {
    id: 'tr-pickup-006',
    gemName: 'Blink Arrow',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'the_caged_brute',
  });

  // Act 1 - After Fairgreaves: Toxic Rain
  addPickup(stops, 'a1_after_merveil', {
    id: 'tr-pickup-007',
    gemName: 'Toxic Rain',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'the_sirens_cadence',
  });

  // Act 2 - After Weaver: Vicious Projectiles Support
  addPickup(stops, 'a2_after_weaver', {
    id: 'tr-pickup-008',
    gemName: 'Vicious Projectiles Support',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'sharp_and_cruel',
  });

  // Act 4 - After Malachai: Withering Touch Support
  addPickup(stops, 'a4_after_malachai', {
    id: 'tr-pickup-009',
    gemName: 'Withering Touch Support',
    gemColor: 'green',
    source: 'quest_reward',
    rewardSetId: 'the_eternal_nightmare',
  });

  // Act 6 - Lilly Roth: Swift Affliction Support
  addPickup(stops, 'a6_town_arrival', {
    id: 'tr-pickup-010',
    gemName: 'Swift Affliction Support',
    gemColor: 'green',
    source: 'vendor',
  });

  const linkGroups: BuildLinkGroup[] = [
    {
      id: 'tr-lg-001',
      label: 'Toxic Rain',
      phases: [
        // Phase 1: Caustic Arrow early
        phase('tr-ph-001', 'a1_after_hillock', [
          { gemName: 'Caustic Arrow', socketColor: 'G' },
          { gemName: 'Momentum Support', socketColor: 'G' },
        ]),
        // Phase 2: Add Mirage Archer
        phase('tr-ph-002', 'a1_after_hailrake', [
          { gemName: 'Caustic Arrow', socketColor: 'G' },
          { gemName: 'Mirage Archer Support', socketColor: 'G' },
          { gemName: 'Pierce Support', socketColor: 'G' },
        ]),
        // Phase 3: Transition to Toxic Rain + Void Manipulation
        phase('tr-ph-003', 'a1_after_merveil', [
          { gemName: 'Toxic Rain', socketColor: 'G' },
          { gemName: 'Mirage Archer Support', socketColor: 'G' },
          { gemName: 'Void Manipulation Support', socketColor: 'G' },
        ]),
        // Phase 4: Add Vicious Projectiles
        phase('tr-ph-004', 'a2_after_weaver', [
          { gemName: 'Toxic Rain', socketColor: 'G' },
          { gemName: 'Mirage Archer Support', socketColor: 'G' },
          { gemName: 'Void Manipulation Support', socketColor: 'G' },
          { gemName: 'Vicious Projectiles Support', socketColor: 'G' },
        ]),
        // Phase 5: Final with Swift Affliction
        phase('tr-ph-005', 'a6_town_arrival', [
          { gemName: 'Toxic Rain', socketColor: 'G' },
          { gemName: 'Mirage Archer Support', socketColor: 'G' },
          { gemName: 'Void Manipulation Support', socketColor: 'G' },
          { gemName: 'Swift Affliction Support', socketColor: 'G' },
        ]),
      ],
    },
    // Utility: Withering Touch (for secondary attack)
    {
      id: 'tr-lg-002',
      label: 'Wither',
      phases: [
        phase('tr-ph-006', 'a4_after_malachai', [
          { gemName: 'Caustic Arrow', socketColor: 'G' },
          { gemName: 'Withering Touch Support', socketColor: 'G' },
        ]),
      ],
    },
    // Movement: Blink Arrow
    {
      id: 'tr-lg-003',
      label: 'Movement',
      phases: [
        phase('tr-ph-007', 'a1_after_brutus', [
          { gemName: 'Blink Arrow', socketColor: 'G' },
        ]),
      ],
    },
  ];

  return {
    id: 'template-tr-ranger-001',
    name: 'Toxic Rain Ranger (Pathfinder)',
    className: 'Ranger',
    ascendancy: 'Pathfinder',
    stops,
    linkGroups,
    gearGoals: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    version: 3,
  };
}

// =============================================================================
// Exported templates
// =============================================================================

export const BUILD_TEMPLATES: BuildTemplate[] = [
  {
    id: 'template-srs-witch-001',
    name: 'SRS Witch',
    description: 'Summon Raging Spirits Witch. Easy league starter with strong clear and bossing.',
    className: 'Witch',
    ascendancy: 'Necromancer',
    tags: ['league start', 'beginner', 'minion'],
    build: createSrsWitch(),
  },
  {
    id: 'template-la-ranger-001',
    name: 'Lightning Arrow Ranger',
    description: 'Lightning Arrow Ranger. Fast mapper with excellent clear speed.',
    className: 'Ranger',
    ascendancy: 'Deadeye',
    tags: ['league start', 'bow', 'fast'],
    build: createLaRanger(),
  },
  {
    id: 'template-tr-ranger-001',
    name: 'Toxic Rain Pathfinder',
    description: 'Toxic Rain Pathfinder. Strong league starter with smooth leveling.',
    className: 'Ranger',
    ascendancy: 'Pathfinder',
    tags: ['league start', 'beginner', 'dot'],
    build: createTrRanger(),
  },
];
