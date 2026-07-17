'use client';

import { useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { Plus, ShieldBan, Trash2, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { RegexEntryRow } from './RegexEntryRow';
import { abbreviate } from '@/lib/regex/abbreviator';
import type { RegexCategory, RegexEntry } from '@/types/regex';
import type { Gem as GemType } from '@/types/gem';
import gemsData from '@/data/gems.json';
import itemsData from '@/data/items.json';

// PoE item classes with their abbreviations for the lass:. pattern.
// Classes whose name doesn't start with the abbreviation (e.g., "Life Flasks")
// use `standalone` instead — a pattern appended outside the lass:.(…) group.
interface ItemClassDef {
  id: string;
  label: string;
  abbr?: string;
  standalone?: string;
}

const ITEM_CLASSES: ItemClassDef[] = [
  { id: 'staves', label: 'Staves', abbr: 'st' },
  { id: 'two_hand', label: 'Two Hand', abbr: 'tw' },
  { id: 'warstaves', label: 'Warstaves', abbr: 'war' },
  { id: 'one_hand', label: 'One Hand', abbr: 'one' },
  { id: 'rune_daggers', label: 'Rune Daggers', abbr: 'ru' },
  { id: 'thrusting', label: 'Thrusting', abbr: 'th' },
  { id: 'sceptres', label: 'Sceptres', abbr: 'sc' },
  { id: 'claws', label: 'Claws', abbr: 'cl' },
  { id: 'shields', label: 'Shields', abbr: 'shi' },
  { id: 'bows', label: 'Bows', abbr: 'bow' },
  { id: 'wands', label: 'Wands', abbr: 'wan' },
  { id: 'daggers', label: 'Daggers', abbr: 'da' },
  { id: 'quivers', label: 'Quivers', abbr: 'qu' },
  { id: 'flasks', label: 'Flasks', standalone: 'flask' },
  { id: 'jewels', label: 'Jewels', abbr: 'je' },
  { id: 'amulets', label: 'Amulets', abbr: 'am' },
  { id: 'rings', label: 'Rings', abbr: 'ri' },
  { id: 'belts', label: 'Belts', abbr: 'be' },
  { id: 'helmets', label: 'Helmets', abbr: 'he' },
  { id: 'body_armours', label: 'Body Armours', abbr: 'bod' },
  { id: 'gloves', label: 'Gloves', abbr: 'gl' },
  { id: 'boots', label: 'Boots', abbr: 'boo' },
];

// Special entry ID prefix for the class-block pattern
const CLASS_BLOCK_SOURCE = '__class_block__';

interface ExclusionPanelProps {
  category: RegexCategory;
  onAddEntry: (entry: Omit<RegexEntry, 'id'>) => void;
  onUpdateEntry: (entryId: string, updates: Partial<RegexEntry>) => void;
  onRemoveEntry: (entryId: string) => void;
  onToggleEntry: (entryId: string) => void;
  onClearAll: () => void;
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

const GHOST_CHIP_CLASSES =
  'inline-flex items-center gap-1 rounded-full border border-dashed border-poe-border bg-transparent px-3 py-1 text-xs font-medium text-poe-muted transition-colors hover:border-poe-red/60 hover:text-poe-red';

function InlineGemExcludeInput({
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

  const allGems = useMemo(() => getAllGems(), []);
  const fuse = useMemo(
    () => new Fuse(allGems, { keys: ['name', 'tags'], threshold: 0.3 }),
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
    },
    [allNames, onSelect],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        const match = suggestions[0] || fuse.search(query, { limit: 1 })[0]?.item;
        if (match) handleSelect(match);
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
      if (suggestions[selectedIndex]) handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  return (
    <span className="relative inline-flex items-center gap-1 rounded-full border border-poe-red/50 bg-poe-input py-1 pl-3 pr-1.5">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(e.target.value.trim().length > 0);
          setSelectedIndex(0);
        }}
        onFocus={() => {
          if (query.trim()) setShowSuggestions(true);
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Gem to exclude..."
        className="w-40 bg-transparent text-xs text-poe-text placeholder:text-poe-muted focus:outline-none"
        autoFocus
      />
      <button
        onClick={onClose}
        className="rounded-full p-0.5 text-poe-muted hover:bg-white/10 hover:text-poe-bright"
        aria-label="Close gem exclusion input"
      >
        <X className="h-3 w-3" />
      </button>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-48 w-64 overflow-y-auto rounded-md border border-poe-border bg-poe-card shadow-lg">
          {suggestions.map((gem, i) => (
            <button
              key={gem.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(gem);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                i === selectedIndex ? 'bg-poe-border/60' : 'hover:bg-poe-border/30'
              }`}
            >
              <span className={GEM_COLOR_CLASSES[gem.color] ?? 'text-poe-text'}>{gem.name}</span>
              <span className="ml-auto rounded bg-poe-border/60 px-1.5 py-0.5 text-[10px] text-poe-muted">{gem.type}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

export function ExclusionPanel({
  category,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
  onToggleEntry,
  onClearAll,
}: ExclusionPanelProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showGemInput, setShowGemInput] = useState(false);

  const allNames = useMemo(() => collectAllNames(), []);

  // Parse which item classes are currently selected from existing entries
  const classBlockEntry = category.entries.find((e) => e.sourceId === CLASS_BLOCK_SOURCE);
  const selectedClasses = useMemo(() => {
    if (!classBlockEntry) return new Set<string>();
    const pattern = classBlockEntry.pattern;
    const selected = new Set<string>();

    // Parse lass:.(abbr|...) portion
    const match = pattern.match(/lass:\.\(([^)]+)\)/);
    if (match) {
      const abbrs = match[1].split('|');
      for (const cls of ITEM_CLASSES) {
        if (cls.abbr && abbrs.includes(cls.abbr)) selected.add(cls.id);
      }
    }

    // Parse standalone patterns (appended after |)
    for (const cls of ITEM_CLASSES) {
      if (cls.standalone && pattern.includes(cls.standalone)) selected.add(cls.id);
    }

    return selected;
  }, [classBlockEntry]);

  function buildClassPattern(classes: Set<string>): string {
    const selected = ITEM_CLASSES.filter((c) => classes.has(c.id));
    const abbrs = selected.filter((c) => c.abbr).map((c) => c.abbr);
    const standalones = selected.filter((c) => c.standalone).map((c) => c.standalone);

    const parts: string[] = [];
    if (abbrs.length > 0) {
      parts.push(`lass:.(${abbrs.join('|')})`);
    }
    parts.push(...(standalones as string[]));

    return parts.join('|');
  }

  function handleClassToggle(classId: string) {
    const next = new Set(selectedClasses);
    if (next.has(classId)) {
      next.delete(classId);
    } else {
      next.add(classId);
    }

    const pattern = buildClassPattern(next);

    if (classBlockEntry) {
      if (next.size === 0) {
        // Remove the entry entirely
        onRemoveEntry(classBlockEntry.id);
      } else {
        onUpdateEntry(classBlockEntry.id, { pattern });
      }
    } else if (next.size > 0) {
      onAddEntry({
        pattern,
        sourceId: CLASS_BLOCK_SOURCE,
        sourceName: 'Item Class Block',
        isExclusion: true,
        enabled: true,
        isCustom: false,
      });
    }
  }

  // Split entries into sub-groups for display
  const gemEntries = category.entries.filter(
    (e) => e.sourceId && e.sourceId !== CLASS_BLOCK_SOURCE && !e.isCustom,
  );
  const customEntries = category.entries.filter((e) => e.isCustom);

  function handleGemExclude(gem: GemType, pattern: string) {
    onAddEntry({
      pattern,
      sourceId: gem.id,
      sourceName: gem.name,
      isExclusion: true,
      enabled: true,
      isCustom: false,
    });
  }

  function handleAddCustom() {
    if (!customInput.trim()) return;
    onAddEntry({
      pattern: customInput.trim(),
      isExclusion: true,
      enabled: true,
      isCustom: true,
    });
    setCustomInput('');
    setShowCustomInput(false);
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <ShieldBan className="h-3.5 w-3.5 text-poe-red" />
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-poe-red/90">
          Don&apos;t Ever Show
        </h3>
        <span className="font-mono text-[9px] text-poe-faint">{category.entries.length}</span>
        <span className="flex-1" />
        {category.entries.length > 0 && (
          <button
            onClick={onClearAll}
            className="rounded p-1 text-poe-faint transition-colors hover:bg-poe-red/20 hover:text-poe-red"
            title="Delete all exclusions"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Item Classes sub-section */}
        <div>
          <h4 className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint">
            Block Item Classes
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ITEM_CLASSES.map((cls) => {
              const isSelected = selectedClasses.has(cls.id);
              return (
                <button
                  key={cls.id}
                  onClick={() => handleClassToggle(cls.id)}
                  className={clsx(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    isSelected
                      ? 'border-poe-red/70 bg-poe-red/15 text-poe-red'
                      : 'border-transparent bg-white/[0.04] text-poe-text hover:bg-white/[0.07]',
                  )}
                >
                  {cls.label}
                </button>
              );
            })}
          </div>
          {classBlockEntry && (
            <div className="mt-2 rounded-md border border-poe-border/50 bg-poe-bg/50 px-3 py-1.5">
              <span className="mr-1 font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint">
                pattern
              </span>
              <code className="break-all font-mono text-[11px] text-poe-red/80">
                {classBlockEntry.pattern}
              </code>
            </div>
          )}
        </div>

        {/* Gems sub-section */}
        <div>
          <h4 className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint">
            Block Gems
          </h4>
          <div className="flex flex-wrap items-center gap-1.5">
            {gemEntries.map((entry) => (
              <RegexEntryRow
                key={entry.id}
                entry={entry}
                accent="red"
                onToggle={() => onToggleEntry(entry.id)}
                onUpdatePattern={(pattern) => onUpdateEntry(entry.id, { pattern })}
                onDelete={() => onRemoveEntry(entry.id)}
              />
            ))}
            {showGemInput ? (
              <InlineGemExcludeInput
                onSelect={handleGemExclude}
                allNames={allNames}
                onClose={() => setShowGemInput(false)}
              />
            ) : (
              <button className={GHOST_CHIP_CLASSES} onClick={() => setShowGemInput(true)}>
                <Plus className="h-3 w-3" />
                block gem
              </button>
            )}
          </div>
        </div>

        {/* Other / Custom sub-section */}
        <div>
          <h4 className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint">
            Other Exclusions
          </h4>
          <div className="flex flex-wrap items-center gap-1.5">
            {customEntries.map((entry) => (
              <RegexEntryRow
                key={entry.id}
                entry={entry}
                accent="red"
                onToggle={() => onToggleEntry(entry.id)}
                onUpdatePattern={(pattern) => onUpdateEntry(entry.id, { pattern })}
                onDelete={() => onRemoveEntry(entry.id)}
              />
            ))}
            {showCustomInput ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-poe-red/50 bg-poe-input py-1 pl-3 pr-1.5">
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
                  placeholder="exclusion pattern..."
                  className="w-36 bg-transparent font-mono text-xs text-poe-text placeholder:text-poe-muted focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleAddCustom}
                  className="rounded-full p-0.5 text-poe-green hover:bg-poe-green/20"
                  aria-label="Add exclusion pattern"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomInput('');
                  }}
                  className="rounded-full p-0.5 text-poe-muted hover:bg-white/10 hover:text-poe-bright"
                  aria-label="Close exclusion input"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : (
              <button className={GHOST_CHIP_CLASSES} onClick={() => setShowCustomInput(true)}>
                <Plus className="h-3 w-3" />
                custom pattern
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
