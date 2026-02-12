'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBuildStore } from '@/stores/useBuildStore';
import { BuildCard } from '@/components/builds/BuildCard';
import { Button } from '@/components/ui/Button';

export default function BuildsPage() {
  const router = useRouter();
  const { builds, isLoading, loadBuilds, createBuild, deleteBuild } = useBuildStore();

  useEffect(() => {
    loadBuilds();
  }, [loadBuilds]);

  const handleNewBuild = async () => {
    const id = await createBuild();
    router.push(`/builds/${id}`);
  };

  const handleDelete = async (id: string) => {
    await deleteBuild(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-poe-gold">Builds</h1>
        <Button onClick={handleNewBuild}>New Build</Button>
      </div>

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
