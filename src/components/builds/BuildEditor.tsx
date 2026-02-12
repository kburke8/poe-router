'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useBuildStore } from '@/stores/useBuildStore';
import { BuildHeader } from '@/components/builds/BuildHeader';
import { StopSection } from '@/components/builds/StopSection';
import { GearGoalsPanel } from '@/components/builds/GearGoalsPanel';
import { MuleSection } from '@/components/builds/MuleSection';
import { TOWN_STOPS, getStopsForAct, getActNumbers } from '@/data/town-stops';
import { getBeachGems } from '@/data/classes';
import { resolveLinkGroupsAtStop } from '@/lib/link-group-resolver';

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
    addGearGoal,
    updateGearGoal,
    removeGearGoal,
    toggleGearGoalAcquired,
    updateMuleClass,
    addMulePickup,
    removeMulePickup,
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

      {/* Gear Goals (build-level) */}
      <GearGoalsPanel
        goals={build.gearGoals}
        onAdd={(goal) => addGearGoal(buildId, goal)}
        onUpdate={(goalId, updates) => updateGearGoal(buildId, goalId, updates)}
        onRemove={(goalId) => removeGearGoal(buildId, goalId)}
        onToggleAcquired={(goalId) => toggleGearGoalAcquired(buildId, goalId)}
      />

      {/* Mule (optional) */}
      <MuleSection
        muleClassName={build.muleClassName ?? ''}
        mulePickups={build.mulePickups ?? []}
        onUpdateMuleClass={(cls) => updateMuleClass(buildId, cls)}
        onAddPickup={(pickup) => addMulePickup(buildId, pickup)}
        onRemovePickup={(pickupId) => removeMulePickup(buildId, pickupId)}
      />

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
                  return (
                    <StopSection
                      key={townStop.id}
                      stopPlan={stopPlan!}
                      townStop={townStop}
                      buildId={buildId}
                      className={build.className}
                      stopGemNames={stopGemNames}
                      resolvedLinkGroups={resolved}
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
