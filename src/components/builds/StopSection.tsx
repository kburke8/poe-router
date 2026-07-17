'use client';

import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { GemPickupList, type PickupMode } from '@/components/builds/GemPickupList';
import { PhaseEditor } from '@/components/builds/PhaseEditor';
import { InheritedLinkGroupCard } from '@/components/builds/InheritedLinkGroupCard';
import type { StopPlan, GemPickup, LinkGroupPhase } from '@/types/build';
import type { ResolvedLinkGroup } from '@/lib/link-group-resolver';
import { getPreviousPhase } from '@/lib/link-group-resolver';
import { TOWN_STOPS, GEM_QUESTS, type TownStop, type GemQuest } from '@/data/town-stops';
import { getExcludedQuests } from '@/lib/gem-availability';
import { summarizeVendorCosts } from '@/lib/gem-costs';
import { CurrencyBadge } from '@/components/ui/CurrencyBadge';
import { InventoryPanel } from '@/components/builds/InventoryPanel';

interface StopSectionProps {
  stopPlan: StopPlan;
  townStop: TownStop;
  buildId: string;
  className: string;
  inventoryGemNames: string[];
  inventoryOnly?: boolean;
  resolvedLinkGroups: ResolvedLinkGroup[];
  disabledStopIds?: Set<string>;
  isCustomStop?: boolean;
  showQuestRewards?: boolean;
  onToggleEnabled: () => void;
  onAddGemPickup: (pickup: GemPickup) => void;
  onRemoveGemPickup: (pickupId: string) => void;
  onSetPickupMode?: (pickupId: string, mode: PickupMode) => void;
  onAddLinkGroup: (fromStopId: string) => void;
  onAddPhase: (lgId: string, fromStopId: string) => void;
  onRetireLinkGroup: (lgId: string, fromStopId: string) => void;
  onUpdatePhase: (lgId: string, phaseId: string, updates: Partial<Pick<LinkGroupPhase, 'gems' | 'notes'>>) => void;
  onRemovePhase: (lgId: string, phaseId: string) => void;
  onUpdateLinkGroupLabel: (lgId: string, label: string) => void;
  onUpdateNotes: (notes: string) => void;
  onDropGem?: (gemName: string) => void;
  onUndropGem?: (gemName: string) => void;
  onDeleteCustomStop?: () => void;
  onUpdateCustomLabel?: (label: string) => void;
}

const DOT_BG: Record<string, string> = {
  red: 'bg-poe-red',
  green: 'bg-poe-green',
  blue: 'bg-poe-blue',
};

function getNewQuestNames(current: string[], previous: string[]): string[] {
  const prevSet = new Set(previous);
  const questMap = new Map<string, GemQuest>();
  for (const q of GEM_QUESTS) questMap.set(q.id, q);
  return current
    .filter((id) => !prevSet.has(id) && questMap.has(id))
    .map((id) => questMap.get(id)!.name);
}

/** Cap a name list at `max` entries, appending "+ N more". */
function nameList(names: string[], max = 2): string {
  if (names.length <= max) return names.join(' + ');
  return `${names.slice(0, max).join(' + ')} +${names.length - max} more`;
}

/** One-line "what happens here" summary for the collapsed row. */
function deriveSummary(
  pickups: GemPickup[],
  resolvedLinkGroups: ResolvedLinkGroup[],
): { text: string; faint: boolean } {
  const active = pickups.filter((p) => !p.skipped);
  const phaseStarts = resolvedLinkGroups.filter((r) => r.isPhaseStart);

  const verb =
    active.length === 0
      ? ''
      : active.every((p) => p.source === 'quest_reward')
        ? 'Pick up'
        : active.every((p) => p.source === 'vendor')
          ? 'Buy'
          : 'Get';

  if (active.length > 0 && phaseStarts.length > 0) {
    return { text: `${verb} gems + set links`, faint: false };
  }
  if (active.length > 0) {
    return { text: `${verb} ${nameList(active.map((p) => p.gemName))}`, faint: false };
  }
  if (phaseStarts.length > 0) {
    const gems = phaseStarts[0].activePhase.gems.map((g) => g.gemName).filter(Boolean);
    return {
      text: gems.length > 0 ? `Link ${nameList(gems)}` : 'Set links',
      faint: false,
    };
  }
  return { text: '', faint: true };
}

