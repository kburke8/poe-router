'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { decodeBuild } from '@/lib/share';
import { useBuildStore } from '@/stores/useBuildStore';
import { db } from '@/db/database';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { SharePayload } from '@/lib/share';
import Link from 'next/link';

function ImportPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { importBuild } = useBuildStore();
  const [importing, setImporting] = useState(false);

  const data = searchParams.get('data');

  const decoded = useDecoded(data);

  const handleImport = async (payload: SharePayload) => {
    setImporting(true);
    try {
      const now = new Date().toISOString();
      const newBuild = {
        ...JSON.parse(JSON.stringify(payload.build)),
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      const newId = await importBuild(newBuild);

      if (payload.regexPreset) {
        const newPreset = {
          ...JSON.parse(JSON.stringify(payload.regexPreset)),
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        await db.regexPresets.add(newPreset);
      }

      toast.success(`Imported "${payload.build.name}"`);
      router.push(`/builds/${newId}`);
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Failed to import build');
      setImporting(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-poe-muted text-lg">No share data found in URL.</p>
        <Link
          href="/builds"
          className="text-poe-gold hover:text-poe-gold/80 underline"
        >
          Back to Builds
        </Link>
      </div>
    );
  }

  if (decoded.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-poe-red text-lg">Failed to decode share link</p>
        <p className="text-poe-muted text-sm">{decoded.error}</p>
        <Link
          href="/builds"
          className="text-poe-gold hover:text-poe-gold/80 underline"
        >
          Back to Builds
        </Link>
      </div>
    );
  }

  if (!decoded.payload) return null;

  const { build, regexPreset } = decoded.payload;
  const totalGemPickups = build.stops?.reduce(
    (sum, s) => sum + (s.gemPickups?.length ?? 0),
    0,
  ) ?? 0;
  const totalLinkGroups = build.linkGroups?.length ?? 0;

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <h1 className="text-2xl font-bold text-poe-gold">Import Shared Build</h1>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-poe-text">{build.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {build.className && <Badge variant="gold">{build.className}</Badge>}
            {build.ascendancy && <Badge variant="default">{build.ascendancy}</Badge>}
            {totalGemPickups > 0 && (
              <Badge variant="default">
                {totalGemPickups} gem pickup{totalGemPickups !== 1 ? 's' : ''}
              </Badge>
            )}
            {totalLinkGroups > 0 && (
              <Badge variant="default">
                {totalLinkGroups} link group{totalLinkGroups !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {regexPreset && (
            <p className="text-sm text-poe-muted">
              Includes regex preset: <span className="text-poe-text">{regexPreset.name}</span>
            </p>
          )}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleImport(decoded.payload!)}
          disabled={importing}
        >
          {importing ? 'Importing...' : 'Import Build'}
        </Button>
        <Link
          href="/builds"
          className="text-sm text-poe-muted hover:text-poe-text transition-colors"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}

function useDecoded(data: string | null): { payload: SharePayload | null; error: string | null } {
  const [result] = useState(() => {
    if (!data) return { payload: null, error: null };
    try {
      return { payload: decodeBuild(data), error: null };
    } catch (err) {
      return { payload: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  });
  return result;
}

export default function ImportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <span className="text-poe-muted">Loading...</span>
        </div>
      }
    >
      <ImportPageContent />
    </Suspense>
  );
}
