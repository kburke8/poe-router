'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import type { RegexEntry } from '@/types/regex';

interface RegexEntryRowProps {
  entry: RegexEntry;
  onToggle: () => void;
  onUpdatePattern: (pattern: string) => void;
  onDelete: () => void;
}

export function RegexEntryRow({ entry, onToggle, onUpdatePattern, onDelete }: RegexEntryRowProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <input
        type="checkbox"
        checked={entry.enabled}
        onChange={onToggle}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-poe-gold"
        aria-label={`Toggle ${entry.sourceName ?? entry.pattern}`}
      />

      {entry.sourceName && (
        <span
          className="shrink-0 truncate text-xs text-poe-muted"
          style={{ maxWidth: '8rem' }}
          title={entry.sourceName}
        >
          {entry.sourceName}
        </span>
      )}

      <Input
        value={entry.pattern}
        onChange={(e) => onUpdatePattern(e.target.value)}
        className="h-7 flex-1 px-2 py-0.5 font-mono text-xs"
        aria-label="Regex pattern"
      />

      <button
        onClick={onDelete}
        className="shrink-0 rounded p-1 text-poe-muted transition-colors hover:bg-poe-red/20 hover:text-poe-red"
        aria-label="Delete entry"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
