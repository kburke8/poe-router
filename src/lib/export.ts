'use client';

import type { RegexPreset } from '@/types/regex';
import type { BuildPlan } from '@/types/build';
import { CURRENT_BUILD_VERSION } from '@/types/build';
import type { RunRecord } from '@/types/history';
import type { Gem, Item } from '@/types/gem';
import { migrateBuildToCurrent, migratePresetToCurrent } from '@/lib/migration';

interface ExportData {
  version: 1;
  exportedAt: string;
  regexPresets?: RegexPreset[];
  builds?: BuildPlan[];
  runs?: RunRecord[];
  customGems?: Gem[];
  customItems?: Item[];
}

export type { ExportData };

/**
 * Serialize export data to a formatted JSON string.
 */
export function exportToJson(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Trigger a browser download of the export data as a JSON file.
 */
export function downloadJson(data: ExportData, filename?: string): void {
  const json = exportToJson(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const defaultName = `poe-planner-export-${new Date().toISOString().split('T')[0]}.json`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse a JSON string into ExportData, with basic validation.
 *
 * Builds and presets from any historical version are migrated to the current
 * version on the way in. Records written by a NEWER app version are rejected
 * with a clear message rather than being half-understood.
 */
export function parseImportFile(jsonString: string): ExportData {
  const data = JSON.parse(jsonString);

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid import file: expected a JSON object');
  }

  if (data.version !== 1) {
    throw new Error(
      `Unsupported export version: ${data.version}. Expected version 1.`,
    );
  }

  if (typeof data.exportedAt !== 'string') {
    throw new Error('Invalid import file: missing exportedAt field');
  }

  if (Array.isArray(data.builds)) {
    const tooNew = data.builds.filter(
      (b: BuildPlan) => typeof b.version === 'number' && b.version > CURRENT_BUILD_VERSION,
    );
    if (tooNew.length > 0) {
      const names = tooNew.map((b: BuildPlan) => `"${b.name}"`).join(', ');
      throw new Error(
        `This file was created by a newer version of the app (${names}). Update the app to import it.`,
      );
    }
    data.builds = data.builds.map(migrateBuildToCurrent);
  }

  if (Array.isArray(data.regexPresets)) {
    data.regexPresets = data.regexPresets.map(migratePresetToCurrent);
  }

  return data as ExportData;
}

/**
 * Export a single build as a JSON file download.
 */
export function downloadBuildJson(build: BuildPlan): void {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    builds: [build],
  };
  const safeName = build.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  downloadJson(data, `${safeName}-export-${date}.json`);
}

/**
 * Read a File object and parse it as ExportData.
 */
export function readFileAsJson(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = parseImportFile(reader.result as string);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
