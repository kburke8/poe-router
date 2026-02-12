// Quest-centric gem reward data for PoE 1.
// For each quest, lists which gems each class can choose as quest rewards,
// and which gems become available to buy from vendors.
// Source: https://www.poewiki.net/wiki/Quest_Rewards
//
// Quest reward data extracted directly from poewiki.net DOM tables.
// After Act 6 "Fallen from Grace", Lilly Roth sells ALL gems to ALL classes.

export type ClassName = 'Marauder' | 'Ranger' | 'Witch' | 'Duelist' | 'Templar' | 'Shadow' | 'Scion';

export const ALL_CLASSES: ClassName[] = ['Marauder', 'Ranger', 'Witch', 'Duelist', 'Templar', 'Shadow', 'Scion'];

export interface QuestGemTable {
  questId: string;
  rewardSetId?: string;
  rewardSetLabel?: string;
  // Per-class quest reward choices (gems the player can choose one from)
  questRewards: Partial<Record<ClassName, string[]>>;
  // Per-class vendor gems that become available after this quest
  vendorRewards: Partial<Record<ClassName, string[]>>;
}

// After this quest, ALL gems become available as vendor purchases for ALL classes
export const LILLY_ROTH_QUEST_ID = 'fallen_from_grace';

// =============================================================================
// Act 1
// =============================================================================

// https://www.poewiki.net/wiki/Enemy_at_the_Gate
const ENEMY_AT_THE_GATE: QuestGemTable = {
  questId: 'enemy_at_the_gate',
  questRewards: {
    Marauder: ['Ground Slam', 'Molten Strike', 'Shield Crush'],
    Duelist: ['Cleave', 'Galvanic Arrow', 'Molten Strike', 'Perforate', 'Splitting Steel'],
    Templar: ['Frostbolt', 'Lightning Tendrils', 'Molten Strike', 'Purifying Flame', 'Rolling Magma', 'Smite'],
    Ranger: ['Caustic Arrow', 'Frost Blades', 'Galvanic Arrow', 'Ice Shot', 'Split Arrow'],
    Witch: ['Blight', 'Freezing Pulse', 'Kinetic Bolt', 'Lightning Tendrils', 'Raise Zombie', 'Rolling Magma'],
    Shadow: ['Blight', 'Cobra Lash', 'Ethereal Knives', 'Explosive Trap', 'Freezing Pulse', 'Stormblast Mine'],
    Scion: ['Lightning Tendrils', 'Molten Strike', 'Split Arrow', 'Splitting Steel'],
  },
  vendorRewards: {
    Witch: ['Arcane Surge Support', 'Blight', 'Ethereal Knives', 'Explosive Trap', 'Fireball', 'Freezing Pulse', 'Frostbolt', 'Kinetic Bolt', 'Lightning Tendrils', 'Prismatic Burst Support', 'Purifying Flame', 'Raise Zombie', 'Rolling Magma', 'Spark', 'Stormblast Mine'],
    Shadow: ['Blight', 'Burning Arrow', 'Caustic Arrow', 'Chance to Poison Support', 'Cobra Lash', 'Double Strike', 'Dual Strike', 'Ethereal Knives', 'Explosive Trap', 'Fireball', 'Freezing Pulse', 'Frost Blades', 'Frostbolt', 'Kinetic Bolt', 'Lightning Tendrils', 'Prismatic Burst Support', 'Purifying Flame', 'Rolling Magma', 'Spark', 'Spectral Throw', 'Split Arrow', 'Stormblast Mine', 'Viper Strike'],
    Ranger: ['Burning Arrow', 'Caustic Arrow', 'Cleave', 'Cobra Lash', 'Double Strike', 'Dual Strike', 'Explosive Trap', 'Frost Blades', 'Galvanic Arrow', 'Ice Shot', 'Kinetic Bolt', 'Momentum Support', 'Perforate', 'Spectral Throw', 'Split Arrow', 'Splitting Steel', 'Viper Strike'],
    Duelist: ['Burning Arrow', 'Caustic Arrow', 'Chance to Bleed Support', 'Cleave', 'Double Strike', 'Dual Strike', 'Frost Blades', 'Galvanic Arrow', 'Glacial Hammer', 'Ground Slam', 'Heavy Strike', 'Ice Shot', 'Molten Strike', 'Perforate', 'Shield Crush', 'Spectral Throw', 'Split Arrow', 'Splitting Steel', 'Viper Strike'],
    Marauder: ['Cleave', 'Double Strike', 'Dual Strike', 'Ethereal Knives', 'Fireball', 'Glacial Hammer', 'Ground Slam', 'Heavy Strike', 'Molten Strike', 'Perforate', 'Ruthless Support', 'Shield Crush', 'Smite', 'Spectral Throw'],
    Templar: ['Blight', 'Elemental Proliferation Support', 'Fireball', 'Freezing Pulse', 'Frostbolt', 'Glacial Hammer', 'Ground Slam', 'Heavy Strike', 'Lightning Tendrils', 'Molten Strike', 'Prismatic Burst Support', 'Purifying Flame', 'Raise Zombie', 'Rolling Magma', 'Shield Crush', 'Smite', 'Spark', 'Spectral Throw', 'Stormblast Mine'],
    Scion: ['Blight', 'Burning Arrow', 'Caustic Arrow', 'Cleave', 'Cobra Lash', 'Double Strike', 'Dual Strike', 'Explosive Trap', 'Fireball', 'Frost Blades', 'Frostbolt', 'Galvanic Arrow', 'Heavy Strike', 'Ice Shot', 'Kinetic Bolt', 'Lightning Tendrils', 'Molten Strike', 'Momentum Support', 'Perforate', 'Prismatic Burst Support', 'Purifying Flame', 'Raise Zombie', 'Rolling Magma', 'Shield Crush', 'Smite', 'Spark', 'Spectral Throw', 'Split Arrow', 'Splitting Steel', 'Stormblast Mine', 'Viper Strike'],
  },
};

// https://www.poewiki.net/wiki/Breaking_Some_Eggs
const BREAKING_SOME_EGGS: QuestGemTable = {
  questId: 'breaking_some_eggs',
  questRewards: {
    Witch: ['Contagion', 'Detonate Dead', 'Flame Wall', 'Frost Bomb', 'Orb of Storms', 'Summon Raging Spirit'],
    Shadow: ['Bear Trap', 'Contagion', 'Detonate Dead', 'Orb of Storms'],
    Ranger: ['Bear Trap', 'Puncture', 'Shrapnel Ballista', "Sniper's Mark"],
    Duelist: ['Blood and Sand', 'Crushing Fist', 'Decoy Totem', 'Puncture', "Sniper's Mark", 'Vigilant Strike', 'War Banner'],
    Marauder: ['Crushing Fist', 'Decoy Totem', 'Steelskin', 'Vigilant Strike'],
    Templar: ['Flame Wall', 'Frost Bomb', 'Holy Flame Totem', 'Summon Holy Relic', 'Vigilant Strike'],
    Scion: ['Bear Trap', 'Decoy Totem', 'Frost Bomb', 'Vigilant Strike'],
  },
  vendorRewards: {
    Witch: ['Animate Weapon', 'Contagion', 'Conversion Trap', 'Dash', 'Detonate Dead', 'Devouring Totem', 'Flame Wall', 'Frost Bomb', 'Frost Wall', 'Frostblink', 'Holy Flame Totem', 'Orb of Storms', 'Shield Charge', 'Summon Holy Relic', 'Summon Raging Spirit'],
    Shadow: ['Animate Weapon', 'Bear Trap', 'Contagion', 'Conversion Trap', 'Dash', 'Detonate Dead', 'Flame Wall', 'Frost Bomb', 'Frostblink', 'Orb of Storms', 'Puncture', 'Shield Charge', 'Shrapnel Ballista', "Sniper's Mark"],
    Ranger: ['Bear Trap', 'Blood and Sand', 'Conversion Trap', 'Dash', 'Decoy Totem', 'Detonate Dead', 'Devouring Totem', 'Frostblink', 'Puncture', 'Shield Charge', 'Shrapnel Ballista', "Sniper's Mark", 'Vigilant Strike', 'War Banner'],
    Duelist: ['Blood and Sand', 'Crushing Fist', 'Dash', 'Decoy Totem', 'Devouring Totem', 'Frost Wall', 'Frostblink', 'Puncture', 'Rejuvenation Totem', 'Shield Charge', 'Shrapnel Ballista', "Sniper's Mark", 'Steelskin', 'Vigilant Strike', 'War Banner'],
    Marauder: ['Bear Trap', 'Blood and Sand', 'Crushing Fist', 'Dash', 'Decoy Totem', 'Devouring Totem', 'Frostblink', 'Holy Flame Totem', 'Rejuvenation Totem', 'Shield Charge', 'Shrapnel Ballista', 'Steelskin', 'Vigilant Strike', 'War Banner'],
    Templar: ['Contagion', 'Crushing Fist', 'Dash', 'Decoy Totem', 'Devouring Totem', 'Flame Wall', 'Frost Bomb', 'Frost Wall', 'Frostblink', 'Holy Flame Totem', 'Orb of Storms', 'Rejuvenation Totem', 'Shield Charge', 'Steelskin', 'Summon Holy Relic', 'Summon Raging Spirit', 'Vigilant Strike', 'War Banner'],
    Scion: ['Animate Weapon', 'Bear Trap', 'Blood and Sand', 'Contagion', 'Conversion Trap', 'Crushing Fist', 'Dash', 'Decoy Totem', 'Devouring Totem', 'Flame Wall', 'Frost Bomb', 'Frostblink', 'Orb of Storms', 'Rejuvenation Totem', 'Shield Charge', 'Shrapnel Ballista', "Sniper's Mark", 'Steelskin', 'Summon Raging Spirit', 'Vigilant Strike', 'War Banner'],
  },
};

