'use client';

interface WizardModeToggleProps {
  mode: 'wizard' | 'advanced';
  onModeChange: (mode: 'wizard' | 'advanced') => void;
}

export function WizardModeToggle({ mode, onModeChange }: WizardModeToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-poe-border bg-poe-bg/50 p-0.5">
      <button
        type="button"
        onClick={() => onModeChange('wizard')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'wizard'
            ? 'bg-poe-gold/20 text-poe-gold'
            : 'text-poe-muted hover:text-poe-text'
        }`}
      >
        Wizard
      </button>
      <button
        type="button"
        onClick={() => onModeChange('advanced')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'advanced'
            ? 'bg-poe-gold/20 text-poe-gold'
            : 'text-poe-muted hover:text-poe-text'
        }`}
      >
        Advanced
      </button>
    </div>
  );
}
