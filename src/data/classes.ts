export interface BeachGems {
  skillGem: string;
  supportGem: string;
}

export interface ClassInfo {
  name: string;
  ascendancies: string[];
  beachGems: BeachGems;
}

export const POE_CLASSES: ClassInfo[] = [
  { name: 'Marauder', ascendancies: ['Juggernaut', 'Berserker', 'Chieftain'], beachGems: { skillGem: 'Heavy Strike', supportGem: 'Ruthless Support' } },
  { name: 'Ranger', ascendancies: ['Deadeye', 'Raider', 'Pathfinder'], beachGems: { skillGem: 'Burning Arrow', supportGem: 'Momentum Support' } },
  { name: 'Witch', ascendancies: ['Necromancer', 'Elementalist', 'Occultist'], beachGems: { skillGem: 'Fireball', supportGem: 'Arcane Surge Support' } },
  { name: 'Duelist', ascendancies: ['Slayer', 'Gladiator', 'Champion'], beachGems: { skillGem: 'Double Strike', supportGem: 'Chance to Bleed Support' } },
  { name: 'Templar', ascendancies: ['Inquisitor', 'Hierophant', 'Guardian'], beachGems: { skillGem: 'Glacial Hammer', supportGem: 'Elemental Proliferation Support' } },
  { name: 'Shadow', ascendancies: ['Assassin', 'Trickster', 'Saboteur'], beachGems: { skillGem: 'Viper Strike', supportGem: 'Chance to Poison Support' } },
  { name: 'Scion', ascendancies: ['Ascendant'], beachGems: { skillGem: 'Spectral Throw', supportGem: 'Prismatic Burst Support' } },
];

export function getAscendancies(className: string): string[] {
  return POE_CLASSES.find(c => c.name === className)?.ascendancies ?? [];
}

export function getBeachGems(className: string): BeachGems | null {
  return POE_CLASSES.find(c => c.name === className)?.beachGems ?? null;
}
