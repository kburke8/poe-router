'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, BookOpen, Clock } from 'lucide-react';

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: never) => void; // Will never be called
}

export function TemplatePickerDialog({ open, onOpenChange }: TemplatePickerDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-poe-border bg-poe-card p-0 shadow-xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-poe-border px-4 py-3">
            <Dialog.Title className="text-sm font-semibold text-poe-gold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Build Templates
            </Dialog.Title>
            <Dialog.Close className="text-poe-muted hover:text-poe-text">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Coming Soon Content */}
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-poe-gold/10 p-4">
                <Clock className="h-8 w-8 text-poe-gold" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-poe-text mb-2">Coming Soon</h3>
            <p className="text-sm text-poe-muted mb-6 leading-relaxed">
              Build templates are in development. For now, create a new build from scratch or import from Path of Building.
            </p>
            <Dialog.Close asChild>
              <button className="inline-flex items-center justify-center rounded-md bg-poe-gold text-poe-bg px-4 py-2 text-sm font-medium hover:bg-poe-gold/90 transition-colors">
                Got it
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
