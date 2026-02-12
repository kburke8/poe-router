'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Copy as CopyIcon, Trash2, Pencil, Check, X } from 'lucide-react';
import { useRegexStore } from '@/stores/useRegexStore';
import { combineCategories } from '@/lib/regex/combiner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

  const combinedRegex = useMemo(() => {
    if (!activePreset) return '';
    return combineCategories(activePreset.categories);
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
    if (!activePresetId) return;
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
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      {/* Preset selector */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select
          value={activePresetId ?? ''}
          onChange={(e) => setActivePreset(e.target.value)}
          className="rounded-md border border-poe-border bg-poe-input px-3 py-2 text-sm text-poe-text focus:border-poe-gold focus:outline-none"
        >
          {presets.length === 0 && <option value="">No presets</option>}
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {renamingId === activePresetId && activePresetId ? (
          <div className="flex items-center gap-1">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') cancelRename();
              }}
              className="h-8 w-40 text-xs"
              autoFocus
            />
            <button onClick={confirmRename} className="rounded p-1 text-poe-green hover:bg-poe-green/20">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={cancelRename} className="rounded p-1 text-poe-red hover:bg-poe-red/20">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Button variant="primary" size="sm" onClick={handleCreatePreset}>
              <Plus className="mr-1 h-3 w-3" />
              New
            </Button>
            {activePreset && (
              <>
                <Button variant="secondary" size="sm" onClick={handleDuplicate}>
                  <CopyIcon className="mr-1 h-3 w-3" />
                  Duplicate
                </Button>
                <Button variant="ghost" size="sm" onClick={startRename}>
                  <Pencil className="mr-1 h-3 w-3" />
                  Rename
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* Category panels */}
      {activePreset ? (
        <div className="flex-1 space-y-3">
          {categoryOrder.map((catId) => {
            const category = getCategoryById(catId);
            if (!category) return null;
            return (
              <CategoryPanel
                key={catId}
                category={category}
                onAddEntry={(entry) => addEntry(catId, entry)}
                onUpdateEntry={(entryId, updates) => updateEntry(catId, entryId, updates)}
                onRemoveEntry={(entryId) => removeEntry(catId, entryId)}
                onToggleEntry={(entryId) => toggleEntry(catId, entryId)}
                onClearAll={() => clearCategory(catId)}
              />
            );
          })}

          {/* Exclusion panel */}
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
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-poe-muted">No preset selected</p>
            <Button variant="primary" size="md" className="mt-3" onClick={handleCreatePreset}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Your First Preset
            </Button>
          </div>
        </div>
      )}

      {/* Regex preview */}
      <RegexPreview combinedRegex={combinedRegex} />
    </div>
  );
}
