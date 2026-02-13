'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { BuildPlan } from '@/types/build';

interface BuildCardProps {
  build: BuildPlan;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export function BuildCard({ build, onClick, onDelete }: BuildCardProps) {
  const updatedDate = new Date(build.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalStops = build.stops?.length ?? 0;
  const enabledStops = build.stops?.filter((s) => s.enabled).length ?? 0;
  const totalLinkGroups = build.linkGroups?.length ?? 0;

  // Auto-computed route tags
  const hasMule = !!build.muleClassName;
  const hasLibrary = build.stops?.some((s) => s.stopId === 'a3_after_library' && s.enabled) ?? false;
  const hasGravicius = build.stops?.some((s) => s.stopId === 'a3_after_gravicius' && s.enabled) ?? false;

  return (
    <Card
      className="cursor-pointer hover:border-poe-gold/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-poe-text truncate">
            {build.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {build.className && <Badge variant="gold">{build.className}</Badge>}
            {build.ascendancy && <Badge variant="default">{build.ascendancy}</Badge>}
            {hasMule && <Badge variant="green">Mule</Badge>}
            {hasLibrary && <Badge variant="blue">Library</Badge>}
            {hasGravicius && <Badge variant="red">Gravicius</Badge>}
            {totalStops > 0 && (
              <Badge variant="default">
                {enabledStops}/{totalStops} stops
              </Badge>
            )}
            {totalLinkGroups > 0 && (
              <Badge variant="default">
                {totalLinkGroups} link group{totalLinkGroups !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs text-poe-muted">Updated {updatedDate}</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete "${build.name}"? This cannot be undone.`)) {
              onDelete(build.id);
            }
          }}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