const BREAKING_SOME_EGGS_MOVEMENT: QuestGemTable = {
  questId: 'breaking_some_eggs',
  rewardSetId: 'breaking_some_eggs_movement',
  rewardSetLabel: 'Movement Skill',
  questRewards: {
    Witch: ['Frostblink'],
    Shadow: ['Dash', 'Frostblink'],
    Ranger: ['Dash'],
    Duelist: ['Dash', 'Shield Charge'],
    Marauder: ['Shield Charge'],
    Templar: ['Frostblink', 'Shield Charge'],
    Scion: ['Dash', 'Frostblink', 'Shield Charge'],
  },
  vendorRewards: {},
};

// https://www.poewiki.net/wiki/Mercy_Mission
const MERCY_MISSION: QuestGemTable = {
  questId: 'mercy_mission',
  questRewards: {
    Witch: ['Chance to Poison Support', 'Elemental Proliferation Support', 'Infused Channelling Support', 'Spell Cascade Support', 'Summon Phantasm Support'],
    Shadow: ['Elemental Proliferation Support', 'Infused Channelling Support', 'Momentum Support', 'Pierce Support', 'Spell Cascade Support', 'Swift Assembly Support', 'Volley Support'],
    Ranger: ['Chance to Poison Support', 'Mirage Archer Support', 'Pierce Support', 'Volley Support'],
    Duelist: ['Ancestral Call Support', 'Chance to Poison Support', 'Mirage Archer Support', 'Momentum Support', 'Pierce Support', 'Ruthless Support', 'Volley Support'],
    Marauder: ['Ancestral Call Support', 'Chance to Bleed Support', 'Momentum Support'],
    Templar: ['Ancestral Call Support', 'Arcane Surge Support', 'Chance to Bleed Support', 'Infused Channelling Support', 'Ruthless Support', 'Spell Cascade Support'],
    Scion: ['Ancestral Call Support', 'Arcane Surge Support', 'Chance to Bleed Support', 'Chance to Poison Support', 'Elemental Proliferation Support', 'Pierce Support', 'Ruthless Support', 'Spell Cascade Support', 'Summon Phantasm Support', 'Volley Support'],
  },
  vendorRewards: {
    Witch: ['Elemental Proliferation Support', 'Infused Channelling Support', 'Spell Cascade Support', 'Summon Phantasm Support', 'Swift Assembly Support', 'Volley Support'],
    Shadow: ['Arcane Surge Support', 'Elemental Proliferation Support', 'Infused Channelling Support', 'Mirage Archer Support', 'Momentum Support', 'Pierce Support', 'Spell Cascade Support', 'Summon Phantasm Support', 'Swift Assembly Support', 'Volley Support'],
    Ranger: ['Ancestral Call Support', 'Chance to Bleed Support', 'Chance to Poison Support', 'Mirage Archer Support', 'Momentum Support', 'Pierce Support', 'Swift Assembly Support', 'Volley Support'],
    Duelist: ['Ancestral Call Support', 'Mirage Archer Support', 'Momentum Support', 'Pierce Support', 'Ruthless Support', 'Swift Assembly Support', 'Volley Support'],
    Marauder: ['Ancestral Call Support', 'Chance to Bleed Support', 'Momentum Support', 'Volley Support'],
    Templar: ['Ancestral Call Support', 'Arcane Surge Support', 'Chance to Bleed Support', 'Infused Channelling Support', 'Ruthless Support', 'Spell Cascade Support', 'Summon Phantasm Support'],
    Scion: ['Ancestral Call Support', 'Arcane Surge Support', 'Chance to Bleed Support', 'Chance to Poison Support', 'Elemental Proliferation Support', 'Infused Channelling Support', 'Mirage Archer Support', 'Momentum Support', 'Pierce Support', 'Ruthless Support', 'Spell Cascade Support', 'Summon Phantasm Support', 'Swift Assembly Support', 'Volley Support'],
  },
};

// https://www.poewiki.net/wiki/The_Caged_Brute
// Tarkleigh's reward: active skills, movement, auras, warcries
const THE_CAGED_BRUTE: QuestGemTable = {
  questId: 'the_caged_brute',
  rewardSetLabel: 'Tarkleigh\'s Reward',
  questRewards: {
    Witch: ['Bodyswap', 'Clarity', 'Flame Dash', 'Lightning Warp', 'Summon Skeletons', 'Wither'],
    Shadow: ['Clarity', 'Flame Dash', 'Precision', 'Siphoning Trap', 'Smoke Mine', 'Unearth', 'Whirling Blades', 'Withering Step'],
    Ranger: ['Blink Arrow', 'Precision', 'Smoke Mine', 'Whirling Blades'],
    Duelist: ['Blink Arrow', 'Enduring Cry', 'Intimidating Cry', 'Leap Slam', 'Precision', 'Vitality', 'Whirling Blades'],
    Marauder: ['Enduring Cry', 'Intimidating Cry', 'Leap Slam', 'Vitality'],
    Templar: ['Clarity', 'Flame Dash', 'Leap Slam', 'Vitality'],
    Scion: ['Blink Arrow', 'Flame Dash', 'Leap Slam', 'Withering Step'],
  },
  // Active skill vendor gems only — support gems are under THE_CAGED_BRUTE_NESSA
  vendorRewards: {
    Witch: ['Bodyswap', 'Clarity', 'Flame Dash', 'Lightning Warp', 'Precision', 'Siphoning Trap', 'Smoke Mine', 'Summon Skeletons', 'Unearth', 'Vitality', 'Wither', 'Withering Step'],
    Shadow: ['Blink Arrow', 'Bodyswap', 'Clarity', 'Flame Dash', 'Flicker Strike', 'Lightning Warp', 'Precision', 'Siphoning Trap', 'Smoke Mine', 'Unearth', 'Vitality', 'Whirling Blades', 'Wither', 'Withering Step'],
    Ranger: ['Blink Arrow', 'Bodyswap', 'Clarity', 'Flicker Strike', 'Leap Slam', 'Precision', 'Smoke Mine', 'Unearth', 'Vitality', 'Whirling Blades', 'Withering Step'],
    Duelist: ['Blink Arrow', 'Clarity', 'Enduring Cry', 'Flicker Strike', 'Intimidating Cry', 'Leap Slam', 'Precision', 'Smoke Mine', 'Vitality', 'Whirling Blades', 'Withering Step'],
    Marauder: ['Clarity', 'Enduring Cry', 'Flicker Strike', 'Intimidating Cry', 'Leap Slam', 'Precision', 'Smoke Mine', 'Vitality'],
    Templar: ['Bodyswap', 'Clarity', 'Enduring Cry', 'Flame Dash', 'Intimidating Cry', 'Leap Slam', 'Lightning Warp', 'Precision', 'Summon Skeletons', 'Unearth', 'Vitality', 'Wither'],
    Scion: ['Blink Arrow', 'Bodyswap', 'Clarity', 'Enduring Cry', 'Flame Dash', 'Flicker Strike', 'Intimidating Cry', 'Leap Slam', 'Lightning Warp', 'Precision', 'Siphoning Trap', 'Summon Skeletons', 'Unearth', 'Vitality', 'Wither', 'Withering Step'],
  },
};

