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

interface StopSectionProps {
  stopPlan: StopPlan;
  townStop: TownStop;
  buildId: string;
  className: string;
  stopGemNames: string[];
  resolvedLinkGroups: ResolvedLinkGroup[];
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
}

export function StopSection({
  stopPlan,
  townStop,
  className,
  stopGemNames,
  resolvedLinkGroups,
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
}: StopSectionProps) {
  const [open, setOpen] = useState(false);

  const previousQuestsCompleted = useMemo(() => {
    const idx = TOWN_STOPS.findIndex((s) => s.id === townStop.id);
    return idx > 0 ? TOWN_STOPS[idx - 1].questsCompleted : [];
  }, [townStop.id]);

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

  return (
    <div>
      <StopHeader
        townStop={townStop}
        previousQuestsCompleted={previousQuestsCompleted}
        enabled={stopPlan.enabled}
        isOpen={open}
        onToggleOpen={() => setOpen(!open)}
        onToggleEnabled={onToggleEnabled}
        summary={summary}
      />

      <Collapsible.Root open={open && stopPlan.enabled} onOpenChange={setOpen}>
        <Collapsible.Content className="mt-1 ml-6 rounded-md border border-poe-border bg-poe-card p-4 space-y-4">
          {/* Gem Pickups */}
          <div>
            <h4 className="text-sm font-medium text-poe-text mb-2">Gems</h4>
            <GemPickupList
              pickups={stopPlan.gemPickups}
              stopId={stopPlan.stopId}
              className={className}
              onAdd={onAddGemPickup}
              onRemove={onRemoveGemPickup}
            />
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
                      stopGemNames={stopGemNames}
                      previousPhaseGems={prevPhase?.gems}
                    />
                  );
                } else {
                  return (
                    <InheritedLinkGroupCard
                      key={`inherited-${resolved.buildLinkGroup.id}`}
                      buildLinkGroup={resolved.buildLinkGroup}
                      activePhase={resolved.activePhase}
                      onAddTransition={() => onAddPhase(resolved.buildLinkGroup.id, townStop.id)}
                      onRetire={() => onRetireLinkGroup(resolved.buildLinkGroup.id, townStop.id)}
                    />
                  );
                }
              })}
              <Button variant="secondary" size="sm" onClick={() => onAddLinkGroup(townStop.id)}>
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
