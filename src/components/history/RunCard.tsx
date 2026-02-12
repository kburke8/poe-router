'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { RunRecord } from '@/types/history';

interface RunCardProps {
  run: RunRecord;
  onDelete: (id: string) => void;
  onEdit: (run: RunRecord) => void;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function RunCard({ run, onDelete, onEdit }: RunCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = useCallback(() => {
    if (confirmDelete) {
      onDelete(run.id);
    } else {
      setConfirmDelete(true);
    }
  }, [confirmDelete, onDelete, run.id]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(false);
  }, []);

  return (
    <Card className="flex items-center justify-between gap-4 transition-colors hover:border-poe-gold/40">
      <button
        type="button"
        className="flex flex-1 items-center gap-4 text-left"
        onClick={() => onEdit(run)}
      >
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-poe-text">
            {run.buildName || 'Untitled Run'}
          </h4>
          <div className="flex items-center gap-2">
            <p className="text-xs text-poe-muted">
              {formatDisplayDate(run.date)}
            </p>
            {run.buildPlanId && (
              <Link
                href={`/builds/${run.buildPlanId}`}
                className="text-xs text-poe-gold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View Build
              </Link>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-lg font-mono font-bold text-poe-gold">
            {run.totalTime || '--:--:--'}
          </span>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        {confirmDelete ? (
          <>
            <Button size="sm" variant="danger" onClick={handleDeleteClick}>
              Confirm
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelDelete}>
              No
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={handleDeleteClick}>
            Delete
          </Button>
        )}
      </div>
    </Card>
  );
}