// Nessa's reward: support gems (quest reward choices + vendor support gems)
const THE_CAGED_BRUTE_NESSA: QuestGemTable = {
  questId: 'the_caged_brute_nessa',
  rewardSetLabel: 'Nessa\'s Reward',
  questRewards: {
    Witch: ['Added Lightning Damage Support', 'Combustion Support', 'Devour Support', 'Efficacy Support', 'Infernal Legion Support', 'Minion Damage Support', 'Unbound Ailments Support', 'Void Manipulation Support'],
    Shadow: ['Added Cold Damage Support', 'Added Lightning Damage Support', 'Faster Attacks Support', 'Lesser Multiple Projectiles Support', 'Multiple Traps Support', 'Void Manipulation Support'],
    Ranger: ['Added Cold Damage Support', 'Arrow Nova Support', 'Faster Attacks Support', 'Lesser Multiple Projectiles Support', 'Manaforged Arrows Support', 'Melee Splash Support', 'Void Manipulation Support'],
    Duelist: ['Added Fire Damage Support', 'Faster Attacks Support', 'Lesser Multiple Projectiles Support', 'Lifetap Support', 'Maim Support', 'Melee Splash Support'],
    Marauder: ['Added Fire Damage Support', 'Faster Attacks Support', 'Flamewood Support', 'Lifetap Support', 'Melee Splash Support'],
    Templar: ['Added Fire Damage Support', 'Added Lightning Damage Support', 'Combustion Support', 'Lifetap Support', 'Melee Splash Support'],
    Scion: ['Added Cold Damage Support', 'Added Fire Damage Support', 'Added Lightning Damage Support', 'Faster Attacks Support', 'Lesser Multiple Projectiles Support', 'Lifetap Support', 'Melee Splash Support', 'Unbound Ailments Support'],
  },
  // Support gems available from Nessa's vendor after The Caged Brute
  vendorRewards: {
    Witch: ['Added Cold Damage Support', 'Added Lightning Damage Support', 'Blastchain Mine Support', 'Combustion Support', 'Devour Support', 'Efficacy Support', 'Increased Critical Strikes Support', 'Infernal Legion Support', 'Lesser Multiple Projectiles Support', 'Locus Mine Support', 'Melee Splash Support', 'Minion Damage Support', 'Multiple Traps Support', 'Spell Totem Support', 'Trap Support', 'Unbound Ailments Support', 'Void Manipulation Support'],
    Shadow: ['Added Cold Damage Support', 'Added Fire Damage Support', 'Added Lightning Damage Support', 'Additional Accuracy Support', 'Arrow Nova Support', 'Ballista Totem Support', 'Blastchain Mine Support', 'Blind Support', 'Chance to Flee Support', 'Combustion Support', 'Devour Support', 'Efficacy Support', 'Faster Attacks Support', 'Increased Critical Strikes Support', 'Lesser Multiple Projectiles Support', 'Locus Mine Support', 'Manaforged Arrows Support', 'Melee Splash Support', 'Multiple Traps Support', 'Trap Support', 'Unbound Ailments Support', 'Void Manipulation Support'],
    Ranger: ['Added Cold Damage Support', 'Added Fire Damage Support', 'Additional Accuracy Support', 'Arrow Nova Support', 'Ballista Totem Support', 'Blastchain Mine Support', 'Blind Support', 'Chance to Flee Support', 'Faster Attacks Support', 'Increased Critical Strikes Support', 'Lesser Multiple Projectiles Support', 'Locus Mine Support', 'Maim Support', 'Manaforged Arrows Support', 'Melee Splash Support', 'Multiple Traps Support', 'Trap Support', 'Void Manipulation Support'],
    Duelist: ['Added Fire Damage Support', 'Additional Accuracy Support', 'Arrow Nova Support', 'Ballista Totem Support', 'Blind Support', 'Chance to Flee Support', 'Faster Attacks Support', 'Knockback Support', 'Lesser Multiple Projectiles Support', 'Life Gain on Hit Support', 'Lifetap Support', 'Maim Support', 'Melee Splash Support', 'Stun Support', 'Trap Support'],
    Marauder: ['Added Fire Damage Support', 'Additional Accuracy Support', 'Blind Support', 'Chance to Flee Support', 'Combustion Support', 'Faster Attacks Support', 'Flamewood Support', 'Knockback Support', 'Life Gain on Hit Support', 'Lifetap Support', 'Maim Support', 'Melee Splash Support', 'Spell Totem Support', 'Stun Support'],
    Templar: ['Added Fire Damage Support', 'Added Lightning Damage Support', 'Additional Accuracy Support', 'Blastchain Mine Support', 'Combustion Support', 'Devour Support', 'Efficacy Support', 'Flamewood Support', 'Infernal Legion Support', 'Knockback Support', 'Life Gain on Hit Support', 'Lifetap Support', 'Melee Splash Support', 'Minion Damage Support', 'Spell Totem Support', 'Stun Support', 'Unbound Ailments Support', 'Void Manipulation Support'],
    Scion: ['Added Cold Damage Support', 'Added Fire Damage Support', 'Added Lightning Damage Support', 'Additional Accuracy Support', 'Arrow Nova Support', 'Ballista Totem Support', 'Blastchain Mine Support', 'Blind Support', 'Chance to Flee Support', 'Devour Support', 'Efficacy Support', 'Faster Attacks Support', 'Flamewood Support', 'Increased Critical Strikes Support', 'Knockback Support', 'Lesser Multiple Projectiles Support', 'Life Gain on Hit Support', 'Lifetap Support', 'Locus Mine Support', 'Maim Support', 'Manaforged Arrows Support', 'Melee Splash Support', 'Minion Damage Support', 'Multiple Traps Support', 'Spell Totem Support', 'Stun Support', 'Trap Support', 'Unbound Ailments Support', 'Void Manipulation Support'],
  },
};

