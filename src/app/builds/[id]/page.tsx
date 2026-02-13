'use client';

import { Suspense, use, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { BuildEditor } from '@/components/builds/BuildEditor';
import { BuildWizard } from '@/components/builds/wizard/BuildWizard';
import { WizardModeToggle } from '@/components/builds/wizard/WizardModeToggle';
import { Button } from '@/components/ui/Button';
import { PobImportDialog } from '@/components/builds/PobImportDialog';
import { useBuildStore } from '@/stores/useBuildStore';
import type { BackfillResult } from '@/lib/pob/backfill';

function BuildEditorContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { deleteBuild, importBuild } = useBuildStore();
  const [importOpen, setImportOpen] = useState(false);

  const mode = (searchParams.get('mode') === 'advanced' ? 'advanced' : 'wizard') as 'wizard' | 'advanced';

  const handleModeChange = useCallback(
    (newMode: 'wizard' | 'advanced') => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('mode', newMode);
      router.replace(`/builds/${id}?${params.toString()}`);
    },
    [id, router, searchParams],
  );

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/builds')}>
            &larr; Back to Builds
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            Import from PoB
          </Button>
        </div>
        <WizardModeToggle mode={mode} onModeChange={handleModeChange} />
      </div>

      <PobImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handlePobImport}
      />

      {mode === 'wizard' ? (
        <BuildWizard buildId={id} onSwitchToAdvanced={() => handleModeChange('advanced')} />
      ) : (
        <BuildEditor buildId={id} />
      )}
    </div>
  );
}

export default function BuildEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense fallback={<div className="text-poe-muted py-10 text-center">Loading...</div>}>
      <BuildEditorContent id={id} />
    </Suspense>
  );
}
