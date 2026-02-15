'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { SocketColorIndicator } from '@/components/ui/SocketColorIndicator';
import { getStopById, getStopsForAct, getActNumbers, getQuestById } from '@/data/town-stops';
import { getRewardPickersAtStop, getExcludedQuests } from '@/lib/gem-availability';
import { getBeachGems } from '@/data/classes';
import { resolveLinkGroupsAtStop, getPreviousPhase } from '@/lib/link-group-resolver';
import { summarizeVendorCosts } from '@/lib/gem-costs';
import { useRegexStore } from '@/stores/useRegexStore';
import { combineCategories } from '@/lib/regex/combiner';
import type { BuildPlan, StopPlan, GemPickup, BuildLinkGroup } from '@/types/build';
import type { ResolvedLinkGroup } from '@/lib/link-group-resolver';

interface RunViewProps {
  build: BuildPlan;
}

/**
 * Detail levels — slide right to strip detail as you learn the build.
 * 0 = Full:      gems, notes, all per-stop links, end-of-act expanded
 * 1 = Compact:   gems only, no notes, no per-stop links, end-of-act socket summary
 * 2 = Links:     end-of-act link summaries only (no stops)
 */
const DETAIL_LABELS = ['Full', 'Compact', 'Links'] as const;
type DetailLevel = 0 | 1 | 2;

const gemColorToVariant = {
  red: 'red',
  green: 'green',
  blue: 'blue',
} as const;

