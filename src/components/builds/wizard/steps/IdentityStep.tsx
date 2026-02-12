'use client';

import { Input } from '@/components/ui/Input';
import { POE_CLASSES, getAscendancies } from '@/data/classes';
import type { BuildPlan } from '@/types/build';

interface IdentityStepProps {
  build: BuildPlan;
  onUpdate: (updates: { name?: string; className?: string; ascendancy?: string }) => void;
  onInitializeStops: () => void;
}

export function IdentityStep({ build, onUpdate, onInitializeStops }: IdentityStepProps) {
  const ascendancies = getAscendancies(build.className);

  const handleClassChange = (newClassName: string) => {
    onUpdate({ className: newClassName });
    if (newClassName) {
      onInitializeStops();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-poe-gold mb-1">Class & Identity</h2>
        <p className="text-sm text-poe-muted">Name your build and choose your class.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-poe-text mb-1.5">Build Name</label>
          <Input
            value={build.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g. League Start SRS Necro"
            className="max-w-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-poe-text mb-1.5">Class</label>
          <select
            value={build.className}
            onChange={(e) => handleClassChange(e.target.value)}
            className="rounded-md border border-poe-border bg-poe-input px-3 py-2 text-sm text-poe-text focus:border-poe-gold focus:outline-none focus:ring-1 focus:ring-poe-gold/50 max-w-xs"
          >
            <option value="">Select Class</option>
            {POE_CLASSES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-poe-text mb-1.5">Ascendancy</label>
          <select
            value={build.ascendancy}
            onChange={(e) => onUpdate({ ascendancy: e.target.value })}
            disabled={!build.className}
            className="rounded-md border border-poe-border bg-poe-input px-3 py-2 text-sm text-poe-text focus:border-poe-gold focus:outline-none focus:ring-1 focus:ring-poe-gold/50 disabled:opacity-50 max-w-xs"
          >
            <option value="">Select Ascendancy</option>
            {ascendancies.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
