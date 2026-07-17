'use client';

import { useEffect, useState, useMemo } from 'react';
import clsx from 'clsx';
import { Plus, Copy as CopyIcon, Trash2, Pencil } from 'lucide-react';
import { useRegexStore } from '@/stores/useRegexStore';
import { combineCategories, condenseGambasPatterns } from '@/lib/regex/combiner';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { CategoryPanel } from './CategoryPanel';
import { ExclusionPanel } from './ExclusionPanel';
import { RegexPreview } from './RegexPreview';
import type { RegexCategoryId } from '@/types/regex';

export function RegexBuilder() {
  const {
    presets,
    activePresetId,
    isLoading,
    loadPresets,
    createPreset,
    deletePreset,
    duplicatePreset,
    renamePreset,
    setActivePreset,
    addEntry,
    updateEntry,
    removeEntry,
    toggleEntry,
    clearCategory,
    setCustomRegex,
    toggleCustomRegex,
    toggleStrictLinks,
  } = useRegexStore();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) ?? null,
    [presets, activePresetId],
  );

  const useCustom = !!activePreset?.useCustomRegex;

  const combinedRegex = useMemo(() => {
    if (!activePreset) return '';
    if (activePreset.useCustomRegex && activePreset.customRegex) return activePreset.customRegex;

    const categories = activePreset.strictLinks !== false
      ? activePreset.categories.map((cat) =>
          cat.id === 'links'
            ? { ...cat, entries: cat.entries.filter((e) => !e.linkSize || e.linkSize >= 3) }
            : cat,
        )
      : activePreset.categories;

    return combineCategories(categories);
  }, [activePreset]);

  async function handleCreatePreset() {
    const name = `Preset ${presets.length + 1}`;
    await createPreset(name);
  }

  async function handleDuplicate() {
    if (!activePresetId) return;
    await duplicatePreset(activePresetId);
  }

  async function handleDelete() {
    if (!activePresetId || !activePreset) return;
    if (!window.confirm(`Delete "${activePreset.name}"? This cannot be undone.`)) return;
    await deletePreset(activePresetId);
  }

  function startRename() {
    if (!activePreset) return;
    setRenamingId(activePresetId);
    setRenameValue(activePreset.name);
  }

  function confirmRename() {
    if (renamingId && renameValue.trim()) {
      renamePreset(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue('');
  }

  function getCategoryById(id: RegexCategoryId) {
    return activePreset?.categories.find((c) => c.id === id) ?? null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-poe-muted">Loading presets...</span>
      </div>
    );
  }

  const categoryOrder: RegexCategoryId[] = ['gems', 'links', 'stats', 'items', 'item_gambas'];

  return (
    <div className="rounded-xl border border-poe-border bg-poe-card shadow-[0_18px_40px_rgba(0,0,0,.4)]">
      {/* Output bar pinned at top */}
      <RegexPreview combinedRegex={combinedRegex} />

      <div className="flex min-h-[calc(100vh-18rem)]">
        {/* Presets rail */}
        <aside className="w-[158px] flex-none rounded-bl-xl border-r border-poe-border/60 bg-poe-rail py-3">
          <div className="px-4 pb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint">
            Presets
          </div>

          {presets.map((p) => {
            const active = p.id === activePresetId;
            return (
              <div
                key={p.id}
                className={clsx(
                  'border-l-2',
                  active
                    ? 'border-poe-gold bg-poe-gold/10'
                    : 'border-transparent',
                )}
              >
                {renamingId === p.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    onBlur={confirmRename}
                    className="mx-2 my-1 w-[calc(100%-1rem)] rounded border border-poe-border bg-poe-input px-2 py-1 text-xs text-poe-text focus:border-poe-gold focus:outline-none"
                    aria-label="Rename preset"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setActivePreset(p.id)}
                    className={clsx(
                      'block w-full truncate px-3.5 py-1.5 text-left text-xs font-semibold transition-colors',
                      active ? 'text-poe-gold' : 'text-poe-muted hover:text-poe-text',
                    )}
                    title={p.name}
                  >
                    {p.name}
                  </button>
                )}

                {active && renamingId !== p.id && (
                  <div className="flex items-center gap-0.5 px-3 pb-1.5">
                    <button
                      onClick={startRename}
                      className="rounded p-1 text-poe-faint transition-colors hover:bg-white/10 hover:text-poe-bright"
                      title="Rename preset"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={handleDuplicate}
                      className="rounded p-1 text-poe-faint transition-colors hover:bg-white/10 hover:text-poe-bright"
                      title="Duplicate preset"
                    >
                      <CopyIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="rounded p-1 text-poe-faint transition-colors hover:bg-poe-red/20 hover:text-poe-red"
                      title="Delete preset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={handleCreatePreset}
            className="mt-2 flex w-full items-center gap-1 px-3.5 py-1.5 text-left text-xs font-medium text-poe-faint transition-colors hover:text-poe-gold"
          >
            <Plus className="h-3 w-3" />
            New preset
          </button>
        </aside>

        {/* Main area */}
        <main className="min-w-0 flex-1 rounded-br-xl p-4 sm:p-5">
          {activePreset ? (
            <>
              {/* Custom regex toggle */}
              <div className="mb-5 flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-poe-text">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useCustom}
                    onClick={() => toggleCustomRegex(!useCustom)}
                    className={clsx(
                      'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                      useCustom ? 'bg-poe-gold' : 'bg-poe-border',
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                        useCustom ? 'translate-x-[18px]' : 'translate-x-[3px]',
                      )}
                    />
                  </button>
                  Use Custom Regex
                </label>
                {useCustom && (
                  <span className="text-[10px] text-poe-faint">Chip sections are bypassed</span>
                )}
              </div>

              {useCustom ? (
                <div className="space-y-2 rounded-lg border border-poe-border bg-poe-row p-4">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-poe-faint">
                    Custom Regex
                  </label>
                  <Textarea
                    value={activePreset.customRegex ?? ''}
                    onChange={(e) => setCustomRegex(e.target.value)}
                    placeholder="Enter raw regex string (e.g. !flask B-B-G|R-R-G-B)"
                    rows={3}
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-poe-muted">
                    This string is used as-is in the output, bypassing all category-based generation.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {categoryOrder.map((catId) => {
                    const category = getCategoryById(catId);
                    if (!category) return null;

                    // Links category: add strict toggle and filter 2L entries visually
                    if (catId === 'links') {
                      const strict = activePreset.strictLinks !== false;
                      const has2L = category.entries.some((e) => e.linkSize === 2);
                      const visibleCategory = strict
                        ? { ...category, entries: category.entries.filter((e) => !e.linkSize || e.linkSize >= 3) }
                        : category;
                      const hiddenCount = category.entries.length - visibleCategory.entries.length;

                      const linkEval = visibleCategory.entries
                        .filter((e) => e.enabled)
                        .map((e) => e.pattern)
                        .join('|');

                      return (
                        <CategoryPanel
                          key={catId}
                          category={visibleCategory}
                          onAddEntry={(entry) => addEntry(catId, entry)}
                          onUpdateEntry={(entryId, updates) => updateEntry(catId, entryId, updates)}
                          onRemoveEntry={(entryId) => removeEntry(catId, entryId)}
                          onToggleEntry={(entryId) => toggleEntry(catId, entryId)}
                          onClearAll={() => clearCategory(catId)}
                          evaluatedRegex={linkEval || undefined}
                          headerExtra={
                            has2L ? (
                              <span className="ml-2 flex items-center gap-1.5">
                                <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-poe-muted">
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={strict}
                                    onClick={() => toggleStrictLinks(!strict)}
                                    className={clsx(
                                      'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors',
                                      strict ? 'bg-poe-gold' : 'bg-poe-border',
                                    )}
                                  >
                                    <span
                                      className={clsx(
                                        'inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform',
                                        strict ? 'translate-x-[14px]' : 'translate-x-[3px]',
                                      )}
                                    />
                                  </button>
                                  Strict (3L only)
                                </label>
                                {strict && hiddenCount > 0 && (
                                  <span className="text-[9px] text-poe-faint">
                                    {hiddenCount} 2-link {hiddenCount === 1 ? 'entry' : 'entries'} hidden
                                  </span>
                                )}
                              </span>
                            ) : undefined
                          }
                        />
                      );
                    }

                    const catEval = catId === 'item_gambas'
                      ? condenseGambasPatterns(category.entries.filter((e) => e.enabled)).join('|')
                      : undefined;

                    return (
                      <CategoryPanel
                        key={catId}
                        category={category}
                        onAddEntry={(entry) => addEntry(catId, entry)}
                        onUpdateEntry={(entryId, updates) => updateEntry(catId, entryId, updates)}
                        onRemoveEntry={(entryId) => removeEntry(catId, entryId)}
                        onToggleEntry={(entryId) => toggleEntry(catId, entryId)}
                        onClearAll={() => clearCategory(catId)}
                        evaluatedRegex={catEval || undefined}
                      />
                    );
                  })}

                  {/* Exclusion section */}
                  {(() => {
                    const excCategory = getCategoryById('dont_ever_show');
                    if (!excCategory) return null;
                    return (
                      <ExclusionPanel
                        category={excCategory}
                        onAddEntry={(entry) => addEntry('dont_ever_show', entry)}
                        onUpdateEntry={(entryId, updates) => updateEntry('dont_ever_show', entryId, updates)}
                        onRemoveEntry={(entryId) => removeEntry('dont_ever_show', entryId)}
                        onToggleEntry={(entryId) => toggleEntry('dont_ever_show', entryId)}
                        onClearAll={() => clearCategory('dont_ever_show')}
                      />
                    );
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-poe-muted">No preset selected</p>
                <Button variant="primary" size="md" className="mt-3" onClick={handleCreatePreset}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Your First Preset
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
