'use client';

import { MuleSection } from '@/components/builds/MuleSection';
import type { BuildPlan, MulePickup } from '@/types/build';

interface MuleStepProps {
  build: BuildPlan;
  onUpdateMuleClass: (className: string) => void;
  onAddMulePickup: (pickup: MulePickup) => void;
  onRemoveMulePickup: (pickupId: string) => void;
}

export function MuleStep({ build, onUpdateMuleClass, onAddMulePickup, onRemoveMulePickup }: MuleStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-poe-gold mb-1">Mule Setup</h2>
        <p className="text-sm text-poe-muted">
          Optionally configure a mule character to pick up extra gems at the start.
          You can skip this step if you don&apos;t need a mule.
        </p>
      </div>

      <MuleSection
        muleClassName={build.muleClassName ?? ''}
        mulePickups={build.mulePickups ?? []}
        onUpdateMuleClass={onUpdateMuleClass}
        onAddPickup={onAddMulePickup}
        onRemovePickup={onRemoveMulePickup}
      />
    </div>
  );
}
