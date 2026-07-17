'use client';

import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CurrencyBadge } from '@/components/ui/CurrencyBadge';
import { SocketColorIndicator } from '@/components/ui/SocketColorIndicator';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { getStopById, getStopsForAct, getActNumbers, getQuestById } from '@/data/town-stops';
import { getRewardPickersAtStop, getExcludedQuests } from '@/lib/gem-availability';
import { getBeachGems } from '@/data/classes';
import { resolveLinkGroupsAtStop, getPreviousPhase } from '@/lib/link-group-resolver';
import { summarizeVendorCosts } from '@/lib/gem-costs';
import { useRegexStore } from '@/stores/useRegexStore';
import { useBuildStore } from '@/stores/useBuildStore';
import { combineCategories } from '@/lib/regex/combiner';
import { encodeBuild } from '@/lib/share';
import { getBulkBuyVendor, getBulkBuyGemsByStop, getExclusiveBulkBuyGemNames, computeBulkBuyRegex } from '@/lib/bulk-buy';
import { cn } from '@/lib/utils';
import type { BuildPlan, StopPlan, GemPickup, BuildLinkGroup, SocketColor } from '@/types/build';
import type { RegexCategory } from '@/types/regex';
import type { ResolvedLinkGroup } from '@/lib/link-group-resolver';

interface RunViewProps {
  build: BuildPlan;
}

/**
 * Detail levels — same route data at three densities:
 * - glance:   per-act link-group cards + single-gem chips (end-of-act state)
 * - standard: per-stop one-liners (rewards / buys / link size)
 * - learning: full per-quest breakdown with reward sets, costs, and link setups
 */
type DetailLevel = 'glance' | 'standard' | 'learning';
const DETAIL_LEVELS: DetailLevel[] = ['glance', 'standard', 'learning'];

const gemColorToVariant = {
  red: 'red',
  green: 'green',
  blue: 'blue',
} as const;

const COST_ORDER = ['Wisdom', 'Trans', 'Alt', 'Chance', 'Alch', 'Regret'];

interface InterleavedStop {
  stopPlan: StopPlan;
  label: string;
  isCustom: boolean;
  showQuestRewards: boolean;
  effectiveDisabledIds: Set<string>;
}

