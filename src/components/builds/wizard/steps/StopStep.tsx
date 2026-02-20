'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { GemPickupList } from '@/components/builds/GemPickupList';
import { PhaseEditor } from '@/components/builds/PhaseEditor';
import { InheritedLinkGroupCard } from '@/components/builds/InheritedLinkGroupCard';
import { resolveLinkGroupsAtStop, getPreviousPhase } from '@/lib/link-group-resolver';
import { getInventoryAtStop } from '@/lib/gem-inventory';
import type { TownStop } from '@/data/town-stops';
import type { BuildPlan, StopPlan, GemPickup, LinkGroupPhase } from '@/types/build';

interface StopStepProps {
  build: BuildPlan;
  stopPlan: StopPlan;
  townStop: TownStop;
  onToggleStopEnabled: (stopId: string) => void;
  onAddGemPickup: (stopId: string, pickup: GemPickup) => void;
  onRemoveGemPickup: (stopId: string, pickupId: string) => void;
  onUpdateStopNotes: (stopId: string, notes: string) => void;
  onAddLinkGroup: (fromStopId: string) => void;
  onAddPhase: (lgId: string, fromStopId: string) => void;
  onRetireLinkGroup: (lgId: string, fromStopId: string) => void;
  onUpdatePhase: (lgId: string, phaseId: string, updates: Partial<Pick<LinkGroupPhase, 'gems' | 'notes'>>) => void;
  onRemovePhase: (lgId: string, phaseId: string) => void;
  onUpdateLinkGroupLabel: (lgId: string, label: string) => void;
  onAddCustomStop: (afterStopId: string) => void;
  onRemoveCustomStop: (stopId: string) => void;
  onUpdateCustomStopLabel: (stopId: string, label: string) => void;
}

