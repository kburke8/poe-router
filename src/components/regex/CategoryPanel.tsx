'use client';

import { useState, useMemo, useRef, useCallback, type ReactNode } from 'react';
import { Plus, Package, Trash2, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { RegexEntryRow } from './RegexEntryRow';
import { ItemSearchPicker } from './ItemSearchPicker';
import { abbreviate } from '@/lib/regex/abbreviator';
import type { RegexCategory, RegexEntry } from '@/types/regex';
import type { Gem as GemType, Item } from '@/types/gem';
import gemsData from '@/data/gems.json';
import itemsData from '@/data/items.json';

interface CategoryPanelProps {
  category: RegexCategory;
  onAddEntry: (entry: Omit<RegexEntry, 'id'>) => void;
  onUpdateEntry: (entryId: string, updates: Partial<RegexEntry>) => void;
  onRemoveEntry: (entryId: string) => void;
  onToggleEntry: (entryId: string) => void;
  onClearAll: () => void;
  evaluatedRegex?: string;
  /** Extra controls rendered on the section label row (e.g. strict-links toggle). */
  headerExtra?: ReactNode;
}

function collectAllNames(): string[] {
  const names: string[] = [];
  if (gemsData.skills) for (const g of gemsData.skills) names.push(g.name);
  if (gemsData.supports) for (const g of gemsData.supports) names.push(g.name);
  const items = itemsData as Record<string, { name: string }[]>;
  for (const cat of Object.keys(items)) {
    if (Array.isArray(items[cat])) {
      for (const item of items[cat]) names.push(item.name);
    }
  }
  return names;
}

function getAllGems(): GemType[] {
  const gems: GemType[] = [];
  if (gemsData.skills) gems.push(...(gemsData.skills as GemType[]));
  if (gemsData.supports) gems.push(...(gemsData.supports as GemType[]));
  return gems;
}

const GEM_COLOR_CLASSES: Record<string, string> = {
  red: 'text-poe-red',
  green: 'text-poe-green',
  blue: 'text-poe-blue',
};

function InlineGemInput({
  onSelect,
  allNames,
  onClose,
}: {
  onSelect: (gem: GemType, pattern: string) => void;
  allNames: string[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allGems = useMemo(() => getAllGems(), []);
  const fuse = useMemo(
    () =>
      new Fuse(allGems, {
        keys: ['name', 'tags'],
        threshold: 0.3,
        includeScore: true,
      }),
    [allGems],
  );

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query, { limit: 8 }).map((r) => r.item);
  }, [query, fuse]);

  const handleSelect = useCallback(
    (gem: GemType) => {
      const pattern = abbreviate(gem.name, allNames);
      onSelect(gem, pattern);
      setQuery('');
      setShowSuggestions(false);
      setSelectedIndex(0);
      inputRef.current?.focus();
    },
    [allNames, onSelect],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // If no suggestions visible but there's text, try exact/best match
        const match = suggestions[0] || fuse.search(query, { limit: 1 })[0]?.item;
        if (match) {
          handleSelect(match);
        }
        e.preventDefault();
      }
      if (e.key === 'Escape') onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  return (
    <span className="relative inline-flex items-center gap-1 rounded-full border border-poe-gold/50 bg-poe-input py-1 pl-3 pr-1.5">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(e.target.value.trim().length > 0);
          setSelectedIndex(0);
        }}
        onFocus={() => {
          if (query.trim()) setShowSuggestions(true);
        }}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Gem name, Enter to add..."
        className="w-44 bg-transparent text-xs text-poe-text placeholder:text-poe-muted focus:outline-none"
        autoFocus
      />
      <button
        onClick={onClose}
        className="rounded-full p-0.5 text-poe-muted hover:bg-white/10 hover:text-poe-bright"
        aria-label="Close gem input"
      >
        <X className="h-3 w-3" />
      </button>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-56 w-64 overflow-y-auto rounded-md border border-poe-border bg-poe-card shadow-lg">
          {suggestions.map((gem, i) => (
            <button
              key={gem.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(gem);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                i === selectedIndex ? 'bg-poe-border/60' : 'hover:bg-poe-border/30'
              }`}
            >
              <span className={GEM_COLOR_CLASSES[gem.color] ?? 'text-poe-text'}>
                {gem.name}
              </span>
              <span className="ml-auto rounded bg-poe-border/60 px-1.5 py-0.5 text-[10px] text-poe-muted">
                {gem.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

const GHOST_CHIP_CLASSES =
  'inline-flex items-center gap-1 rounded-full border border-dashed border-poe-border bg-transparent px-3 py-1 text-xs font-medium text-poe-muted transition-colors hover:border-poe-gold/60 hover:text-poe-gold';

export function CategoryPanel({
  category,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
  onToggleEntry,
  onClearAll,
  evaluatedRegex,
  headerExtra,
}: CategoryPanelProps) {
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showGemInput, setShowGemInput] = useState(false);

  const allNames = useMemo(() => collectAllNames(), []);

  const isGemCategory = category.id === 'gems';
  const showItemButton = category.id === 'items' || category.id === 'item_gambas';

  function handleGemSelect(gem: GemType, pattern: string) {
    onAddEntry({
      pattern,
      sourceId: gem.id,
      sourceName: gem.name,
      isExclusion: false,
      enabled: true,
      isCustom: false,
    });
  }

  function handleItemSelect(item: Item, pattern: string) {
    onAddEntry({
      pattern,
      sourceId: item.id,
      sourceName: item.name,
      isExclusion: false,
      enabled: true,
      isCustom: false,
    });
  }

  function handleAddCustom() {
    if (!customInput.trim()) return;
    onAddEntry({
      pattern: customInput.trim(),
      isExclusion: false,
      enabled: true,
      isCustom: true,
    });
    setCustomInput('');
    setShowCustomInput(false);
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-poe-faint">
          {category.label}
        </h3>
        <span className="font-mono text-[9px] text-poe-faint">
          {category.entries.length}
        </span>
        {headerExtra}
        <span className="flex-1" />
        {category.entries.length > 0 && (
          <button
            onClick={onClearAll}
            className="rounded p-1 text-poe-faint transition-colors hover:bg-poe-red/20 hover:text-poe-red"
            title="Delete all entries"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {category.entries.map((entry) => (
          <RegexEntryRow
            key={entry.id}
            entry={entry}
            onToggle={() => onToggleEntry(entry.id)}
            onUpdatePattern={(pattern) => onUpdateEntry(entry.id, { pattern })}
            onDelete={() => onRemoveEntry(entry.id)}
          />
        ))}

        {isGemCategory &&
          (showGemInput ? (
            <InlineGemInput
              onSelect={handleGemSelect}
              allNames={allNames}
              onClose={() => setShowGemInput(false)}
            />
          ) : (
            <button className={GHOST_CHIP_CLASSES} onClick={() => setShowGemInput(true)}>
              <Plus className="h-3 w-3" />
              add gem
            </button>
          ))}

        {showItemButton && (
          <button className={GHOST_CHIP_CLASSES} onClick={() => setItemPickerOpen(true)}>
            <Package className="h-3 w-3" />
            add item
          </button>
        )}

        {!isGemCategory &&
          (showCustomInput ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-poe-gold/50 bg-poe-input py-1 pl-3 pr-1.5">
              <input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustom();
                  if (e.key === 'Escape') {
                    setShowCustomInput(false);
                    setCustomInput('');
                  }
                }}
                placeholder="regex pattern..."
                className="w-36 bg-transparent font-mono text-xs text-poe-text placeholder:text-poe-muted focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleAddCustom}
                className="rounded-full p-0.5 text-poe-green hover:bg-poe-green/20"
                aria-label="Add custom pattern"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomInput('');
                }}
                className="rounded-full p-0.5 text-poe-muted hover:bg-white/10 hover:text-poe-bright"
                aria-label="Close custom pattern input"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : (
            <button className={GHOST_CHIP_CLASSES} onClick={() => setShowCustomInput(true)}>
              <Plus className="h-3 w-3" />
              custom
            </button>
          ))}
      </div>

      {evaluatedRegex && (
        <div className="mt-2 rounded-md border border-poe-border/50 bg-poe-bg/50 px-3 py-1.5">
          <span className="mr-1 font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint">
            evaluated
          </span>
          <code className="break-all font-mono text-[11px] text-poe-gold/80">{evaluatedRegex}</code>
        </div>
      )}

      {showItemButton && (
        <ItemSearchPicker
          open={itemPickerOpen}
          onOpenChange={setItemPickerOpen}
          onSelect={handleItemSelect}
          allNames={allNames}
          initialCategory={category.id === 'item_gambas' ? 'gambas' : undefined}
        />
      )}
    </section>
  );
}
