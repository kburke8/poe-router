'use client';

import { useMemo } from 'react';
import { X, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import gemsData from '@/data/gems.json';
import type { Gem } from '@/types/gem';

const allGems: Gem[] = [
  ...(gemsData.skills as Gem[]),
  ...(gemsData.supports as Gem[]),
];

function findGemColor(name: string): 'red' | 'green' | 'blue' {
  const gem = allGems.find((g) => g.name === name);
  return (gem?.color as 'red' | 'green' | 'blue') ?? 'red';
}

const GEM_COLOR_VARIANT: Record<string, 'red' | 'green' | 'blue'> = {
  red: 'red',
  green: 'green',
  blue: 'blue',
};

interface InventoryPanelProps {
  inventoryGemNames: string[];
  droppedGems: string[];
  gemsInLinkGroups: Set<string>;
  onDrop: (gemName: string) => void;
  onUndrop: (gemName: string) => void;
}

export function InventoryPanel({
  inventoryGemNames,
  droppedGems,
  gemsInLinkGroups,
  onDrop,
  onUndrop,
}: InventoryPanelProps) {
  const sortedGems = useMemo(
    () => [...inventoryGemNames].sort((a, b) => a.localeCompare(b)),
    [inventoryGemNames],
  );

  const unslotted = sortedGems.filter((name) => !gemsInLinkGroups.has(name));
  const slotted = sortedGems.filter((name) => gemsInLinkGroups.has(name));

  return (
    <div>
      <h4 className="text-sm font-medium text-poe-text mb-2">
        Inventory ({inventoryGemNames.length})
      </h4>
      <div className="rounded-md border border-poe-border/50 bg-poe-bg/30 p-2 space-y-2">
        {/* Unslotted gems - can be dropped */}
        {unslotted.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {unslotted.map((name) => (
              <span key={name} className="inline-flex items-center gap-0.5">
                <Badge variant={GEM_COLOR_VARIANT[findGemColor(name)] ?? 'default'} className="pr-1">
                  <span className="mr-1">{name}</span>
                  <button
                    type="button"
                    onClick={() => onDrop(name)}
                    className="inline-flex items-center justify-center rounded hover:bg-white/10 transition-colors cursor-pointer p-0.5"
                    title={`Drop ${name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </span>
            ))}
          </div>
        )}

        {/* Slotted gems - shown dimmed */}
        {slotted.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {slotted.map((name) => (
              <Badge
                key={name}
                variant={GEM_COLOR_VARIANT[findGemColor(name)] ?? 'default'}
                className="opacity-50"
                title="In use (link group)"
              >
                {name}
              </Badge>
            ))}
          </div>
        )}

        {sortedGems.length === 0 && (
          <span className="text-xs text-poe-muted">No gems in inventory</span>
        )}

        {/* Dropped gems */}
        {droppedGems.length > 0 && (
          <div>
            <span className="text-[11px] text-poe-muted uppercase tracking-wider">Dropped</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {droppedGems.map((name) => (
                <span key={name} className="inline-flex items-center gap-0.5">
                  <Badge variant="default" className="opacity-50 line-through pr-1">
                    <span className="mr-1">{name}</span>
                    <button
                      type="button"
                      onClick={() => onUndrop(name)}
                      className="inline-flex items-center justify-center rounded hover:bg-white/10 transition-colors cursor-pointer p-0.5"
                      title={`Restore ${name}`}
                    >
                      <Undo2 className="h-3 w-3" />
                    </button>
                  </Badge>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
