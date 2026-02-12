import { cn } from '@/lib/utils';
import type { SocketColor } from '@/types/build';

interface SocketColorIndicatorProps {
  color: SocketColor;
  className?: string;
}

const colorMap: Record<SocketColor, string> = {
  R: 'bg-poe-red',
  G: 'bg-poe-green',
  B: 'bg-poe-blue',
  W: 'bg-white',
};

export function SocketColorIndicator({ color, className }: SocketColorIndicatorProps) {
  return (
    <span
      className={cn('inline-block h-3 w-3 rounded-full', colorMap[color], className)}
      title={`${color} socket`}
    />
  );
}
