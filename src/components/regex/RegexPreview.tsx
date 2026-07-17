'use client';

import clsx from 'clsx';
import { Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { getCharCount } from '@/lib/regex/combiner';

const CHAR_LIMIT = 250;
const AMBER_THRESHOLD = 200;

interface RegexPreviewProps {
  combinedRegex: string;
}

/**
 * Output bar pinned at the top of the builder frame: compiled search string,
 * char counter against PoE's 250-char cap, copy button, and a threshold meter.
 */
export function RegexPreview({ combinedRegex }: RegexPreviewProps) {
  const { copied, copy } = useCopyToClipboard();
  const charCount = getCharCount(combinedRegex);
  const isOverLimit = charCount > CHAR_LIMIT;
  const pct = Math.min((charCount / CHAR_LIMIT) * 100, 100);

  const textColor = isOverLimit
    ? 'text-poe-red'
    : charCount > AMBER_THRESHOLD
      ? 'text-[#e6a45a]'
      : 'text-poe-green';
  const barColor = isOverLimit
    ? 'bg-poe-red'
    : charCount > AMBER_THRESHOLD
      ? 'bg-[#e6a45a]'
      : 'bg-poe-green';

  return (
    <div className="sticky top-0 z-30 rounded-t-xl border-b border-poe-border bg-poe-card px-4 py-3.5 sm:px-5">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="text-[13px] font-bold text-poe-bright">Search string</span>
        <span className="flex-1" />
        <span className={clsx('font-mono text-[11px]', textColor)}>
          {charCount}/{CHAR_LIMIT}
        </span>
        <button
          onClick={() => copy(combinedRegex)}
          className="inline-flex items-center gap-1.5 rounded-md bg-poe-gold px-3 py-1.5 text-[11px] font-bold text-poe-gold-ink transition-colors hover:bg-poe-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-poe-gold/50"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="min-h-[38px] break-all rounded-lg border border-white/10 bg-poe-input px-3 py-2.5 font-mono text-xs leading-relaxed text-poe-text">
        {combinedRegex ? (
          <>
            {combinedRegex}
            <span className="text-poe-gold">|</span>
          </>
        ) : (
          <span className="font-sans text-xs text-poe-muted">No patterns configured</span>
        )}
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={clsx('h-full transition-all duration-150', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isOverLimit && (
        <p className="mt-1.5 text-[10px] text-poe-red">
          Regex exceeds PoE&apos;s 250-character limit. Remove or shorten patterns.
        </p>
      )}
    </div>
  );
}
