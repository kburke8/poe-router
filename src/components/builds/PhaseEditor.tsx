'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
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

function SortableGemSlot({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 text-poe-muted/50 hover:text-poe-muted">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(String(active.id).split('-')[1]);
    const newIndex = Number(String(over.id).split('-')[1]);
    const newGems = [...phase.gems];
    const [moved] = newGems.splice(oldIndex, 1);
    newGems.splice(newIndex, 0, moved);
    onChange({ gems: newGems });
  };

  const gemIds = phase.gems.map((_: GemSlot, i: number) => `gem-${i}`);

  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(() => new Set());

  const toggleSlotExpanded = (index: number) => {
    setExpandedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

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

  const handleAddAlternative = (slotIndex: number) => {
    const newGems = [...phase.gems];
    const slot = newGems[slotIndex];
    const alts = slot.alternatives ? [...slot.alternatives] : [];
    alts.push({ gemName: '', socketColor: 'R' });
    newGems[slotIndex] = { ...slot, alternatives: alts };
    onChange({ gems: newGems });
    setExpandedSlots((prev) => new Set(prev).add(slotIndex));
  };

  const handleRemoveAlternative = (slotIndex: number, altIndex: number) => {
    const newGems = [...phase.gems];
    const slot = newGems[slotIndex];
    const alts = [...(slot.alternatives ?? [])];
    alts.splice(altIndex, 1);
    newGems[slotIndex] = { ...slot, alternatives: alts.length > 0 ? alts : undefined };
    onChange({ gems: newGems });
  };

  const handleAltGemSelect = (slotIndex: number, altIndex: number, gemName: string, newSocketColor?: SocketColor) => {
    const newGems = [...phase.gems];
    const slot = newGems[slotIndex];
    const alts = [...(slot.alternatives ?? [])];
    alts[altIndex] = {
      ...alts[altIndex],
      gemName,
      ...(newSocketColor ? { socketColor: newSocketColor } : {}),
    };
    newGems[slotIndex] = { ...slot, alternatives: alts };
    onChange({ gems: newGems });
  };

  const handleAltColorClick = (slotIndex: number, altIndex: number) => {
    const newGems = [...phase.gems];
    const slot = newGems[slotIndex];
    const alts = [...(slot.alternatives ?? [])];
    alts[altIndex] = { ...alts[altIndex], socketColor: cycleColor(alts[altIndex].socketColor) };
    newGems[slotIndex] = { ...slot, alternatives: alts };
    onChange({ gems: newGems });
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={gemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {phase.gems.map((gem: GemSlot, i: number) => {
              const altCount = gem.alternatives?.length ?? 0;
              const isExpanded = expandedSlots.has(i);

              return (
                <SortableGemSlot key={gemIds[i]} id={gemIds[i]}>
                  <div>
                    <div className="flex items-center gap-2">
                      <SocketColorIndicator color={gem.socketColor} />
                      <GemSlotCombobox
                        value={gem.gemName}
                        socketColor={gem.socketColor}
                        onSelect={(name, sc) => handleGemSelect(i, name, sc)}
                        priorityGemNames={stopGemNames}
                        placeholder={`Gem ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => altCount > 0 ? toggleSlotExpanded(i) : handleAddAlternative(i)}
                        className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-poe-border/40 text-poe-muted hover:text-poe-text hover:border-poe-gold/40 transition-colors cursor-pointer"
                        title={altCount > 0 ? 'Toggle alternatives' : 'Add alternative gem'}
                      >
                        {altCount > 0 ? `Alt ${altCount}` : 'Alt'}
                      </button>
                    </div>

                    {/* Alternatives section */}
                    {isExpanded && (
                      <div className="ml-5 mt-1 mb-1 pl-2 border-l-2 border-poe-gold/20 space-y-1">
                        {gem.alternatives?.map((alt, ai) => (
                          <div key={ai} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAltColorClick(i, ai)}
                              className="cursor-pointer p-0.5 rounded hover:bg-poe-border/50 transition-colors"
                              title={`Click to cycle socket color (${alt.socketColor})`}
                            >
                              <SocketColorIndicator color={alt.socketColor} className="h-3.5 w-3.5" />
                            </button>
                            <GemSlotCombobox
                              value={alt.gemName}
                              socketColor={alt.socketColor}
                              onSelect={(name, sc) => handleAltGemSelect(i, ai, name, sc)}
                              priorityGemNames={stopGemNames}
                              placeholder="Alternative gem"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveAlternative(i, ai)}
                              className="shrink-0 text-xs text-poe-muted hover:text-red-400 transition-colors cursor-pointer px-1"
                              title="Remove alternative"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddAlternative(i)}
                          className="flex items-center gap-1 text-[10px] text-poe-muted hover:text-poe-text transition-colors py-0.5 cursor-pointer"
                        >
                          <span className="text-poe-gold/60">+</span> Add alt
                        </button>
                      </div>
                    )}
                  </div>
                </SortableGemSlot>
              );
            })}
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
        </SortableContext>
      </DndContext>

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
