'use client';

import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GemPickerDialog } from '@/components/builds/GemPickerDialog';
import { getRewardPickersAtStop, getQuestRewardsAtStop } from '@/lib/gem-availability';
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

export type PickupMode = 'quest_reward' | 'vendor' | 'skip';

interface GemPickupListProps {
  pickups: GemPickup[];
  stopId: string;
  className: string;
  disabledStopIds?: Set<string>;
  isCustomStop?: boolean;
  showQuestRewards?: boolean;
  onAdd: (pickup: GemPickup) => void;
  onRemove: (pickupId: string) => void;
  /** Wire to useBuildStore.setGemPickupMode. When omitted, the segmented control is hidden. */
  onSetMode?: (pickupId: string, mode: PickupMode) => void;
}

const GEM_COLOR_VARIANT: Record<string, 'red' | 'green' | 'blue'> = {
  red: 'red',
  green: 'green',
  blue: 'blue',
};

const DOT_BG: Record<string, string> = {
  red: 'bg-poe-red',
  green: 'bg-poe-green',
  blue: 'bg-poe-blue',
};

function ModeSegment({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? 'Not offered as a quest reward at this stop' : undefined}
      className={clsx(
        'px-2 py-0.5 rounded-[5px] text-[10.5px] font-semibold transition-colors cursor-pointer',
        active
          ? 'bg-poe-gold text-poe-gold-ink'
          : disabled
            ? 'text-poe-faint/50 cursor-not-allowed'
            : 'text-poe-muted hover:text-poe-text',
      )}
    >
      {label}
    </button>
  );
}

export function GemPickupList({
  pickups,
  stopId,
  className,
  disabledStopIds,
  isCustomStop,
  showQuestRewards = true,
  onAdd,
  onRemove,
  onSetMode,
}: GemPickupListProps) {
  const [openRewardSetId, setOpenRewardSetId] = useState<string | null>(null);
  const [vendorPickerOpen, setVendorPickerOpen] = useState(false);

  const rewardPickers = useMemo(
    () => getRewardPickersAtStop(stopId, className, disabledStopIds),
    [stopId, className, disabledStopIds],
  );

  /** Gems actually offered as a quest reward at this stop (for enabling "Pick up"). */
  const questRewardGemNames = useMemo(() => {
    const names = new Set<string>();
    for (const ag of getQuestRewardsAtStop(stopId, className, undefined, disabledStopIds)) {
      names.add(ag.gem.name);
    }
    return names;
  }, [stopId, className, disabledStopIds]);

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
    <div className="space-y-2.5">
      {/* Beach Gems (Twilight Strand starting gems) */}
      {beachGems && (
        <div>
          <h5 className="font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint mb-1.5">
            Beach (Twilight Strand)
          </h5>
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

      {/* Pickup rows with Pick up / Buy / Skip segmented control */}
      {pickups.length === 0 && (
        <p className="text-xs text-poe-faint">No gems planned at this stop.</p>
      )}
      {pickups.map((pickup) => {
        const skipped = pickup.skipped === true;
        const canQuest =
          pickup.rewardSetId != null || questRewardGemNames.has(pickup.gemName);
        return (
          <div key={pickup.id} className="flex items-center gap-2.5">
            <span
              className={clsx(
                'h-[9px] w-[9px] rounded-full shrink-0',
                DOT_BG[pickup.gemColor] ?? 'bg-poe-red',
                skipped && 'opacity-40',
              )}
            />
            <span
              className={clsx(
                'flex-1 min-w-0 truncate text-sm font-semibold',
                skipped ? 'text-poe-faint line-through' : 'text-poe-bright',
              )}
              title={pickup.gemName}
            >
              {pickup.gemName}
            </span>
            {onSetMode ? (
              <div className="flex shrink-0 rounded-[7px] border border-white/10 bg-poe-bg p-0.5" data-tour="pickup-mode">
                <ModeSegment
                  label="Pick up"
                  active={!skipped && pickup.source === 'quest_reward'}
                  disabled={!canQuest}
                  onClick={() => onSetMode(pickup.id, 'quest_reward')}
                />
                <ModeSegment
                  label="Buy"
                  active={!skipped && pickup.source === 'vendor'}
                  onClick={() => onSetMode(pickup.id, 'vendor')}
                />
                <ModeSegment
                  label="Skip"
                  active={skipped}
                  onClick={() => onSetMode(pickup.id, 'skip')}
                />
              </div>
            ) : (
              <span className="text-[10px] font-mono uppercase tracking-wider text-poe-faint shrink-0">
                {pickup.source === 'quest_reward' ? 'quest' : 'vendor'}
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(pickup.id)}
              className="shrink-0 text-poe-faint hover:text-poe-red transition-colors cursor-pointer"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {/* Add flows: one per quest reward set, plus vendor */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
        {showQuestRewards &&
          rewardPickers.map((picker) => (
            <button
              key={picker.rewardSetId}
              type="button"
              onClick={() => setOpenRewardSetId(picker.rewardSetId)}
              className="text-xs font-semibold text-poe-gold hover:text-poe-gold/75 transition-colors cursor-pointer"
            >
              + {picker.label}
            </button>
          ))}
        <button
          type="button"
          onClick={() => setVendorPickerOpen(true)}
          className="text-xs font-semibold text-poe-gold hover:text-poe-gold/75 transition-colors cursor-pointer"
        >
          + Buy from vendor
        </button>
      </div>

      {/* Per-reward-set picker dialogs */}
      {showQuestRewards &&
        rewardPickers.map((picker) => (
          <GemPickerDialog
            key={picker.rewardSetId}
            open={openRewardSetId === picker.rewardSetId}
            onOpenChange={(o) => {
              if (!o) setOpenRewardSetId(null);
            }}
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
