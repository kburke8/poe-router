'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { BUILD_TEMPLATES, type BuildTemplate } from '@/data/templates';

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: BuildTemplate) => void;
}

export function TemplatePickerDialog({ open, onOpenChange, onSelect }: TemplatePickerDialogProps) {
  const [filter, setFilter] = useState('');

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setFilter('');
    onOpenChange(nextOpen);
  }

  const query = filter.toLowerCase();
  const filtered = BUILD_TEMPLATES.filter((t) => {
    if (!query) return true;
    return (
      t.name.toLowerCase().includes(query) ||
      t.className.toLowerCase().includes(query) ||
      t.ascendancy.toLowerCase().includes(query) ||
      t.tags.some((tag) => tag.includes(query))
    );
  });

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-poe-border bg-poe-card p-0 shadow-xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-poe-border px-4 py-3">
            <Dialog.Title className="text-sm font-semibold text-poe-gold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Starter Templates
            </Dialog.Title>
            <Dialog.Close className="text-poe-muted hover:text-poe-text">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Filter */}
          <div className="px-4 pt-4">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name, class, or tag..."
            />
          </div>

          {/* Template Grid */}
          <div className="p-4 grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="col-span-2 text-center text-sm text-poe-muted py-8">
                No templates match your search.
              </p>
            ) : (
              filtered.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="text-left rounded-lg border border-poe-border bg-poe-bg/50 p-4 hover:border-poe-gold/50 hover:bg-poe-bg transition-colors focus:outline-none focus:ring-1 focus:ring-poe-gold/50"
                >
                  <div className="text-sm font-medium text-poe-text">{template.name}</div>
                  <div className="mt-0.5 text-xs text-poe-muted">
                    {template.className} / {template.ascendancy}
                  </div>
                  <p className="mt-2 text-xs text-poe-muted leading-relaxed">
                    {template.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="gold">{tag}</Badge>
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
