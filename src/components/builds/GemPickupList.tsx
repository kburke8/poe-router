'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GemPickerDialog } from '@/components/builds/GemPickerDialog';
import { getRewardPickersAtStop } from '@/lib/gem-availability';
import { getBeachGems } from '@/data/classes';
import gemsData from '@/data/gems.json';
import type { Gem } from '@/types/gem';
import type { GemPickup } from '@/types/build';

const allGems: Gem[] = [
  ...(gemsData.skills as Gem[]),
  ...(gemsData.supports as Gem[]),
];

function findGemColor(name: string): 'red' | 'green' | 'blue' {
  const gem = allGems.find((g) => g.name === name);
  return (gem?.color as 'red' | 'green' | 'blue') ?? 'red';
}

const FIRST_STOP_ID = 'a1_after_hillock';

interface GemPickupListProps {
  pickups: GemPickup[];
  stopId: string;
  className: string;
  disabledStopIds?: Set<string>;
  isCustomStop?: boolean;
  showQuestRewards?: boolean;
  onAdd: (pickup: GemPickup) => void;
  onRemove: (pickupId: string) => void;
}

const GEM_COLOR_VARIANT: Record<string, 'red' | 'green' | 'blue'> = {
  red: 'red',
  green: 'green',
  blue: 'blue',
};

export function GemPickupList({ pickups, stopId, className, disabledStopIds, isCustomStop, showQuestRewards = true, onAdd, onRemove }: GemPickupListProps) {
  const [openRewardSetId, setOpenRewardSetId] = useState<string | null>(null);
  const [vendorPickerOpen, setVendorPickerOpen] = useState(false);

  const rewardPickers = useMemo(() => getRewardPickersAtStop(stopId, className, disabledStopIds), [stopId, className, disabledStopIds]);

  const vendorPickups = pickups.filter((p) => p.source === 'vendor');

  function renderGemBadges(items: GemPickup[]) {
    if (items.length === 0) return null;
    return items.map((pickup) => (
      <span key={pickup.id} className="inline-flex items-center gap-1">
        <Badge variant={GEM_COLOR_VARIANT[pickup.gemColor] ?? 'default'}>
          {pickup.gemName}
        </Badge>
        <button
          type="button"
          onClick={() => onRemove(pickup.id)}
          className="text-poe-muted hover:text-poe-red text-xs leading-none"
          title="Remove"
        >
          x
        </button>
      </span>
    ));
  }

  function handleAdd(source: 'quest_reward' | 'vendor', rewardSetId?: string) {
    return (gem: { name: string; color: string }) => {
      onAdd({
        id: crypto.randomUUID(),
        gemName: gem.name,
        gemColor: gem.color as 'red' | 'green' | 'blue',
        source,
        rewardSetId,
      });
    };
  }

  const beachGems = !isCustomStop && stopId === FIRST_STOP_ID ? getBeachGems(className) : null;

  return (
    <div className="space-y-3">
      {/* Beach Gems (Twilight Strand starting gems) */}
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

      {/* Quest Rewards - one section per reward set */}
      {showQuestRewards && (rewardPickers.length > 0 ? (
        rewardPickers.map((picker) => {
          const pickerPickups = pickups.filter((p) => p.source === 'quest_reward' && p.rewardSetId === picker.rewardSetId);
          return (
            <div key={picker.rewardSetId}>
              <div className="flex items-center gap-2 mb-1.5">
                <h5 className="text-xs font-medium text-poe-gold">{picker.label}</h5>
                <Button variant="secondary" size="sm" onClick={() => setOpenRewardSetId(picker.rewardSetId)}>
                  + Pick Up
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pickerPickups.length === 0 && (
                  <span className="text-xs text-poe-muted">None</span>
                )}
                {renderGemBadges(pickerPickups)}
              </div>
            </div>
          );
        })
      ) : (
        <div>
          <h5 className="text-xs font-medium text-poe-muted mb-1.5">No quest rewards</h5>
        </div>
      ))}

      {/* Vendor Buys */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <h5 className="text-xs font-medium text-poe-gold">Buy from Vendor</h5>
          <Button variant="secondary" size="sm" onClick={() => setVendorPickerOpen(true)}>
            + Buy
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {vendorPickups.length === 0 && (
            <span className="text-xs text-poe-muted">None</span>
          )}
          {renderGemBadges(vendorPickups)}
        </div>
      </div>

      {/* Per-reward-set picker dialogs */}
      {showQuestRewards && rewardPickers.map((picker) => (
        <GemPickerDialog
          key={picker.rewardSetId}
          open={openRewardSetId === picker.rewardSetId}
          onOpenChange={(o) => { if (!o) setOpenRewardSetId(null); }}
          stopId={stopId}
          className={className}
          mode="quest_reward"
          rewardSetId={picker.rewardSetId}
          disabledStopIds={disabledStopIds}
          onSelect={(gem, source) => handleAdd(source, picker.rewardSetId)(gem)}
        />
      ))}
      <GemPickerDialog
        open={vendorPickerOpen}
        onOpenChange={setVendorPickerOpen}
        stopId={stopId}
        className={className}
        mode="vendor"
        disabledStopIds={disabledStopIds}
        onSelect={(gem, source) => handleAdd(source)(gem)}
      />
    </div>
  );
}
