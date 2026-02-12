'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRunHistoryStore } from '@/stores/useRunHistoryStore';
import { RunForm } from '@/components/history/RunForm';
import { RunCard } from '@/components/history/RunCard';
import { Button } from '@/components/ui/Button';
import type { RunRecord } from '@/types/history';

export default function RunHistoryPage() {
  const { runs, isLoading, loadRuns, createRun, updateRun, deleteRun } =
    useRunHistoryStore();

  const [showForm, setShowForm] = useState(false);
  const [editingRun, setEditingRun] = useState<RunRecord | null>(null);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleNewRun = useCallback(() => {
    setEditingRun(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((run: RunRecord) => {
    setEditingRun(run);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(
    async (run: RunRecord) => {
      if (editingRun) {
        await updateRun(run.id, run);
      } else {
        await createRun(run);
      }
      setShowForm(false);
      setEditingRun(null);
    },
    [editingRun, updateRun, createRun]
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingRun(null);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteRun(id);
    },
    [deleteRun]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-poe-gold">Run History</h1>
        {!showForm && (
          <Button variant="primary" onClick={handleNewRun}>
            New Run
          </Button>
        )}
      </div>

      {showForm && (
        <RunForm
          run={editingRun ?? undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {isLoading && (
        <p className="text-sm text-poe-muted">Loading runs...</p>
      )}

      {!isLoading && runs.length === 0 && !showForm && (
        <div className="rounded-lg border border-poe-border bg-poe-card p-8 text-center">
          <p className="text-poe-muted">
            No runs recorded yet. Click &quot;New Run&quot; to track your first
            speed run.
          </p>
        </div>
      )}

      {runs.length > 0 && (
        <div className="space-y-2">
          {runs.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
