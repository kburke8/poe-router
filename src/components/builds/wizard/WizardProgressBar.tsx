'use client';

import { useState, useRef, useEffect } from 'react';
import type { TownStop } from '@/data/town-stops';

export type WizardPhase = 'identity' | 'mule' | 'route' | 'gear' | 'review';

export type WizardStepDef =
  | { type: 'identity' }
  | { type: 'mule' }
  | { type: 'stop'; stopPlan: { stopId: string; enabled: boolean }; townStop: TownStop }
  | { type: 'gear' }
  | { type: 'review' };

function getPhaseForStep(step: WizardStepDef): WizardPhase {
  switch (step.type) {
    case 'identity': return 'identity';
    case 'mule': return 'mule';
    case 'stop': return 'route';
    case 'gear': return 'gear';
    case 'review': return 'review';
  }
}

interface PhaseInfo {
  phase: WizardPhase;
  label: string;
  firstStepIndex: number;
}

const PHASE_ORDER: WizardPhase[] = ['identity', 'mule', 'route', 'gear', 'review'];
const PHASE_LABELS: Record<WizardPhase, string> = {
  identity: 'Class',
  mule: 'Mule',
  route: 'Route',
  gear: 'Gear',
  review: 'Review',
};

interface WizardProgressBarProps {
  steps: WizardStepDef[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
  canNavigateTo: (index: number) => boolean;
}

export function WizardProgressBar({ steps, currentStepIndex, onStepClick, canNavigateTo }: WizardProgressBarProps) {
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!routeDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRouteDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [routeDropdownOpen]);

  const currentStep = steps[currentStepIndex];
  const currentPhase = currentStep ? getPhaseForStep(currentStep) : 'identity';

  // Build phase info with first step indices
  const phases: PhaseInfo[] = [];
  const seenPhases = new Set<WizardPhase>();
  for (let i = 0; i < steps.length; i++) {
    const phase = getPhaseForStep(steps[i]);
    if (!seenPhases.has(phase)) {
      seenPhases.add(phase);
      phases.push({ phase, label: PHASE_LABELS[phase], firstStepIndex: i });
    }
  }

  // Route-specific info
  const routeSteps = steps
    .map((s, i) => ({ step: s, index: i }))
    .filter((x) => x.step.type === 'stop');
  const currentRouteIndex = routeSteps.findIndex((x) => x.index === currentStepIndex);
  const routeTotal = routeSteps.length;

  return (
    <div className="flex items-center gap-1">
      {phases.map((phaseInfo, i) => {
        const phaseIdx = PHASE_ORDER.indexOf(phaseInfo.phase);
        const currentPhaseIdx = PHASE_ORDER.indexOf(currentPhase);
        const isActive = phaseInfo.phase === currentPhase;
        const isCompleted = phaseIdx < currentPhaseIdx;
        const isClickable = canNavigateTo(phaseInfo.firstStepIndex);

        // Route phase label with current stop + counter
        let displayLabel = phaseInfo.label;
        if (phaseInfo.phase === 'route' && routeTotal > 0) {
          if (isActive && currentStep?.type === 'stop') {
            displayLabel = `A${currentStep.townStop.actNumber}: ${currentStep.townStop.label}`;
          } else if (isCompleted) {
            displayLabel = `Route`;
          }
        }

        const routeCounter =
          phaseInfo.phase === 'route' && routeTotal > 0
            ? ` (${isActive ? currentRouteIndex + 1 : isCompleted ? routeTotal : 0}/${routeTotal})`
            : '';

        return (
          <div key={phaseInfo.phase} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-6 h-px mx-0.5 ${
                  isCompleted ? 'bg-poe-gold/60' : 'bg-poe-border'
                }`}
              />
            )}
            <div className="relative" ref={phaseInfo.phase === 'route' ? dropdownRef : undefined}>
              <button
                type="button"
                onClick={() => {
                  if (phaseInfo.phase === 'route' && isActive) {
                    setRouteDropdownOpen(!routeDropdownOpen);
                  } else if (isClickable) {
                    onStepClick(phaseInfo.firstStepIndex);
                    setRouteDropdownOpen(false);
                  }
                }}
                disabled={!isClickable && !isActive}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-poe-gold/20 text-poe-gold'
                    : isCompleted
                      ? 'text-poe-gold/70 hover:text-poe-gold cursor-pointer'
                      : isClickable
                        ? 'text-poe-muted hover:text-poe-text cursor-pointer'
                        : 'text-poe-muted/40 cursor-not-allowed'
                }`}
              >
                <span
                  className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold border shrink-0 ${
                    isActive
                      ? 'border-poe-gold bg-poe-gold/20 text-poe-gold'
                      : isCompleted
                        ? 'border-poe-gold/60 bg-poe-gold/10 text-poe-gold/70'
                        : 'border-poe-border text-poe-muted/60'
                  }`}
                >
                  {isCompleted ? '\u2713' : phaseIdx + 1}
                </span>
                <span className="hidden sm:inline truncate max-w-[180px]">
                  {displayLabel}{routeCounter}
                </span>
                {phaseInfo.phase === 'route' && isActive && (
                  <span className="text-[10px] ml-0.5">{routeDropdownOpen ? '\u25B2' : '\u25BC'}</span>
                )}
              </button>

              {/* Route dropdown */}
              {phaseInfo.phase === 'route' && routeDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 min-w-[220px] max-h-[320px] overflow-y-auto rounded-md border border-poe-border bg-poe-card shadow-lg">
                  {routeSteps.map((rs, rsIdx) => {
                    const stopStep = rs.step as Extract<WizardStepDef, { type: 'stop' }>;
                    const isCurrent = rs.index === currentStepIndex;
                    const canNav = canNavigateTo(rs.index);
                    const isDisabled = !stopStep.stopPlan.enabled;

                    return (
                      <button
                        key={rs.index}
                        type="button"
                        onClick={() => {
                          if (canNav) {
                            onStepClick(rs.index);
                            setRouteDropdownOpen(false);
                          }
                        }}
                        disabled={!canNav}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          isCurrent
                            ? 'bg-poe-gold/20 text-poe-gold'
                            : isDisabled
                              ? 'text-poe-muted/40 hover:bg-poe-panel/30'
                              : canNav
                                ? 'text-poe-text hover:bg-poe-panel/50'
                                : 'text-poe-muted/40 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-poe-muted mr-1.5">{rsIdx + 1}.</span>
                        {isDisabled && <span className="text-poe-muted/40 mr-1" title="Disabled">&#x2013;</span>}
                        A{stopStep.townStop.actNumber}: {stopStep.townStop.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
