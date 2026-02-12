'use client';

import type { TownStop } from '@/data/town-stops';
import { GEM_QUESTS, type GemQuest } from '@/data/town-stops';

interface StopHeaderProps {
  townStop: TownStop;
  previousQuestsCompleted: string[];
  enabled: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleEnabled: () => void;
  summary: string;
}

function getNewQuestNames(current: string[], previous: string[]): string[] {
  const prevSet = new Set(previous);
  const questMap = new Map<string, GemQuest>();
  for (const q of GEM_QUESTS) questMap.set(q.id, q);
  return current
    .filter((id) => !prevSet.has(id) && questMap.has(id))
    .map((id) => questMap.get(id)!.name);
}

export function StopHeader({ townStop, previousQuestsCompleted, enabled, isOpen, onToggleOpen, onToggleEnabled, summary }: StopHeaderProps) {
  const newQuestNames = getNewQuestNames(townStop.questsCompleted, previousQuestsCompleted);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleEnabled();
        }}
        className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
          enabled
            ? 'border-poe-gold bg-poe-gold/20 text-poe-gold'
            : 'border-poe-border bg-poe-bg/50 text-poe-muted'
        }`}
        title={enabled ? 'Disable this stop' : 'Enable this stop'}
      >
        {enabled ? '\u2713' : ''}
      </button>
      <button
        type="button"
        onClick={onToggleOpen}
        className={`flex-1 flex items-center justify-between rounded-md border px-4 py-2.5 text-left transition-colors ${
          enabled
            ? 'border-poe-border bg-poe-card hover:bg-poe-border/30'
            : 'border-poe-border/50 bg-poe-card/50 opacity-60'
        }`}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-poe-muted">{isOpen ? '\u25BC' : '\u25B6'}</span>
            <span className={`text-sm font-semibold ${enabled ? 'text-poe-gold' : 'text-poe-muted'}`}>
              {townStop.label}
            </span>
          </div>
          {newQuestNames.length > 0 && (
            <span className="text-[10px] text-poe-muted/70 ml-5">
              {newQuestNames.join(', ')}
            </span>
          )}
        </div>
        <span className="text-xs text-poe-muted">{summary}</span>
      </button>
    </div>
  );
}
