'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBuildStore } from '@/stores/useBuildStore';
import { BuildCard } from '@/components/builds/BuildCard';
import { Button } from '@/components/ui/Button';
import { PobImportDialog } from '@/components/builds/PobImportDialog';
import type { BackfillResult } from '@/lib/pob/backfill';

export default function BuildsPage() {
  const router = useRouter();
  const { builds, isLoading, loadBuilds, createBuild, deleteBuild, importBuild } = useBuildStore();
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    loadBuilds().then(() => {
      if (useBuildStore.getState().builds.length === 0) {
        createBuild().then((id) => router.replace(`/builds/${id}`));
      }
    });
  }, [loadBuilds, createBuild, router]);

  const handleNewBuild = async () => {
    const id = await createBuild();
    router.push(`/builds/${id}`);
  };

  const handleDelete = async (id: string) => {
    await deleteBuild(id);
  };

  const handlePobImport = async (result: BackfillResult) => {
    try {
      const id = await importBuild(result.build);
      const warnCount = result.warnings.length;
      toast.success(
        `Imported "${result.build.name}"` + (warnCount > 0 ? ` with ${warnCount} warning${warnCount !== 1 ? 's' : ''}` : ''),
      );
      router.push(`/builds/${id}`);
    } catch (err) {
      toast.error('Failed to import build');
      console.error('Import error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-poe-gold">Builds</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>Import from PoB</Button>
          <Button onClick={handleNewBuild}>New Build</Button>
        </div>
      </div>

      <PobImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handlePobImport}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-poe-muted">Loading builds...</span>
        </div>
      ) : builds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-poe-muted text-lg">No builds yet.</p>
          <p className="text-poe-muted text-sm mt-1">Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => (
            <BuildCard
              key={build.id}
              build={build}
              onClick={() => router.push(`/builds/${build.id}/run`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
