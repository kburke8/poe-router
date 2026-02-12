'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { POE_CLASSES, getAscendancies } from '@/data/classes';
import { useRegexStore } from '@/stores/useRegexStore';
import { useBuildStore } from '@/stores/useBuildStore';
import { generateBuildRegex, hasBuildRegexContent } from '@/lib/regex/generate-from-build';
import type { BuildPlan } from '@/types/build';

interface BuildHeaderProps {
  build: BuildPlan;
  onUpdate: (updates: { name?: string; className?: string; ascendancy?: string; regexPresetId?: string }) => void;
}

export function BuildHeader({ build, onUpdate }: BuildHeaderProps) {
  const [name, setName] = useState(build.name);
  const ascendancies = getAscendancies(build.className);
  const { presets, loadPresets, createPreset, setActivePreset, addEntry, clearCategory } = useRegexStore();
  const { initializeStops } = useBuildStore();

  useEffect(() => {
    setName(build.name);
  }, [build.name]);

  useEffect(() => {
    if (presets.length === 0) loadPresets();
  }, [presets.length, loadPresets]);

  const linkedPreset = build.regexPresetId
    ? presets.find((p) => p.id === build.regexPresetId)
    : null;

  const handleClassChange = (newClassName: string) => {
    onUpdate({ className: newClassName });
    // Ensure stops are initialized when class is set
    if (newClassName) {
      initializeStops(build.id);
    }
  };

  const handleGenerateRegex = async () => {
    if (!hasBuildRegexContent(build)) return;

    const presetId = await generateBuildRegex(build, presets, {
      createPreset,
      setActivePreset,
      clearCategory,
      addEntry,
    });

    onUpdate({ regexPresetId: presetId });
  };

  return (
    <div className="space-y-4">
      <Input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          onUpdate({ name: e.target.value });
        }}
        placeholder="Build Name"
        className="text-2xl font-bold text-poe-gold border-transparent bg-transparent px-0 focus:border-poe-gold focus:bg-poe-input"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-poe-muted">Class</label>
          <select
            value={build.className}
            onChange={(e) => handleClassChange(e.target.value)}
            className="rounded-md border border-poe-border bg-poe-input px-3 py-1.5 text-sm text-poe-text focus:border-poe-gold focus:outline-none focus:ring-1 focus:ring-poe-gold/50"
          >
            <option value="">Select Class</option>
            {POE_CLASSES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-poe-muted">Ascendancy</label>
          <select
            value={build.ascendancy}
            onChange={(e) => onUpdate({ ascendancy: e.target.value })}
            disabled={!build.className}
            className="rounded-md border border-poe-border bg-poe-input px-3 py-1.5 text-sm text-poe-text focus:border-poe-gold focus:outline-none focus:ring-1 focus:ring-poe-gold/50 disabled:opacity-50"
          >
            <option value="">Select Ascendancy</option>
            {ascendancies.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-poe-muted">Regex Preset</label>
          <select
            value={build.regexPresetId ?? ''}
            onChange={(e) => onUpdate({ regexPresetId: e.target.value || undefined })}
            className="rounded-md border border-poe-border bg-poe-input px-3 py-1.5 text-sm text-poe-text focus:border-poe-gold focus:outline-none focus:ring-1 focus:ring-poe-gold/50"
          >
            <option value="">None</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateRegex}
            disabled={!hasBuildRegexContent(build)}
          >
            Generate Regex
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

        {build.className && (
          <Badge variant="gold">{build.className}</Badge>
        )}
        {build.ascendancy && (
          <Badge variant="default">{build.ascendancy}</Badge>
        )}
      </div>
    </div>
  );
}
