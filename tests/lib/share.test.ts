import { describe, it, expect } from 'vitest';
import { encodeBuild, decodeBuild } from '@/lib/share';
import { makeMinimalBuild } from '../helpers/fixtures';

describe('encodeBuild / decodeBuild', () => {
  it('round-trip preserves build data', () => {
    const build = makeMinimalBuild({ name: 'Round Trip Test' });
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);
    expect(decoded.build.id).toBe(build.id);
    expect(decoded.build.name).toBe('Round Trip Test');
    expect(decoded.build.className).toBe(build.className);
  });

  it('encoded output is URL-safe (no +, /, =)', () => {
    const build = makeMinimalBuild({ name: 'Test with special chars!@#$%' });
    const encoded = encodeBuild(build);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('includes regexPreset when provided', () => {
    const build = makeMinimalBuild();
    const preset = {
      id: 'preset-1',
      name: 'Test Preset',
      categories: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const encoded = encodeBuild(build, preset);
    const decoded = decodeBuild(encoded);
    expect(decoded.regexPreset).toBeDefined();
    expect(decoded.regexPreset!.id).toBe('preset-1');
  });

  it('omits regexPreset when not provided', () => {
    const build = makeMinimalBuild();
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);
    expect(decoded.regexPreset).toBeUndefined();
  });

  it('throws for invalid encoded input', () => {
    expect(() => decodeBuild('not-valid-base64-data!!!')).toThrow();
  });

  it('throws for missing build.id', () => {
    // Create a valid encoded payload but with missing build id
    // by manually encoding invalid data
    const pako = require('pako');
    const json = JSON.stringify({ build: { name: 'No ID' } });
    const compressed = pako.deflate(new TextEncoder().encode(json));
    let b64 = btoa(String.fromCharCode(...compressed));
    b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(() => decodeBuild(b64)).toThrow('Invalid share data');
  });
});
