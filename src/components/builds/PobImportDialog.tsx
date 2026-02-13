'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { decodePobCode } from '@/lib/pob/decode';
import { parsePobXml } from '@/lib/pob/parse';
import { backfillBuild, type BackfillResult, type BackfillWarning } from '@/lib/pob/backfill';

interface PobImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (result: BackfillResult) => void;
}

type Step = 'input' | 'loading' | 'review' | 'error';

function extractPobbinId(input: string): string | null {
  // Match pobb.in/XXXXX or https://pobb.in/XXXXX
  const match = input.match(/pobb\.in\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function WarningItem({ warning }: { warning: BackfillWarning }) {
  const icons: Record<string, string> = {
    skipped: '~',
    not_found: '?',
    lilly_only: '!',
  };
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 shrink-0 text-yellow-500">{icons[warning.type] ?? '!'}</span>
      <span className="text-poe-muted">
        <span className="text-poe-text">{warning.gemName}</span>
        {' - '}
        {warning.reason}
      </span>
    </div>
  );
}

export function PobImportDialog({ open, onOpenChange, onImport }: PobImportDialogProps) {
  const [step, setStep] = useState<Step>('input');
  const [url, setUrl] = useState('');
  const [rawCode, setRawCode] = useState('');
  const [buildName, setBuildName] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<BackfillResult | null>(null);

  function reset() {
    setStep('input');
    setUrl('');
    setRawCode('');
    setBuildName('');
    setError('');
    setResult(null);
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleImport() {
    setStep('loading');
    setError('');

    try {
      let code = rawCode.trim();

      // If a URL is provided, fetch from the proxy
      if (!code && url.trim()) {
        const id = extractPobbinId(url.trim());
        if (!id) {
          throw new Error('Invalid pobb.in URL. Expected format: pobb.in/XXXXX or https://pobb.in/XXXXX');
        }

        const res = await fetch(`/api/pob-proxy?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? `Failed to fetch (${res.status})`);
        }
        code = data.code;
      }

      if (!code) {
        throw new Error('Please provide a pobb.in URL or paste a PoB code.');
      }

      // Decode
      const xml = decodePobCode(code);

      // Parse
      const pobBuild = parsePobXml(xml);

      if (!pobBuild.className) {
        throw new Error('Could not determine class from PoB data.');
      }

      // Count total gems before backfill for context
      const totalPobGems = pobBuild.skillGroups
        .filter((sg) => sg.enabled)
        .flatMap((sg) => sg.gems.filter((g) => g.enabled)).length;

      if (totalPobGems === 0) {
        throw new Error('No gems found in the PoB data.');
      }

      // Backfill
      const name = buildName.trim() || `${pobBuild.className} Import`;
      const backfillResult = backfillBuild(pobBuild, name);
      setResult(backfillResult);
      setStep('review');
    } catch (err) {
      console.error('PoB import error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }

  function handleConfirm() {
    if (result) {
      onImport(result);
      handleOpenChange(false);
    }
  }

  // Count stats for review
  const gemPickupCount = result?.build.stops.reduce((n, s) => n + s.gemPickups.length, 0) ?? 0;
  const linkGroupCount = result?.build.linkGroups.length ?? 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-poe-border bg-poe-card p-0 shadow-xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-poe-border px-4 py-3">
            <Dialog.Title className="text-sm font-semibold text-poe-gold flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import from Path of Building
            </Dialog.Title>
            <Dialog.Close className="text-poe-muted hover:text-poe-text">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Input Step */}
          {step === 'input' && (
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-poe-text">Build Name (optional)</label>
                <Input
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  placeholder="e.g. Arc Witch Speedrun"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-poe-text">pobb.in URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://pobb.in/XXXXX"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-poe-border" />
                <span className="text-[10px] uppercase text-poe-muted">or</span>
                <div className="h-px flex-1 bg-poe-border" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-poe-text">Paste PoB Code</label>
                <Textarea
                  value={rawCode}
                  onChange={(e) => setRawCode(e.target.value)}
                  placeholder="Paste the raw PoB export code here..."
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={!url.trim() && !rawCode.trim()}>
                  Import
                </Button>
              </div>
            </div>
          )}

          {/* Loading Step */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-poe-gold" />
              <p className="text-sm text-poe-muted">Decoding and processing build...</p>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && result && (
            <div className="p-4 space-y-4">
              {/* Build summary */}
              <div className="rounded-md border border-poe-border bg-poe-bg/50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-poe-text">{result.build.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-poe-muted">
                  <span>Class</span>
                  <span className="text-poe-text">{result.build.className}</span>
                  {result.build.ascendancy && (
                    <>
                      <span>Ascendancy</span>
                      <span className="text-poe-text">{result.build.ascendancy}</span>
                    </>
                  )}
                  <span>Gem Pickups</span>
                  <span className="text-poe-text">{gemPickupCount}</span>
                  <span>Link Groups</span>
                  <span className="text-poe-text">{linkGroupCount}</span>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-yellow-500">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.warnings.map((w, i) => (
                      <WarningItem key={i} warning={w} />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-poe-muted">
                Gem pickups are placed at the earliest available vendor stop. You can refine sources and stops after importing.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={reset}>
                  Back
                </Button>
                <Button onClick={handleConfirm}>
                  Create Build
                </Button>
              </div>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="p-4 space-y-4">
              <div className="rounded-md border border-poe-red/30 bg-poe-red/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-poe-red" />
                  <p className="text-sm text-poe-text">{error}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={reset}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
