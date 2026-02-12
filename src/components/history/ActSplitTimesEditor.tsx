'use client';

import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { parseTime, formatTime } from '@/lib/utils';
import type { ActSplit } from '@/types/history';

interface ActSplitTimesEditorProps {
  splits: ActSplit[];
  onChange: (splits: ActSplit[]) => void;
}

export function ActSplitTimesEditor({ splits, onChange }: ActSplitTimesEditorProps) {
  const handleChange = useCallback(
    (actNumber: number, value: string) => {
      const next = splits.map((s) =>
        s.actNumber === actNumber ? { ...s, time: value } : s
      );
      onChange(next);
    },
    [splits, onChange]
  );

  const cumulativeTimes = useMemo(() => {
    let total = 0;
    return splits.map((s) => {
      if (s.time) {
        total += parseTime(s.time);
      }
      return total;
    });
  }, [splits]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-poe-muted">
        Act Split Times
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {splits.map((split, i) => (
          <div key={split.actNumber} className="space-y-1">
            <label className="block text-xs text-poe-muted">
              Act {split.actNumber}
            </label>
            <Input
              value={split.time}
              onChange={(e) => handleChange(split.actNumber, e.target.value)}
              placeholder="MM:SS"
              className="text-xs"
            />
            {cumulativeTimes[i] > 0 && (
              <span className="block text-[10px] text-poe-muted">
                {formatTime(cumulativeTimes[i])}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
