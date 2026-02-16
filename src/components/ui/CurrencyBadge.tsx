import { cn } from '@/lib/utils';

const CURRENCY_STYLES: Record<string, string> = {
  Wisdom: 'text-gray-400 bg-gray-700/30',
  Trans: 'text-blue-400 bg-blue-700/30',
  Alt: 'text-amber-400 bg-amber-700/30',
  Chance: 'text-green-400 bg-green-700/30',
  Regret: 'text-red-400 bg-red-700/30',
};

interface CurrencyBadgeProps {
  shortName: string;
  count: number;
  className?: string;
}

export function CurrencyBadge({ shortName, count, className }: CurrencyBadgeProps) {
  const style = CURRENCY_STYLES[shortName] ?? 'text-gray-400 bg-gray-700/30';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
        style,
        className,
      )}
    >
      {count === 1 ? shortName : `${count}x ${shortName}`}
    </span>
  );
}