export function RunView({ build }: RunViewProps) {
  const actNumbers = getActNumbers();
  const maxAct = actNumbers[actNumbers.length - 1] ?? 10;
  const actRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Per-build persisted state (RunView only mounts client-side, after IndexedDB load)
  const [detail, setDetail] = useState<DetailLevel>(() => {
    if (typeof window === 'undefined') return 'standard';
    const stored = localStorage.getItem(`poe-detail-${build.id}`);
    return stored && (DETAIL_LEVELS as string[]).includes(stored)
      ? (stored as DetailLevel)
      : 'standard';
  });
  const [currentAct, setCurrentAct] = useState(() => {
    // 0 = not started ("—")
    if (typeof window === 'undefined') return 0;
    const n = parseInt(localStorage.getItem(`poe-current-act-${build.id}`) ?? '', 10);
    return Number.isNaN(n) ? 0 : Math.max(0, Math.min(maxAct, n));
  });
  const [charName, setCharName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(`poe-charname-${build.id}`) ?? '';
  });
  const [fontScale, setFontScale] = useState(100);

  const handleCharNameChange = (value: string) => {
    setCharName(value);
    if (value) {
      localStorage.setItem(`poe-charname-${build.id}`, value);
    } else {
      localStorage.removeItem(`poe-charname-${build.id}`);
    }
  };

  const handleDetailChange = (level: DetailLevel) => {
    setDetail(level);
    localStorage.setItem(`poe-detail-${build.id}`, level);
  };

  const handleActChange = (next: number) => {
    const clamped = Math.max(0, Math.min(maxAct, next));
    setCurrentAct(clamped);
    localStorage.setItem(`poe-current-act-${build.id}`, String(clamped));
    if (clamped > 0) {
      requestAnimationFrame(() => {
        actRefs.current.get(clamped)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const toggleBulkBuyRegex = useBuildStore((s) => s.toggleBulkBuyRegex);

  // Load linked regex preset
  const { presets, loadPresets } = useRegexStore();
  useEffect(() => {
    if (presets.length === 0) loadPresets();
  }, [presets.length, loadPresets]);

  // Bulk buy data
  const bulkBuyGemsByStop = useMemo(() => getBulkBuyGemsByStop(build), [build]);
  const hasBulkBuyStops = bulkBuyGemsByStop.size > 0;

  const bulkBuyRegexes = useMemo(() => {
    if (!build.bulkBuyRegex) return new Map<string, string>();
    const result = new Map<string, string>();
    for (const [stopId, gems] of bulkBuyGemsByStop) {
      const regex = computeBulkBuyRegex(gems);
      if (regex) result.set(stopId, regex);
    }
    return result;
  }, [build.bulkBuyRegex, bulkBuyGemsByStop]);

  const linkedRegex = useMemo(() => {
    if (!build.regexPresetId) return '';
    const preset = presets.find((p) => p.id === build.regexPresetId);
    if (!preset) return '';

    // When bulk buy is enabled, filter exclusive bulk buy gems from the gems category
    if (build.bulkBuyRegex) {
      const exclusiveNames = getExclusiveBulkBuyGemNames(build);
      if (exclusiveNames.size > 0) {
        const filtered = preset.categories.map((cat): RegexCategory => {
          if (cat.id !== 'gems') return cat;
          return {
            ...cat,
            entries: cat.entries.filter((e) => !e.sourceName || !exclusiveNames.has(e.sourceName)),
          };
        });
        return combineCategories(filtered);
      }
    }

    return combineCategories(preset.categories);
  }, [build, presets]);

  const handleShare = () => {
    const regexPreset = build.regexPresetId
      ? presets.find((p) => p.id === build.regexPresetId)
      : undefined;
    const encoded = encodeBuild(build, regexPreset);
    const url = `${window.location.origin}/builds/import?data=${encoded}`;
    if (url.length > 8000) {
      toast.error('Build too large for URL sharing. Use JSON export instead.');
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Share link copied!');
    });
  };

  // Full-run vendor budget (skipped pickups excluded from cost math)
  const totalBudget = useMemo(() => {
    if (!build.className) return [];
    const allVendorPickups = build.stops
      .filter((s) => s.enabled)
      .flatMap((s) => s.gemPickups.filter((p) => p.source === 'vendor' && !p.skipped));
    if (allVendorPickups.length === 0) return [];
    return summarizeVendorCosts(allVendorPickups, build.className)
      .sort((a, b) => COST_ORDER.indexOf(a.shortName) - COST_ORDER.indexOf(b.shortName));
  }, [build]);

  // Only enabled stops that have content at this detail level
  const enabledStops = useMemo(() => build.stops.filter((s) => {
    if (!s.enabled) return false;
    const hasGems = s.gemPickups.length > 0;
    if (detail === 'learning') {
      const hasNotes = s.notes.trim().length > 0;
      const resolved = resolveLinkGroupsAtStop(build.linkGroups, s.stopId);
      const hasLinks = resolved.some((r) => r.activePhase.gems.some((g) => g.gemName));
      return hasGems || hasLinks || hasNotes;
    }
    // Standard / Glance: only stops with gem pickups
    return hasGems;
  }), [build, detail]);

  const enabledStopIds = useMemo(() => new Set(enabledStops.map((s) => s.stopId)), [enabledStops]);
  const disabledStopIds = useMemo(
    () => new Set(build.stops.filter((s) => !s.enabled).map((s) => s.stopId)),
    [build.stops],
  );

  // Disabled town stops covered by an enabled custom stop (absorbs cascade)
  const coveredStopIds = useMemo(() => {
    const covered = new Set<string>();
    for (const stopId of disabledStopIds) {
      const hasEnabledCustom = build.stops.some(
        (s) => s.isCustom && s.enabled && s.afterStopId === stopId,
      );
      if (hasEnabledCustom) covered.add(stopId);
    }
    return covered;
  }, [build.stops, disabledStopIds]);

  const townStopDisabledIds = useMemo(() => {
    if (coveredStopIds.size === 0) return disabledStopIds;
    const result = new Set(disabledStopIds);
    for (const id of coveredStopIds) result.delete(id);
    return result;
  }, [disabledStopIds, coveredStopIds]);

  // Per-act sections: stops, end-of-act link state, costs
  const actSections = useMemo(() => {
    // Pre-compute end-of-act link states
    const endOfActLinksMap = new Map<number, ResolvedLinkGroup[]>();
    for (const actNum of actNumbers) {
      const actStops = getStopsForAct(actNum);
      const lastActStop = actStops[actStops.length - 1];
      endOfActLinksMap.set(
        actNum,
        lastActStop
          ? resolveLinkGroupsAtStop(build.linkGroups, lastActStop.id)
              .filter((r) => r.activePhase.gems.some((g) => g.gemName))
          : [],
      );
    }

    return actNumbers.map((actNum) => {
      const actStops = getStopsForAct(actNum);
      const actStopPlans = actStops
        .filter((ts) => enabledStopIds.has(ts.id))
        .map((ts) => ({
          townStop: ts,
          stopPlan: enabledStops.find((s) => s.stopId === ts.id)!,
        }));

      // Build interleaved list: town stops + custom stops after their anchors
      const interleavedStops: InterleavedStop[] = [];
      for (const { townStop, stopPlan } of actStopPlans) {
        interleavedStops.push({ stopPlan, label: townStop.label, isCustom: false, showQuestRewards: true, effectiveDisabledIds: townStopDisabledIds });
        // Find custom stops anchored after this town stop
        const customAfter = enabledStops.filter(
          (s) => s.isCustom && s.afterStopId === townStop.id,
        );
        const anchorDisabled = disabledStopIds.has(townStop.id);
        let questRewardsClaimed = false;
        for (const cs of customAfter) {
          const showRewards = anchorDisabled && !questRewardsClaimed;
          if (showRewards) questRewardsClaimed = true;
          interleavedStops.push({ stopPlan: cs, label: cs.customLabel || 'Custom Stop', isCustom: true, showQuestRewards: showRewards, effectiveDisabledIds: disabledStopIds });
        }
      }

      const endOfActLinks = endOfActLinksMap.get(actNum) ?? [];
      const prevActIdx = actNumbers.indexOf(actNum) - 1;
      const prevEndOfActLinks = prevActIdx >= 0
        ? endOfActLinksMap.get(actNumbers[prevActIdx]) ?? []
        : [];
      const endOfActChanged = prevActIdx < 0 || !areEndOfActLinksEqual(prevEndOfActLinks, endOfActLinks);

      const actVendorPickups = build.className
        ? interleavedStops.flatMap(({ stopPlan }) =>
            stopPlan.gemPickups.filter((p) => p.source === 'vendor' && !p.skipped))
        : [];
      const actCosts = build.className && actVendorPickups.length > 0
        ? summarizeVendorCosts(actVendorPickups, build.className)
            .sort((a, b) => COST_ORDER.indexOf(a.shortName) - COST_ORDER.indexOf(b.shortName))
        : [];

      return { actNum, interleavedStops, endOfActLinks, endOfActChanged, actCosts };
    });
  }, [actNumbers, build, enabledStops, enabledStopIds, disabledStopIds, townStopDisabledIds]);

  return (
    <div>
      {/* Sticky header: build identity + current-act stepper + detail control */}
      <div className="sticky top-0 z-20 -mt-2 mb-3 rounded-b-lg border-b border-poe-gold/20 bg-poe-card/95 px-4 py-2.5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-base font-bold text-poe-gold">{build.name}</h1>
          {build.className && (
            <span className="text-xs text-poe-muted">
              {build.className}
              {build.ascendancy ? ` · ${build.ascendancy}` : ''}
            </span>
          )}
          {build.muleClassName && <Badge variant="green" className="text-[10px]">Mule</Badge>}
          {build.stops.some((s) => s.stopId === 'a3_after_library' && s.enabled) && <Badge variant="blue" className="text-[10px]">Library</Badge>}
          {build.stops.some((s) => s.stopId === 'a3_after_gravicius' && s.enabled) && <Badge variant="red" className="text-[10px]">Gravicius</Badge>}
          <span className="flex-1" />

          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint">Currently in</span>
          <div className="flex items-center gap-0.5 rounded-lg border border-poe-gold/40 bg-poe-bg p-0.5">
            <button
              type="button"
              onClick={() => handleActChange(currentAct - 1)}
              disabled={currentAct <= 0}
              className="grid h-6 w-7 place-items-center rounded-md text-[15px] font-bold text-poe-gold transition-colors hover:bg-poe-gold/10 disabled:pointer-events-none disabled:opacity-30"
              aria-label="Previous act"
            >
              &minus;
            </button>
            <span className="min-w-[52px] text-center text-[13px] font-bold text-poe-bright">
              {currentAct === 0 ? '—' : `Act ${currentAct}`}
            </span>
            <button
              type="button"
              onClick={() => handleActChange(currentAct + 1)}
              disabled={currentAct >= maxAct}
              className="grid h-6 w-7 place-items-center rounded-md text-[15px] font-bold text-poe-gold transition-colors hover:bg-poe-gold/10 disabled:pointer-events-none disabled:opacity-30"
              aria-label="Next act"
            >
              +
            </button>
          </div>

          <span className="ml-1 font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint">Detail</span>
          <div className="flex rounded-lg border border-poe-border bg-poe-bg p-0.5 text-[11px] font-semibold">
            {DETAIL_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleDetailChange(level)}
                className={cn(
                  'rounded-md px-2.5 py-1 capitalize transition-colors',
                  detail === level
                    ? 'bg-poe-gold text-poe-gold-ink'
                    : 'text-poe-muted hover:text-poe-text',
                )}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontScale((s) => Math.max(50, s - 10))}
              className="px-1.5 text-xs"
              title="Decrease text size"
            >
              -
            </Button>
            <span className="w-8 text-center text-xs text-poe-muted">{fontScale}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontScale((s) => Math.min(200, s + 10))}
              className="px-1.5 text-xs"
              title="Increase text size"
            >
              +
            </Button>
          </div>

          <Button variant="secondary" size="sm" onClick={handleShare} title="Copy share link">
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          <Link
            href={`/builds/${build.id}`}
            className="inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-poe-muted transition-colors hover:bg-poe-border/50 hover:text-poe-text"
          >
            &larr; Edit
          </Link>
        </div>
      </div>

      {/* Regex strip — visible at all detail levels */}
      <div className="mb-3 flex flex-col gap-1.5 rounded-lg border border-poe-border bg-poe-card px-3.5 py-2.5">
        <StripRow label="Character">
          <input
            type="text"
            value={charName}
            onChange={(e) => handleCharNameChange(e.target.value)}
            placeholder="Character name"
            className="min-w-0 flex-1 rounded-md border border-poe-border bg-poe-input px-2.5 py-1 font-mono text-xs text-poe-text outline-none placeholder:text-poe-muted/40 focus:border-poe-gold/40"
          />
          {charName && <SmallCopyButton text={charName} />}
        </StripRow>

        {totalBudget.length > 0 && (
          <StripRow label="Budget">
            <div className="flex flex-wrap gap-1">
              {totalBudget.map((c) => (
                <CurrencyBadge key={c.shortName} shortName={c.shortName} count={c.count} />
              ))}
            </div>
          </StripRow>
        )}

        {hasBulkBuyStops && (
          <StripRow label="Bulk buy">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={!!build.bulkBuyRegex}
                onChange={() => toggleBulkBuyRegex(build.id)}
                className="h-3.5 w-3.5 accent-poe-gold"
              />
              <span className="text-xs text-poe-muted">Separate vendor regexes for Siosa / Lily</span>
            </label>
          </StripRow>
        )}

        {linkedRegex && (
          <StripRow label="Search">
            <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-poe-muted" title={linkedRegex}>
              {linkedRegex}
            </code>
            <SmallCopyButton text={linkedRegex} />
          </StripRow>
        )}

        {bulkBuyRegexes.size > 0 && [...bulkBuyRegexes.entries()].map(([stopId, regex]) => {
          const vendor = getBulkBuyVendor(stopId);
          const label = vendor === 'siosa' ? 'Siosa' : 'Lily Roth';
          return (
            <StripRow key={stopId} label={label}>
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-poe-muted" title={regex}>
                {regex}
              </code>
              {regex.length > 200 && (
                <span className={cn('shrink-0 text-[10px]', regex.length > 250 ? 'text-red-400' : 'text-poe-muted/50')}>
                  {regex.length}/250
                </span>
              )}
              <SmallCopyButton text={regex} />
            </StripRow>
          );
        })}
      </div>

      {/* Mule */}
      {build.muleClassName && (build.mulePickups?.length ?? 0) > 0 && detail !== 'glance' && (
        <div className="mb-3 text-sm">
          <span className="font-semibold text-poe-gold">Mule</span>
          <span className="ml-1.5 text-poe-muted">({build.muleClassName})</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(() => {
              const beach = getBeachGems(build.muleClassName);
              return beach ? (
                <>
                  <Badge variant="default" className="px-1.5 py-0 text-[11px]">{beach.skillGem}</Badge>
                  <Badge variant="default" className="px-1.5 py-0 text-[11px]">{beach.supportGem}</Badge>
                </>
              ) : null;
            })()}
            {build.mulePickups!.map((p) => (
              <Badge key={p.id} variant={gemColorToVariant[p.gemColor]} className="px-1.5 py-0 text-[11px]">
                {p.gemName}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Continuous act sheet */}
      <div className="space-y-2" style={{ zoom: fontScale / 100 }}>
        {actSections.map(({ actNum, interleavedStops, endOfActLinks, endOfActChanged, actCosts }) => {
          const isCurrent = currentAct === actNum;

          // What does this act have to show at this detail level?
          const hasStops = detail !== 'glance' && interleavedStops.length > 0;
          const hasGlanceContent = detail === 'glance' && endOfActLinks.length > 0;
          const hasFooter = endOfActLinks.length > 0 && (detail === 'glance' || endOfActChanged);
          if (!hasStops && !hasGlanceContent && !hasFooter) return null;

          const linkedGroups = endOfActLinks.filter((r) => r.activePhase.gems.filter((g) => g.gemName).length > 1);
          const singleGroups = endOfActLinks.filter((r) => r.activePhase.gems.filter((g) => g.gemName).length === 1);

          return (
            <section
              key={actNum}
              ref={(el) => {
                if (el) actRefs.current.set(actNum, el);
                else actRefs.current.delete(actNum);
              }}
              className={cn(
                'scroll-mt-16 rounded-xl px-3 py-2.5 transition-shadow',
                isCurrent && 'bg-poe-card ring-2 ring-poe-gold shadow-[0_0_24px_rgba(230,194,106,0.18)]',
              )}
            >
              {/* Act header */}
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="text-[13px] font-extrabold uppercase tracking-wider text-poe-gold">Act {actNum}</span>
                {isCurrent && (
                  <span className="rounded bg-poe-gold/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-poe-gold">
                    You are here
                  </span>
                )}
                {actCosts.map((c) => (
                  <CurrencyBadge key={c.shortName} shortName={c.shortName} count={c.count} />
                ))}
                <span className="h-px flex-1 bg-poe-border/60" />
                {endOfActLinks.length > 0 && (
                  <span className="font-mono text-[11px] text-poe-faint">
                    {formatSocketSummary(endOfActLinks, true)}
                  </span>
                )}
              </div>

              {/* Glance: end-of-act link-group cards + single-gem chips */}
              {detail === 'glance' && hasGlanceContent && (
                <>
                  {linkedGroups.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {linkedGroups.map((r) => (
                        <GlanceCard key={r.buildLinkGroup.id} resolved={r} />
                      ))}
                    </div>
                  )}
                  {singleGroups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {singleGroups.map((r) => {
                        const gem = r.activePhase.gems.find((g) => g.gemName)!;
                        return (
                          <span
                            key={r.buildLinkGroup.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-poe-border/40 bg-poe-row px-2.5 py-1 text-[11px] font-semibold text-poe-text"
                          >
                            <SocketColorIndicator color={gem.socketColor} className="h-1.5 w-1.5" />
                            {gem.gemName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Standard: per-stop one-liners */}
              {detail === 'standard' && hasStops && (
                <div className="flex flex-col">
                  {interleavedStops.map((item, i) => (
                    <StandardStopRow
                      key={item.stopPlan.stopId}
                      item={item}
                      className={build.className}
                      buildLinkGroups={build.linkGroups}
                      first={i === 0}
                    />
                  ))}
                </div>
              )}

              {/* Learning: full per-quest breakdown */}
              {detail === 'learning' && hasStops && (
                <div className="flex flex-col">
                  {interleavedStops.map((item, i) => (
                    <LearningStopBlock
                      key={item.stopPlan.stopId}
                      item={item}
                      className={build.className}
                      buildLinkGroups={build.linkGroups}
                      first={i === 0}
                    />
                  ))}
                </div>
              )}

              {/* End-of-act footer */}
              {hasFooter && (
                <div className="mt-3 flex items-center gap-2.5 border-t border-poe-border/50 pt-2.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-poe-gold">
                    End of Act {actNum}
                  </span>
                  <span className="font-mono text-[11px] text-poe-faint">
                    {formatSocketSummary(endOfActLinks)}
                  </span>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** Labeled row inside the regex strip. */
function StripRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-20 shrink-0 font-mono text-[9px] font-bold uppercase tracking-widest text-poe-faint">
        {label}
      </span>
      {children}
    </div>
  );
}

/** Small blue copy button used in the regex strip. */
function SmallCopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-poe-blue/15 px-2 py-1 text-[10px] font-semibold text-poe-blue transition-colors hover:bg-poe-blue/25"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/** Glance-level card for a multi-gem link group. */
function GlanceCard({ resolved }: { resolved: ResolvedLinkGroup }) {
  const gems = resolved.activePhase.gems.filter((g) => g.gemName);
  if (gems.length === 0) return null;
  const label = resolved.buildLinkGroup.label?.trim();
  const [main, ...supports] = gems;

  return (
    <div className="rounded-lg border border-poe-border/60 bg-poe-row px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="inline-flex gap-1">
          {gems.map((g, i) => (
            <SocketColorIndicator key={i} color={g.socketColor} className="h-2 w-2" />
          ))}
        </span>
        <span
          className={cn(
            'font-mono text-[10px] font-bold uppercase tracking-widest',
            label ? 'text-poe-gold' : 'text-poe-faint',
          )}
        >
          {gems.length}-Link{label ? ` · ${label}` : ''}
        </span>
      </div>
      <div className="text-sm font-bold text-poe-bright">{main.gemName}</div>
      {supports.length > 0 && (
        <div className="text-xs text-poe-muted">{supports.map((g) => g.gemName).join(' · ')}</div>
      )}
    </div>
  );
}

/** Standard-level per-stop one-liner: gold stop label · sentence · link size. */
function StandardStopRow({
  item,
  className,
  buildLinkGroups,
  first,
}: {
  item: InterleavedStop;
  className: string;
  buildLinkGroups: BuildLinkGroup[];
  first: boolean;
}) {
  const { stopPlan, label } = item;
  const questPickups = stopPlan.gemPickups.filter((p) => p.source === 'quest_reward');
  const vendorPickups = stopPlan.gemPickups.filter((p) => p.source === 'vendor');
  const beach = stopPlan.stopId === 'a1_after_hillock' ? getBeachGems(className) : null;

  const segments: ReactNode[] = [];
  if (beach) {
    segments.push(
      <span key="beach">
        Pick <StandardGemNames pickups={[]} plainNames={[beach.skillGem, beach.supportGem]} />
      </span>,
    );
  }
  if (questPickups.length > 0) {
    segments.push(
      <span key="reward">
        Reward <StandardGemNames pickups={questPickups} />
      </span>,
    );
  }
  if (vendorPickups.length > 0) {
    const costs = className
      ? summarizeVendorCosts(vendorPickups.filter((p) => !p.skipped), className)
      : [];
    const costParts = costs.map((c) => (c.count === 1 ? c.shortName : `${c.count}× ${c.shortName}`));
    segments.push(
      <span key="buy">
        buy <StandardGemNames pickups={vendorPickups} />
        {costParts.length > 0 && <span className="text-poe-faint"> ({costParts.join(', ')})</span>}
      </span>,
    );
  }

  // Link size: largest active link group at this stop
  const resolved = resolveLinkGroupsAtStop(buildLinkGroups, stopPlan.stopId);
  const maxLinks = resolved.reduce(
    (max, r) => Math.max(max, r.activePhase.gems.filter((g) => g.gemName).length),
    0,
  );

  return (
    <div className={cn('flex items-baseline gap-2.5 py-1.5', !first && 'border-t border-poe-border/20')}>
      <span className="w-[104px] shrink-0 text-[11px] font-bold text-poe-gold/80">{label}</span>
      <span className="min-w-0 flex-1 text-[13px] text-poe-text">
        {segments.length > 0
          ? segments.map((seg, i) => (
              <span key={i}>
                {i > 0 && <span className="text-poe-faint"> · </span>}
                {seg}
              </span>
            ))
          : <span className="text-poe-faint">—</span>}
      </span>
      {maxLinks > 1 && (
        <span className="shrink-0 font-mono text-[11px] text-poe-faint">{maxLinks}L</span>
      )}
    </div>
  );
}

/** Bold bright gem names for Standard rows; skipped pickups struck and greyed. */
function StandardGemNames({ pickups, plainNames }: { pickups: GemPickup[]; plainNames?: string[] }) {
  const parts: ReactNode[] = [];
  for (const name of plainNames ?? []) {
    parts.push(<b key={`p-${name}`} className="font-semibold text-poe-bright">{name}</b>);
  }
  for (const p of pickups) {
    parts.push(
      p.skipped ? (
        <s key={p.id} className="text-poe-faint" title="Skipped">{p.gemName}</s>
      ) : (
        <b key={p.id} className="font-semibold text-poe-bright">{p.gemName}</b>
      ),
    );
  }
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && ', '}
          {part}
        </span>
      ))}
    </>
  );
}

/** Learning-level gem chip, tinted by gem color; skipped chips greyed + struck. */
function LearningGemChip({ pickup }: { pickup: GemPickup }) {
  if (pickup.skipped) {
    return (
      <span
        className="inline-flex items-center rounded bg-poe-border/30 px-2 py-0.5 text-xs font-medium text-poe-faint line-through"
        title="Skipped"
      >
        {pickup.gemName}
      </span>
    );
  }
  return (
    <Badge variant={gemColorToVariant[pickup.gemColor]} className="px-2 py-0.5 text-xs font-semibold">
      {pickup.gemName}
    </Badge>
  );
}

/** Learning-level per-stop block: quests, reward sets, buys with costs, links, notes. */
function LearningStopBlock({
  item,
  className,
  buildLinkGroups,
  first,
}: {
  item: InterleavedStop;
  className: string;
  buildLinkGroups: BuildLinkGroup[];
  first: boolean;
}) {
  const { stopPlan, label: stopLabel, isCustom, showQuestRewards, effectiveDisabledIds } = item;

  // Reward set labels for this stop
  const effectiveStopId = isCustom ? (stopPlan.afterStopId ?? stopPlan.stopId) : stopPlan.stopId;
  const rewardPickers = showQuestRewards
    ? getRewardPickersAtStop(effectiveStopId, className, effectiveDisabledIds)
    : [];
  const rewardSetMap = new Map(rewardPickers.map((rp) => [rp.rewardSetId, rp.label]));

  // Group gem pickups
  const questPickups = stopPlan.gemPickups.filter((p) => p.source === 'quest_reward');
  const vendorPickups = stopPlan.gemPickups.filter((p) => p.source === 'vendor');

  const questGroups = new Map<string, GemPickup[]>();
  for (const p of questPickups) {
    const key = p.rewardSetId ?? '_unknown';
    const arr = questGroups.get(key) ?? [];
    arr.push(p);
    questGroups.set(key, arr);
  }

  // Resolve link groups (hide 1L groups from per-stop display)
  const resolvedLinkGroups = resolveLinkGroupsAtStop(buildLinkGroups, stopPlan.stopId);
  const activeLinkGroups = resolvedLinkGroups.filter((r) => {
    const filledGems = r.activePhase.gems.filter((g) => g.gemName);
    return filledGems.length > 1;
  });
  const changedGroups = activeLinkGroups.filter((r) => r.isPhaseStart);
  const inheritedGroups = activeLinkGroups.filter((r) => !r.isPhaseStart);

  // Compute excluded quests from disabled optional stops
  const excluded = effectiveDisabledIds ? getExcludedQuests(effectiveDisabledIds) : new Set<string>();

  // New quest names at this stop (none for custom stops)
  const stop = isCustom ? null : getStopById(stopPlan.stopId);
  const newQuestIds = stop ? (() => {
    const effectiveQuests = excluded.size > 0
      ? stop.questsCompleted.filter((q) => !excluded.has(q))
      : stop.questsCompleted;
    const allStops = getStopsForAct(stop.actNumber);
    const idx = allStops.findIndex((s) => s.id === stop.id);
    if (idx <= 0) return effectiveQuests;
    // Walk backward to find previous enabled stop for comparison
    let prevQuests: Set<string> = new Set();
    if (effectiveDisabledIds && effectiveDisabledIds.size > 0) {
      for (let i = idx - 1; i >= 0; i--) {
        if (!effectiveDisabledIds.has(allStops[i].id)) {
          prevQuests = new Set(allStops[i].questsCompleted.filter((q) => !excluded.has(q)));
          break;
        }
      }
    } else {
      const prevStop = allStops[idx - 1];
      prevQuests = new Set(prevStop?.questsCompleted ?? []);
    }
    return effectiveQuests.filter((q) => !prevQuests.has(q));
  })() : [];

  const newQuestNames = newQuestIds
    .map((qid) => getQuestById(qid)?.name)
    .filter(Boolean) as string[];

  const beach = stopPlan.stopId === 'a1_after_hillock' ? getBeachGems(className) : null;

  const vendorCosts = className
    ? summarizeVendorCosts(vendorPickups.filter((p) => !p.skipped), className)
    : [];
  const vendorCostParts = vendorCosts.map((c) =>
    c.count === 1 ? c.shortName : `${c.count}× ${c.shortName}`,
  );

  return (
    <div className={cn('py-2.5', !first && 'border-t border-poe-border/20')}>
      {/* Stop header */}
      <div className="mb-1 flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-bold text-poe-gold/90">{stopLabel}</span>
        {newQuestNames.length > 0 && (
          <span className="text-xs text-poe-muted">{newQuestNames.join(', ')}</span>
        )}
      </div>

      <div className="space-y-1">
        {/* Beach gems */}
        {beach && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-poe-faint">Beach:</span>
            <Badge variant="default" className="px-2 py-0.5 text-xs font-semibold">{beach.skillGem}</Badge>
            <Badge variant="default" className="px-2 py-0.5 text-xs font-semibold">{beach.supportGem}</Badge>
          </div>
        )}

        {/* Quest reward pickups by reward set */}
        {[...questGroups.entries()].map(([setId, pickups]) => {
          const label = rewardSetMap.get(setId) ?? setId;
          return (
            <div key={setId} className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-poe-faint">{label}:</span>
              {pickups.map((p) => (
                <LearningGemChip key={p.id} pickup={p} />
              ))}
            </div>
          );
        })}

        {/* Vendor pickups */}
        {vendorPickups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-poe-faint">Buy:</span>
            {vendorPickups.map((p) => (
              <LearningGemChip key={p.id} pickup={p} />
            ))}
            {vendorCostParts.length > 0 && (
              <span className="text-poe-faint">({vendorCostParts.join(', ')})</span>
            )}
          </div>
        )}

        {/* Notes */}
        {stopPlan.notes.trim() && (
          <p className="text-xs italic text-poe-muted/70">{stopPlan.notes}</p>
        )}

        {/* Link groups that change at this stop */}
        {changedGroups.length > 0 && (
          <div className="space-y-0.5 pt-0.5">
            {changedGroups.map((resolved) => (
              <LinkGroupLine key={resolved.buildLinkGroup.id} resolved={resolved} />
            ))}
          </div>
        )}
        {inheritedGroups.length > 0 && (
          <div className="text-[10px] text-poe-muted/40">
            {inheritedGroups.map((r) => {
              const label = r.buildLinkGroup.label?.trim();
              const count = r.activePhase.gems.filter((g) => g.gemName).length;
              return label ? `${label} ${count}L` : `${count}L`;
            }).join(' / ')}
          </div>
        )}
      </div>
    </div>
  );
}

function LinkGroupLine({ resolved }: { resolved: ResolvedLinkGroup }) {
  const { buildLinkGroup, activePhase, isPhaseStart } = resolved;
  const activeGems = activePhase.gems.filter((g) => g.gemName);
  if (activeGems.length === 0) return null;

  const label = buildLinkGroup.label?.trim();

  // Track which gem slots changed and which gems were removed
  const changedIndices = new Set<number>();
  const removedGems: { name: string; socketColor: SocketColor }[] = [];
  if (isPhaseStart) {
    const prevPhase = getPreviousPhase(buildLinkGroup, activePhase);
    if (prevPhase) {
      const maxLen = Math.max(prevPhase.gems.length, activePhase.gems.length);
      for (let i = 0; i < maxLen; i++) {
        const prev = prevPhase.gems[i]?.gemName || '';
        const curr = activePhase.gems[i]?.gemName || '';
        if (prev !== curr) {
          changedIndices.add(i);
          if (prev) {
            removedGems.push({ name: prev, socketColor: prevPhase.gems[i].socketColor });
          }
        }
      }
    }
  }

  const gemsWithAlts = activeGems.filter((g) => g.alternatives && g.alternatives.length > 0);

  return (
    <div className="text-xs">
      <div className="flex flex-wrap items-center gap-1">
        <span className="font-mono text-[11px] text-poe-faint">
          {label ? `${label} ${activeGems.length}L` : `${activeGems.length}L`}
        </span>
        {activeGems.map((gem, i) => {
          const changed = changedIndices.has(i);
          return (
            <span key={i} className="inline-flex items-center gap-1">
              <SocketColorIndicator color={gem.socketColor} className="h-2 w-2" />
              <span className={cn(socketTextColor(gem.socketColor), changed && 'font-bold')}>{gem.gemName}</span>
            </span>
          );
        })}
        {removedGems.map((gem, i) => (
          <span key={`rm-${i}`} className="inline-flex items-center gap-0.5 opacity-40 line-through">
            <span className={socketTextColor(gem.socketColor)}>{gem.name}</span>
          </span>
        ))}
      </div>
      {gemsWithAlts.map((gem, i) => (
        <div key={i} className="ml-4 flex flex-wrap items-center gap-1 text-poe-muted/60">
          {gem.alternatives!.map((alt, ai) => (
            <span key={ai} className="inline-flex items-center gap-0.5">
              or <SocketColorIndicator color={alt.socketColor} className="h-2 w-2" />
              <span className={socketTextColor(alt.socketColor)}>{alt.gemName}</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Summarize socket requirements: linked groups in brackets, singles pooled by color.
 * e.g. "[1R2G] [2R1G] · 3R 1G 1B" — pass groupsOnly to omit the singles.
 */
function formatSocketSummary(resolved: ResolvedLinkGroup[], groupsOnly = false): string {
  const COLOR_ORDER: SocketColor[] = ['R', 'G', 'B', 'W'];
  const groups: string[] = [];
  const looseCounts: Partial<Record<SocketColor, number>> = {};

  for (const r of resolved) {
    const filled = r.activePhase.gems.filter((g) => g.gemName);
    if (filled.length === 0) continue;

    if (filled.length === 1) {
      const c = filled[0].socketColor;
      looseCounts[c] = (looseCounts[c] ?? 0) + 1;
    } else {
      const counts: Partial<Record<SocketColor, number>> = {};
      for (const g of filled) {
        counts[g.socketColor] = (counts[g.socketColor] ?? 0) + 1;
      }
      let part = '';
      for (const c of COLOR_ORDER) {
        if (counts[c]) part += `${counts[c]}${c}`;
      }
      groups.push(`[${part}]`);
    }
  }

  const groupsPart = groups.join(' ');
  if (groupsOnly) return groupsPart;

  const loosePart = COLOR_ORDER.filter((c) => looseCounts[c])
    .map((c) => `${looseCounts[c]}${c}`)
    .join(' ');

  if (groupsPart && loosePart) return `${groupsPart} · ${loosePart}`;
  return groupsPart || loosePart;
}

function socketTextColor(color: SocketColor): string {
  switch (color) {
    case 'R': return 'text-poe-red';
    case 'G': return 'text-poe-green';
    case 'B': return 'text-poe-blue';
    case 'W': return 'text-poe-text';
  }
}

/** Compare two end-of-act resolved link group arrays for equality. */
function areEndOfActLinksEqual(prev: ResolvedLinkGroup[], curr: ResolvedLinkGroup[]): boolean {
  if (prev.length !== curr.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const pGems = prev[i].activePhase.gems;
    const cGems = curr[i].activePhase.gems;
    if (pGems.length !== cGems.length) return false;
    for (let j = 0; j < pGems.length; j++) {
      if (pGems[j].gemName !== cGems[j].gemName) return false;
      if (pGems[j].socketColor !== cGems[j].socketColor) return false;
    }
  }
  return true;
}