// https://www.poewiki.net/wiki/The_Siren%27s_Cadence
const THE_SIRENS_CADENCE: QuestGemTable = {
  questId: 'the_sirens_cadence',
  questRewards: {
    Witch: ['Arc', 'Blazing Salvo', 'Creeping Frost', 'Essence Drain', 'Flesh Offering', 'Ice Nova', 'Manabond', 'Scorching Ray', 'Volatile Dead'],
    Shadow: ['Blade Vortex', 'Essence Drain', 'Fire Trap', 'Icicle Mine', 'Lightning Trap', 'Reave', 'Venom Gyre', 'Volatile Dead', 'Voltaxic Burst'],
    Ranger: ['Elemental Hit', 'Lightning Arrow', 'Lightning Strike', 'Poisonous Concoction', 'Rain of Arrows', 'Reave', 'Siege Ballista', 'Toxic Rain'],
    Duelist: ['Earthshatter', 'Lacerate', 'Rain of Arrows', 'Shattering Steel', 'Sweep', 'Volcanic Fissure'],
    Marauder: ['Chain Hook', 'Earthshatter', 'Infernal Blow', 'Static Strike', 'Sunder', 'Sweep', 'Volcanic Fissure'],
    Templar: ['Absolution', 'Blazing Salvo', 'Ice Nova', 'Manabond', 'Scorching Ray', 'Searing Bond', 'Static Strike', 'Storm Brand', 'Storm Burst', 'Storm Call', 'Wintertide Brand'],
    Scion: ['Blade Vortex', 'Exsanguinate', 'Ice Nova', 'Rain of Arrows', 'Scorching Ray', 'Spectral Helix', 'Static Strike', 'Storm Burst'],
  },
  vendorRewards: {
    Witch: ['Absolution', 'Arc', 'Blade Vortex', 'Blazing Salvo', 'Bone Offering', 'Creeping Frost', 'Essence Drain', 'Exsanguinate', 'Fire Trap', 'Flame Surge', 'Flesh Offering', 'Ice Nova', 'Ice Spear', 'Icicle Mine', 'Incinerate', 'Kinetic Fusillade', 'Lightning Trap', 'Manabond', 'Power Siphon', 'Scorching Ray', 'Searing Bond', 'Spirit Offering', 'Storm Brand', 'Storm Burst', 'Storm Call', 'Volatile Dead', 'Voltaxic Burst', 'Wintertide Brand'],
    Shadow: ['Arc', 'Barrage', 'Blade Trap', 'Blade Vortex', 'Blazing Salvo', 'Creeping Frost', 'Elemental Hit', 'Essence Drain', 'Exsanguinate', 'Fire Trap', 'Flame Surge', 'Ice Nova', 'Ice Spear', 'Icicle Mine', 'Incinerate', 'Kinetic Fusillade', 'Lacerate', 'Lightning Arrow', 'Lightning Strike', 'Lightning Trap', 'Manabond', 'Poisonous Concoction', 'Power Siphon', 'Rain of Arrows', 'Reave', 'Scorching Ray', 'Siege Ballista', 'Spectral Helix', 'Storm Burst', 'Storm Call', 'Toxic Rain', 'Venom Gyre', 'Volatile Dead', 'Voltaxic Burst', 'Wintertide Brand'],
    Ranger: ['Barrage', 'Blade Trap', 'Blade Vortex', 'Elemental Hit', 'Fire Trap', 'Infernal Blow', 'Lacerate', 'Lightning Arrow', 'Lightning Strike', 'Lightning Trap', 'Poisonous Concoction', 'Rain of Arrows', 'Reave', 'Shattering Steel', 'Siege Ballista', 'Spectral Helix', 'Static Strike', 'Toxic Rain', 'Venom Gyre', 'Volatile Dead'],
    Duelist: ['Barrage', 'Chain Hook', 'Earthshatter', 'Elemental Hit', 'Infernal Blow', 'Lacerate', 'Lightning Arrow', 'Lightning Strike', 'Poisonous Concoction', 'Rain of Arrows', 'Reave', 'Shattering Steel', 'Siege Ballista', 'Spectral Helix', 'Static Strike', 'Sunder', 'Sweep', 'Toxic Rain'],
    Marauder: ['Absolution', 'Chain Hook', 'Earthshatter', 'Exsanguinate', 'Infernal Blow', 'Lacerate', 'Searing Bond', 'Spectral Helix', 'Static Strike', 'Sunder', 'Sweep'],
    Templar: ['Absolution', 'Arc', 'Blazing Salvo', 'Bone Offering', 'Creeping Frost', 'Earthshatter', 'Essence Drain', 'Exsanguinate', 'Flame Surge', 'Flesh Offering', 'Ice Nova', 'Ice Spear', 'Icicle Mine', 'Incinerate', 'Infernal Blow', 'Lacerate', 'Lightning Strike', 'Manabond', 'Scorching Ray', 'Searing Bond', 'Spectral Helix', 'Spirit Offering', 'Static Strike', 'Storm Brand', 'Storm Burst', 'Storm Call', 'Sunder', 'Sweep', 'Volatile Dead', 'Wintertide Brand'],
    Scion: ['Absolution', 'Barrage', 'Blade Trap', 'Blade Vortex', 'Blazing Salvo', 'Bone Offering', 'Chain Hook', 'Creeping Frost', 'Earthshatter', 'Elemental Hit', 'Essence Drain', 'Exsanguinate', 'Fire Trap', 'Flame Surge', 'Flesh Offering', 'Ice Nova', 'Ice Spear', 'Icicle Mine', 'Incinerate', 'Infernal Blow', 'Kinetic Fusillade', 'Lacerate', 'Lightning Strike', 'Lightning Trap', 'Manabond', 'Poisonous Concoction', 'Power Siphon', 'Rain of Arrows', 'Scorching Ray', 'Shattering Steel', 'Siege Ballista', 'Spectral Helix', 'Spirit Offering', 'Static Strike', 'Storm Brand', 'Storm Burst', 'Storm Call', 'Sunder', 'Toxic Rain', 'Venom Gyre', 'Volatile Dead', 'Voltaxic Burst', 'Wintertide Brand'],
  },
};

// =============================================================================
// Act 2
// =============================================================================

// https://www.poewiki.net/wiki/Intruders_in_Black
const INTRUDERS_IN_BLACK: QuestGemTable = {
  questId: 'intruders_in_black',
  questRewards: {
    Witch: ['Arcane Cloak', 'Arctic Armour', 'Cold Snap', 'Desecrate', 'Galvanic Field', 'Herald of Ash', 'Herald of Ice', 'Herald of Thunder', 'Wall of Force'],
    Shadow: ['Arcane Cloak', 'Arctic Armour', "Assassin's Mark", 'Blade Blast', 'Blood Rage', 'Cold Snap', 'Herald of Agony', 'Herald of Ash', 'Herald of Ice', 'Herald of Thunder', 'Summon Skitterbots'],
    Ranger: ['Arctic Armour', 'Blood Rage', 'Ensnaring Arrow', 'Frenzy', 'Herald of Agony', 'Herald of Ash', 'Herald of Ice', 'Herald of Thunder', "Poacher's Mark"],
    Duelist: ['Ancestral Cry', 'Blood Rage', 'Corrupting Fever', 'Defiance Banner', 'Eviscerate', 'Flesh and Stone', 'Frenzy', 'Glacial Shield Swipe', 'Herald of Ash', 'Herald of Ice', 'Herald of Thunder', "Poacher's Mark", 'Seismic Cry', 'Swordstorm', "Warlord's Mark"],
    Marauder: ['Ancestral Cry', 'Corrupting Fever', 'Eviscerate', 'Herald of Ash', 'Herald of Ice', 'Herald of Thunder', 'Molten Shell', 'Seismic Cry', "Warlord's Mark"],
    Templar: ['Arcane Cloak', 'Brand Recall', 'Divine Retribution', 'Herald of Ash', 'Herald of Ice', 'Herald of Purity', 'Herald of Thunder', 'Wave of Conviction'],
    Scion: ['Arctic Armour', 'Corrupting Fever', 'Frenzy', 'Herald of Ash', 'Herald of Ice', 'Herald of Thunder'],
  },
  vendorRewards: {
    Witch: ['Arcane Cloak', 'Arctic Armour', 'Blade Blast', 'Brand Recall', 'Cold Snap', 'Desecrate', 'Divine Retribution', 'Forbidden Rite', 'Galvanic Field', 'Herald of Ash', 'Herald of Ice', 'Herald of Purity', 'Herald of Thunder', 'Righteous Fire', 'Summon Skitterbots', 'Tempest Shield', 'Wall of Force', 'Wave of Conviction'],
    Shadow: ['Arcane Cloak', 'Arctic Armour', "Assassin's Mark", 'Blade Blast', 'Blood Rage', 'Cold Snap', 'Desecrate', 'Ensnaring Arrow', 'Forbidden Rite', 'Frenzy', 'Galvanic Field', 'Herald of Agony', 'Herald of Ash', 'Herald of Ice', 'Herald of Thunder', "Poacher's Mark", 'Summon Skitterbots', 'Tempest Shield', 'Wall of Force', 'Wave of Conviction'],
    Ranger: ['Arctic Armour', "Assassin's Mark", 'Blade Blast', 'Blood Rage', 'Cold Snap', 'Desecrate', 'Ensnaring Arrow', 'Frenzy', 'Glacial Shield Swipe', 'Herald of Agony', 'Herald of Ash', 'Herald of Ice', 'Herald of Thunder', "Poacher's Mark", 'Summon Skitterbots', "Warlord's Mark"],
    Duelist: ['Ancestral Cry', 'Arctic Armour', "Assassin's Mark", 'Blood Rage', 'Corrupting Fever', 'Defiance Banner', 'Ensnaring Arrow', 'Eviscerate', 'Flesh and Stone', 'Frenzy', 'Glacial Shield Swipe', 'Herald of Agony', 'Herald of Ash', 'Herald of Ice', 'Herald of Purity', 'Herald of Thunder', 'Molten Shell', "Poacher's Mark", 'Seismic Cry', 'Swordstorm', 'Tempest Shield', "Warlord's Mark"],
    Marauder: ['Ancestral Cry', 'Blood Rage', 'Brand Recall', 'Corrupting Fever', 'Defiance Banner', 'Eviscerate', 'Flesh and Stone', 'Frenzy', 'Glacial Shield Swipe', 'Herald of Ash', 'Herald of Ice', 'Herald of Purity', 'Herald of Thunder', 'Molten Shell', 'Righteous Fire', 'Seismic Cry', 'Swordstorm', 'Tempest Shield', "Warlord's Mark"],
    Templar: ['Ancestral Cry', 'Arcane Cloak', 'Arctic Armour', 'Blade Blast', 'Brand Recall', 'Cold Snap', 'Corrupting Fever', 'Defiance Banner', 'Desecrate', 'Divine Retribution', 'Eviscerate', 'Galvanic Field', 'Herald of Ash', 'Herald of Ice', 'Herald of Purity', 'Herald of Thunder', 'Molten Shell', 'Righteous Fire', 'Seismic Cry', 'Tempest Shield', 'Wave of Conviction'],
    Scion: ['Ancestral Cry', 'Arcane Cloak', 'Arctic Armour', "Assassin's Mark", 'Blade Blast', 'Blood Rage', 'Brand Recall', 'Cold Snap', 'Corrupting Fever', 'Defiance Banner', 'Desecrate', 'Divine Retribution', 'Ensnaring Arrow', 'Eviscerate', 'Flesh and Stone', 'Forbidden Rite', 'Frenzy', 'Glacial Shield Swipe', 'Herald of Agony', 'Herald of Ash', 'Herald of Ice', 'Herald of Purity', 'Herald of Thunder', 'Molten Shell', "Poacher's Mark", 'Righteous Fire', 'Seismic Cry', 'Summon Skitterbots', 'Swordstorm', 'Tempest Shield', 'Wall of Force', "Warlord's Mark", 'Wave of Conviction'],
  },
};

