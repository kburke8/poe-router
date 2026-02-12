'use client';

import { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { GearGoal } from '@/types/build';
import { TOWN_STOPS } from '@/data/town-stops';

interface GearGoalsPanelProps {
  goals: GearGoal[];
  onAdd: (goal: GearGoal) => void;
  onUpdate: (goalId: string, updates: Partial<GearGoal>) => void;
  onRemove: (goalId: string) => void;
  onToggleAcquired: (goalId: string) => void;
}

export function GearGoalsPanel({ goals, onAdd, onUpdate, onRemove, onToggleAcquired }: GearGoalsPanelProps) {
  const [open, setOpen] = useState(false);
  const [newSlot, setNewSlot] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = () => {
    if (!newSlot.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      slot: newSlot.trim(),
      description: newDesc.trim(),
      acquired: false,
    });
    setNewSlot('');
    setNewDesc('');
  };

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between rounded-md border border-poe-border bg-poe-card px-4 py-3 text-left hover:bg-poe-border/30 transition-colors"
        >
          <span className="text-base font-semibold text-poe-gold">
            Gear Goals ({goals.length})
          </span>
          <span className="text-sm text-poe-muted">
            {goals.filter((g) => g.acquired).length}/{goals.length} acquired
          </span>
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content className="mt-1 rounded-md border border-poe-border bg-poe-card p-4 space-y-2">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="flex items-center gap-2 rounded border border-poe-border bg-poe-bg/50 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={goal.acquired}
              onChange={() => onToggleAcquired(goal.id)}
              className="h-4 w-4 rounded border-poe-border accent-poe-gold"
            />
            <Input
              value={goal.slot}
              onChange={(e) => onUpdate(goal.id, { slot: e.target.value })}
              className={`w-24 py-1 text-sm font-medium ${goal.acquired ? 'line-through opacity-50' : ''}`}
            />
            <Input
              value={goal.description}
              onChange={(e) => onUpdate(goal.id, { description: e.target.value })}
              className={`flex-1 py-1 text-sm ${goal.acquired ? 'line-through opacity-50' : ''}`}
            />
            <select
              value={goal.targetStopId ?? ''}
              onChange={(e) => onUpdate(goal.id, { targetStopId: e.target.value || undefined })}
              className="rounded border border-poe-border bg-poe-input px-2 py-1 text-xs text-poe-text focus:border-poe-gold focus:outline-none w-32"
              title="Target stop"
            >
              <option value="">Any stop</option>
              {TOWN_STOPS.map((ts) => (
                <option key={ts.id} value={ts.id}>
                  A{ts.actNumber}: {ts.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              className="text-poe-red"
              onClick={() => onRemove(goal.id)}
            >
              x
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            placeholder="Slot (e.g. Helmet)"
            className="w-32 py-1 text-sm"
          />
          <Input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description"
            className="flex-1 py-1 text-sm"
          />
          <Button variant="secondary" size="sm" onClick={handleAdd}>
            Add
          </Button>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
