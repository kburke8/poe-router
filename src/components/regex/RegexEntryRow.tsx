'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Pencil, X, Check } from 'lucide-react';
import type { RegexEntry } from '@/types/regex';

interface RegexEntryRowProps {
  entry: RegexEntry;
  /** Accent colour when the chip is toggled on. */
  accent?: 'gold' | 'red';
  onToggle: () => void;
  onUpdatePattern: (pattern: string) => void;
  onDelete: () => void;
}

/**
 * A single regex entry rendered as a toggleable pill chip.
 * Click the label to toggle enabled; hover reveals edit (pattern) and delete.
 */
export function RegexEntryRow({
  entry,
  accent = 'gold',
  onToggle,
  onUpdatePattern,
  onDelete,
}: RegexEntryRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.pattern);

  const label = entry.sourceName ?? entry.pattern;

  function commitEdit() {
    if (draft.trim()) onUpdatePattern(draft.trim());
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(entry.pattern);
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-poe-gold/50 bg-poe-input py-1 pl-3 pr-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          className="w-36 bg-transparent font-mono text-xs text-poe-text focus:outline-none"
          aria-label={`Edit pattern for ${label}`}
          autoFocus
        />
        <button
          onClick={commitEdit}
          className="rounded-full p-0.5 text-poe-green hover:bg-poe-green/20"
          aria-label="Save pattern"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={cancelEdit}
          className="rounded-full p-0.5 text-poe-red hover:bg-poe-red/20"
          aria-label="Cancel edit"
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return (
    <span
      className={clsx(
        'group inline-flex items-center rounded-full border py-1 pl-3 pr-1.5 text-xs font-semibold transition-colors',
        entry.enabled
          ? accent === 'red'
            ? 'border-poe-red/70 bg-poe-red/15 text-poe-red'
            : 'border-poe-gold/70 bg-[rgba(230,194,106,.16)] text-poe-gold'
          : 'border-transparent bg-white/[0.04] text-poe-text hover:bg-white/[0.07]',
      )}
    >
      <button
        onClick={onToggle}
        title={entry.pattern}
        className="max-w-[14rem] truncate"
        aria-pressed={entry.enabled}
        aria-label={`Toggle ${label}`}
      >
        {label}
      </button>
      <span className="ml-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          onClick={() => {
            setDraft(entry.pattern);
            setEditing(true);
          }}
          className="rounded-full p-0.5 text-poe-muted hover:bg-white/10 hover:text-poe-bright"
          aria-label={`Edit pattern for ${label}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-full p-0.5 text-poe-muted hover:bg-poe-red/20 hover:text-poe-red"
          aria-label={`Delete ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    </span>
  );
}
