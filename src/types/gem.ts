export type GemColor = 'red' | 'green' | 'blue';
export type GemType = 'skill' | 'support';

export interface Gem {
  id: string;
  name: string;
  color: GemColor;
  type: GemType;
  tags: string[];
  abbreviation?: string;
}

export type ItemCategory =
  | 'axes' | 'bows' | 'claws' | 'daggers' | 'maces' | 'sceptres'
  | 'staves' | 'swords' | 'wands' | 'fishing_rods'
  | 'body_armour' | 'helmets' | 'gloves' | 'boots' | 'shields'
  | 'amulets' | 'rings' | 'belts' | 'quivers'
  | 'flasks' | 'jewels' | 'gambas';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  abbreviation?: string;
  isCustom?: boolean;
}

export interface GemDatabase {
  skills: Gem[];
  supports: Gem[];
}

export interface ItemDatabase {
  [category: string]: Item[];
}
