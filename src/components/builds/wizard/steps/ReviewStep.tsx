'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SocketColorIndicator } from '@/components/ui/SocketColorIndicator';
import { useRegexStore } from '@/stores/useRegexStore';
import { computeAbbreviations } from '@/lib/regex/abbreviator';
import { getStopById, getActNumbers, getStopsForAct } from '@/data/town-stops';
import gemsData from '@/data/gems.json';
import type { Gem } from '@/types/gem';
import type { BuildPlan } from '@/types/build';

const allGemNames = [
  ...(gemsData.skills as Gem[]),
  ...(gemsData.supports as Gem[]),
].map((g) => g.name);

interface ReviewStepProps {
  build: BuildPlan;
  buildId: string;
  onUpdate: (updates: { regexPresetId?: string }) => void;
  onSwitchToAdvanced: () => void;
}

export function ReviewStep({ build, buildId, onUpdate, onSwitchToAdvanced }: ReviewStepProps) {
  const { presets, loadPresets, createPreset, setActivePreset, addEntry, clearCategory } = useRegexStore();

  useEffect(() => {
    if (presets.length === 0) loadPresets();
  }, [presets.length, loadPresets]);

  const linkedPreset = build.regexPresetId
    ? presets.find((p) => p.id === build.regexPresetId)
    : null;

  const handleGenerateVendorRegex = async () => {
    const vendorGemNames = [
      ...new Set(
        build.stops
          .flatMap((s) => s.gemPickups)
          .filter((p) => p.source === 'vendor')
          .map((p) => p.gemName)
      ),
    ];
    if (vendorGemNames.length === 0) return;

    const abbreviations = computeAbbreviations(vendorGemNames, allGemNames);

    let presetId = build.regexPresetId;
    if (presetId && presets.find((p) => p.id === presetId)) {
      setActivePreset(presetId);
      await clearCategory('gems');
    } else {
      presetId = await createPreset(`${build.name} - Vendor Gems`);
    }

    setActivePreset(presetId);
    for (const [gemName, pattern] of abbreviations) {
      await addEntry('gems', {
        pattern,
        sourceName: gemName,
        isExclusion: false,
        enabled: true,
        isCustom: false,
      });
    }

    onUpdate({ regexPresetId: presetId });
  };

  // Compute summary stats
  const actNumbers = getActNumbers();
  const gemsByAct = actNumbers.map((actNum) => {
    const actStopIds = new Set(getStopsForAct(actNum).map((s) => s.id));
    const count = build.stops
      .filter((s) => actStopIds.has(s.stopId) || (s.isCustom && s.afterStopId && actStopIds.has(s.afterStopId)))
      .reduce((sum, s) => sum + s.gemPickups.length, 0);
    return { actNum, count };
  }).filter((a) => a.count > 0);

  const totalGems = build.stops.reduce((sum, s) => sum + s.gemPickups.length, 0);
  const vendorGemCount = build.stops
    .flatMap((s) => s.gemPickups)
    .filter((p) => p.source === 'vendor').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-poe-gold mb-1">Review & Finish</h2>
        <p className="text-sm text-poe-muted">
          Review your build plan, generate vendor regex, and start your run.
        </p>
      </div>

      {/* Regex Section */}
      <div className="rounded-lg border border-poe-border bg-poe-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-poe-gold">Vendor Regex</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={build.regexPresetId ?? ''}
            onChange={(e) => onUpdate({ regexPresetId: e.target.value || undefined })}
            className="rounded-md border border-poe-border bg-poe-input px-3 py-1.5 text-sm text-poe-text focus:border-poe-gold focus:outline-none focus:ring-1 focus:ring-poe-gold/50"
          >
            <option value="">No Preset</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateVendorRegex}
            disabled={vendorGemCount === 0}
          >
            Generate Vendor Regex
          </Button>
          {linkedPreset && (
            <Link
              href="/regex"
              className="text-xs text-poe-gold hover:underline"
            >
              Open in Regex Builder
            </Link>
          )}
        </div>
        {vendorGemCount === 0 && (
          <p className="text-xs text-poe-muted">No vendor gems configured. Add vendor buys in the Gems step to enable regex generation.</p>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-poe-border bg-poe-card p-4 space-y-4">
        <h3 className="text-sm font-bold text-poe-gold">Build Summary</h3>

        {/* Class/Ascendancy */}
        <div className="flex flex-wrap gap-2">
          {build.className && <Badge variant="gold">{build.className}</Badge>}
          {build.ascendancy && <Badge variant="default">{build.ascendancy}</Badge>}
          {build.muleClassName && (
            <Badge variant="default">Mule: {build.muleClassName}</Badge>
          )}
        </div>

        {/* Gem Counts by Act */}
        {totalGems > 0 && (
          <div>
            <h4 className="text-xs font-medium text-poe-text mb-1.5">Gem Pickups ({totalGems} total)</h4>
            <div className="flex flex-wrap gap-2">
              {gemsByAct.map(({ actNum, count }) => (
                <span key={actNum} className="text-xs text-poe-muted">
                  Act {actNum}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Link Groups */}
        {build.linkGroups.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-poe-text mb-1.5">
              Link Groups ({build.linkGroups.length})
            </h4>
            <div className="space-y-1.5">
              {build.linkGroups.map((lg) => {
                const firstPhase = lg.phases[0];
                const stopInfo = firstPhase ? getStopById(firstPhase.fromStopId) : null;
                return (
                  <div key={lg.id} className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-0.5">
                      {(firstPhase?.gems ?? []).map((gem, i) => (
                        <SocketColorIndicator key={i} color={gem.socketColor} className="h-3 w-3" />
                      ))}
                    </div>
                    <span className="text-poe-text">
                      {lg.label || `${firstPhase?.gems.length ?? 0}L`}
                    </span>
                    {stopInfo && (
                      <span className="text-poe-muted">
                        from A{stopInfo.actNumber}: {stopInfo.label}
                      </span>
                    )}
                    {lg.phases.length > 1 && (
                      <span className="text-poe-gold/60">
                        ({lg.phases.length} phases)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gear Goals */}
        {build.gearGoals.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-poe-text mb-1">
              Gear Goals ({build.gearGoals.filter((g) => g.acquired).length}/{build.gearGoals.length} acquired)
            </h4>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/builds/${buildId}/run`}
          className="inline-flex items-center rounded-md border border-poe-gold/50 bg-poe-gold/10 px-4 py-2 text-sm font-medium text-poe-gold hover:bg-poe-gold/20 transition-colors"
        >
          Open Run View &rarr;
        </Link>
        <Button variant="secondary" size="md" onClick={onSwitchToAdvanced}>
          Switch to Advanced Editor
        </Button>
      </div>
    </div>
  );
}
