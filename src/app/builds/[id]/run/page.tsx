'use client';

import { use, useEffect } from 'react';
import { useBuildStore } from '@/stores/useBuildStore';
import { RunView } from '@/components/builds/RunView';

export default function RunViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { builds, loadBuilds, isLoading } = useBuildStore();
  const build = builds.find((b) => b.id === id);

  useEffect(() => {
    if (builds.length === 0) {
      loadBuilds();
    }
  }, [builds.length, loadBuilds]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-poe-muted">Loading...</span>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-poe-muted">Build not found.</span>
      </div>
    );
  }

  return <RunView build={build} />;
}
