'use client';

import { Button } from '@/components/ui/Button';

interface WizardStepNavProps {
  currentStep: number;
  totalSteps: number;
  canNext: boolean;
  isSkippable: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function WizardStepNav({
  currentStep,
  totalSteps,
  canNext,
  isSkippable,
  onBack,
  onNext,
  onSkip,
}: WizardStepNavProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === totalSteps;

  return (
    <div className="flex items-center justify-between border-t border-poe-border pt-4 mt-6">
      <div>
        {!isFirst && (
          <Button variant="ghost" size="md" onClick={onBack}>
            &larr; Back
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isSkippable && !isLast && (
          <Button variant="ghost" size="md" onClick={onSkip}>
            Skip
          </Button>
        )}
        <Button
          variant="primary"
          size="md"
          onClick={onNext}
          disabled={!canNext}
        >
          {isLast ? 'Finish' : 'Next \u2192'}
        </Button>
      </div>
    </div>
  );
}