// https://www.poewiki.net/wiki/Sharp_and_Cruel
const SHARP_AND_CRUEL: QuestGemTable = {
  questId: 'sharp_and_cruel',
  questRewards: {
    Witch: [
      'Concentrated Effect Support', 'Controlled Destruction Support', 'Cruelty Support',
      'Elemental Focus Support', 'Faster Casting Support', 'Fresh Meat Support',
      'Kinetic Instability Support', 'Living Lightning Support', 'Minion Speed Support',
      'Overcharge Support', 'Predator Support', 'Sacred Wisps Support', 'Trinity Support',
    ],
    Shadow: [
      'Deadly Ailments Support', 'Elemental Focus Support', 'Faster Casting Support',
      'Melee Physical Damage Support', 'Nightblade Support',
      'Trap and Mine Damage Support', 'Trinity Support',
    ],
    Ranger: [
      'Close Combat Support', 'Elemental Damage with Attacks Support',
      'Trinity Support', 'Vicious Projectiles Support',
    ],
    Duelist: [
      'Close Combat Support', 'Elemental Damage with Attacks Support',
      'Melee Physical Damage Support', 'Rage Support', 'Sadism Support',
      'Trinity Support', 'Vicious Projectiles Support',
    ],
    Marauder: [
      'Close Combat Support', 'Cruelty Support', 'Elemental Damage with Attacks Support',
      'Melee Physical Damage Support', 'Rage Support', 'Shockwave Support',
      'Volatility Support',
    ],
    Templar: [
      'Concentrated Effect Support', 'Controlled Destruction Support', 'Cruelty Support',
      'Elemental Damage with Attacks Support', 'Elemental Focus Support',
      'Faster Casting Support', 'Melee Physical Damage Support', 'Shockwave Support',
    ],
    Scion: [
      'Concentrated Effect Support', 'Cruelty Support', 'Deadly Ailments Support',
      'Elemental Damage with Attacks Support', 'Faster Casting Support',
      'Melee Physical Damage Support', 'Sadism Support', 'Vicious Projectiles Support',
    ],
  },
  vendorRewards: {
    Witch: ['Cold to Fire Support', 'Concentrated Effect Support', 'Controlled Destruction Support', 'Cruelty Support', 'Culling Strike Support', 'Deadly Ailments Support', 'Elemental Focus Support', 'Faster Casting Support', 'Fresh Meat Support', 'Increased Critical Damage Support', 'Kinetic Instability Support', 'Living Lightning Support', 'Melee Physical Damage Support', 'Minion Life Support', 'Minion Speed Support', 'Overcharge Support', 'Power Charge On Critical Support', 'Predator Support', 'Sacred Wisps Support', 'Sadism Support', 'Trap and Mine Damage Support', 'Trinity Support'],
    Shadow: ['Bloodlust Support', 'Close Combat Support', 'Cold to Fire Support', 'Concentrated Effect Support', 'Controlled Destruction Support', 'Culling Strike Support', 'Deadly Ailments Support', 'Elemental Damage with Attacks Support', 'Elemental Focus Support', 'Faster Casting Support', 'Increased Critical Damage Support', 'Kinetic Instability Support', 'Melee Physical Damage Support', 'Nightblade Support', 'Overcharge Support', 'Physical to Lightning Support', 'Point Blank Support', 'Power Charge On Critical Support', 'Rage Support', 'Sadism Support', 'Trap and Mine Damage Support', 'Trinity Support'],
    Ranger: ['Bloodlust Support', 'Close Combat Support', 'Culling Strike Support', 'Deadly Ailments Support', 'Elemental Damage with Attacks Support', 'Increased Critical Damage Support', 'Iron Grip Support', 'Melee Physical Damage Support', 'Nightblade Support', 'Overcharge Support', 'Physical to Lightning Support', 'Point Blank Support', 'Power Charge On Critical Support', 'Rage Support', 'Sacred Wisps Support', 'Sadism Support', 'Trap and Mine Damage Support', 'Trinity Support', 'Vicious Projectiles Support'],
    Duelist: ['Bloodlust Support', 'Close Combat Support', 'Cruelty Support', 'Culling Strike Support', 'Damage on Full Life Support', 'Deadly Ailments Support', 'Elemental Damage with Attacks Support', 'Endurance Charge on Melee Stun Support', 'Iron Grip Support', 'Iron Will Support', 'Melee Physical Damage Support', 'Physical to Lightning Support', 'Point Blank Support', 'Rage Support', 'Sadism Support', 'Shockwave Support', 'Trinity Support', 'Vicious Projectiles Support', 'Volatility Support'],
    Marauder: ['Bloodlust Support', 'Close Combat Support', 'Cruelty Support', 'Culling Strike Support', 'Damage on Full Life Support', 'Elemental Damage with Attacks Support', 'Endurance Charge on Melee Stun Support', 'Iron Grip Support', 'Iron Will Support', 'Melee Physical Damage Support', 'Physical to Lightning Support', 'Rage Support', 'Sadism Support', 'Shockwave Support', 'Volatility Support'],
    Templar: ['Bloodlust Support', 'Close Combat Support', 'Cold to Fire Support', 'Concentrated Effect Support', 'Controlled Destruction Support', 'Cruelty Support', 'Culling Strike Support', 'Damage on Full Life Support', 'Deadly Ailments Support', 'Elemental Damage with Attacks Support', 'Elemental Focus Support', 'Endurance Charge on Melee Stun Support', 'Faster Casting Support', 'Fresh Meat Support', 'Iron Grip Support', 'Iron Will Support', 'Living Lightning Support', 'Melee Physical Damage Support', 'Minion Life Support', 'Minion Speed Support', 'Overcharge Support', 'Physical to Lightning Support', 'Predator Support', 'Rage Support', 'Sacred Wisps Support', 'Sadism Support', 'Shockwave Support', 'Trap and Mine Damage Support', 'Trinity Support', 'Volatility Support'],
    Scion: ['Bloodlust Support', 'Close Combat Support', 'Cold to Fire Support', 'Concentrated Effect Support', 'Controlled Destruction Support', 'Cruelty Support', 'Culling Strike Support', 'Damage on Full Life Support', 'Deadly Ailments Support', 'Elemental Damage with Attacks Support', 'Elemental Focus Support', 'Endurance Charge on Melee Stun Support', 'Faster Casting Support', 'Fresh Meat Support', 'Increased Critical Damage Support', 'Iron Grip Support', 'Iron Will Support', 'Kinetic Instability Support', 'Living Lightning Support', 'Melee Physical Damage Support', 'Minion Life Support', 'Minion Speed Support', 'Nightblade Support', 'Physical to Lightning Support', 'Point Blank Support', 'Power Charge On Critical Support', 'Predator Support', 'Rage Support', 'Sacred Wisps Support', 'Sadism Support', 'Shockwave Support', 'Trap and Mine Damage Support', 'Trinity Support', 'Vicious Projectiles Support', 'Volatility Support'],
  },
};

// =============================================================================
// Act 3
// =============================================================================

