'use client';

import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { getQuestRewardsAtStop, getVendorGemsAtStop, type AvailableGem } from '@/lib/gem-availability';
import { QUEST_GEM_TABLES } from '@/data/gem-rewards';
import { getQuestById } from '@/data/town-stops';
import type { Gem } from '@/types/gem';
import gemsData from '@/data/gems.json';

interface GemPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stopId: string;
  className: string;
  mode: 'quest_reward' | 'vendor';
  rewardSetId?: string;
  disabledStopIds?: Set<string>;
  onSelect: (gem: Gem, source: 'quest_reward' | 'vendor') => void;
}

const GEM_COLOR_CLASSES: Record<string, string> = {
  red: 'text-poe-red',
  green: 'text-poe-green',
  blue: 'text-poe-blue',
};

function getAllGems(): Gem[] {
  const gems: Gem[] = [];
  if (gemsData.skills) {
    for (const g of gemsData.skills) gems.push(g as Gem);
  }
  if (gemsData.supports) {
    for (const g of gemsData.supports) gems.push(g as Gem);
  }
  return gems;
}

export function GemPickerDialog({ open, onOpenChange, stopId, className, mode, rewardSetId, disabledStopIds, onSelect }: GemPickerDialogProps) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const allGems = useMemo(() => getAllGems(), []);

  const availableGems = useMemo(() => {
    if (mode === 'quest_reward') {
      return getQuestRewardsAtStop(stopId, className, rewardSetId, disabledStopIds);
    }
    return getVendorGemsAtStop(stopId, className, disabledStopIds);
  }, [stopId, className, mode, rewardSetId, disabledStopIds]);

  const availableMap = useMemo(() => {
    const map = new Map<string, AvailableGem>();
    for (const ag of availableGems) {
      map.set(ag.gem.name, ag);
    }
    return map;
  }, [availableGems]);

  // Display list: available gems, plus optionally all gems (vendor mode only)
  const displayGems = useMemo(() => {
    if (mode === 'vendor' && showAll) return allGems;
    return availableGems.map((ag) => ag.gem);
  }, [showAll, allGems, availableGems, mode]);

  const fuse = useMemo(
    () =>
      new Fuse(displayGems, {
        keys: ['name', 'tags'],
        threshold: 0.3,
        includeScore: true,
      }),
    [displayGems],
  );

  const dialogTitle = useMemo(() => {
    if (mode !== 'quest_reward' || !rewardSetId) return mode === 'quest_reward' ? 'Quest Rewards' : 'Buy from Vendor';
    const table = QUEST_GEM_TABLES.find(t => (t.rewardSetId ?? t.questId) === rewardSetId);
    if (table?.rewardSetLabel) return table.rewardSetLabel;
    const quest = getQuestById(table?.questId ?? rewardSetId);
    return quest?.name ?? 'Quest Rewards';
  }, [mode, rewardSetId]);

  const results = useMemo(() => {
    if (!query.trim()) {
      // Sort: new gems first, then alphabetical
      const sorted = [...displayGems].sort((a, b) => {
        const aNew = availableMap.get(a.name)?.isNewAtThisStop ?? false;
        const bNew = availableMap.get(b.name)?.isNewAtThisStop ?? false;
        if (aNew && !bNew) return -1;
        if (!aNew && bNew) return 1;
        return a.name.localeCompare(b.name);
      });
      return sorted.slice(0, 60);
    }
    return fuse.search(query, { limit: 60 }).map((r) => r.item);
  }, [query, fuse, displayGems, availableMap]);

  function handleSelect(gem: Gem) {
    onSelect(gem, mode);
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
              {dialogTitle}
            </Dialog.Title>
            <Dialog.Close className="text-poe-muted hover:text-poe-text">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="px-4 pt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-poe-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or tag..."
                className="pl-9"
                autoFocus
              />
            </div>
            {mode === 'vendor' && (
              <label className="flex items-center gap-2 text-xs text-poe-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="h-3 w-3 rounded border-poe-border accent-poe-gold"
                />
                Show all gems (including unavailable)
              </label>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto px-2 py-2">
            {results.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-poe-muted">
                No gems found
              </p>
            )}
            {results.map((gem) => {
              const available = availableMap.get(gem.name);
              const isAvailable = !!available;
              const isNew = available?.isNewAtThisStop ?? false;

              return (
                <button
                  key={gem.id}
                  onClick={() => handleSelect(gem)}
                  disabled={showAll && !isAvailable}
                  className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm transition-colors ${
                    showAll && !isAvailable
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-poe-border/50'
                  }`}
                >
                  <span className={GEM_COLOR_CLASSES[gem.color] ?? 'text-poe-text'}>
                    {gem.name}
                  </span>
                  {isNew && (
                    <Badge variant="gold" className="text-[9px] px-1 py-0">
                      NEW
                    </Badge>
                  )}
                  <span className="ml-auto">
                    <span className="rounded bg-poe-border/60 px-1.5 py-0.5 text-[10px] uppercase text-poe-muted">
                      {gem.type}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
