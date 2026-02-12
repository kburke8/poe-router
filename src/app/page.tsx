'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRegexStore } from '@/stores/useRegexStore';
import { useBuildStore } from '@/stores/useBuildStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { downloadJson, readFileAsJson, type ExportData } from '@/lib/export';
import { combineCategories } from '@/lib/regex/combiner';
import { db } from '@/db/database';

export default function DashboardPage() {
  const { presets, loadPresets } = useRegexStore();
  const { builds, loadBuilds } = useBuildStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPresets();
    loadBuilds();
  }, [loadPresets, loadBuilds]);

  const recentBuilds = builds.slice(0, 3);
  const lastPreset = presets.length > 0 ? presets[presets.length - 1] : null;
  const lastPresetRegex = lastPreset ? combineCategories(lastPreset.categories) : '';

  const handleExport = async () => {
    const allPresets = await db.regexPresets.toArray();
    const allBuilds = await db.builds.toArray();
    const allRuns = await db.runs.toArray();
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      regexPresets: allPresets,
      builds: allBuilds,
      runs: allRuns,
    };
    downloadJson(data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readFileAsJson(file);
      if (data.regexPresets) {
        for (const preset of data.regexPresets) {
          await db.regexPresets.put(preset);
        }
      }
      if (data.builds) {
        for (const build of data.builds) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b = build as any;
          if (!b.linkGroups) b.linkGroups = [];
          if (b.version !== 3) b.version = 3;
          // Strip per-stop linkGroups from V2 builds
          if (Array.isArray(b.stops)) {
            for (const stop of b.stops) {
              delete stop.linkGroups;
            }
          }
          await db.builds.put(build);
        }
      }
      if (data.runs) {
        for (const run of data.runs) {
          await db.runs.put(run);
        }
      }
      // Reload all stores
      loadPresets();
      loadBuilds();
      alert('Import successful!');
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-poe-gold">PoE Speed Run Planner</h1>
        <p className="mt-1 text-sm text-poe-muted">
          Plan your builds, manage loot filters, and track your runs.
        </p>
      </div>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/builds">
            <Button variant="primary">New Build</Button>
          </Link>
          <Link href="/regex">
            <Button variant="secondary">New Regex Preset</Button>
          </Link>
        </div>
      </section>

      {/* Recent Builds */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-poe-text">Recent Builds</h2>
          <Link href="/builds" className="text-sm text-poe-gold hover:underline">
            View all
          </Link>
        </div>
        {recentBuilds.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-poe-muted">
              No builds yet. Create your first build to plan gem setups, gear goals, and skill transitions.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentBuilds.map((build) => (
              <Link key={build.id} href={`/builds/${build.id}`}>
                <Card className="cursor-pointer transition-colors hover:border-poe-gold/50">
                  <h3 className="truncate font-semibold text-poe-text">{build.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {build.className && <Badge variant="gold">{build.className}</Badge>}
                    {build.ascendancy && <Badge variant="default">{build.ascendancy}</Badge>}
                  </div>
                  <p className="mt-2 text-xs text-poe-muted">
                    Updated {new Date(build.updatedAt).toLocaleDateString()}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Regex Quick Access */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-poe-text">Regex Quick Access</h2>
          <Link href="/regex" className="text-sm text-poe-gold hover:underline">
            Open Builder
          </Link>
        </div>
        {!lastPreset ? (
          <Card>
            <p className="text-center text-sm text-poe-muted">
              No regex presets yet. Create one to generate PoE loot filter search strings.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-poe-text">
                  {lastPreset.name}
                </h3>
                {lastPresetRegex ? (
                  <p className="mt-1 truncate font-mono text-xs text-poe-muted">
                    {lastPresetRegex}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-poe-muted">No entries yet</p>
                )}
              </div>
              {lastPresetRegex && <CopyButton text={lastPresetRegex} />}
            </div>
          </Card>
        )}
      </section>

      {/* Import/Export */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Data Management</h2>
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={handleExport}>
              Export All Data
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Import from JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          <p className="mt-2 text-xs text-poe-muted">
            Export your builds, regex presets, and run history as JSON, or import a previously exported file.
          </p>
        </Card>
      </section>
    </div>
  );
}
