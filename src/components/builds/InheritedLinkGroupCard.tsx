'use client';

import { Button } from '@/components/ui/Button';
import { SocketColorIndicator } from '@/components/ui/SocketColorIndicator';
import type { BuildLinkGroup, LinkGroupPhase } from '@/types/build';
import { getStopById } from '@/data/town-stops';

interface InheritedLinkGroupCardProps {
  buildLinkGroup: BuildLinkGroup;
  activePhase: LinkGroupPhase;
  onAddTransition: () => void;
  onRetire: () => void;
}

export function InheritedLinkGroupCard({
  buildLinkGroup,
  activePhase,
  onAddTransition,
  onRetire,
}: InheritedLinkGroupCardProps) {
  const sourceStop = getStopById(activePhase.fromStopId);
  const activeGems = activePhase.gems.filter((g) => g.gemName);

  return (
    <div className="rounded-md border border-poe-border/50 bg-poe-bg/30 p-3 opacity-60 hover:opacity-80 transition-opacity">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {activePhase.gems.map((gem, i) => (
              <SocketColorIndicator key={i} color={gem.socketColor} className="h-3.5 w-3.5" />
            ))}
            <span className="ml-1 text-xs text-poe-muted">{activePhase.gems.length}L</span>
          </div>
          {buildLinkGroup.label && (
            <span className="text-xs font-medium text-poe-text/70 truncate">
              {buildLinkGroup.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onRetire} title="Stop using this link group from this stop onward">
            Drop
          </Button>
          <Button variant="ghost" size="sm" onClick={onAddTransition} title="Create a transition phase at this stop">
            + Transition
          </Button>
        </div>
      </div>

      {/* Gem names (read-only) */}
      {activeGems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs text-poe-muted/70">
          {activeGems.map((gem, i) => (
            <span key={i} className="inline-flex items-center gap-0.5">
              <SocketColorIndicator color={gem.socketColor} className="h-2 w-2" />
              {gem.gemName}
              {gem.alternatives && gem.alternatives.length > 0 && (
                <span className="text-poe-muted/50 text-[10px]">
                  {gem.alternatives.map((alt, ai) => (
                    <span key={ai} className="inline-flex items-center gap-0.5 ml-1">
                      (or <SocketColorIndicator color={alt.socketColor} className="h-1.5 w-1.5" /> {alt.gemName})
                    </span>
                  ))}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Source line */}
      {sourceStop && (
        <p className="text-[10px] text-poe-muted/50 mt-1">
          inherited from {sourceStop.label}
        </p>
      )}
    </div>
  );
}
