import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'red' | 'green' | 'blue' | 'gold';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-poe-border text-poe-text',
  red: 'bg-poe-red/20 text-poe-red',
  green: 'bg-poe-green/20 text-poe-green',
  blue: 'bg-poe-blue/20 text-poe-blue',
  gold: 'bg-poe-gold/20 text-poe-gold',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