// https://www.poewiki.net/wiki/Lost_in_Love
// Two rewards: Clarissa gives Sewer Keys (quest item) + vendor gems unlock,
// Maramoa gives a gem quest reward.
const LOST_IN_LOVE: QuestGemTable = {
  questId: 'lost_in_love',
  rewardSetId: 'lost_in_love_clarissa',
  rewardSetLabel: 'Clarissa\'s Reward',
  questRewards: {},
  vendorRewards: {
    Witch: ['Automation', 'Bane', 'Conductivity', 'Despair', 'Discipline', 'Elemental Weakness', 'Energy Blade', 'Enfeeble', 'Flammability', 'Frostbite', 'Hatred', 'Malevolence', 'Pride', 'Purity of Elements', 'Purity of Lightning', 'Spellslinger', 'Temporal Chains', 'Wrath', 'Zealotry'],
    Shadow: ["Alchemist's Mark", 'Automation', 'Bane', 'Conductivity', 'Despair', 'Discipline', 'Elemental Weakness', 'Energy Blade', 'Enfeeble', 'Flammability', 'Frostbite', 'Grace', 'Haste', 'Hatred', 'Malevolence', 'Plague Bearer', 'Pride', 'Purity of Elements', 'Purity of Ice', 'Purity of Lightning', 'Spellslinger', 'Temporal Chains', 'Wrath', 'Zealotry'],
    Ranger: ["Alchemist's Mark", 'Anger', 'Automation', 'Despair', 'Dread Banner', 'Frostbite', 'Grace', 'Haste', 'Hatred', 'Plague Bearer', 'Pride', 'Purity of Elements', 'Purity of Ice', 'Temporal Chains', 'Wrath'],
    Duelist: ['Anger', 'Autoexertion', 'Automation', "Battlemage's Cry", 'Determination', 'Dread Banner', "General's Cry", 'Grace', 'Haste', 'Hatred', 'Infernal Cry', 'Petrified Blood', 'Pride', 'Punishment', 'Purity of Elements', 'Purity of Fire', 'Purity of Ice', 'Rallying Cry', 'Vengeful Cry', 'Vulnerability'],
    Marauder: ['Anger', 'Autoexertion', 'Automation', "Battlemage's Cry", 'Determination', 'Dread Banner', 'Flammability', "General's Cry", 'Hatred', 'Infernal Cry', 'Petrified Blood', 'Pride', 'Punishment', 'Purity of Elements', 'Purity of Fire', 'Rallying Cry', 'Vengeful Cry', 'Vulnerability'],
    Templar: ['Anger', 'Autoexertion', 'Automation', 'Bane', "Battlemage's Cry", 'Conductivity', 'Determination', 'Discipline', 'Dread Banner', 'Elemental Weakness', 'Energy Blade', 'Enfeeble', 'Flammability', 'Frostbite', "General's Cry", 'Infernal Cry', 'Malevolence', 'Petrified Blood', 'Pride', 'Punishment', 'Purity of Elements', 'Purity of Fire', 'Purity of Lightning', 'Rallying Cry', 'Spellslinger', 'Vulnerability', 'Wrath', 'Zealotry'],
    Scion: ["Alchemist's Mark", 'Anger', 'Autoexertion', 'Automation', 'Bane', "Battlemage's Cry", 'Conductivity', 'Despair', 'Discipline', 'Dread Banner', 'Elemental Weakness', 'Energy Blade', 'Enfeeble', 'Flammability', 'Frostbite', "General's Cry", 'Haste', 'Hatred', 'Infernal Cry', 'Malevolence', 'Petrified Blood', 'Plague Bearer', 'Pride', 'Punishment', 'Purity of Elements', 'Purity of Fire', 'Purity of Ice', 'Purity of Lightning', 'Rallying Cry', 'Spellslinger', 'Temporal Chains', 'Vengeful Cry', 'Vulnerability', 'Wrath', 'Zealotry'],
  },
};

// Maramoa's gem reward from Lost in Love
const LOST_IN_LOVE_MARAMOA: QuestGemTable = {
  questId: 'lost_in_love',
  rewardSetId: 'lost_in_love_maramoa',
  rewardSetLabel: 'Maramoa\'s Reward',
  questRewards: {
    Witch: ['Bane', 'Conductivity', 'Despair', 'Discipline', 'Elemental Weakness', 'Enfeeble', 'Flammability', 'Frostbite', 'Malevolence', 'Purity of Elements', 'Spellslinger', 'Temporal Chains', 'Zealotry'],
    Shadow: ['Bane', 'Conductivity', 'Despair', 'Elemental Weakness', 'Enfeeble', 'Flammability', 'Frostbite', 'Hatred', 'Malevolence', 'Plague Bearer', 'Temporal Chains', 'Wrath'],
    Ranger: ["Alchemist's Mark", 'Despair', 'Grace', 'Hatred'],
    Duelist: ['Dread Banner', 'Grace', 'Hatred', 'Petrified Blood', 'Pride', 'Rallying Cry'],
    Marauder: ['Anger', 'Determination', "General's Cry", 'Infernal Cry', 'Petrified Blood', 'Pride', 'Punishment', 'Vengeful Cry', 'Vulnerability'],
    Templar: ["Battlemage's Cry", 'Conductivity', 'Elemental Weakness', 'Enfeeble', 'Flammability', 'Frostbite', 'Punishment', 'Vulnerability', 'Zealotry'],
    Scion: ['Anger', 'Bane', 'Conductivity', 'Elemental Weakness', 'Flammability', 'Frostbite', 'Hatred', 'Malevolence', 'Petrified Blood', 'Punishment', 'Temporal Chains', 'Vulnerability', 'Wrath', 'Zealotry'],
  },
  vendorRewards: {},
};

// https://www.poewiki.net/wiki/A_Fixture_of_Fate
// Siosa becomes a gem vendor selling a wide range of gems
const A_FIXTURE_OF_FATE: QuestGemTable = {
  questId: 'a_fixture_of_fate',
  questRewards: {},
  vendorRewards: {},
};

