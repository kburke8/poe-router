'use client';

import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { decodePobCode } from '@/lib/pob/decode';
import { parsePobXml } from '@/lib/pob/parse';
import { backfillBuild, type BackfillResult, type BackfillWarning } from '@/lib/pob/backfill';
import { getQuestRewardsAtStop } from '@/lib/gem-availability';
import { getStopById } from '@/data/town-stops';
import type { BuildPlan } from '@/types/build';

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

/**
 * A quest-reward-set collision the backfill produced: a gem placed as a vendor
 * buy at a stop where it was actually offered by a reward set that another
 * imported gem already claimed. The user may prefer to swap which gem takes
 * the free quest reward.
 */
interface RewardCollision {
  stopId: string;
  stopLabel: string;
  actNumber: number;
  rewardSetId: string;
  vendorPickupId: string;
  vendorGemName: string;
  questPickupId: string;
  questGemName: string;
}

function findRewardCollisions(build: BuildPlan): RewardCollision[] {
  if (!build.className) return [];
  const out: RewardCollision[] = [];
  for (const stop of build.stops) {
    if (!stop.enabled || stop.gemPickups.length === 0) continue;
    const townStop = getStopById(stop.stopId);
    if (!townStop) continue;

    const rewards = getQuestRewardsAtStop(stop.stopId, build.className);
    if (rewards.length === 0) continue;
    const rewardSetByGem = new Map<string, string>();
    for (const r of rewards) {
      if (r.rewardSetId) rewardSetByGem.set(r.gem.name, r.rewardSetId);
    }

    const questPickupBySet = new Map(
      stop.gemPickups
        .filter((p) => p.source === 'quest_reward' && p.rewardSetId)
        .map((p) => [p.rewardSetId!, p]),
    );

    for (const p of stop.gemPickups) {
      if (p.source !== 'vendor' || p.skipped) continue;
      const rs = rewardSetByGem.get(p.gemName);
      if (!rs) continue;
      const taken = questPickupBySet.get(rs);
      if (!taken || taken.gemName === p.gemName) continue;
      out.push({
        stopId: stop.stopId,
        stopLabel: townStop.label,
        actNumber: townStop.actNumber,
        rewardSetId: rs,
        vendorPickupId: p.id,
        vendorGemName: p.gemName,
        questPickupId: taken.id,
        questGemName: taken.gemName,
      });
    }
  }
  return out;
}

const WARNING_LABELS: Record<BackfillWarning['type'], string> = {
  not_found: 'NOT MATCHED',
  skipped: 'SKIPPED',
  lilly_only: 'LATE UNLOCK',
};

