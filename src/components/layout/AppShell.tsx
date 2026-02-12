'use client';

import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="pt-8 pb-2 text-center text-[11px] text-poe-muted/40">
          This site isn&apos;t affiliated with or endorsed by Grinding Gear Games in any way.
        </footer>
      </main>
    </div>
  );
}
