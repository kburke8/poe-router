'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import type { SocketColor } from '@/types/build';
import type { Gem, GemColor } from '@/types/gem';
import gemsData from '@/data/gems.json';

interface GemSlotComboboxProps {
  value: string;
  socketColor: SocketColor;
  onSelect: (gemName: string, socketColor?: SocketColor) => void;
  priorityGemNames: string[];
  placeholder?: string;
}

const gemColorToSocket: Record<GemColor, SocketColor> = {
  red: 'R',
  green: 'G',
  blue: 'B',
};

const GEM_COLOR_TEXT: Record<string, string> = {
  red: 'text-poe-red',
  green: 'text-poe-green',
  blue: 'text-poe-blue',
};

const socketTextColor: Record<SocketColor, string> = {
  R: 'text-poe-red',
  G: 'text-poe-green',
  B: 'text-poe-blue',
  W: 'text-poe-text',
};

function getAllGems(): Gem[] {
  const gems: Gem[] = [];
  if (gemsData.skills) for (const g of gemsData.skills) gems.push(g as Gem);
  if (gemsData.supports) for (const g of gemsData.supports) gems.push(g as Gem);
  return gems;
}

const allGemsCache = getAllGems();

export function GemSlotCombobox({
  value,
  socketColor,
  onSelect,
  priorityGemNames,
  placeholder,
}: GemSlotComboboxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prioritySet = useMemo(() => new Set(priorityGemNames), [priorityGemNames]);

  const priorityGems = useMemo(
    () => allGemsCache.filter((g) => prioritySet.has(g.name)).sort((a, b) => a.name.localeCompare(b.name)),
    [prioritySet],
  );

  const otherGems = useMemo(
    () => allGemsCache.filter((g) => !prioritySet.has(g.name)).sort((a, b) => a.name.localeCompare(b.name)),
    [prioritySet],
  );

  const fuse = useMemo(
    () => new Fuse(allGemsCache, { keys: ['name', 'tags'], threshold: 0.3 }),
    [],
  );

  const filteredResults = useMemo(() => {
    const text = query.trim();
    if (!text) {
      return { priority: priorityGems, other: otherGems.slice(0, 40) };
    }
    const matches = fuse.search(text, { limit: 40 }).map((r) => r.item);
    return {
      priority: matches.filter((g) => prioritySet.has(g.name)),
      other: matches.filter((g) => !prioritySet.has(g.name)),
    };
  }, [query, fuse, priorityGems, otherGems, prioritySet]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // Close on tab-away
  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    });
  };

  const handleFocus = () => {
    setQuery(value);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleGemClick = (gem: Gem) => {
    onSelect(gem.name, gemColorToSocket[gem.color]);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      const firstResult = filteredResults.priority[0] ?? filteredResults.other[0];
      if (firstResult && query.trim()) {
        handleGemClick(firstResult);
      } else {
        setIsOpen(false);
      }
    }
  };

  const displayValue = isOpen ? query : value;
  const hasSomeResults = filteredResults.priority.length > 0 || filteredResults.other.length > 0;

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full rounded-md border border-poe-border bg-poe-input px-3 py-1 text-sm focus:border-poe-gold focus:outline-none focus:ring-1 focus:ring-poe-gold/50 ${isOpen ? 'text-poe-text' : socketTextColor[socketColor]}`}
      />
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-poe-border bg-poe-card shadow-lg">
          {!hasSomeResults && query.trim() && (
            <p className="px-3 py-2 text-xs text-poe-muted">No gems found</p>
          )}
          {filteredResults.priority.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-poe-gold/70 border-b border-poe-border/50 bg-poe-bg/50">
                Picking up this town
              </div>
              {filteredResults.priority.map((gem) => (
                <button
                  key={gem.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleGemClick(gem);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1 text-left text-sm hover:bg-poe-border/50 transition-colors"
                >
                  <span className={GEM_COLOR_TEXT[gem.color] ?? 'text-poe-text'}>{gem.name}</span>
                  <span className="ml-auto text-[10px] uppercase text-poe-muted">{gem.type}</span>
                </button>
              ))}
            </div>
          )}
          {filteredResults.other.length > 0 && (
            <div>
              {filteredResults.priority.length > 0 && (
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-poe-muted/70 border-b border-poe-border/50 bg-poe-bg/50">
                  All gems
                </div>
              )}
              {filteredResults.other.map((gem) => (
                <button
                  key={gem.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleGemClick(gem);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1 text-left text-sm hover:bg-poe-border/50 transition-colors"
                >
                  <span className={GEM_COLOR_TEXT[gem.color] ?? 'text-poe-text'}>{gem.name}</span>
                  <span className="ml-auto text-[10px] uppercase text-poe-muted">{gem.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
