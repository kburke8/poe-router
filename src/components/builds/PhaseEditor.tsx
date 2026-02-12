'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SocketColorIndicator } from '@/components/ui/SocketColorIndicator';
import { GemSlotCombobox } from '@/components/builds/GemSlotCombobox';
import type { LinkGroupPhase, BuildLinkGroup, GemSlot, SocketColor } from '@/types/build';
import { getStopById } from '@/data/town-stops';

interface PhaseEditorProps {
  phase: LinkGroupPhase;
  buildLinkGroup: BuildLinkGroup;
  isFirstPhase: boolean;
  onChange: (updates: Partial<Pick<LinkGroupPhase, 'gems' | 'notes'>>) => void;
  onChangeLabel: (label: string) => void;
  onDelete: () => void;
  stopGemNames: string[];
  previousPhaseGems?: GemSlot[];
}

const SOCKET_CYCLE: SocketColor[] = ['R', 'G', 'B', 'W'];

function cycleColor(current: SocketColor): SocketColor {
  const idx = SOCKET_CYCLE.indexOf(current);
  return SOCKET_CYCLE[(idx + 1) % SOCKET_CYCLE.length];
}

export function PhaseEditor({
  phase,
  buildLinkGroup,
  isFirstPhase,
  onChange,
  onChangeLabel,
  onDelete,
  stopGemNames,
  previousPhaseGems,
}: PhaseEditorProps) {
  const handleColorClick = (index: number) => {
    const newGems = [...phase.gems];
    newGems[index] = { ...newGems[index], socketColor: cycleColor(newGems[index].socketColor) };
    onChange({ gems: newGems });
  };

  const handleGemSelect = (index: number, gemName: string, newSocketColor?: SocketColor) => {
    const newGems = [...phase.gems];
    newGems[index] = {
      ...newGems[index],
      gemName,
      ...(newSocketColor ? { socketColor: newSocketColor } : {}),
    };
    onChange({ gems: newGems });
  };

  const addSocket = () => {
    if (phase.gems.length >= 6) return;
    onChange({
      gems: [...phase.gems, { gemName: '', socketColor: 'R' }],
    });
  };

  const removeSocket = () => {
    if (phase.gems.length <= 1) return;
    onChange({
      gems: phase.gems.slice(0, -1),
    });
  };

  // Compute transition diffs from previous phase
  const diffs: { index: number; from: string; to: string }[] = [];
  if (previousPhaseGems) {
    const maxLen = Math.max(previousPhaseGems.length, phase.gems.length);
    for (let i = 0; i < maxLen; i++) {
      const prev = previousPhaseGems[i]?.gemName || '';
      const curr = phase.gems[i]?.gemName || '';
      if (prev !== curr && (prev || curr)) {
        diffs.push({ index: i, from: prev, to: curr });
      }
    }
  }

  const stopInfo = getStopById(phase.fromStopId);
  const isOnlyPhase = buildLinkGroup.phases.length === 1;

  return (
    <div className="rounded-md border border-poe-gold/30 bg-poe-bg/50 p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {phase.gems.map((gem, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleColorClick(i)}
                className="cursor-pointer p-0.5 rounded hover:bg-poe-border/50 transition-colors"
                title={`Click to cycle socket color (${gem.socketColor})`}
              >
                <SocketColorIndicator color={gem.socketColor} className="h-4 w-4" />
              </button>
            ))}
            <span className="ml-2 text-xs text-poe-muted">{phase.gems.length}L</span>
          </div>
          {isFirstPhase && (
            <Input
              value={buildLinkGroup.label}
              onChange={(e) => onChangeLabel(e.target.value)}
              placeholder="Label (e.g. Main 4L)"
              className="text-xs py-1 max-w-[140px]"
            />
          )}
          {!isFirstPhase && stopInfo && (
            <span className="text-xs text-poe-gold/70">
              Phase @ {stopInfo.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={removeSocket}
            disabled={phase.gems.length <= 1}
            title="Remove socket"
          >
            -
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addSocket}
            disabled={phase.gems.length >= 6}
            title="Add socket"
          >
            +
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            {isOnlyPhase ? 'Delete Group' : 'Delete Phase'}
          </Button>
        </div>
      </div>

      {/* Transition diffs */}
      {diffs.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {diffs.map((d) => (
            <span key={d.index} className="text-poe-gold/80">
              &#x27F3; {d.from || '(empty)'} &rarr; {d.to || '(empty)'}
            </span>
          ))}
        </div>
      )}

      {/* Gem slots */}
      <div className="space-y-1">
        {phase.gems.map((gem: GemSlot, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <SocketColorIndicator color={gem.socketColor} />
            <GemSlotCombobox
              value={gem.gemName}
              socketColor={gem.socketColor}
              onSelect={(name, sc) => handleGemSelect(i, name, sc)}
              priorityGemNames={stopGemNames}
              placeholder={`Gem ${i + 1}`}
            />
          </div>
        ))}
        {phase.gems.length < 6 && (
          <button
            type="button"
            onClick={addSocket}
            className="flex items-center gap-1.5 text-xs text-poe-muted hover:text-poe-text transition-colors py-1 cursor-pointer"
          >
            <span className="text-poe-gold/60">+</span> Add socket
          </button>
        )}
      </div>

      {/* Notes */}
      <Input
        value={phase.notes || ''}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="Notes (optional)"
        className="text-xs text-poe-muted"
      />
    </div>
  );
}
