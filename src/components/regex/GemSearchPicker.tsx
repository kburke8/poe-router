'use client';

import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { abbreviate } from '@/lib/regex/abbreviator';
import type { Gem } from '@/types/gem';
import gemsData from '@/data/gems.json';

interface GemSearchPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (gem: Gem, pattern: string) => void;
  allNames: string[];
}

const GEM_COLOR_CLASSES: Record<string, string> = {
  red: 'text-poe-red',
  green: 'text-poe-green',
  blue: 'text-poe-blue',
};

function getAllGems(): Gem[] {
  const gems: Gem[] = [];
  if (gemsData.skills) {
    for (const g of gemsData.skills) {
      gems.push(g as Gem);
    }
  }
  if (gemsData.supports) {
    for (const g of gemsData.supports) {
      gems.push(g as Gem);
    }
  }
  return gems;
}

export function GemSearchPicker({ open, onOpenChange, onSelect, allNames }: GemSearchPickerProps) {
  const [query, setQuery] = useState('');

  const allGems = useMemo(() => getAllGems(), []);

  const fuse = useMemo(
    () =>
      new Fuse(allGems, {
        keys: ['name', 'tags'],
        threshold: 0.3,
        includeScore: true,
      }),
    [allGems],
  );

  const results = useMemo(() => {
    if (!query.trim()) return allGems.slice(0, 50);
    return fuse.search(query, { limit: 50 }).map((r) => r.item);
  }, [query, fuse, allGems]);

  function handleSelect(gem: Gem) {
    const pattern = abbreviate(gem.name, allNames);
    onSelect(gem, pattern);
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
              Search Gems
            </Dialog.Title>
            <Dialog.Close className="text-poe-muted hover:text-poe-text">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="relative px-4 pt-3">
            <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-poe-muted mt-1.5" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or tag..."
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto px-2 py-2">
            {results.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-poe-muted">
                No gems found
              </p>
            )}
            {results.map((gem) => (
              <button
                key={gem.id}
                onClick={() => handleSelect(gem)}
                className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm transition-colors hover:bg-poe-border/50"
              >
                <span className={GEM_COLOR_CLASSES[gem.color] ?? 'text-poe-text'}>
                  {gem.name}
                </span>
                <span className="ml-auto rounded bg-poe-border/60 px-1.5 py-0.5 text-[10px] uppercase text-poe-muted">
                  {gem.type}
                </span>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
