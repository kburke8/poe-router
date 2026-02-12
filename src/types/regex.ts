export interface RegexEntry {
  id: string;
  pattern: string;
  sourceId?: string;
  sourceName?: string;
  isExclusion: boolean;
  enabled: boolean;
  isCustom: boolean;
  linkSize?: number;
}

export type RegexCategoryId = 'gems' | 'links' | 'stats' | 'items' | 'item_gambas' | 'dont_ever_show';

export interface RegexCategory {
  id: RegexCategoryId;
  label: string;
  entries: RegexEntry[];
}

export interface RegexPreset {
  id: string;
  name: string;
  categories: RegexCategory[];
  customRegex?: string;
  useCustomRegex?: boolean;
  strictLinks?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES: RegexCategory[] = [
  { id: 'gems', label: 'Gems', entries: [] },
  { id: 'links', label: 'Links', entries: [] },
  { id: 'stats', label: 'Stats', entries: [
    { id: 'default-ms', pattern: 'unner|rint', sourceName: 'Movement Speed', isExclusion: false, enabled: true, isCustom: true },
  ] },
  { id: 'items', label: 'Items', entries: [] },
  { id: 'item_gambas', label: 'Item Gambas', entries: [] },
  { id: 'dont_ever_show', label: "Don't Ever Show", entries: [] },
];
