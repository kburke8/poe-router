'use client';

import { Github, Heart } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="pt-8 pb-2 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/kburke8/poe-router"
              target="_blank"
              rel="noopener noreferrer"
              className="text-poe-muted/40 hover:text-poe-muted transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://ko-fi.com/kburke8"
              target="_blank"
              rel="noopener noreferrer"
              className="text-poe-muted/40 hover:text-poe-muted transition-colors"
              aria-label="Support on Ko-fi"
            >
              <Heart className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-[11px] text-poe-muted/40">
            This site isn&apos;t affiliated with or endorsed by Grinding Gear Games in any way.
          </p>
        </footer>
      </main>
    </div>
  );
}
