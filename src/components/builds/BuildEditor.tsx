'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useBuildStore } from '@/stores/useBuildStore';
import { BuildHeader } from '@/components/builds/BuildHeader';
import { StopSection } from '@/components/builds/StopSection';
import { MuleSection } from '@/components/builds/MuleSection';
import { Button } from '@/components/ui/Button';
import { getStopsForAct, getActNumbers } from '@/data/town-stops';
import { getBeachGems } from '@/data/classes';
import { resolveLinkGroupsAtStop } from '@/lib/link-group-resolver';
import type { BuildLinkGroup } from '@/types/build';

function SortableLinkGroupItem({ id, linkGroup }: { id: string; linkGroup: BuildLinkGroup }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const totalGems = linkGroup.phases.reduce((sum, p) => Math.max(sum, p.gems.length), 0);
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded border border-poe-border/40 bg-poe-panel/50 px-2 py-1.5">
      <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 text-poe-muted/50 hover:text-poe-muted">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="text-sm text-poe-text truncate flex-1">
        {linkGroup.label || 'Untitled'}
      </span>
      <span className="text-xs text-poe-muted shrink-0">
        {totalGems}L / {linkGroup.phases.length} phase{linkGroup.phases.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

function LinkGroupReorder({ buildId, linkGroups }: { buildId: string; linkGroups: BuildLinkGroup[] }) {
  const { reorderLinkGroups } = useBuildStore();
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = linkGroups.findIndex((lg) => lg.id === active.id);
    const newIndex = linkGroups.findIndex((lg) => lg.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) {
      reorderLinkGroups(buildId, oldIndex, newIndex);
    }
  };

  if (linkGroups.length < 2) return null;

  return (
    <div className="rounded-md border border-poe-border/30 bg-poe-panel/30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-poe-muted hover:text-poe-text transition-colors cursor-pointer"
      >
        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        Reorder Link Groups
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={linkGroups.map((lg) => lg.id)} strategy={verticalListSortingStrategy}>
              {linkGroups.map((lg) => (
                <SortableLinkGroupItem key={lg.id} id={lg.id} linkGroup={lg} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

interface BuildEditorProps {
  buildId: string;
}

export function BuildEditor({ buildId }: BuildEditorProps) {
  const {
    builds,
    loadBuilds,
    isLoading,
    updateBuildInfo,
    initializeStops,
    toggleStopEnabled,
    updateStopNotes,
    addGemPickup,
    removeGemPickup,
    addLinkGroup,
    addPhase,
    retireLinkGroup,
    updatePhase,
    removePhase,
    updateLinkGroupLabel,
    updateMuleClass,
    addMulePickup,
    removeMulePickup,
    addCustomStop,
    removeCustomStop,
    updateCustomStopLabel,
  } = useBuildStore();

  const build = builds.find((b) => b.id === buildId);

  useEffect(() => {
    if (builds.length === 0) {
      loadBuilds();
    }
  }, [builds.length, loadBuilds]);

  // Initialize stops if build exists but has no stops
  useEffect(() => {
    if (build && build.stops.length === 0) {
      initializeStops(buildId);
    }
  }, [build, buildId, initializeStops]);

  const disabledStopIds = useMemo(
    () => build ? new Set(build.stops.filter((s) => !s.enabled).map((s) => s.stopId)) : new Set<string>(),
    [build],
  );

  // Disabled town stops that have an enabled custom stop "covering" them —
  // the custom stop absorbs the cascade so the next town stop doesn't duplicate it.
  const coveredStopIds = useMemo(() => {
    if (!build) return new Set<string>();
    const covered = new Set<string>();
    for (const stopId of disabledStopIds) {
      const hasEnabledCustom = build.stops.some(
        (s) => s.isCustom && s.enabled && s.afterStopId === stopId,
      );
      if (hasEnabledCustom) covered.add(stopId);
    }
    return covered;
  }, [build, disabledStopIds]);

  // For town stops: remove covered stops so cascade doesn't double-fire
  const townStopDisabledIds = useMemo(() => {
    if (coveredStopIds.size === 0) return disabledStopIds;
    const result = new Set(disabledStopIds);
    for (const id of coveredStopIds) result.delete(id);
    return result;
  }, [disabledStopIds, coveredStopIds]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-poe-muted">Loading build...</span>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-poe-muted">Build not found.</span>
      </div>
    );
  }

  const actNumbers = getActNumbers();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <BuildHeader
            build={build}
            onUpdate={(updates) => updateBuildInfo(buildId, updates)}
          />
        </div>
        <Link
          href={`/builds/${buildId}/run`}
          className="inline-flex items-center rounded-md border border-poe-gold/50 bg-poe-gold/10 px-3 py-1.5 text-sm font-medium text-poe-gold hover:bg-poe-gold/20 transition-colors shrink-0 ml-4 mt-1"
        >
          Run View &rarr;
        </Link>
      </div>

      {/* Mule (optional) */}
      <MuleSection
        muleClassName={build.muleClassName ?? ''}
        mulePickups={build.mulePickups ?? []}
        onUpdateMuleClass={(cls) => updateMuleClass(buildId, cls)}
        onAddPickup={(pickup) => addMulePickup(buildId, pickup)}
        onRemovePickup={(pickupId) => removeMulePickup(buildId, pickupId)}
      />

      {/* Reorder Link Groups */}
      <LinkGroupReorder buildId={buildId} linkGroups={build.linkGroups} />

      {/* Stop Timeline grouped by act */}
      <div className="space-y-4">
        {actNumbers.map((actNum) => {
          const actStops = getStopsForAct(actNum);
          const actStopPlans = actStops
            .map((ts) => ({
              townStop: ts,
              stopPlan: build.stops.find((s) => s.stopId === ts.id),
            }))
            .filter((x) => x.stopPlan);

          if (actStopPlans.length === 0) return null;

          return (
            <div key={actNum}>
              <h3 className="text-sm font-bold text-poe-gold/80 uppercase tracking-wider mb-2 px-1">
                Act {actNum}
              </h3>
              <div className="space-y-1">
                {actStopPlans.map(({ townStop, stopPlan }) => {
                  const resolved = resolveLinkGroupsAtStop(build.linkGroups, townStop.id);
                  // Gem names available at this stop for the link group combobox
                  const beachNames: string[] = [];
                  if (townStop.id === 'a1_after_hillock') {
                    const mainBeach = getBeachGems(build.className);
                    if (mainBeach) beachNames.push(mainBeach.skillGem, mainBeach.supportGem);
                    const muleBeach = build.muleClassName ? getBeachGems(build.muleClassName) : null;
                    if (muleBeach) beachNames.push(muleBeach.skillGem, muleBeach.supportGem);
                  }
                  const stopGemNames = [
                    ...new Set([
                      ...stopPlan!.gemPickups.map((p) => p.gemName),
                      ...beachNames,
                      // Include mule gems at After Hillock
                      ...(townStop.id === 'a1_after_hillock'
                        ? (build.mulePickups ?? []).map((p) => p.gemName)
                        : []),
                    ]),
                  ];

                  // Find custom stops anchored after this town stop
                  const customStopsAfter = build.stops.filter(
                    (s) => s.isCustom && s.afterStopId === townStop.id,
                  );

                  return (
                    <div key={townStop.id} className="space-y-1">
                      <StopSection
                        stopPlan={stopPlan!}
                        townStop={townStop}
                        buildId={buildId}
                        className={build.className}
                        stopGemNames={stopGemNames}
                        resolvedLinkGroups={resolved}
                        disabledStopIds={townStopDisabledIds}
                        onToggleEnabled={() => toggleStopEnabled(buildId, townStop.id)}
                        onAddGemPickup={(pickup) => addGemPickup(buildId, townStop.id, pickup)}
                        onRemoveGemPickup={(pickupId) => removeGemPickup(buildId, townStop.id, pickupId)}
                        onAddLinkGroup={(fromStopId) => addLinkGroup(buildId, fromStopId)}
                        onAddPhase={(lgId, fromStopId) => addPhase(buildId, lgId, fromStopId)}
                        onRetireLinkGroup={(lgId, fromStopId) => retireLinkGroup(buildId, lgId, fromStopId)}
                        onUpdatePhase={(lgId, phaseId, updates) => updatePhase(buildId, lgId, phaseId, updates)}
                        onRemovePhase={(lgId, phaseId) => removePhase(buildId, lgId, phaseId)}
                        onUpdateLinkGroupLabel={(lgId, label) => updateLinkGroupLabel(buildId, lgId, label)}
                        onUpdateNotes={(notes) => updateStopNotes(buildId, townStop.id, notes)}
                      />
                      {/* Custom stops anchored after this town stop */}
                      {(() => {
                        // First enabled custom stop after a disabled anchor gets quest rewards
                        const anchorDisabled = disabledStopIds.has(townStop.id);
                        const firstQuestRewardId = anchorDisabled
                          ? customStopsAfter.find((s) => s.enabled)?.stopId
                          : undefined;

                        return customStopsAfter.map((cs) => {
                        const csResolved = resolveLinkGroupsAtStop(build.linkGroups, cs.stopId);
                        const csGemNames = [...new Set(cs.gemPickups.map((p) => p.gemName))];
                        return (
                          <StopSection
                            key={cs.stopId}
                            stopPlan={cs}
                            townStop={townStop}
                            buildId={buildId}
                            className={build.className}
                            stopGemNames={csGemNames}
                            resolvedLinkGroups={csResolved}
                            disabledStopIds={disabledStopIds}
                            isCustomStop
                            showQuestRewards={cs.stopId === firstQuestRewardId}
                            onToggleEnabled={() => toggleStopEnabled(buildId, cs.stopId)}
                            onAddGemPickup={(pickup) => addGemPickup(buildId, cs.stopId, pickup)}
                            onRemoveGemPickup={(pickupId) => removeGemPickup(buildId, cs.stopId, pickupId)}
                            onAddLinkGroup={(fromStopId) => addLinkGroup(buildId, fromStopId)}
                            onAddPhase={(lgId, fromStopId) => addPhase(buildId, lgId, fromStopId)}
                            onRetireLinkGroup={(lgId, fromStopId) => retireLinkGroup(buildId, lgId, fromStopId)}
                            onUpdatePhase={(lgId, phaseId, updates) => updatePhase(buildId, lgId, phaseId, updates)}
                            onRemovePhase={(lgId, phaseId) => removePhase(buildId, lgId, phaseId)}
                            onUpdateLinkGroupLabel={(lgId, label) => updateLinkGroupLabel(buildId, lgId, label)}
                            onUpdateNotes={(notes) => updateStopNotes(buildId, cs.stopId, notes)}
                            onDeleteCustomStop={() => removeCustomStop(buildId, cs.stopId)}
                            onUpdateCustomLabel={(label) => updateCustomStopLabel(buildId, cs.stopId, label)}
                          />
                        );
                      });
                      })()}
                      {/* Add custom stop button */}
                      <div className="ml-6 pl-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] text-poe-muted/50 hover:text-poe-muted py-0.5 px-2"
                          onClick={() => addCustomStop(buildId, townStop.id)}
                        >
                          + Custom Stop
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
