'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronRight, Plus, Package, Trash2 } from 'lucide-react';
import Fuse from 'fuse.js';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
}: {
  onSelect: (gem: GemType, pattern: string) => void;
  allNames: string[];
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
    <div className="relative mt-2">
      <Input
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
        placeholder="Type gem name and press Enter..."
        className="h-8 text-xs"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-poe-border bg-poe-card shadow-lg">
          {suggestions.map((gem, i) => (
            <button
              key={gem.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(gem);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? 'bg-poe-border/60'
                  : 'hover:bg-poe-border/30'
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
    </div>
  );
}

export function CategoryPanel({
  category,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
  onToggleEntry,
  onClearAll,
}: CategoryPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

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
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center rounded-t-lg border border-poe-border bg-poe-card">
        <Collapsible.Trigger className="flex flex-1 items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-poe-border/30">
          <ChevronRight
            className={`h-4 w-4 text-poe-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
          <span className="text-sm font-semibold text-poe-gold">{category.label}</span>
          <span className="ml-auto rounded-full bg-poe-border/60 px-2 py-0.5 text-[10px] text-poe-muted">
            {category.entries.length}
          </span>
        </Collapsible.Trigger>
        {category.entries.length > 0 && (
          <button
            onClick={onClearAll}
            className="mr-2 rounded p-1.5 text-poe-muted transition-colors hover:bg-poe-red/20 hover:text-poe-red"
            title="Delete all entries"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Collapsible.Content className="rounded-b-lg border border-t-0 border-poe-border bg-poe-card px-4 pb-3 pt-1">
        {category.entries.length === 0 && !isGemCategory && (
          <p className="py-2 text-center text-xs text-poe-muted">No entries yet</p>
        )}

        {category.entries.map((entry) => (
          <RegexEntryRow
            key={entry.id}
            entry={entry}
            onToggle={() => onToggleEntry(entry.id)}
            onUpdatePattern={(pattern) => onUpdateEntry(entry.id, { pattern })}
            onDelete={() => onRemoveEntry(entry.id)}
          />
        ))}

        {isGemCategory && (
          <InlineGemInput onSelect={handleGemSelect} allNames={allNames} />
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {showItemButton && (
            <Button variant="secondary" size="sm" onClick={() => setItemPickerOpen(true)}>
              <Package className="mr-1 h-3 w-3" />
              Add Item
            </Button>
          )}

          {!isGemCategory && (
            <>
              {!showCustomInput ? (
                <Button variant="ghost" size="sm" onClick={() => setShowCustomInput(true)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Custom
                </Button>
              ) : (
                <div className="flex items-center gap-1">
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
                    placeholder="regex pattern..."
                    className="h-7 w-40 px-2 py-0.5 font-mono text-xs"
                    autoFocus
                  />
                  <Button variant="primary" size="sm" onClick={handleAddCustom}>
                    Add
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {showItemButton && (
          <ItemSearchPicker
            open={itemPickerOpen}
            onOpenChange={setItemPickerOpen}
            onSelect={handleItemSelect}
            allNames={allNames}
            initialCategory={category.id === 'item_gambas' ? 'gambas' : undefined}
          />
        )}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
