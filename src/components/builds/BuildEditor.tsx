'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useBuildStore } from '@/stores/useBuildStore';
import { BuildHeader } from '@/components/builds/BuildHeader';
import { StopSection } from '@/components/builds/StopSection';
import { MuleSection } from '@/components/builds/MuleSection';
import { GearGoalsPanel } from '@/components/builds/GearGoalsPanel';
import { getStopsForAct, getActNumbers, type TownStop } from '@/data/town-stops';
import { resolveLinkGroupsAtStop } from '@/lib/link-group-resolver';
import { getInventoryAtStop } from '@/lib/gem-inventory';
import type { BuildLinkGroup, StopPlan } from '@/types/build';

function SortableLinkGroupItem({ id, linkGroup }: { id: string; linkGroup: BuildLinkGroup }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const totalGems = linkGroup.phases.reduce((sum, p) => Math.max(sum, p.gems.length), 0);
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded border border-poe-border/40 bg-poe-bg/50 px-2 py-1.5">
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
    <div className="rounded-lg border border-white/[.06] bg-poe-row mb-[7px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 w-full px-3 py-2 cursor-pointer"
      >
        {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-poe-faint" /> : <ChevronRight className="h-3.5 w-3.5 text-poe-faint" />}
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-poe-faint">
          Reorder Link Groups
        </span>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-1 border-t border-white/[.06] pt-2">
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

/** Collapsible pseudo-row styled like a stop row, for the pre-Act-1 sections. */
function PseudoSection({
  label,
  meta,
  dataTour,
  children,
}: {
  label: string;
  meta?: string;
  dataTour?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-white/[.06] bg-poe-row mb-[7px]" data-tour={dataTour}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 cursor-pointer text-left"
      >
        <span className={clsx('w-[110px] shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest', open ? 'text-poe-gold' : 'text-poe-faint')}>
          {label}
        </span>
        <span className="flex-1 min-w-0 truncate text-[13px] text-poe-muted">{meta ?? ''}</span>
        <span className={clsx('shrink-0 text-base leading-none', open ? 'text-poe-gold' : 'text-poe-border')}>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && <div className="border-t border-white/[.06] p-3">{children}</div>}
    </div>
  );
}

interface ActGroup {
  actNumber: number;
  stops: { townStop: TownStop; stopPlan: StopPlan }[];
  enabledCount: number;
}

interface BuildEditorProps {
  buildId: string;
  onOpenImport: () => void;
}

export function BuildEditor({ buildId, onOpenImport }: BuildEditorProps) {
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
    setGemPickupMode,
    addLinkGroup,
    addPhase,
    retireLinkGroup,
    updatePhase,
    removePhase,
    updateLinkGroupLabel,
    updateMuleClass,
    addMulePickup,
    removeMulePickup,
    addGearGoal,
    updateGearGoal,
    removeGearGoal,
    toggleGearGoalAcquired,
    dropGem,
    undropGem,
    addCustomStop,
    removeCustomStop,
    updateCustomStopLabel,
  } = useBuildStore();

  const build = builds.find((b) => b.id === buildId);

  const [inventoryOnly, setInventoryOnly] = useState(true);
  const [collapsedActs, setCollapsedActs] = useState<Set<number>>(new Set());
  const [activeAct, setActiveAct] = useState<number | null>(null);
  const actRefs = useRef<Map<number, HTMLElement>>(new Map());

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

  // Group stops by act (custom stops count toward their anchor's act)
  const actGroups: ActGroup[] = useMemo(() => {
    if (!build) return [];
    return getActNumbers()
      .map((actNum) => {
        const actStops = getStopsForAct(actNum);
        const stops = actStops
          .map((ts) => ({
            townStop: ts,
            stopPlan: build.stops.find((s) => s.stopId === ts.id),
          }))
          .filter((x): x is { townStop: TownStop; stopPlan: StopPlan } => !!x.stopPlan);
        const actStopIds = new Set(actStops.map((ts) => ts.id));
        const customInAct = build.stops.filter(
          (s) => s.isCustom && s.afterStopId && actStopIds.has(s.afterStopId),
        );
        const enabledCount =
          stops.filter((x) => x.stopPlan.enabled).length +
          customInAct.filter((s) => s.enabled).length;
        return { actNumber: actNum, stops, enabledCount };
      })
      .filter((g) => g.stops.length > 0);
  }, [build]);

  const totalStops = useMemo(
    () => actGroups.reduce((n, g) => n + g.enabledCount, 0),
    [actGroups],
  );

  const totalGems = useMemo(() => {
    if (!build) return 0;
    return build.stops
      .filter((s) => s.enabled)
      .reduce((n, s) => n + s.gemPickups.filter((p) => !p.skipped).length, 0);
  }, [build]);

  // Scroll spy: highlight the act whose section is at/above the viewport top
  useEffect(() => {
    function onScroll() {
      let current: number | null = null;
      for (const g of actGroups) {
        const el = actRefs.current.get(g.actNumber);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 120) current = g.actNumber;
      }
      setActiveAct(current ?? (actGroups[0]?.actNumber ?? null));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [actGroups]);

  const jumpToAct = useCallback((actNum: number) => {
    setCollapsedActs((prev) => {
      if (!prev.has(actNum)) return prev;
      const next = new Set(prev);
      next.delete(actNum);
      return next;
    });
    actRefs.current.get(actNum)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const toggleActCollapsed = useCallback((actNum: number) => {
    setCollapsedActs((prev) => {
      const next = new Set(prev);
      if (next.has(actNum)) next.delete(actNum);
      else next.add(actNum);
      return next;
    });
  }, []);

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

  return (
    <div className="flex items-start rounded-xl border border-poe-border bg-poe-card min-h-[70vh]">
      {/* ===== Left rail ===== */}
      <div
        data-tour="route-rail"
        className="w-[150px] shrink-0 self-stretch bg-poe-rail border-r border-white/[.06] rounded-l-xl"
      >
        <div className="sticky top-4 py-3.5 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="px-[15px] pb-[9px] font-mono text-[9px] font-bold uppercase tracking-[.12em] text-poe-faint">
            Route · {totalStops} stops
          </div>
          {actGroups.map((g) => {
            const isActive = g.actNumber === activeAct;
            return (
              <button
                key={g.actNumber}
                type="button"
                onClick={() => jumpToAct(g.actNumber)}
                className={clsx(
                  'w-full text-left px-[13px] py-1.5 text-[11px] border-l-2 transition-colors cursor-pointer',
                  isActive
                    ? 'font-bold text-poe-gold bg-poe-gold/[.08] border-poe-gold'
                    : 'font-semibold text-poe-muted border-transparent hover:text-poe-text',
                )}
              >
                Act {g.actNumber}{' '}
                <span className="font-normal text-poe-faint">· {g.enabledCount}</span>
              </button>
            );
          })}
          <div className="mx-[15px] mt-3 pt-3 border-t border-white/[.06] text-[11px] leading-relaxed text-poe-muted">
            <div className="font-bold text-poe-gold mb-1 break-words">{build.name}</div>
            {build.className && (
              <div>
                {build.className}
                {build.ascendancy ? ` · ${build.ascendancy}` : ''}
              </div>
            )}
            <div className="text-poe-faint">
              {totalGems} gems · {build.linkGroups.length} links
            </div>
          </div>
        </div>
      </div>

      {/* ===== Main column ===== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Slim header */}
        <div className="flex items-center gap-2.5 px-4 py-[11px] border-b border-white/[.06]">
          <Link
            href="/builds"
            className="text-poe-muted hover:text-poe-text text-sm transition-colors"
            title="Back to Builds"
          >
            &larr;
          </Link>
          <span className="text-[13px] font-bold text-poe-bright">Edit route</span>
          <span
            className="font-mono text-[9px] uppercase tracking-[.12em] text-poe-faint"
            title="Changes are saved automatically"
          >
            ✓ autosaves
          </span>
          <span className="flex-1" />
          <label className="flex items-center gap-1.5 text-[11px] text-poe-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inventoryOnly}
              onChange={(e) => setInventoryOnly(e.target.checked)}
              className="accent-poe-gold"
            />
            Inventory only
          </label>
          <button
            type="button"
            data-tour="reimport-pob"
            onClick={onOpenImport}
            className="rounded-md bg-poe-blue/[.14] px-[11px] py-[5px] text-[11px] font-semibold text-[#8fb6ec] hover:bg-poe-blue/[.22] transition-colors cursor-pointer"
          >
            ⟲ Re-import PoB
          </button>
          <Link
            href={`/builds/${buildId}/run`}
            className="rounded-md bg-poe-gold px-[11px] py-[5px] text-[11px] font-bold text-poe-gold-ink hover:bg-poe-gold/90 transition-colors"
          >
            Run View &rarr;
          </Link>
        </div>

        {/* Route canvas */}
        <div className="px-4 py-3">
          {/* Pre-act sections */}
          <PseudoSection
            label="Build"
            meta={`${build.name}${build.className ? ` · ${build.className}` : ''}${build.ascendancy ? ` · ${build.ascendancy}` : ''}`}
            dataTour="build-settings"
          >
            <BuildHeader
              build={build}
              onUpdate={(updates) => updateBuildInfo(buildId, updates)}
            />
          </PseudoSection>

          <PseudoSection
            label="Mule"
            meta={
              build.muleClassName
                ? `${build.muleClassName} · ${(build.mulePickups ?? []).length} gem${(build.mulePickups ?? []).length !== 1 ? 's' : ''}`
                : 'No mule'
            }
          >
            <MuleSection
              muleClassName={build.muleClassName ?? ''}
              mulePickups={build.mulePickups ?? []}
              onUpdateMuleClass={(cls) => updateMuleClass(buildId, cls)}
              onAddPickup={(pickup) => addMulePickup(buildId, pickup)}
              onRemovePickup={(pickupId) => removeMulePickup(buildId, pickupId)}
            />
          </PseudoSection>

          <PseudoSection
            label="Gear Goals"
            meta={`${build.gearGoals.length} goal${build.gearGoals.length !== 1 ? 's' : ''}`}
          >
            <GearGoalsPanel
              goals={build.gearGoals}
              onAdd={(goal) => addGearGoal(buildId, goal)}
              onUpdate={(goalId, updates) => updateGearGoal(buildId, goalId, updates)}
              onRemove={(goalId) => removeGearGoal(buildId, goalId)}
              onToggleAcquired={(goalId) => toggleGearGoalAcquired(buildId, goalId)}
            />
          </PseudoSection>

          <LinkGroupReorder buildId={buildId} linkGroups={build.linkGroups} />

          {/* Acts */}
          {actGroups.map((g) => {
            const collapsed = collapsedActs.has(g.actNumber);
            return (
              <section
                key={g.actNumber}
                ref={(el) => {
                  if (el) actRefs.current.set(g.actNumber, el);
                  else actRefs.current.delete(g.actNumber);
                }}
                className="scroll-mt-4"
              >
                <button
                  type="button"
                  onClick={() => toggleActCollapsed(g.actNumber)}
                  className={clsx(
                    'w-full flex items-center gap-2 mt-4 mb-[9px] cursor-pointer',
                    collapsed && 'opacity-60',
                  )}
                  title={collapsed ? 'Expand act' : 'Collapse act'}
                >
                  <span className="text-[12px] font-extrabold tracking-[.05em] text-poe-gold">
                    ACT {g.actNumber}
                  </span>
                  <span className="flex-1 h-px bg-white/[.07]" />
                  <span className="font-mono text-[11px] text-poe-faint">
                    {g.enabledCount} stop{g.enabledCount !== 1 ? 's' : ''}
                    {collapsed ? ' · collapsed' : ''}
                  </span>
                </button>

                {!collapsed &&
                  g.stops.map(({ townStop, stopPlan }) => {
                    const resolved = resolveLinkGroupsAtStop(build.linkGroups, townStop.id);
                    const inventoryGemNames = getInventoryAtStop(build, townStop.id);

                    // Custom stops anchored after this town stop
                    const customStopsAfter = build.stops.filter(
                      (s) => s.isCustom && s.afterStopId === townStop.id,
                    );

                    // First enabled custom stop after a disabled anchor gets quest rewards
                    const anchorDisabled = disabledStopIds.has(townStop.id);
                    const firstQuestRewardId = anchorDisabled
                      ? customStopsAfter.find((s) => s.enabled)?.stopId
                      : undefined;

                    return (
                      <div key={townStop.id}>
                        <StopSection
                          stopPlan={stopPlan}
                          townStop={townStop}
                          buildId={buildId}
                          className={build.className}
                          inventoryGemNames={inventoryGemNames}
                          inventoryOnly={inventoryOnly}
                          resolvedLinkGroups={resolved}
                          disabledStopIds={townStopDisabledIds}
                          onToggleEnabled={() => toggleStopEnabled(buildId, townStop.id)}
                          onAddGemPickup={(pickup) => addGemPickup(buildId, townStop.id, pickup)}
                          onRemoveGemPickup={(pickupId) => removeGemPickup(buildId, townStop.id, pickupId)}
                          onSetPickupMode={(pickupId, mode) => setGemPickupMode(buildId, townStop.id, pickupId, mode)}
                          onAddLinkGroup={(fromStopId) => addLinkGroup(buildId, fromStopId)}
                          onAddPhase={(lgId, fromStopId) => addPhase(buildId, lgId, fromStopId)}
                          onRetireLinkGroup={(lgId, fromStopId) => retireLinkGroup(buildId, lgId, fromStopId)}
                          onUpdatePhase={(lgId, phaseId, updates) => updatePhase(buildId, lgId, phaseId, updates)}
                          onRemovePhase={(lgId, phaseId) => removePhase(buildId, lgId, phaseId)}
                          onUpdateLinkGroupLabel={(lgId, label) => updateLinkGroupLabel(buildId, lgId, label)}
                          onUpdateNotes={(notes) => updateStopNotes(buildId, townStop.id, notes)}
                          onDropGem={(gemName) => dropGem(buildId, townStop.id, gemName)}
                          onUndropGem={(gemName) => undropGem(buildId, townStop.id, gemName)}
                        />
                        {customStopsAfter.map((cs) => {
                          const csResolved = resolveLinkGroupsAtStop(build.linkGroups, cs.stopId);
                          const csInventoryGemNames = getInventoryAtStop(build, cs.stopId);
                          return (
                            <StopSection
                              key={cs.stopId}
                              stopPlan={cs}
                              townStop={townStop}
                              buildId={buildId}
                              className={build.className}
                              inventoryGemNames={csInventoryGemNames}
                              inventoryOnly={inventoryOnly}
                              resolvedLinkGroups={csResolved}
                              disabledStopIds={disabledStopIds}
                              isCustomStop
                              showQuestRewards={cs.stopId === firstQuestRewardId}
                              onToggleEnabled={() => toggleStopEnabled(buildId, cs.stopId)}
                              onAddGemPickup={(pickup) => addGemPickup(buildId, cs.stopId, pickup)}
                              onRemoveGemPickup={(pickupId) => removeGemPickup(buildId, cs.stopId, pickupId)}
                              onSetPickupMode={(pickupId, mode) => setGemPickupMode(buildId, cs.stopId, pickupId, mode)}
                              onAddLinkGroup={(fromStopId) => addLinkGroup(buildId, fromStopId)}
                              onAddPhase={(lgId, fromStopId) => addPhase(buildId, lgId, fromStopId)}
                              onRetireLinkGroup={(lgId, fromStopId) => retireLinkGroup(buildId, lgId, fromStopId)}
                              onUpdatePhase={(lgId, phaseId, updates) => updatePhase(buildId, lgId, phaseId, updates)}
                              onRemovePhase={(lgId, phaseId) => removePhase(buildId, lgId, phaseId)}
                              onUpdateLinkGroupLabel={(lgId, label) => updateLinkGroupLabel(buildId, lgId, label)}
                              onUpdateNotes={(notes) => updateStopNotes(buildId, cs.stopId, notes)}
                              onDropGem={(gemName) => dropGem(buildId, cs.stopId, gemName)}
                              onUndropGem={(gemName) => undropGem(buildId, cs.stopId, gemName)}
                              onDeleteCustomStop={() => removeCustomStop(buildId, cs.stopId)}
                              onUpdateCustomLabel={(label) => updateCustomStopLabel(buildId, cs.stopId, label)}
                            />
                          );
                        })}
                        <div className="mb-[7px] -mt-1 pl-1">
                          <button
                            type="button"
                            onClick={() => addCustomStop(buildId, townStop.id)}
                            className="text-[11px] text-poe-faint hover:text-poe-muted transition-colors cursor-pointer"
                          >
                            + custom stop
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
