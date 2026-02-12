'use client';

import { CopyButton } from '@/components/ui/CopyButton';
import { getCharCount } from '@/lib/regex/combiner';

interface RegexPreviewProps {
  combinedRegex: string;
}

export function RegexPreview({ combinedRegex }: RegexPreviewProps) {
  const charCount = getCharCount(combinedRegex);
  const isOverLimit = charCount > 250;

  return (
    <div className="sticky bottom-0 z-30 border-t border-poe-border bg-[#0f0f23] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs font-semibold text-poe-gold">Output</span>

        <div className="min-w-0 flex-1 overflow-x-auto rounded border border-poe-border bg-poe-input px-3 py-1.5">
          {combinedRegex ? (
            <pre className="whitespace-nowrap font-mono text-xs text-poe-text">
              {combinedRegex}
            </pre>
          ) : (
            <span className="text-xs text-poe-muted">No patterns configured</span>
          )}
        </div>

        <span
          className={`shrink-0 text-xs font-mono ${
            isOverLimit ? 'font-bold text-poe-red' : 'text-poe-muted'
          }`}
        >
          {charCount}/250
        </span>

        <CopyButton text={combinedRegex} />
      </div>

      {isOverLimit && (
        <p className="mt-1 text-[10px] text-poe-red">
          Regex exceeds PoE's 250-character limit. Remove or shorten patterns.
        </p>
      )}
    </div>
  );
}