// https://www.poewiki.net/wiki/Sever_the_Right_Hand
const SEVER_THE_RIGHT_HAND: QuestGemTable = {
  questId: 'sever_the_right_hand',
  questRewards: {
    Witch: [
      'Ball Lightning', 'Crackling Lance', 'Cremation', 'Eye of Winter',
      'Firestorm', 'Flameblast', 'Glacial Cascade', 'Hexblast',
      'Kinetic Blast', 'Kinetic Rain', 'Lightning Conduit', 'Raise Spectre',
      'Somatic Shell', 'Soulrend', 'Stormbind', 'Summon Reaper',
    ],
    Shadow: [
      'Ball Lightning', 'Blade Flurry', 'Bladefall', 'Charged Dash',
      'Cremation', 'Flamethrower Trap', 'Hexblast', 'Lightning Spire Trap',
      'Pestilent Strike', 'Pyroclast Mine', 'Seismic Trap', 'Soulrend',
    ],
    Ranger: [
      'Artillery Ballista', 'Blade Flurry', 'Blast Rain', 'Charged Dash',
      'Conflagration', 'Explosive Concoction', 'Scourge Arrow', 'Storm Rain',
      'Thunderstorm', 'Tornado Shot', 'Wild Strike',
    ],
    Duelist: [
      'Bladestorm', 'Blast Rain', 'Charged Dash', 'Cyclone',
      'Ice Crash', 'Lancing Steel', 'Spectral Shield Throw', 'Thunderstorm',
    ],
    Marauder: [
      'Cyclone', 'Earthquake', 'Ice Crash', 'Rage Vortex', 'Tectonic Slam',
    ],
    Templar: [
      'Armageddon Brand', 'Consecrated Path', 'Divine Ire', 'Dominating Blow',
      'Firestorm', 'Flameblast', 'Ice Crash', 'Penance Brand',
      'Shock Nova', 'Shockwave Totem', 'Stormbind',
    ],
    Scion: [
      'Blade Flurry', 'Bladefall', 'Charged Dash', 'Cyclone',
      'Divine Ire', 'Flameblast', 'Hexblast', 'Reap',
      'Soulrend', 'Tectonic Slam', 'Tornado Shot',
    ],
  },
  vendorRewards: {
    Witch: ['Animate Guardian', 'Armageddon Brand', 'Ball Lightning', 'Bladefall', 'Crackling Lance', 'Cremation', 'Dark Pact', 'Discharge', 'Divine Ire', 'Eye of Winter', 'Firestorm', 'Flameblast', 'Flamethrower Trap', 'Glacial Cascade', 'Hexblast', 'Ice Trap', 'Kinetic Blast', 'Kinetic Rain', 'Lightning Conduit', 'Lightning Spire Trap', 'Penance Brand', 'Pyroclast Mine', 'Raise Spectre', 'Reap', 'Seismic Trap', 'Shock Nova', 'Shockwave Totem', 'Somatic Shell', 'Soulrend', 'Stormbind', 'Summon Reaper', 'Vortex', 'Winter Orb'],
    Shadow: ['Animate Guardian', 'Artillery Ballista', 'Ball Lightning', 'Blade Flurry', 'Bladefall', 'Charged Dash', 'Crackling Lance', 'Cremation', 'Dark Pact', 'Discharge', 'Divine Ire', 'Explosive Concoction', 'Eye of Winter', 'Firestorm', 'Flameblast', 'Flamethrower Trap', 'Glacial Cascade', 'Hexblast', 'Ice Crash', 'Ice Trap', 'Kinetic Blast', 'Kinetic Rain', 'Lightning Conduit', 'Lightning Spire Trap', 'Pestilent Strike', 'Pyroclast Mine', 'Reap', 'Scourge Arrow', 'Seismic Trap', 'Shock Nova', 'Somatic Shell', 'Soulrend', 'Storm Rain', 'Stormbind', 'Thunderstorm', 'Tornado Shot', 'Vortex', 'Wild Strike', 'Winter Orb'],
    Ranger: ['Animate Guardian', 'Artillery Ballista', 'Blade Flurry', 'Bladefall', 'Blast Rain', 'Charged Dash', 'Conflagration', 'Cremation', 'Cyclone', 'Discharge', 'Explosive Arrow', 'Explosive Concoction', 'Ice Crash', 'Lancing Steel', 'Pestilent Strike', 'Scourge Arrow', 'Spectral Shield Throw', 'Storm Rain', 'Thunderstorm', 'Tornado Shot', 'Wild Strike'],
    Duelist: ['Animate Guardian', 'Artillery Ballista', 'Blade Flurry', 'Bladestorm', 'Blast Rain', 'Boneshatter', 'Charged Dash', 'Cyclone', 'Discharge', 'Dominating Blow', 'Earthquake', 'Explosive Arrow', 'Explosive Concoction', 'Ice Crash', 'Lancing Steel', 'Rage Vortex', 'Scourge Arrow', 'Spectral Shield Throw', 'Storm Rain', 'Tectonic Slam', 'Thunderstorm', 'Tornado Shot'],
    Marauder: ['Animate Guardian', 'Artillery Ballista', 'Bladestorm', 'Boneshatter', 'Charged Dash', 'Consecrated Path', 'Cyclone', 'Discharge', 'Dominating Blow', 'Earthquake', 'Explosive Arrow', 'Flameblast', 'Ice Crash', 'Rage Vortex', 'Reap', 'Shockwave Totem', 'Spectral Shield Throw', 'Tectonic Slam'],
    Templar: ['Animate Guardian', 'Armageddon Brand', 'Ball Lightning', 'Boneshatter', 'Charged Dash', 'Consecrated Path', 'Crackling Lance', 'Cremation', 'Cyclone', 'Discharge', 'Divine Ire', 'Dominating Blow', 'Earthquake', 'Eye of Winter', 'Firestorm', 'Flameblast', 'Glacial Cascade', 'Hexblast', 'Ice Crash', 'Kinetic Blast', 'Kinetic Rain', 'Lightning Conduit', 'Penance Brand', 'Pyroclast Mine', 'Rage Vortex', 'Raise Spectre', 'Reap', 'Shock Nova', 'Shockwave Totem', 'Somatic Shell', 'Soulrend', 'Spectral Shield Throw', 'Stormbind', 'Summon Reaper', 'Tectonic Slam', 'Vortex', 'Winter Orb'],
    Scion: ['Animate Guardian', 'Armageddon Brand', 'Artillery Ballista', 'Blade Flurry', 'Bladefall', 'Bladestorm', 'Blast Rain', 'Boneshatter', 'Charged Dash', 'Consecrated Path', 'Crackling Lance', 'Cremation', 'Cyclone', 'Dark Pact', 'Discharge', 'Divine Ire', 'Dominating Blow', 'Earthquake', 'Explosive Concoction', 'Eye of Winter', 'Firestorm', 'Flameblast', 'Flamethrower Trap', 'Glacial Cascade', 'Hexblast', 'Ice Crash', 'Ice Trap', 'Kinetic Blast', 'Kinetic Rain', 'Lancing Steel', 'Lightning Spire Trap', 'Penance Brand', 'Pestilent Strike', 'Pyroclast Mine', 'Rage Vortex', 'Raise Spectre', 'Reap', 'Scourge Arrow', 'Seismic Trap', 'Shock Nova', 'Somatic Shell', 'Soulrend', 'Spectral Shield Throw', 'Storm Rain', 'Stormbind', 'Summon Reaper', 'Tectonic Slam', 'Thunderstorm', 'Tornado Shot', 'Vortex', 'Wild Strike', 'Winter Orb'],
  },
};

// =============================================================================
// Act 4
// =============================================================================

// https://www.poewiki.net/wiki/Breaking_the_Seal
const BREAKING_THE_SEAL: QuestGemTable = {
  questId: 'breaking_the_seal',
  questRewards: {
    Witch: [
      'Frost Shield', 'Hydrosphere', 'Sigil of Power',
      'Summon Carrion Golem', 'Summon Chaos Golem', 'Summon Flame Golem',
      'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem',
      'Void Sphere',
    ],
    Shadow: [
      'Ambush', 'Frost Shield',
      'Summon Chaos Golem', 'Summon Flame Golem',
      'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem',
      'Temporal Rift', 'Tornado', 'Void Sphere',
    ],
    Ranger: [
      'Snipe', 'Summon Chaos Golem', 'Summon Flame Golem',
      'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem',
      'Tornado',
    ],
    Duelist: [
      'Summon Chaos Golem', 'Summon Flame Golem',
      'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem',
    ],
    Marauder: [
      'Berserk', 'Summon Chaos Golem', 'Summon Flame Golem',
      'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem',
    ],
    Templar: [
      'Frost Shield', 'Frozen Legion', 'Hydrosphere', 'Sigil of Power',
      'Summon Carrion Golem', 'Summon Chaos Golem', 'Summon Flame Golem',
      'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem',
      'Void Sphere',
    ],
    Scion: [
      'Flame Link', 'Frost Shield', 'Intuitive Link', 'Soul Link',
      'Summon Chaos Golem', 'Summon Flame Golem',
      'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem',
      'Void Sphere',
    ],
  },
  vendorRewards: {
    Witch: ['Destructive Link', 'Frost Shield', 'Hydrosphere', 'Sigil of Power', 'Soul Link', 'Summon Carrion Golem', 'Summon Chaos Golem', 'Summon Flame Golem', 'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem', 'Temporal Rift', 'Void Sphere'],
    Shadow: ['Ambush', 'Destructive Link', 'Frost Shield', 'Hydrosphere', 'Intuitive Link', 'Phase Run', 'Sigil of Power', 'Snipe', 'Soul Link', 'Summon Carrion Golem', 'Summon Chaos Golem', 'Summon Flame Golem', 'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem', 'Temporal Rift', 'Tornado', 'Void Sphere'],
    Ranger: ['Ambush', 'Intuitive Link', 'Phase Run', 'Snipe', 'Summon Carrion Golem', 'Summon Chaos Golem', 'Summon Flame Golem', 'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem', 'Temporal Rift', 'Tornado', 'Vampiric Link'],
    Duelist: ['Ambush', 'Berserk', 'Flame Link', 'Frozen Legion', 'Immortal Call', 'Intuitive Link', 'Phase Run', 'Snipe', 'Summon Chaos Golem', 'Summon Flame Golem', 'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem', 'Vampiric Link'],
    Marauder: ['Berserk', 'Flame Link', 'Frozen Legion', 'Immortal Call', 'Protective Link', 'Summon Chaos Golem', 'Summon Flame Golem', 'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem'],
    Templar: ['Berserk', 'Flame Link', 'Frost Shield', 'Frozen Legion', 'Hydrosphere', 'Immortal Call', 'Protective Link', 'Sigil of Power', 'Soul Link', 'Summon Carrion Golem', 'Summon Chaos Golem', 'Summon Flame Golem', 'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem', 'Void Sphere'],
    Scion: ['Ambush', 'Berserk', 'Destructive Link', 'Flame Link', 'Frost Shield', 'Frozen Legion', 'Hydrosphere', 'Immortal Call', 'Intuitive Link', 'Phase Run', 'Protective Link', 'Sigil of Power', 'Snipe', 'Soul Link', 'Summon Carrion Golem', 'Summon Chaos Golem', 'Summon Flame Golem', 'Summon Ice Golem', 'Summon Lightning Golem', 'Summon Stone Golem', 'Temporal Rift', 'Tornado', 'Vampiric Link', 'Void Sphere'],
  },
};

