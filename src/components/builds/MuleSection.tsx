'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GemPickerDialog } from '@/components/builds/GemPickerDialog';
import { POE_CLASSES, getBeachGems } from '@/data/classes';
import gemsData from '@/data/gems.json';
import type { Gem } from '@/types/gem';
import type { MulePickup } from '@/types/build';

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

interface MuleSectionProps {
  muleClassName: string;
  mulePickups: MulePickup[];
  onUpdateMuleClass: (className: string) => void;
  onAddPickup: (pickup: MulePickup) => void;
  onRemovePickup: (pickupId: string) => void;
}

export function MuleSection({
  muleClassName,
  mulePickups,
  onUpdateMuleClass,
  onAddPickup,
  onRemovePickup,
}: MuleSectionProps) {
  const [questPickerOpen, setQuestPickerOpen] = useState(false);

  const beachGems = useMemo(
    () => (muleClassName ? getBeachGems(muleClassName) : null),
    [muleClassName],
  );

  const questPickups = mulePickups.filter((p) => p.source === 'quest_reward');

  return (
    <div className="rounded-lg border border-poe-border bg-poe-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-bold text-poe-gold">Mule</h3>
        <select
          value={muleClassName}
          onChange={(e) => onUpdateMuleClass(e.target.value)}
          className="rounded-md border border-poe-border bg-poe-input px-3 py-1.5 text-sm text-poe-text focus:border-poe-gold focus:outline-none focus:ring-1 focus:ring-poe-gold/50"
        >
          <option value="">No Mule</option>
          {POE_CLASSES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {muleClassName && (
        <div className="space-y-3">
          {/* Beach gems */}
          {beachGems && (
            <div>
              <h5 className="text-xs font-medium text-poe-gold mb-1.5">Beach (Twilight Strand)</h5>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={GEM_COLOR_VARIANT[findGemColor(beachGems.skillGem)] ?? 'default'}>
                  {beachGems.skillGem}
                </Badge>
                <Badge variant={GEM_COLOR_VARIANT[findGemColor(beachGems.supportGem)] ?? 'default'}>
                  {beachGems.supportGem}
                </Badge>
              </div>
            </div>
          )}

          {/* Enemy at the Gate quest reward */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h5 className="text-xs font-medium text-poe-gold">Enemy at the Gate</h5>
              <Button variant="secondary" size="sm" onClick={() => setQuestPickerOpen(true)}>
                + Pick Up
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {questPickups.length === 0 && (
                <span className="text-xs text-poe-muted">None</span>
              )}
              {questPickups.map((pickup) => (
                <span key={pickup.id} className="inline-flex items-center gap-1">
                  <Badge variant={GEM_COLOR_VARIANT[pickup.gemColor] ?? 'default'}>
                    {pickup.gemName}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => onRemovePickup(pickup.id)}
                    className="text-poe-muted hover:text-poe-red text-xs leading-none"
                    title="Remove"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          </div>

          <GemPickerDialog
            open={questPickerOpen}
            onOpenChange={setQuestPickerOpen}
            stopId="a1_after_hillock"
            className={muleClassName}
            mode="quest_reward"
            rewardSetId="enemy_at_the_gate"
            onSelect={(gem) => {
              onAddPickup({
                id: crypto.randomUUID(),
                gemName: gem.name,
                gemColor: gem.color as 'red' | 'green' | 'blue',
                source: 'quest_reward',
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