export function StopStep({
  build,
  stopPlan,
  townStop,
  onToggleStopEnabled,
  onAddGemPickup,
  onRemoveGemPickup,
  onUpdateStopNotes,
  onAddLinkGroup,
  onAddPhase,
  onRetireLinkGroup,
  onUpdatePhase,
  onRemovePhase,
  onUpdateLinkGroupLabel,
  onAddCustomStop,
  onRemoveCustomStop,
  onUpdateCustomStopLabel,
}: StopStepProps) {
  const disabledStopIds = useMemo(
    () => new Set(build.stops.filter((s) => !s.enabled).map((s) => s.stopId)),
    [build.stops],
  );

  const resolvedLinkGroups = useMemo(
    () => resolveLinkGroupsAtStop(build.linkGroups, townStop.id),
    [build.linkGroups, townStop.id],
  );

  const inventoryGemNames = useMemo(
    () => [...getInventoryAtStop(build, townStop.id)],
    [build, townStop.id],
  );

  // Custom stops attached after this town stop
  const customStopsAfter = useMemo(
    () => build.stops.filter((s) => s.isCustom && s.afterStopId === townStop.id),
    [build.stops, townStop.id],
  );

  const linkCount = resolvedLinkGroups.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-poe-gold mb-1">
            Act {townStop.actNumber}: {townStop.label}
          </h2>
          <p className="text-sm text-poe-muted">
            {stopPlan.enabled
              ? 'Configure gem pickups, link groups, and notes for this stop.'
              : 'This stop is disabled. Enable it to configure gems and links.'}
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-poe-muted hover:text-poe-text shrink-0">
          <input
            type="checkbox"
            checked={stopPlan.enabled}
            onChange={() => onToggleStopEnabled(townStop.id)}
            className="accent-poe-gold"
          />
          Enabled
        </label>
      </div>

      {stopPlan.enabled && (
        <>
          {/* Gem Pickups */}
          <div>
            <h4 className="text-sm font-medium text-poe-text mb-2">Gems</h4>
            <GemPickupList
              pickups={stopPlan.gemPickups}
              stopId={stopPlan.stopId}
              className={build.className}
              disabledStopIds={disabledStopIds}
              onAdd={(pickup) => onAddGemPickup(townStop.id, pickup)}
              onRemove={(pickupId) => onRemoveGemPickup(townStop.id, pickupId)}
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
                      inventoryGemNames={inventoryGemNames}
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
              onChange={(e) => onUpdateStopNotes(townStop.id, e.target.value)}
              placeholder="Stop notes..."
              rows={2}
            />
          </div>

          {/* Custom stops after this town stop */}
          {customStopsAfter.length > 0 && (
            <div className="space-y-3 border-t border-poe-border pt-4">
              <h4 className="text-sm font-medium text-poe-muted">Custom Stops</h4>
              {customStopsAfter.map((cs) => (
                <CustomStopSubSection
                  key={cs.stopId}
                  customStop={cs}
                  townStop={townStop}
                  build={build}
                  disabledStopIds={disabledStopIds}
                  onToggleStopEnabled={onToggleStopEnabled}
                  onAddGemPickup={onAddGemPickup}
                  onRemoveGemPickup={onRemoveGemPickup}
                  onUpdateStopNotes={onUpdateStopNotes}
                  onAddLinkGroup={onAddLinkGroup}
                  onAddPhase={onAddPhase}
                  onRetireLinkGroup={onRetireLinkGroup}
                  onUpdatePhase={onUpdatePhase}
                  onRemovePhase={onRemovePhase}
                  onUpdateLinkGroupLabel={onUpdateLinkGroupLabel}
                  onRemoveCustomStop={onRemoveCustomStop}
                  onUpdateCustomStopLabel={onUpdateCustomStopLabel}
                />
              ))}
            </div>
          )}

          {/* Add custom stop button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] text-poe-muted/50 hover:text-poe-muted py-0.5 px-2"
            onClick={() => onAddCustomStop(townStop.id)}
          >
            + Custom Stop
          </Button>
        </>
      )}
    </div>
  );
}

// --- Custom stop sub-section (rendered inline within the parent stop step) ---

interface CustomStopSubSectionProps {
  customStop: StopPlan;
  townStop: TownStop;
  build: BuildPlan;
  disabledStopIds: Set<string>;
  onToggleStopEnabled: (stopId: string) => void;
  onAddGemPickup: (stopId: string, pickup: GemPickup) => void;
  onRemoveGemPickup: (stopId: string, pickupId: string) => void;
  onUpdateStopNotes: (stopId: string, notes: string) => void;
  onAddLinkGroup: (fromStopId: string) => void;
  onAddPhase: (lgId: string, fromStopId: string) => void;
  onRetireLinkGroup: (lgId: string, fromStopId: string) => void;
  onUpdatePhase: (lgId: string, phaseId: string, updates: Partial<Pick<LinkGroupPhase, 'gems' | 'notes'>>) => void;
  onRemovePhase: (lgId: string, phaseId: string) => void;
  onUpdateLinkGroupLabel: (lgId: string, label: string) => void;
  onRemoveCustomStop: (stopId: string) => void;
  onUpdateCustomStopLabel: (stopId: string, label: string) => void;
}

function CustomStopSubSection({
  customStop,
  townStop,
  build,
  disabledStopIds,
  onToggleStopEnabled,
  onAddGemPickup,
  onRemoveGemPickup,
  onUpdateStopNotes,
  onAddLinkGroup,
  onAddPhase,
  onRetireLinkGroup,
  onUpdatePhase,
  onRemovePhase,
  onUpdateLinkGroupLabel,
  onRemoveCustomStop,
  onUpdateCustomStopLabel,
}: CustomStopSubSectionProps) {
  const csResolved = useMemo(
    () => resolveLinkGroupsAtStop(build.linkGroups, customStop.stopId),
    [build.linkGroups, customStop.stopId],
  );

  const csInventoryGemNames = useMemo(
    () => [...getInventoryAtStop(build, customStop.stopId)],
    [build, customStop.stopId],
  );

  const effectiveStopId = customStop.stopId;

  return (
    <div className="rounded-md border border-poe-border bg-poe-panel/50 p-4 space-y-3">
      {/* Custom stop header with label + controls */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-poe-muted hover:text-poe-text text-sm">
          <input
            type="checkbox"
            checked={customStop.enabled}
            onChange={() => onToggleStopEnabled(customStop.stopId)}
            className="accent-poe-gold"
          />
        </label>
        <input
          type="text"
          value={customStop.customLabel ?? ''}
          onChange={(e) => onUpdateCustomStopLabel(customStop.stopId, e.target.value)}
          placeholder="Custom Stop"
          className="rounded border border-poe-border bg-poe-input px-2 py-1 text-sm text-poe-text focus:border-poe-gold focus:outline-none flex-1"
        />
        <Button
          variant="danger"
          size="sm"
          onClick={() => onRemoveCustomStop(customStop.stopId)}
        >
          Delete
        </Button>
      </div>

      {customStop.enabled && (
        <>
          {/* Gem Pickups */}
          <GemPickupList
            pickups={customStop.gemPickups}
            stopId={customStop.afterStopId ?? townStop.id}
            className={build.className}
            disabledStopIds={disabledStopIds}
            isCustomStop
            onAdd={(pickup) => onAddGemPickup(customStop.stopId, pickup)}
            onRemove={(pickupId) => onRemoveGemPickup(customStop.stopId, pickupId)}
          />

          {/* Link Groups */}
          {csResolved.length > 0 && (
            <div className="space-y-2">
              {csResolved.map((resolved) => {
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
                      inventoryGemNames={csInventoryGemNames}
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
            </div>
          )}

          <Button variant="secondary" size="sm" onClick={() => onAddLinkGroup(effectiveStopId)}>
            + Add Link Group
          </Button>

          {/* Notes */}
          <Textarea
            value={customStop.notes}
            onChange={(e) => onUpdateStopNotes(customStop.stopId, e.target.value)}
            placeholder="Notes..."
            rows={2}
          />
        </>
      )}
    </div>
  );
}
