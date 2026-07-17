import { describe, it, expect } from 'vitest';
import { exportToJson, parseImportFile } from '@/lib/export';
import { CURRENT_BUILD_VERSION } from '@/types/build';

describe('exportToJson', () => {
  it('produces valid JSON', () => {
    const data = { version: 1 as const, exportedAt: '2024-01-01T00:00:00.000Z' };
    const json = exportToJson(data);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes optional fields when present', () => {
    const data = {
      version: 1 as const,
      exportedAt: '2024-01-01T00:00:00.000Z',
      builds: [],
      runs: [],
    };
    const json = exportToJson(data);
    const parsed = JSON.parse(json);
    expect(parsed.builds).toEqual([]);
    expect(parsed.runs).toEqual([]);
  });

  it('is pretty-printed with 2-space indent', () => {
    const data = { version: 1 as const, exportedAt: '2024-01-01T00:00:00.000Z' };
    const json = exportToJson(data);
    expect(json).toContain('\n');
    expect(json).toContain('  ');
  });
});

describe('parseImportFile', () => {
  it('parses valid data', () => {
    const json = JSON.stringify({ version: 1, exportedAt: '2024-01-01T00:00:00.000Z' });
    const result = parseImportFile(json);
    expect(result.version).toBe(1);
    expect(result.exportedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('throws for non-object (array)', () => {
    // Arrays are typeof 'object' in JS, so they pass the object check
    // but fail the version check since arrays don't have a .version property
    expect(() => parseImportFile('[1, 2, 3]')).toThrow('Unsupported export version');
  });

  it('throws for null', () => {
    expect(() => parseImportFile('null')).toThrow('expected a JSON object');
  });

  it('throws for wrong version', () => {
    const json = JSON.stringify({ version: 99, exportedAt: '2024-01-01T00:00:00.000Z' });
    expect(() => parseImportFile(json)).toThrow('Unsupported export version');
  });

  it('throws for missing exportedAt', () => {
    const json = JSON.stringify({ version: 1 });
    expect(() => parseImportFile(json)).toThrow('missing exportedAt');
  });

  it('throws for invalid JSON', () => {
    expect(() => parseImportFile('not json at all')).toThrow();
  });
});

describe('round-trip', () => {
  it('export then parse preserves a current-version build exactly', () => {
    const build = {
      id: 'test',
      name: 'Test Build',
      className: 'Witch',
      ascendancy: 'Necromancer',
      stops: [],
      linkGroups: [],
      gearGoals: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: CURRENT_BUILD_VERSION,
    };
    const original = {
      version: 1 as const,
      exportedAt: '2024-01-01T00:00:00.000Z',
      builds: [build],
    };
    const json = exportToJson(original);
    const parsed = parseImportFile(json);
    expect(parsed.version).toBe(original.version);
    expect(parsed.exportedAt).toBe(original.exportedAt);
    expect((parsed as { builds: unknown[] }).builds).toEqual(original.builds);
  });

  it('normalizes a malformed stub build instead of crashing', () => {
    const original = {
      version: 1 as const,
      exportedAt: '2024-01-01T00:00:00.000Z',
      builds: [{ id: 'test', name: 'Test Build' }],
    };
    const parsed = parseImportFile(exportToJson(original));
    const build = (parsed as { builds: { id: string; version: number; stops: unknown[] }[] }).builds[0];
    expect(build.id).toBe('test');
    expect(build.version).toBe(CURRENT_BUILD_VERSION);
    expect(build.stops).toEqual([]);
  });
});