// https://www.poewiki.net/wiki/The_Eternal_Nightmare
const THE_ETERNAL_NIGHTMARE: QuestGemTable = {
  questId: 'the_eternal_nightmare',
  questRewards: {
    Witch: [
      'Bonechill Support', 'Chain Support', 'Decay Support',
      'Greater Multiple Projectiles Support', 'Hex Bloom Support',
      'Immolate Support', 'Increased Area of Effect Support',
      'Multistrike Support', 'Spell Echo Support', 'Unleash Support',
    ],
    Shadow: [
      'Barrage Support', 'Bonechill Support', 'Chain Support',
      'Cluster Traps Support', 'Greater Multiple Projectiles Support',
      'Greater Volley Support', 'Increased Area of Effect Support',
      'Minefield Support', 'Multistrike Support', 'Returning Projectiles Support',
      'Spell Echo Support', 'Unleash Support', 'Vile Toxins Support',
      'Withering Touch Support',
    ],
    Ranger: [
      'Barrage Support', 'Chain Support', 'Greater Multiple Projectiles Support',
      'Greater Volley Support', 'Increased Area of Effect Support',
      'Multistrike Support', 'Returning Projectiles Support', 'Rupture Support',
      'Spell Echo Support', 'Withering Touch Support',
    ],
    Duelist: [
      'Barrage Support', 'Behead Support', 'Chain Support',
      'Fist of War Support', 'Greater Multiple Projectiles Support',
      'Greater Volley Support', 'Increased Area of Effect Support',
      'Multistrike Support', 'Spell Echo Support', 'Trauma Support',
    ],
    Marauder: [
      'Behead Support', 'Brutality Support', 'Chain Support',
      'Eternal Blessing Support', 'Fist of War Support',
      'Greater Multiple Projectiles Support', 'Increased Area of Effect Support',
      'Multiple Totems Support', 'Multistrike Support', 'Overexertion Support',
      'Spell Echo Support', 'Trauma Support',
    ],
    Templar: [
      'Arcanist Brand', 'Chain Support', 'Fist of War Support',
      'Frigid Bond Support', 'Greater Multiple Projectiles Support',
      'Ignite Proliferation Support', 'Increased Area of Effect Support',
      'Multiple Totems Support', 'Multistrike Support', 'Spell Echo Support',
      'Spellblade Support', 'Unleash Support',
    ],
    Scion: [
      'Barrage Support', 'Chain Support', 'Decay Support',
      'Frigid Bond Support', 'Greater Multiple Projectiles Support',
      'Greater Volley Support', 'Immolate Support',
      'Increased Area of Effect Support', 'Multistrike Support',
      'Returning Projectiles Support', 'Spell Echo Support', 'Unleash Support',
    ],
  },
  vendorRewards: {
    Witch: ['Arcanist Brand', 'Barrage Support', 'Bonechill Support', 'Cast On Critical Strike Support', 'Cast on Death Support', 'Cast on Melee Kill Support', 'Cast when Damage Taken Support', 'Cast when Stunned Support', 'Cast while Channelling Support', 'Chain Support', 'Cluster Traps Support', 'Decay Support', 'Frigid Bond Support', 'Greater Multiple Projectiles Support', 'Greater Volley Support', 'Hex Bloom Support', 'Hextouch Support', 'Ignite Proliferation Support', 'Immolate Support', 'Increased Area of Effect Support', 'Mark On Hit Support', 'Minefield Support', 'Multiple Totems Support', 'Multistrike Support', 'Returning Projectiles Support', 'Spell Echo Support', 'Spellblade Support', 'Unleash Support'],
    Shadow: ['Arcanist Brand', 'Barrage Support', 'Bonechill Support', 'Cast On Critical Strike Support', 'Cast on Death Support', 'Cast on Melee Kill Support', 'Cast when Damage Taken Support', 'Cast when Stunned Support', 'Cast while Channelling Support', 'Chain Support', 'Cluster Traps Support', 'Decay Support', 'Greater Multiple Projectiles Support', 'Greater Volley Support', 'Hex Bloom Support', 'Hextouch Support', 'Increased Area of Effect Support', 'Mark On Hit Support', 'Minefield Support', 'Multiple Totems Support', 'Multistrike Support', 'Returning Projectiles Support', 'Spell Echo Support', 'Spellblade Support', 'Unleash Support', 'Vile Toxins Support', 'Withering Touch Support'],
    Ranger: ['Barrage Support', 'Cast On Critical Strike Support', 'Cast on Death Support', 'Cast on Melee Kill Support', 'Cast when Damage Taken Support', 'Cast when Stunned Support', 'Cast while Channelling Support', 'Chain Support', 'Cluster Traps Support', 'Greater Multiple Projectiles Support', 'Greater Volley Support', 'Hextouch Support', 'Increased Area of Effect Support', 'Mark On Hit Support', 'Multiple Totems Support', 'Multistrike Support', 'Returning Projectiles Support', 'Rupture Support', 'Spell Echo Support', 'Vile Toxins Support', 'Withering Touch Support'],
    Duelist: ['Barrage Support', 'Behead Support', 'Brutality Support', 'Cast On Critical Strike Support', 'Cast on Death Support', 'Cast on Melee Kill Support', 'Cast when Damage Taken Support', 'Cast when Stunned Support', 'Cast while Channelling Support', 'Chain Support', 'Eternal Blessing Support', 'Fist of War Support', 'Greater Multiple Projectiles Support', 'Greater Volley Support', 'Hextouch Support', 'Increased Area of Effect Support', 'Mark On Hit Support', 'Multiple Totems Support', 'Multistrike Support', 'Overexertion Support', 'Returning Projectiles Support', 'Rupture Support', 'Spell Echo Support', 'Trauma Support', 'Withering Touch Support'],
    Marauder: ['Barrage Support', 'Behead Support', 'Brutality Support', 'Cast On Critical Strike Support', 'Cast on Death Support', 'Cast on Melee Kill Support', 'Cast when Damage Taken Support', 'Cast when Stunned Support', 'Cast while Channelling Support', 'Chain Support', 'Eternal Blessing Support', 'Fist of War Support', 'Greater Multiple Projectiles Support', 'Greater Volley Support', 'Hextouch Support', 'Immolate Support', 'Increased Area of Effect Support', 'Mark On Hit Support', 'Multiple Totems Support', 'Multistrike Support', 'Overexertion Support', 'Returning Projectiles Support', 'Rupture Support', 'Spell Echo Support', 'Trauma Support'],
    Templar: ['Arcanist Brand', 'Barrage Support', 'Behead Support', 'Bonechill Support', 'Cast On Critical Strike Support', 'Cast on Death Support', 'Cast on Melee Kill Support', 'Cast when Damage Taken Support', 'Cast when Stunned Support', 'Cast while Channelling Support', 'Chain Support', 'Eternal Blessing Support', 'Fist of War Support', 'Frigid Bond Support', 'Greater Multiple Projectiles Support', 'Greater Volley Support', 'Hextouch Support', 'Ignite Proliferation Support', 'Immolate Support', 'Increased Area of Effect Support', 'Mark On Hit Support', 'Multiple Totems Support', 'Multistrike Support', 'Overexertion Support', 'Returning Projectiles Support', 'Rupture Support', 'Spell Echo Support', 'Spellblade Support', 'Trauma Support', 'Unleash Support'],
    Scion: ['Arcanist Brand', 'Barrage Support', 'Behead Support', 'Bonechill Support', 'Brutality Support', 'Cast On Critical Strike Support', 'Cast on Death Support', 'Cast on Melee Kill Support', 'Cast when Damage Taken Support', 'Cast when Stunned Support', 'Cast while Channelling Support', 'Chain Support', 'Cluster Traps Support', 'Decay Support', 'Eternal Blessing Support', 'Fist of War Support', 'Frigid Bond Support', 'Greater Multiple Projectiles Support', 'Greater Volley Support', 'Hex Bloom Support', 'Hextouch Support', 'Ignite Proliferation Support', 'Immolate Support', 'Increased Area of Effect Support', 'Mark On Hit Support', 'Minefield Support', 'Multiple Totems Support', 'Multistrike Support', 'Overexertion Support', 'Returning Projectiles Support', 'Rupture Support', 'Spell Echo Support', 'Spellblade Support', 'Trauma Support', 'Unleash Support', 'Vile Toxins Support', 'Withering Touch Support'],
  },
};

// =============================================================================
// Exported data
// =============================================================================

export const QUEST_GEM_TABLES: QuestGemTable[] = [
  ENEMY_AT_THE_GATE,
  BREAKING_SOME_EGGS,
  BREAKING_SOME_EGGS_MOVEMENT,
  MERCY_MISSION,
  THE_CAGED_BRUTE,
  THE_CAGED_BRUTE_NESSA,
  THE_SIRENS_CADENCE,
  INTRUDERS_IN_BLACK,
  SHARP_AND_CRUEL,
  LOST_IN_LOVE,
  LOST_IN_LOVE_MARAMOA,
  A_FIXTURE_OF_FATE,
  SEVER_THE_RIGHT_HAND,
  BREAKING_THE_SEAL,
  THE_ETERNAL_NIGHTMARE,
];

export function getQuestGemTable(questId: string): QuestGemTable | undefined {
  return QUEST_GEM_TABLES.find((q) => q.questId === questId);
}
