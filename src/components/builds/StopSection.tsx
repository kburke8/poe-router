'use client';

import { useState, useMemo } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StopHeader } from '@/components/builds/StopHeader';
import { GemPickupList } from '@/components/builds/GemPickupList';
import { PhaseEditor } from '@/components/builds/PhaseEditor';
import { InheritedLinkGroupCard } from '@/components/builds/InheritedLinkGroupCard';
import type { StopPlan, GemPickup, LinkGroupPhase } from '@/types/build';
import type { ResolvedLinkGroup } from '@/lib/link-group-resolver';
import { getPreviousPhase } from '@/lib/link-group-resolver';
import { TOWN_STOPS, type TownStop } from '@/data/town-stops';
import { getExcludedQuests } from '@/lib/gem-availability';
import { summarizeVendorCosts } from '@/lib/gem-costs';
import { CurrencyBadge } from '@/components/ui/CurrencyBadge';

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
  onAddLinkGroup: (fromStopId: string) => void;
  onAddPhase: (lgId: string, fromStopId: string) => void;
  onRetireLinkGroup: (lgId: string, fromStopId: string) => void;
  onUpdatePhase: (lgId: string, phaseId: string, updates: Partial<Pick<LinkGroupPhase, 'gems' | 'notes'>>) => void;
  onRemovePhase: (lgId: string, phaseId: string) => void;
  onUpdateLinkGroupLabel: (lgId: string, label: string) => void;
  onUpdateNotes: (notes: string) => void;
  onDeleteCustomStop?: () => void;
  onUpdateCustomLabel?: (label: string) => void;
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
  onAddLinkGroup,
  onAddPhase,
  onRetireLinkGroup,
  onUpdatePhase,
  onRemovePhase,
  onUpdateLinkGroupLabel,
  onUpdateNotes,
  onDeleteCustomStop,
  onUpdateCustomLabel,
}: StopSectionProps) {
  const [open, setOpen] = useState(false);

  const excludedQuests = useMemo(() => {
    if (!disabledStopIds || disabledStopIds.size === 0) return new Set<string>();
    return getExcludedQuests(disabledStopIds);
  }, [disabledStopIds]);

  const previousQuestsCompleted = useMemo(() => {
    if (isCustomStop) return [];
    const idx = TOWN_STOPS.findIndex((s) => s.id === townStop.id);
    if (idx <= 0) return [];
    if (disabledStopIds && disabledStopIds.size > 0) {
      for (let i = idx - 1; i >= 0; i--) {
        if (!disabledStopIds.has(TOWN_STOPS[i].id)) {
          return TOWN_STOPS[i].questsCompleted.filter((q) => !excludedQuests.has(q));
        }
      }
      return [];
    }
    return TOWN_STOPS[idx - 1].questsCompleted;
  }, [townStop.id, disabledStopIds, isCustomStop, excludedQuests]);

  // Effective quests at this stop (filtered by exclusions from disabled optional stops)
  const effectiveQuestsCompleted = useMemo(() => {
    if (isCustomStop) return [];
    if (excludedQuests.size === 0) return townStop.questsCompleted;
    return townStop.questsCompleted.filter((q) => !excludedQuests.has(q));
  }, [townStop.questsCompleted, excludedQuests, isCustomStop]);

  const pickupCount = stopPlan.gemPickups.length;
  const linkCount = resolvedLinkGroups.length;
  const phaseStartCount = resolvedLinkGroups.filter((r) => r.isPhaseStart).length;
  const summaryParts: string[] = [];
  if (pickupCount > 0) summaryParts.push(`${pickupCount} gem${pickupCount !== 1 ? 's' : ''}`);
  if (linkCount > 0) {
    const parts = [`${linkCount} link${linkCount !== 1 ? 's' : ''}`];
    if (phaseStartCount > 0) parts.push(`${phaseStartCount} new`);
    summaryParts.push(parts.join(', '));
  }
  const summary = summaryParts.length > 0 ? summaryParts.join(', ') : '';

  // For custom stops, use the anchor town stop's stopId for link group actions
  const effectiveStopId = stopPlan.stopId;

  return (
    <div>
      <StopHeader
        townStop={townStop}
        previousQuestsCompleted={previousQuestsCompleted}
        effectiveQuestsCompleted={effectiveQuestsCompleted}
        enabled={stopPlan.enabled}
        isOpen={open}
        onToggleOpen={() => setOpen(!open)}
        onToggleEnabled={onToggleEnabled}
        summary={summary}
        isCustomStop={isCustomStop}
        customLabel={stopPlan.customLabel}
        onUpdateCustomLabel={onUpdateCustomLabel}
        onDeleteCustomStop={onDeleteCustomStop}
      />

      <Collapsible.Root open={open && stopPlan.enabled} onOpenChange={setOpen}>
        <Collapsible.Content className="mt-1 ml-6 rounded-md border border-poe-border bg-poe-card p-4 space-y-4">
          {/* Gem Pickups */}
          <div>
            <h4 className="text-sm font-medium text-poe-text mb-2">Gems</h4>
            <GemPickupList
              pickups={stopPlan.gemPickups}
              stopId={isCustomStop ? (stopPlan.afterStopId ?? townStop.id) : stopPlan.stopId}
              className={className}
              disabledStopIds={disabledStopIds}
              isCustomStop={isCustomStop}
              showQuestRewards={isCustomStop ? showQuestRewards : true}
              onAdd={onAddGemPickup}
              onRemove={onRemoveGemPickup}
            />
            {className && (() => {
              const vendorPickups = stopPlan.gemPickups.filter((p) => p.source === 'vendor');
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

          {/* Link Groups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-poe-text">
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
                      inventoryGemNames={inventoryGemNames}
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
            <h4 className="text-sm font-medium text-poe-text mb-2">Notes</h4>
            <Textarea
              value={stopPlan.notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Stop notes..."
              rows={2}
            />
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
