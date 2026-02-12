'use client';

import { Suspense, use, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BuildEditor } from '@/components/builds/BuildEditor';
import { BuildWizard } from '@/components/builds/wizard/BuildWizard';
import { WizardModeToggle } from '@/components/builds/wizard/WizardModeToggle';
import { Button } from '@/components/ui/Button';

function BuildEditorContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = (searchParams.get('mode') === 'advanced' ? 'advanced' : 'wizard') as 'wizard' | 'advanced';

  const handleModeChange = useCallback(
    (newMode: 'wizard' | 'advanced') => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('mode', newMode);
      router.replace(`/builds/${id}?${params.toString()}`);
    },
    [id, router, searchParams],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/builds')}>
          &larr; Back to Builds
        </Button>
        <WizardModeToggle mode={mode} onModeChange={handleModeChange} />
      </div>

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
