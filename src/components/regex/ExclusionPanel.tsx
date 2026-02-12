'use client';

import { useState, useMemo, useCallback } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronRight, Plus, ShieldBan, Trash2 } from 'lucide-react';
import Fuse from 'fuse.js';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

function InlineGemExcludeInput({
  onSelect,
  allNames,
}: {
  onSelect: (gem: GemType, pattern: string) => void;
  allNames: string[];
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
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(e.target.value.trim().length > 0);
          setSelectedIndex(0);
        }}
        onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Type gem to exclude..."
        className="h-7 text-xs"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-md border border-poe-border bg-poe-card shadow-lg">
          {suggestions.map((gem, i) => (
            <button
              key={gem.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(gem); }}
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
    </div>
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
  const [isOpen, setIsOpen] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

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
  const otherEntries = category.entries.filter(
    (e) => e.sourceId === CLASS_BLOCK_SOURCE,
  );

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
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center rounded-t-lg border border-poe-red/40 bg-poe-card">
        <Collapsible.Trigger className="flex flex-1 items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-poe-red/10">
          <ChevronRight
            className={`h-4 w-4 text-poe-red transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
          <ShieldBan className="h-4 w-4 text-poe-red" />
          <span className="text-sm font-semibold text-poe-red">{category.label}</span>
          <span className="ml-auto rounded-full bg-poe-red/20 px-2 py-0.5 text-[10px] text-poe-red">
            {category.entries.length}
          </span>
        </Collapsible.Trigger>
        {category.entries.length > 0 && (
          <button
            onClick={onClearAll}
            className="mr-2 rounded p-1.5 text-poe-muted transition-colors hover:bg-poe-red/20 hover:text-poe-red"
            title="Delete all exclusions"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Collapsible.Content className="rounded-b-lg border border-t-0 border-poe-red/40 bg-poe-card px-4 pb-3 pt-2 space-y-4">

        {/* Item Classes sub-section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-poe-muted">
            Block Item Classes
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ITEM_CLASSES.map((cls) => {
              const isSelected = selectedClasses.has(cls.id);
              return (
                <button
                  key={cls.id}
                  onClick={() => handleClassToggle(cls.id)}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-poe-red/30 text-poe-red border border-poe-red/60'
                      : 'bg-poe-border/30 text-poe-muted border border-poe-border hover:bg-poe-border/50 hover:text-poe-text'
                  }`}
                >
                  {cls.label}
                </button>
              );
            })}
          </div>
          {classBlockEntry && (
            <div className="mt-2">
              <code className="block rounded bg-poe-bg px-2 py-1 font-mono text-[11px] text-poe-red/80">
                {classBlockEntry.pattern}
              </code>
            </div>
          )}
        </div>

        {/* Gems sub-section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-poe-muted">
            Block Gems
          </h4>
          {gemEntries.map((entry) => (
            <RegexEntryRow
              key={entry.id}
              entry={entry}
              onToggle={() => onToggleEntry(entry.id)}
              onUpdatePattern={(pattern) => onUpdateEntry(entry.id, { pattern })}
              onDelete={() => onRemoveEntry(entry.id)}
            />
          ))}
          <InlineGemExcludeInput onSelect={handleGemExclude} allNames={allNames} />
        </div>

        {/* Other / Custom sub-section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-poe-muted">
            Other Exclusions
          </h4>
          {customEntries.map((entry) => (
            <RegexEntryRow
              key={entry.id}
              entry={entry}
              onToggle={() => onToggleEntry(entry.id)}
              onUpdatePattern={(pattern) => onUpdateEntry(entry.id, { pattern })}
              onDelete={() => onRemoveEntry(entry.id)}
            />
          ))}

          {/* Hidden: render class block entries so they aren't lost */}
          {otherEntries.map((entry) => (
            <input key={entry.id} type="hidden" />
          ))}

          {!showCustomInput ? (
            <Button variant="ghost" size="sm" onClick={() => setShowCustomInput(true)} className="mt-1">
              <Plus className="mr-1 h-3 w-3" />
              Add Custom Pattern
            </Button>
          ) : (
            <div className="mt-1 flex items-center gap-1">
              <Input
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
                className="h-7 w-48 px-2 py-0.5 font-mono text-xs"
                autoFocus
              />
              <Button variant="danger" size="sm" onClick={handleAddCustom}>
                Add
              </Button>
            </div>
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