export function RunView({ build }: RunViewProps) {
  const [detail, setDetail] = useState<DetailLevel>(0);
  const [fontScale, setFontScale] = useState(100);
  const actNumbers = getActNumbers();

  // Load linked regex preset
  const { presets, loadPresets } = useRegexStore();
  useEffect(() => {
    if (presets.length === 0) loadPresets();
  }, [presets.length, loadPresets]);

  const linkedRegex = useMemo(() => {
    if (!build.regexPresetId) return '';
    const preset = presets.find((p) => p.id === build.regexPresetId);
    if (!preset) return '';
    return combineCategories(preset.categories);
  }, [build.regexPresetId, presets]);

  // Derive visibility flags from detail level
  const showGems = detail <= 1;
  const showNotes = detail === 0;
  const showInherited = detail === 0;
  const showLinks = detail === 0;
  const expandEndOfAct = detail === 0 || detail === 2;
  const showStops = detail <= 1;

  // Only enabled stops that have content at this detail level
  const enabledStops = build.stops.filter((s) => {
    if (!s.enabled) return false;
    const hasGems = s.gemPickups.length > 0;
    const hasNotes = s.notes.trim().length > 0;
    if (detail === 0) {
      const resolved = resolveLinkGroupsAtStop(build.linkGroups, s.stopId);
      const hasLinks = resolved.some((r) => r.activePhase.gems.some((g) => g.gemName));
      return hasGems || hasLinks || hasNotes;
    }
    // Compact: only stops with gem pickups
    return hasGems;
  });

  const enabledStopIds = new Set(enabledStops.map((s) => s.stopId));
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-poe-gold">{build.name}</h1>
          {build.className && (
            <span className="text-sm text-poe-muted">
              {build.className}
              {build.ascendancy ? ` / ${build.ascendancy}` : ''}
            </span>
          )}
          {build.muleClassName && <Badge variant="green" className="text-[10px]">Mule</Badge>}
          {build.stops.some((s) => s.stopId === 'a3_after_library' && s.enabled) && <Badge variant="blue" className="text-[10px]">Library</Badge>}
          {build.stops.some((s) => s.stopId === 'a3_after_gravicius' && s.enabled) && <Badge variant="red" className="text-[10px]">Gravicius</Badge>}
          <div className="flex items-center gap-0.5 ml-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontScale((s) => Math.max(50, s - 10))}
              className="text-xs px-1.5"
            >
              -
            </Button>
            <span className="text-xs text-poe-muted w-8 text-center">{fontScale}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontScale((s) => Math.min(200, s + 10))}
              className="text-xs px-1.5"
            >
              +
            </Button>
          </div>
        </div>
        <Link
          href={`/builds/${build.id}`}
          className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-poe-muted hover:bg-poe-border/50 hover:text-poe-text transition-colors"
        >
          &larr; Edit
        </Link>
      </div>

      {/* Detail slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-poe-muted shrink-0">Detail</span>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={detail}
          onChange={(e) => setDetail(Number(e.target.value) as DetailLevel)}
          className="w-32 accent-poe-gold"
        />
        <span className="text-xs font-medium text-poe-gold w-16">{DETAIL_LABELS[detail]}</span>
      </div>

      {/* Linked Regex */}
      {linkedRegex && (
        <div className="flex items-center gap-2 rounded-md border border-poe-border bg-poe-card px-3 py-2">
          <code className="flex-1 text-sm font-mono text-poe-text select-all break-all">{linkedRegex}</code>
          <CopyButton text={linkedRegex} className="shrink-0" />
        </div>
      )}

      {/* Mule */}
      {build.muleClassName && (build.mulePickups?.length ?? 0) > 0 && detail <= 1 && (
        <div className="text-sm">
          <span className="font-semibold text-poe-gold">Mule</span>
          <span className="text-poe-muted ml-1.5">({build.muleClassName})</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(() => {
              const beach = getBeachGems(build.muleClassName);
              return beach ? (
                <>
                  <Badge variant="default" className="text-[11px] px-1.5 py-0">{beach.skillGem}</Badge>
                  <Badge variant="default" className="text-[11px] px-1.5 py-0">{beach.supportGem}</Badge>
                </>
              ) : null;
            })()}
            {build.mulePickups!.map((p) => (
              <Badge key={p.id} variant={gemColorToVariant[p.gemColor]} className="text-[11px] px-1.5 py-0">
                {p.gemName}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Act timeline */}
      <div className="space-y-4" style={{ zoom: fontScale / 100 }}>
        {(() => {
          // Pre-compute end-of-act link states for conditional rendering
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
            const interleavedStops: { stopPlan: StopPlan; label: string; isCustom: boolean; showQuestRewards: boolean; effectiveDisabledIds: Set<string> }[] = [];
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

            // Check if end-of-act links changed from previous act
            const prevActIdx = actNumbers.indexOf(actNum) - 1;
            const prevEndOfActLinks = prevActIdx >= 0
              ? endOfActLinksMap.get(actNumbers[prevActIdx]) ?? []
              : [];
            const endOfActChanged = prevActIdx < 0 || !areEndOfActLinksEqual(prevEndOfActLinks, endOfActLinks);

            // Skip act if nothing to show
            const hasStopsToShow = showStops && interleavedStops.length > 0;
            const hasEndOfAct = endOfActLinks.length > 0 && endOfActChanged;
            if (!hasStopsToShow && !hasEndOfAct) return null;

            return (
              <div key={actNum}>
                <h2 className="text-xs font-bold text-poe-gold/70 uppercase tracking-widest mb-1.5 border-b border-poe-border/50 pb-1">
                  Act {actNum}
                </h2>
                {showStops && interleavedStops.length > 0 && (
                  <div className="divide-y divide-poe-border/20">
                    {interleavedStops.map(({ stopPlan, label, isCustom, showQuestRewards: showRewards, effectiveDisabledIds }) => (
                      <StopBlock
                        key={stopPlan.stopId}
                        stopPlan={stopPlan}
                        stopLabel={label}
                        className={build.className}
                        buildLinkGroups={build.linkGroups}
                        disabledStopIds={effectiveDisabledIds}
                        isCustomStop={isCustom}
                        showQuestRewards={showRewards}
                        showGems={showGems}
                        showNotes={showNotes}
                        showLinks={showLinks}
                        showInherited={showInherited}
                      />
                    ))}
                  </div>
                )}
                {/* End-of-act link state summary — only if links changed from previous act */}
                {endOfActLinks.length > 0 && endOfActChanged && (
                  <EndOfActSummary
                    actNum={actNum}
                    endOfActLinks={endOfActLinks}
                    expanded={expandEndOfAct}
                  />
                )}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

function EndOfActSummary({
  actNum,
  endOfActLinks,
  expanded: defaultExpanded,
}: {
  actNum: number;
  endOfActLinks: ResolvedLinkGroup[];
  expanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Sync with parent detail level changes
  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <div className="pl-2 border-l-2 border-poe-border/40 py-2 border-t border-t-poe-border/20">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1 text-xs font-semibold text-poe-muted/60 hover:text-poe-muted transition-colors"
      >
        {expanded
          ? <ChevronDown className="h-3 w-3 shrink-0" />
          : <ChevronRight className="h-3 w-3 shrink-0" />}
        End of Act {actNum}
        <span className="font-normal text-poe-muted/40 ml-1">
          {formatSocketSummary(endOfActLinks)}
        </span>
      </button>
      {expanded && (
        <div className="space-y-0.5 mt-0.5">
          {endOfActLinks.map((r) => (
            <LinkGroupLine key={r.buildLinkGroup.id} resolved={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function StopBlock({
  stopPlan,
  stopLabel,
  className,
  buildLinkGroups,
  disabledStopIds,
  isCustomStop,
  showQuestRewards = true,
  showGems,
  showNotes,
  showLinks,
  showInherited,
}: {
  stopPlan: StopPlan;
  stopLabel: string;
  className: string;
  buildLinkGroups: BuildLinkGroup[];
  disabledStopIds?: Set<string>;
  isCustomStop?: boolean;
  showQuestRewards?: boolean;
  showGems: boolean;
  showNotes: boolean;
  showLinks: boolean;
  showInherited: boolean;
}) {
  // Get reward set labels for this stop
  const effectiveStopId = isCustomStop ? (stopPlan.afterStopId ?? stopPlan.stopId) : stopPlan.stopId;
  const rewardPickers = showQuestRewards ? getRewardPickersAtStop(effectiveStopId, className, disabledStopIds) : [];
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

  // Resolve link groups (hide 1L groups from per-stop display — they only show in end-of-act summary)
  const resolvedLinkGroups = resolveLinkGroupsAtStop(buildLinkGroups, stopPlan.stopId);
  const activeLinkGroups = resolvedLinkGroups.filter((r) => {
    const filledGems = r.activePhase.gems.filter((g) => g.gemName);
    return filledGems.length > 1;
  });

  // Split into changed (phase starts) and inherited
  const changedGroups = activeLinkGroups.filter((r) => r.isPhaseStart);
  const inheritedGroups = activeLinkGroups.filter((r) => !r.isPhaseStart);
  const hasLinkChanges = changedGroups.length > 0;

  // Compute excluded quests from disabled optional stops
  const excluded = disabledStopIds ? getExcludedQuests(disabledStopIds) : new Set<string>();

  // New quest names at this stop (none for custom stops)
  const stop = isCustomStop ? null : getStopById(stopPlan.stopId);
  const newQuestIds = stop ? (() => {
    const effectiveQuests = excluded.size > 0
      ? stop.questsCompleted.filter((q) => !excluded.has(q))
      : stop.questsCompleted;
    const allStops = getStopsForAct(stop.actNumber);
    const idx = allStops.findIndex((s) => s.id === stop.id);
    if (idx <= 0) return effectiveQuests;
    // Walk backward to find previous enabled stop for comparison
    let prevQuests: Set<string> = new Set();
    if (disabledStopIds && disabledStopIds.size > 0) {
      for (let i = idx - 1; i >= 0; i--) {
        if (!disabledStopIds.has(allStops[i].id)) {
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

  return (
    <div className="pl-2 border-l-2 border-poe-border/40 py-2">
      {/* Stop header */}
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-sm font-semibold text-poe-gold">{stopLabel}</span>
        {newQuestNames.length > 0 && (
          <span className="text-xs text-poe-muted">
            {newQuestNames.join(', ')}
          </span>
        )}
      </div>

      <div className={showLinks ? 'grid grid-cols-[280px_1fr] gap-x-4' : ''}>
          {/* Gem pickups + notes */}
          <div className="space-y-0.5">
            {/* Beach gems */}
            {showGems && stopPlan.stopId === 'a1_after_hillock' && (() => {
              const beach = getBeachGems(className);
              if (!beach) return null;
              return (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-poe-muted">Beach:</span>
                  <Badge variant="default" className="text-[11px] px-1.5 py-0">
                    {beach.skillGem}
                  </Badge>
                  <Badge variant="default" className="text-[11px] px-1.5 py-0">
                    {beach.supportGem}
                  </Badge>
                </div>
              );
            })()}

            {/* Quest reward pickups */}
            {showGems && questGroups.size > 0 && (
              <div className="space-y-0.5">
                {[...questGroups.entries()].map(([setId, pickups]) => {
                  const label = rewardSetMap.get(setId) ?? setId;
                  return (
                    <div key={setId} className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="text-poe-muted">{label}:</span>
                      {pickups.map((p) => (
                        <Badge key={p.id} variant={gemColorToVariant[p.gemColor]} className="text-[11px] px-1.5 py-0">
                          {p.gemName}
                        </Badge>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vendor pickups */}
            {showGems && vendorPickups.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-poe-muted">Buy:</span>
                {vendorPickups.map((p) => (
                  <Badge key={p.id} variant={gemColorToVariant[p.gemColor]} className="text-[11px] px-1.5 py-0">
                    {p.gemName}
                  </Badge>
                ))}
                {className && (() => {
                  const costs = summarizeVendorCosts(vendorPickups, className);
                  if (costs.length === 0) return null;
                  const parts = costs.map((c) =>
                    c.count === 1 ? c.shortName : `${c.count}x ${c.shortName}`
                  );
                  return (
                    <span className="text-poe-muted/50 ml-0.5">
                      ({parts.join(', ')})
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Notes */}
            {showNotes && stopPlan.notes.trim() && (
              <p className="text-xs italic text-poe-muted/70">{stopPlan.notes}</p>
            )}

          </div>

          {/* Link groups (Full detail only) */}
          {showLinks && (
            <div className="space-y-0.5">
              {changedGroups.map((resolved) => (
                <LinkGroupLine
                  key={resolved.buildLinkGroup.id}
                  resolved={resolved}
                />
              ))}
              {showInherited && inheritedGroups.length > 0 && !hasLinkChanges && (
                <div className="text-[10px] text-poe-muted/40">
                  {inheritedGroups.map((r) => {
                    const label = r.buildLinkGroup.label?.trim();
                    const count = r.activePhase.gems.filter((g) => g.gemName).length;
                    return label ? `${label} ${count}L` : `${count}L`;
                  }).join(' / ')}
                </div>
              )}
              {showInherited && inheritedGroups.length > 0 && hasLinkChanges && (
                <div className="text-[10px] text-poe-muted/30">
                  {inheritedGroups.map((r) => {
                    const label = r.buildLinkGroup.label?.trim();
                    const count = r.activePhase.gems.filter((g) => g.gemName).length;
                    return label ? `${label} ${count}L` : `${count}L`;
                  }).join(' / ')}
                </div>
              )}
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
  const removedGems: { name: string; socketColor: 'R' | 'G' | 'B' | 'W' }[] = [];
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
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-poe-muted font-medium">
          {label ? `${label} ${activeGems.length}L:` : `${activeGems.length}L:`}
        </span>
        {activeGems.map((gem, i) => {
          const changed = changedIndices.has(i);
          return (
            <span key={i} className="inline-flex items-center gap-0.5">
              <SocketColorIndicator color={gem.socketColor} className="h-2 w-2" />
              <span className={`${socketTextColor(gem.socketColor)}${changed ? ' font-bold' : ''}`}>{gem.gemName}</span>
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
        <div key={i} className="flex items-center gap-1 flex-wrap ml-4 text-poe-muted/60">
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

/** Summarize socket requirements: linked groups in brackets, singles pooled by color. */
function formatSocketSummary(resolved: ResolvedLinkGroup[]): string {
  const COLOR_ORDER = ['R', 'G', 'B', 'W'] as const;
  const parts: string[] = [];
  const looseCounts: Record<string, number> = {};

  for (const r of resolved) {
    const filled = r.activePhase.gems.filter((g) => g.gemName);
    if (filled.length === 0) continue;

    if (filled.length === 1) {
      const c = filled[0].socketColor;
      looseCounts[c] = (looseCounts[c] ?? 0) + 1;
    } else {
      const counts: Record<string, number> = {};
      for (const g of filled) {
        counts[g.socketColor] = (counts[g.socketColor] ?? 0) + 1;
      }
      let part = '';
      for (const c of COLOR_ORDER) {
        if (counts[c]) part += `${counts[c]}${c}`;
      }
      parts.push(`[${part}]`);
    }
  }

  for (const c of COLOR_ORDER) {
    if (looseCounts[c]) parts.push(`${looseCounts[c]}${c}`);
  }

  return parts.length > 0 ? `(${parts.join(', ')})` : '';
}

function socketTextColor(color: 'R' | 'G' | 'B' | 'W'): string {
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
