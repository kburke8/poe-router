'use client';

import { Github, Heart, HelpCircle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TutorialProvider, useTutorial } from '@/components/tutorial/TutorialProvider';

function HelpMenu() {
  const { resetAllTours } = useTutorial();

  const handleRestartTours = () => {
    resetAllTours();
    window.location.reload();
  };

  return (
    <button
      onClick={handleRestartTours}
      className="inline-flex items-center gap-2 text-sm text-poe-muted hover:text-poe-text transition-colors"
      aria-label="Restart tutorial"
      title="Restart tutorial"
    >
      <HelpCircle className="h-4 w-4" />
      <span>Help</span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TutorialProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex-1">{children}</div>
          <footer className="pt-8 pb-2 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <HelpMenu />
              <span className="text-poe-muted/40">•</span>
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
    </TutorialProvider>
  );
}
