'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBuildStore } from '@/stores/useBuildStore';
import { WizardProgressBar, type WizardStepDef } from './WizardProgressBar';
import { WizardStepNav } from './WizardStepNav';
import { IdentityStep } from './steps/IdentityStep';
import { MuleStep } from './steps/MuleStep';
import { StopStep } from './steps/StopStep';
import { GearGoalsStep } from './steps/GearGoalsStep';
import { ReviewStep } from './steps/ReviewStep';
import { TOWN_STOPS } from '@/data/town-stops';
import type { BuildPlan } from '@/types/build';

interface BuildWizardProps {
  buildId: string;
  onSwitchToAdvanced: () => void;
  inventoryOnly: boolean;
}

function computeSteps(build: BuildPlan): WizardStepDef[] {
  const steps: WizardStepDef[] = [
    { type: 'identity' },
    { type: 'mule' },
  ];

  // Add one step per town stop (including disabled, so users can re-enable)
  const townStops = build.stops
    .filter((s) => !s.isCustom)
    .map((s) => {
      const townStop = TOWN_STOPS.find((ts) => ts.id === s.stopId);
      return { stopPlan: s, townStop };
    })
    .filter((x) => x.townStop)
    .sort((a, b) => a.townStop!.sortOrder - b.townStop!.sortOrder);

  for (const { stopPlan, townStop } of townStops) {
    steps.push({ type: 'stop', stopPlan, townStop: townStop! });
  }

  steps.push({ type: 'gear' });
  steps.push({ type: 'review' });

  return steps;
}

function detectInitialStep(build: BuildPlan, steps: WizardStepDef[]): number {
  if (!build.className) return 0;
  const hasGemPickups = build.stops.some((s) => s.gemPickups.length > 0);
  if (!hasGemPickups) {
    // Jump to first stop step
    const firstStopIdx = steps.findIndex((s) => s.type === 'stop');
    return firstStopIdx >= 0 ? firstStopIdx : 2;
  }
  if (build.linkGroups.length > 0 || build.gearGoals.length > 0) {
    return steps.length - 1; // Review
  }
  // Jump to first stop step
  const firstStopIdx = steps.findIndex((s) => s.type === 'stop');
  return firstStopIdx >= 0 ? firstStopIdx : 2;
}

/** Outer wrapper: handles loading, then mounts the inner wizard with the correct initial step */
export function BuildWizard({ buildId, onSwitchToAdvanced, inventoryOnly }: BuildWizardProps) {
  const { builds, loadBuilds, isLoading, initializeStops } = useBuildStore();
  const build = builds.find((b) => b.id === buildId);

  useEffect(() => {
    if (builds.length === 0) {
      loadBuilds();
    }
  }, [builds.length, loadBuilds]);

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

  const steps = computeSteps(build);
  const initialStep = detectInitialStep(build, steps);

  return (
    <BuildWizardInner
      key={buildId}
      build={build}
      buildId={buildId}
      initialStep={initialStep}
      onSwitchToAdvanced={onSwitchToAdvanced}
      inventoryOnly={inventoryOnly}
    />
  );
}

interface BuildWizardInnerProps {
  build: BuildPlan;
  buildId: string;
  initialStep: number;
  onSwitchToAdvanced: () => void;
  inventoryOnly: boolean;
}

