'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { TownStop } from '@/data/town-stops';
import { GEM_QUESTS, type GemQuest } from '@/data/town-stops';

interface StopHeaderProps {
  townStop: TownStop;
  previousQuestsCompleted: string[];
  effectiveQuestsCompleted?: string[];
  enabled: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleEnabled: () => void;
  summary: string;
  isCustomStop?: boolean;
  customLabel?: string;
  onUpdateCustomLabel?: (label: string) => void;
  onDeleteCustomStop?: () => void;
}

function getNewQuestNames(current: string[], previous: string[]): string[] {
  const prevSet = new Set(previous);
  const questMap = new Map<string, GemQuest>();
  for (const q of GEM_QUESTS) questMap.set(q.id, q);
  return current
    .filter((id) => !prevSet.has(id) && questMap.has(id))
    .map((id) => questMap.get(id)!.name);
}

export function StopHeader({ townStop, previousQuestsCompleted, effectiveQuestsCompleted, enabled, isOpen, onToggleOpen, onToggleEnabled, summary, isCustomStop, customLabel, onUpdateCustomLabel, onDeleteCustomStop }: StopHeaderProps) {
  const currentQuests = effectiveQuestsCompleted ?? townStop.questsCompleted;
  const newQuestNames = isCustomStop ? [] : getNewQuestNames(currentQuests, previousQuestsCompleted);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(customLabel ?? '');

  const displayLabel = isCustomStop ? (customLabel || 'Custom Stop') : townStop.label;

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
          isCustomStop
            ? enabled
              ? 'border-poe-gold/30 bg-poe-card hover:bg-poe-border/30 border-dashed'
              : 'border-poe-border/50 bg-poe-card/50 opacity-60 border-dashed'
            : enabled
              ? 'border-poe-border bg-poe-card hover:bg-poe-border/30'
              : 'border-poe-border/50 bg-poe-card/50 opacity-60'
        }`}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-poe-muted">{isOpen ? '\u25BC' : '\u25B6'}</span>
            {isCustomStop && editingLabel ? (
              <input
                type="text"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={() => {
                  setEditingLabel(false);
                  if (onUpdateCustomLabel && labelDraft.trim()) {
                    onUpdateCustomLabel(labelDraft.trim());
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingLabel(false);
                    if (onUpdateCustomLabel && labelDraft.trim()) {
                      onUpdateCustomLabel(labelDraft.trim());
                    }
                  }
                  if (e.key === 'Escape') {
                    setEditingLabel(false);
                    setLabelDraft(customLabel ?? '');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="bg-transparent border-b border-poe-gold text-sm font-semibold text-poe-gold focus:outline-none w-48"
              />
            ) : (
              <>
                <span
                  className={`text-sm font-semibold ${enabled ? 'text-poe-gold' : 'text-poe-muted'}`}
                >
                  {displayLabel}
                </span>
                {isCustomStop && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLabelDraft(customLabel ?? '');
                      setEditingLabel(true);
                    }}
                    className="text-poe-muted/40 hover:text-poe-gold transition-colors"
                    title="Rename"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </div>
          {newQuestNames.length > 0 && (
            <span className="text-[10px] text-poe-muted/70 ml-5">
              {newQuestNames.join(', ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-poe-muted">{summary}</span>
          {isCustomStop && onDeleteCustomStop && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCustomStop();
              }}
              className="text-poe-muted/50 hover:text-poe-red transition-colors"
              title="Delete custom stop"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </button>
    </div>
  );
}
