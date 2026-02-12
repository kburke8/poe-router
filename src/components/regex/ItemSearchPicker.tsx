'use client';

import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { abbreviate } from '@/lib/regex/abbreviator';
import type { Item, ItemCategory } from '@/types/gem';
import itemsData from '@/data/items.json';

interface ItemSearchPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: Item, pattern: string) => void;
  allNames: string[];
  initialCategory?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  axes: 'Axes',
  bows: 'Bows',
  claws: 'Claws',
  daggers: 'Daggers',
  maces: 'Maces',
  sceptres: 'Sceptres',
  staves: 'Staves',
  swords: 'Swords',
  wands: 'Wands',
  fishing_rods: 'Fishing Rods',
  body_armour: 'Body Armour',
  helmets: 'Helmets',
  gloves: 'Gloves',
  boots: 'Boots',
  shields: 'Shields',
  amulets: 'Amulets',
  rings: 'Rings',
  belts: 'Belts',
  quivers: 'Quivers',
  flasks: 'Flasks',
  jewels: 'Jewels',
  gambas: 'Gambler Items',
};

function getAllItems(): Item[] {
  const items: Item[] = [];
  const data = itemsData as Record<string, Item[]>;
  for (const category of Object.keys(data)) {
    if (Array.isArray(data[category])) {
      for (const item of data[category]) {
        items.push(item as Item);
      }
    }
  }
  return items;
}

function getCategories(): string[] {
  const data = itemsData as Record<string, Item[]>;
  return Object.keys(data).filter((k) => Array.isArray(data[k]));
}

export function ItemSearchPicker({ open, onOpenChange, onSelect, allNames, initialCategory }: ItemSearchPickerProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory ?? 'all');

  const allItems = useMemo(() => getAllItems(), []);
  const categories = useMemo(() => getCategories(), []);

  const filteredByCategory = useMemo(() => {
    if (selectedCategory === 'all') return allItems;
    return allItems.filter((item) => item.category === selectedCategory);
  }, [allItems, selectedCategory]);

  const fuse = useMemo(
    () =>
      new Fuse(filteredByCategory, {
        keys: ['name'],
        threshold: 0.3,
        includeScore: true,
      }),
    [filteredByCategory],
  );

  const results = useMemo(() => {
    if (!query.trim()) return filteredByCategory.slice(0, 50);
    return fuse.search(query, { limit: 50 }).map((r) => r.item);
  }, [query, fuse, filteredByCategory]);

  function handleSelect(item: Item) {
    const pattern = abbreviate(item.name, allNames);
    onSelect(item, pattern);
    setQuery('');
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-poe-border bg-poe-card p-0 shadow-xl focus:outline-none">
          <div className="flex items-center justify-between border-b border-poe-border px-4 py-3">
            <Dialog.Title className="text-sm font-semibold text-poe-gold">
              Search Items
            </Dialog.Title>
            <Dialog.Close className="text-poe-muted hover:text-poe-text">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="space-y-2 px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-poe-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items..."
                className="pl-9"
                autoFocus
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-poe-border bg-poe-input px-3 py-1.5 text-xs text-poe-text focus:border-poe-gold focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-72 overflow-y-auto px-2 py-2">
            {results.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-poe-muted">
                No items found
              </p>
            )}
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm transition-colors hover:bg-poe-border/50"
              >
                <span className="text-poe-text">{item.name}</span>
                <span className="ml-auto rounded bg-poe-border/60 px-1.5 py-0.5 text-[10px] uppercase text-poe-muted">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </span>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
