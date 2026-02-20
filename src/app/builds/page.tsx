'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBuildStore } from '@/stores/useBuildStore';
import { BuildCard } from '@/components/builds/BuildCard';
import { Button } from '@/components/ui/Button';
import { PobImportDialog } from '@/components/builds/PobImportDialog';
import { TemplatePickerDialog } from '@/components/builds/TemplatePickerDialog';
import { downloadBuildJson, readFileAsJson } from '@/lib/export';
import { BuildsTour } from '@/components/tutorial/BuildsTour';
import type { BackfillResult } from '@/lib/pob/backfill';

export default function BuildsPage() {
  const router = useRouter();
  const { builds, isLoading, loadBuilds, createBuild, deleteBuild, importBuild } = useBuildStore();
  const [importOpen, setImportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleTemplateSelect = async () => {
    // This function will never be called since templates are disabled
  };

  const handleExport = (id: string) => {
    const build = builds.find((b) => b.id === id);
    if (build) {
      downloadBuildJson(build);
      toast.success(`Exported "${build.name}"`);
    }
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readFileAsJson(file);
      const importedBuilds = data.builds ?? [];
      if (importedBuilds.length === 0) {
        toast.error('No builds found in import file');
        return;
      }
      for (const build of importedBuilds) {
        const now = new Date().toISOString();
        await importBuild({
          ...build,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        });
      }
      toast.success(`Imported ${importedBuilds.length} build${importedBuilds.length !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error('Failed to import: invalid file format');
      console.error('JSON import error:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <BuildsTour hasBuilds={builds.length > 0} />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-poe-gold">Builds</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Import JSON</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleJsonImport}
          />
          <Button variant="secondary" onClick={() => setImportOpen(true)}>Import from PoB</Button>
          <Button variant="secondary" onClick={() => setTemplateOpen(true)}>New from Template</Button>
          <Button onClick={handleNewBuild}>New Build</Button>
        </div>
      </div>

      <PobImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handlePobImport}
      />

      <TemplatePickerDialog
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        onSelect={handleTemplateSelect}
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
              onExport={handleExport}
            />
          ))}
        </div>
      )}
      </div>
    </>
  );
}