function WarningCard({ warning }: { warning: BackfillWarning }) {
  return (
    <div className="rounded-[9px] border border-white/[.07] bg-poe-row px-[13px] py-[11px]">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold tracking-wider text-poe-faint">
          {WARNING_LABELS[warning.type] ?? 'INFO'}
        </span>
        <span className="flex-1" />
        <span className="text-[11px] text-[#e6a45a]">no action taken</span>
      </div>
      <div className="mt-[5px] text-[13px] text-poe-text">
        <b className="text-poe-bright">{warning.gemName}</b> — {warning.reason}
      </div>
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

  /**
   * Swap which gem takes the reward-set pick. The build hasn't been imported
   * into the store yet, so this applies the same semantics as
   * useBuildStore.setGemPickupMode to the pending build directly.
   */
  function handleSwap(collision: RewardCollision) {
    setResult((prev) => {
      if (!prev) return prev;
      const build: BuildPlan = structuredClone(prev.build);
      const stop = build.stops.find((s) => s.stopId === collision.stopId);
      if (!stop) return prev;
      const vendorPickup = stop.gemPickups.find((p) => p.id === collision.vendorPickupId);
      const questPickup = stop.gemPickups.find((p) => p.id === collision.questPickupId);
      if (!vendorPickup || !questPickup) return prev;
      vendorPickup.source = 'quest_reward';
      vendorPickup.rewardSetId = collision.rewardSetId;
      questPickup.source = 'vendor';
      delete questPickup.rewardSetId;
      return { build, warnings: prev.warnings };
    });
  }

  // Review-step stats
  const stopCount = useMemo(
    () => result?.build.stops.filter((s) => s.enabled).length ?? 0,
    [result],
  );
  const gemPickupCount = result?.build.stops.reduce((n, s) => n + s.gemPickups.length, 0) ?? 0;
  const linkGroupCount = result?.build.linkGroups.length ?? 0;

  const collisions = useMemo(
    () => (result ? findRewardCollisions(result.build) : []),
    [result],
  );

  const needsCallCount = collisions.length + (result?.warnings.length ?? 0);
  const ambiguousStopIds = new Set(collisions.map((c) => c.stopId));
  const readyStops = Math.max(0, stopCount - ambiguousStopIds.size);

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
                  Generate route
                </Button>
              </div>
            </div>
          )}

          {/* Loading Step */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-poe-gold" />
              <p className="text-sm text-poe-muted">Decoding and generating route...</p>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && result && (
            <div className="px-[18px] py-[14px]">
              {/* Route generated summary */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-bold text-poe-green">✓ Route generated</span>
                <span className="text-[12px] text-poe-muted">
                  {stopCount} stops · {gemPickupCount} gems · {linkGroupCount} links
                </span>
              </div>
              <div className="text-[12px] text-poe-faint mb-3">
                {result.build.name}
                {result.build.className ? ` · ${result.build.className}` : ''}
                {result.build.ascendancy ? ` · ${result.build.ascendancy}` : ''}
              </div>

              {/* Needs your call */}
              <div className="font-mono text-[9px] font-bold uppercase tracking-[.1em] text-poe-faint mb-[9px]">
                Needs your call ({needsCallCount})
              </div>
              {needsCallCount === 0 ? (
                <p className="text-[13px] text-poe-faint">
                  Nothing — every gem placement was unambiguous.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {collisions.map((c) => (
                    <div
                      key={`${c.stopId}-${c.vendorPickupId}`}
                      className="rounded-[9px] border border-poe-gold/[.22] bg-poe-row px-[13px] py-[11px]"
                    >
                      <div className="flex items-center gap-2 mb-[6px]">
                        <span className="font-mono text-[10px] font-bold tracking-wider text-poe-gold uppercase">
                          Act {c.actNumber} · {c.stopLabel}
                        </span>
                        <span className="flex-1" />
                        <span className="text-[11px] text-[#e6a45a]">buy vs quest</span>
                      </div>
                      <div className="text-[13px] text-poe-text mb-[9px]">
                        <b className="text-poe-bright">{c.vendorGemName}</b> placed as vendor buy —
                        the reward set is taken by <b className="text-poe-bright">{c.questGemName}</b>.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSwap(c)}
                        className="rounded-[7px] bg-poe-gold px-3 py-[6px] text-[12px] font-bold text-poe-gold-ink hover:bg-poe-gold/90 transition-colors cursor-pointer"
                      >
                        Swap: pick up {c.vendorGemName}, buy {c.questGemName}
                      </button>
                    </div>
                  ))}
                  {result.warnings.map((w, i) => (
                    <WarningCard key={i} warning={w} />
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-[9px] mt-[14px] pt-[13px] border-t border-white/[.06]">
                <span className="flex-1 text-[12px] text-poe-faint">
                  {readyStops} stop{readyStops !== 1 ? 's' : ''} auto-filled &amp; ready
                </span>
                <Button variant="secondary" size="sm" onClick={reset}>
                  Back
                </Button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-md bg-white/[.06] px-[11px] py-[5px] text-[11px] font-semibold text-poe-text hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Review all {stopCount}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-md bg-poe-gold px-[13px] py-[5px] text-[11px] font-bold text-poe-gold-ink hover:bg-poe-gold/90 transition-colors cursor-pointer"
                >
                  Finish
                </button>
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
