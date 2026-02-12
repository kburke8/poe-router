'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Code, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/builds', label: 'Builds', icon: Swords },
  { href: '/regex', label: 'Regex Builder', icon: Code },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-poe-card border-r border-poe-border">
      <div className="flex h-14 items-center px-4 border-b border-poe-border">
        <h1 className="text-lg font-bold text-poe-gold">PoE Planner</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-poe-gold/15 text-poe-gold'
                  : 'text-poe-muted hover:bg-poe-border/50 hover:text-poe-text'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
