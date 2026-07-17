'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BuildEditor } from '@/components/builds/BuildEditor';
import { PobImportDialog } from '@/components/builds/PobImportDialog';
import { BuildEditorTour } from '@/components/tutorial/BuildEditorTour';
import { useBuildStore } from '@/stores/useBuildStore';
import type { BackfillResult } from '@/lib/pob/backfill';

export default function BuildEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { deleteBuild, importBuild } = useBuildStore();
  const [importOpen, setImportOpen] = useState(false);

  const handlePobImport = async (result: BackfillResult) => {
    try {
      await deleteBuild(id);
      const newId = await importBuild(result.build);
      const warnCount = result.warnings.length;
      toast.success(
        `Imported "${result.build.name}"` + (warnCount > 0 ? ` with ${warnCount} warning${warnCount !== 1 ? 's' : ''}` : ''),
      );
      router.replace(`/builds/${newId}`);
    } catch (err) {
      toast.error('Failed to import build');
      console.error('Import error:', err);
    }
  };

  return (
    <>
      <PobImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handlePobImport}
      />
      <BuildEditor buildId={id} onOpenImport={() => setImportOpen(true)} />
      <BuildEditorTour />
    </>
  );
}