function BuildWizardInner({ build, buildId, initialStep, onSwitchToAdvanced, inventoryOnly }: BuildWizardInnerProps) {
  const router = useRouter();
  const {
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

  const steps = useMemo(() => computeSteps(build), [build]);
  const [currentStep, setCurrentStepRaw] = useState(() =>
    Math.min(initialStep, steps.length - 1),
  );

  // Clamp currentStep to valid range when steps shrink
  const clampedStep = Math.min(currentStep, steps.length - 1);

  const setCurrentStep = useCallback(
    (step: number) => {
      setCurrentStepRaw(Math.min(step, steps.length - 1));
      window.scrollTo(0, 0);
    },
    [steps.length],
  );

  const canNavigateTo = useCallback(
    (stepIndex: number) => {
      if (stepIndex === 0) return true;
      if (!build.className) return false;
      return true;
    },
    [build.className],
  );

  const canProceed = useCallback(() => {
    const step = steps[clampedStep];
    if (!step) return false;
    if (step.type === 'identity') return !!build.className;
    return true;
  }, [build.className, clampedStep, steps]);

  const currentStepDef = steps[clampedStep];
  const isSkippable = currentStepDef?.type === 'mule' || currentStepDef?.type === 'gear';

  const goNext = () => {
    if (clampedStep < steps.length - 1) {
      setCurrentStep(clampedStep + 1);
    }
  };

  const goBack = () => {
    if (clampedStep > 0) {
      setCurrentStep(clampedStep - 1);
    }
  };

  return (
    <div className="space-y-4">
      <WizardProgressBar
        steps={steps}
        currentStepIndex={clampedStep}
        onStepClick={setCurrentStep}
        canNavigateTo={canNavigateTo}
      />

      <div className="rounded-lg border border-poe-border bg-poe-card p-6">
        {currentStepDef?.type === 'identity' && (
          <IdentityStep
            build={build}
            onUpdate={(updates) => updateBuildInfo(buildId, updates)}
            onInitializeStops={() => initializeStops(buildId)}
          />
        )}

        {currentStepDef?.type === 'mule' && (
          <MuleStep
            build={build}
            onUpdateMuleClass={(cls) => updateMuleClass(buildId, cls)}
            onAddMulePickup={(pickup) => addMulePickup(buildId, pickup)}
            onRemoveMulePickup={(pickupId) => removeMulePickup(buildId, pickupId)}
          />
        )}

        {currentStepDef?.type === 'stop' && (
          <StopStep
            build={build}
            stopPlan={build.stops.find((s) => s.stopId === currentStepDef.stopPlan.stopId)!}
            townStop={currentStepDef.townStop}
            inventoryOnly={inventoryOnly}
            onToggleStopEnabled={(stopId) => toggleStopEnabled(buildId, stopId)}
            onAddGemPickup={(stopId, pickup) => addGemPickup(buildId, stopId, pickup)}
            onRemoveGemPickup={(stopId, pickupId) => removeGemPickup(buildId, stopId, pickupId)}
            onUpdateStopNotes={(stopId, notes) => updateStopNotes(buildId, stopId, notes)}
            onAddLinkGroup={(fromStopId) => addLinkGroup(buildId, fromStopId)}
            onAddPhase={(lgId, fromStopId) => addPhase(buildId, lgId, fromStopId)}
            onRetireLinkGroup={(lgId, fromStopId) => retireLinkGroup(buildId, lgId, fromStopId)}
            onUpdatePhase={(lgId, phaseId, updates) => updatePhase(buildId, lgId, phaseId, updates)}
            onRemovePhase={(lgId, phaseId) => removePhase(buildId, lgId, phaseId)}
            onUpdateLinkGroupLabel={(lgId, label) => updateLinkGroupLabel(buildId, lgId, label)}
            onDropGem={(stopId, gemName) => dropGem(buildId, stopId, gemName)}
            onUndropGem={(stopId, gemName) => undropGem(buildId, stopId, gemName)}
            onAddCustomStop={(afterStopId) => addCustomStop(buildId, afterStopId)}
            onRemoveCustomStop={(stopId) => removeCustomStop(buildId, stopId)}
            onUpdateCustomStopLabel={(stopId, label) => updateCustomStopLabel(buildId, stopId, label)}
          />
        )}

        {currentStepDef?.type === 'gear' && (
          <GearGoalsStep
            build={build}
            onAdd={(goal) => addGearGoal(buildId, goal)}
            onUpdate={(goalId, updates) => updateGearGoal(buildId, goalId, updates)}
            onRemove={(goalId) => removeGearGoal(buildId, goalId)}
            onToggleAcquired={(goalId) => toggleGearGoalAcquired(buildId, goalId)}
          />
        )}

        {currentStepDef?.type === 'review' && (
          <ReviewStep
            build={build}
            buildId={buildId}
            onUpdate={(updates) => updateBuildInfo(buildId, updates)}
            onSwitchToAdvanced={onSwitchToAdvanced}
          />
        )}

        <WizardStepNav
          currentStep={clampedStep + 1}
          totalSteps={steps.length}
          canNext={canProceed()}
          isSkippable={isSkippable}
          onBack={goBack}
          onNext={goNext}
          onSkip={goNext}
          onFinish={() => router.push(`/builds/${buildId}/run`)}
        />
      </div>
    </div>
  );
}