export function StopSection({
  stopPlan,
  townStop,
  className,
  inventoryGemNames,
  inventoryOnly,
  resolvedLinkGroups,
  disabledStopIds,
  isCustomStop,
  showQuestRewards,
  onToggleEnabled,
  onAddGemPickup,
  onRemoveGemPickup,
  onSetPickupMode,
  onAddLinkGroup,
  onAddPhase,
  onRetireLinkGroup,
  onUpdatePhase,
  onRemovePhase,
  onUpdateLinkGroupLabel,
  onUpdateNotes,
  onDropGem,
  onUndropGem,
  onDeleteCustomStop,
  onUpdateCustomLabel,
}: StopSectionProps) {
  const [open, setOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(stopPlan.customLabel ?? '');

  // Quest names newly completed at this stop, respecting exclusions from
  // disabled optional stops (single memo — collapsed from the old three-step
  // excluded/previous/effective chain, of which only the names are consumed).
  const newQuestNames = useMemo(() => {
    if (isCustomStop) return [];
    const excluded =
      disabledStopIds && disabledStopIds.size > 0
        ? getExcludedQuests(disabledStopIds)
        : new Set<string>();
    const effective =
      excluded.size === 0
        ? townStop.questsCompleted
        : townStop.questsCompleted.filter((q) => !excluded.has(q));
    const idx = TOWN_STOPS.findIndex((s) => s.id === townStop.id);
    let previous: string[] = [];
    if (idx > 0) {
      if (disabledStopIds && disabledStopIds.size > 0) {
        for (let i = idx - 1; i >= 0; i--) {
          if (!disabledStopIds.has(TOWN_STOPS[i].id)) {
            previous = TOWN_STOPS[i].questsCompleted.filter((q) => !excluded.has(q));
            break;
          }
        }
      } else {
        previous = TOWN_STOPS[idx - 1].questsCompleted;
      }
    }
    return getNewQuestNames(effective, previous);
  }, [isCustomStop, disabledStopIds, townStop]);

  const linkCount = resolvedLinkGroups.length;

  const summary = useMemo(
    () => deriveSummary(stopPlan.gemPickups, resolvedLinkGroups),
    [stopPlan.gemPickups, resolvedLinkGroups],
  );

  const summaryText = summary.text || (newQuestNames.length > 0 ? newQuestNames.join(', ') : '—');
  const summaryFaint = summary.faint;

  // Gem colour mini-dots for the collapsed row (non-skipped pickups, capped)
  const dotColors = useMemo(() => {
    const colors = stopPlan.gemPickups.filter((p) => !p.skipped).map((p) => p.gemColor);
    return colors.slice(0, 5);
  }, [stopPlan.gemPickups]);

  // For custom stops, use the anchor town stop's stopId for link group actions
  const effectiveStopId = stopPlan.stopId;

  // Compute gems used in each link group for cross-group filtering
  const gemsByLinkGroup = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const resolved of resolvedLinkGroups) {
      const names = resolved.activePhase.gems.map((g) => g.gemName).filter(Boolean);
      map.set(resolved.buildLinkGroup.id, names);
    }
    return map;
  }, [resolvedLinkGroups]);

  // All gems currently in any link group at this stop
  const gemsInLinkGroups = useMemo(() => {
    const all = new Set<string>();
    for (const names of gemsByLinkGroup.values()) {
      for (const n of names) all.add(n);
    }
    return all;
  }, [gemsByLinkGroup]);

  // Filter inventory per link group: count-aware so duplicate gems work.
  // If you have 2x "Momentum Support" and one is in group A, group B still sees it.
  const getFilteredInventory = (linkGroupId: string) => {
    // Count how many of each gem are used in OTHER groups
    const otherUsedCounts = new Map<string, number>();
    for (const [lgId, names] of gemsByLinkGroup) {
      if (lgId !== linkGroupId) {
        for (const n of names) otherUsedCounts.set(n, (otherUsedCounts.get(n) ?? 0) + 1);
      }
    }
    // Subtract other-group usage from inventory counts
    const remaining = new Map<string, number>();
    for (const name of inventoryGemNames) {
      remaining.set(name, (remaining.get(name) ?? 0) + 1);
    }
    for (const [name, used] of otherUsedCounts) {
      const have = remaining.get(name) ?? 0;
      if (have <= used) remaining.delete(name);
      else remaining.set(name, have - used);
    }
    // Expand back to array (deduplicated — one entry per available gem name)
    return [...remaining.keys()];
  };

  const enabled = stopPlan.enabled;
  const isOpen = open && enabled;
  const displayLabel = isCustomStop ? (stopPlan.customLabel || 'Custom Stop') : townStop.label;

  function commitLabel() {
    setEditingLabel(false);
    if (onUpdateCustomLabel && labelDraft.trim()) {
      onUpdateCustomLabel(labelDraft.trim());
    }
  }

  return (
    <div
      data-tour="stop-row"
      className={clsx(
        'rounded-lg border bg-poe-row mb-[7px] transition-colors',
        isOpen ? 'border-poe-gold/25' : 'border-white/[.06]',
        !enabled && 'opacity-50',
        isCustomStop && 'border-dashed',
      )}
    >
      {/* Collapsed row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => enabled && setOpen(!open)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && enabled && e.target === e.currentTarget) {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className={clsx(
          'flex items-center gap-2.5 px-3 py-[9px]',
          enabled ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        {/* Enable toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleEnabled();
          }}
          className={clsx(
            'h-4 w-4 shrink-0 rounded border flex items-center justify-center text-[10px] transition-colors cursor-pointer',
            enabled
              ? 'border-poe-gold bg-poe-gold/20 text-poe-gold'
              : 'border-poe-border bg-poe-bg/50 text-poe-muted',
          )}
          title={enabled ? 'Disable this stop' : 'Enable this stop'}
        >
          {enabled ? '✓' : ''}
        </button>

        {/* Mono stop label */}
        {isCustomStop && editingLabel ? (
          <input
            type="text"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitLabel();
              if (e.key === 'Escape') {
                setEditingLabel(false);
                setLabelDraft(stopPlan.customLabel ?? '');
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-[110px] shrink-0 bg-transparent border-b border-poe-gold font-mono text-[10px] font-bold text-poe-gold focus:outline-none"
          />
        ) : (
          <span
            className={clsx(
              'w-[110px] shrink-0 truncate font-mono text-[10px] font-bold',
              isOpen ? 'text-poe-gold' : 'text-poe-faint',
            )}
            title={newQuestNames.length > 0 ? newQuestNames.join(', ') : displayLabel}
          >
            {displayLabel}
          </span>
        )}
        {isCustomStop && !editingLabel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLabelDraft(stopPlan.customLabel ?? '');
              setEditingLabel(true);
            }}
            className="shrink-0 text-poe-faint hover:text-poe-gold transition-colors cursor-pointer"
            title="Rename"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}

        {/* Summary */}
        <span
          className={clsx(
            'flex-1 min-w-0 truncate text-[13px]',
            !enabled || summaryFaint ? 'text-poe-faint' : isOpen ? 'text-poe-bright' : 'text-poe-text',
          )}
        >
          {enabled ? summaryText : 'Disabled'}
        </span>

        {/* Gem colour mini-dots */}
        {dotColors.length > 0 && (
          <span className="inline-flex gap-[3px] shrink-0">
            {dotColors.map((c, i) => (
              <i key={i} className={clsx('block h-[7px] w-[7px] rounded-full', DOT_BG[c] ?? 'bg-poe-red')} />
            ))}
          </span>
        )}

        {/* Custom stop delete */}
        {isCustomStop && onDeleteCustomStop && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCustomStop();
            }}
            className="shrink-0 text-poe-faint hover:text-poe-red transition-colors cursor-pointer"
            title="Delete custom stop"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Chevron */}
        {enabled && (
          <span className={clsx('shrink-0 text-base leading-none', isOpen ? 'text-poe-gold' : 'text-poe-border')}>
            {isOpen ? '▴' : '▾'}
          </span>
        )}
      </div>

      {/* Expanded in-place editor */}
      {isOpen && (
        <div className="border-t border-white/[.06] px-3 pb-3 pt-3 space-y-4">
          {newQuestNames.length > 0 && (
            <p className="font-mono text-[9px] uppercase tracking-widest text-poe-faint">
              Quests: {newQuestNames.join(' · ')}
            </p>
          )}

          {/* Gems + Inventory row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-tour="gem-pickups">
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-poe-faint mb-2">
                Gems
              </h4>
              <GemPickupList
                pickups={stopPlan.gemPickups}
                stopId={isCustomStop ? (stopPlan.afterStopId ?? townStop.id) : stopPlan.stopId}
                className={className}
                disabledStopIds={disabledStopIds}
                isCustomStop={isCustomStop}
                showQuestRewards={isCustomStop ? showQuestRewards : true}
                onAdd={onAddGemPickup}
                onRemove={onRemoveGemPickup}
                onSetMode={onSetPickupMode}
              />
              {className && (() => {
                const vendorPickups = stopPlan.gemPickups.filter((p) => p.source === 'vendor' && !p.skipped);
                if (vendorPickups.length === 0) return null;
                const costs = summarizeVendorCosts(vendorPickups, className);
                if (costs.length === 0) return null;
                const ORDER = ['Wisdom', 'Trans', 'Alt', 'Chance', 'Alch', 'Regret'];
                const sorted = costs.sort((a, b) => ORDER.indexOf(a.shortName) - ORDER.indexOf(b.shortName));
                return (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs text-poe-muted">Cost:</span>
                    {sorted.map((c) => (
                      <CurrencyBadge key={c.shortName} shortName={c.shortName} count={c.count} />
                    ))}
                  </div>
                );
              })()}
            </div>
            <div data-tour="inventory-panel">
              <InventoryPanel
                inventoryGemNames={inventoryGemNames}
                droppedGems={stopPlan.droppedGems ?? []}
                gemsInLinkGroups={gemsInLinkGroups}
                onDrop={onDropGem ?? (() => {})}
                onUndrop={onUndropGem ?? (() => {})}
              />
            </div>
          </div>

          {/* Link Groups */}
          <div data-tour="link-groups">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-poe-faint">
                Link Groups ({linkCount})
              </h4>
            </div>
            <div className="space-y-2">
              {resolvedLinkGroups.map((resolved) => {
                if (resolved.isPhaseStart) {
                  const prevPhase = getPreviousPhase(resolved.buildLinkGroup, resolved.activePhase);
                  return (
                    <PhaseEditor
                      key={resolved.activePhase.id}
                      phase={resolved.activePhase}
                      buildLinkGroup={resolved.buildLinkGroup}
                      isFirstPhase={resolved.buildLinkGroup.phases.indexOf(resolved.activePhase) === 0}
                      onChange={(updates) => onUpdatePhase(resolved.buildLinkGroup.id, resolved.activePhase.id, updates)}
                      onChangeLabel={(label) => onUpdateLinkGroupLabel(resolved.buildLinkGroup.id, label)}
                      onDelete={() => onRemovePhase(resolved.buildLinkGroup.id, resolved.activePhase.id)}
                      inventoryGemNames={getFilteredInventory(resolved.buildLinkGroup.id)}
                      inventoryOnly={inventoryOnly}
                      previousPhaseGems={prevPhase?.gems}
                    />
                  );
                } else {
                  return (
                    <InheritedLinkGroupCard
                      key={`inherited-${resolved.buildLinkGroup.id}`}
                      buildLinkGroup={resolved.buildLinkGroup}
                      activePhase={resolved.activePhase}
                      onAddTransition={() => onAddPhase(resolved.buildLinkGroup.id, effectiveStopId)}
                      onRetire={() => onRetireLinkGroup(resolved.buildLinkGroup.id, effectiveStopId)}
                    />
                  );
                }
              })}
              <Button variant="secondary" size="sm" onClick={() => onAddLinkGroup(effectiveStopId)}>
                + Add Link Group
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-poe-faint mb-2">
              Notes
            </h4>
            <Textarea
              value={stopPlan.notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Stop notes..."
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}
