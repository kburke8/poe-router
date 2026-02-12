'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ActSplitTimesEditor } from '@/components/history/ActSplitTimesEditor';
import { useBuildStore } from '@/stores/useBuildStore';
import { createEmptyRun } from '@/types/history';
import { generateId } from '@/lib/utils';
import type { RunRecord, ActSplit } from '@/types/history';

interface RunFormProps {
  run?: RunRecord;
  onSave: (run: RunRecord) => void;
  onCancel: () => void;
}

export function RunForm({ run, onSave, onCancel }: RunFormProps) {
  const { builds, loadBuilds } = useBuildStore();

  useEffect(() => {
    loadBuilds();
  }, [loadBuilds]);

  const [form, setForm] = useState<RunRecord>(
    () => run ?? createEmptyRun(generateId())
  );

  const handleBuildSelect = useCallback(
    (buildId: string) => {
      if (buildId === '') {
        // "Custom" selected — clear the link but keep the name for typing
        setForm((prev) => ({ ...prev, buildPlanId: undefined }));
        return;
      }
      const build = builds.find((b) => b.id === buildId);
      if (build) {
        setForm((prev) => ({
          ...prev,
          buildPlanId: build.id,
          buildName: build.name,
        }));
      }
    },
    [builds]
  );

  const handleFieldChange = useCallback(
    (field: keyof RunRecord, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSplitsChange = useCallback((splits: ActSplit[]) => {
    setForm((prev) => ({ ...prev, actSplits: splits }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...form,
        updatedAt: new Date().toISOString(),
      });
    },
    [form, onSave]
  );

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold text-poe-gold">
        {run ? 'Edit Run' : 'New Run'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-poe-muted">
              Date
            </label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-poe-muted">
              Build
            </label>
            {builds.length > 0 ? (
              <select
                value={form.buildPlanId ?? ''}
                onChange={(e) => handleBuildSelect(e.target.value)}
                className="flex h-9 w-full rounded-md border border-poe-border bg-poe-bg px-3 py-1 text-sm text-poe-text focus:border-poe-gold focus:outline-none"
              >
                <option value="">Custom...</option>
                {builds.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <Input
                value={form.buildName}
                onChange={(e) => handleFieldChange('buildName', e.target.value)}
                placeholder="e.g. SRS Necromancer"
              />
            )}
            {builds.length > 0 && !form.buildPlanId && (
              <Input
                value={form.buildName}
                onChange={(e) => handleFieldChange('buildName', e.target.value)}
                placeholder="e.g. SRS Necromancer"
                className="mt-1"
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-poe-muted">
              Total Time
            </label>
            <Input
              value={form.totalTime}
              onChange={(e) => handleFieldChange('totalTime', e.target.value)}
              placeholder="HH:MM:SS"
            />
          </div>
        </div>

        <ActSplitTimesEditor
          splits={form.actSplits}
          onChange={handleSplitsChange}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-poe-muted">
            Notes
          </label>
          <Textarea
            value={form.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Any notes about this run..."
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary">
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
