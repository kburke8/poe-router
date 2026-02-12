'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { BuildEditor } from '@/components/builds/BuildEditor';
import { Button } from '@/components/ui/Button';

export default function BuildEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push('/builds')}>
        &larr; Back to Builds
      </Button>
      <BuildEditor buildId={id} />
    </div>
  );
}
