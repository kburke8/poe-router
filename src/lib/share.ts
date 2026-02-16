import pako from 'pako';
import type { BuildPlan } from '@/types/build';
import type { RegexPreset } from '@/types/regex';

export interface SharePayload {
  build: BuildPlan;
  regexPreset?: RegexPreset;
}

export function encodeBuild(build: BuildPlan, regexPreset?: RegexPreset): string {
  const payload: SharePayload = { build, ...(regexPreset ? { regexPreset } : {}) };
  const json = JSON.stringify(payload);
  const compressed = pako.deflate(new TextEncoder().encode(json));
  // Convert to base64url (URL-safe)
  let b64 = btoa(String.fromCharCode(...compressed));
  b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
}

export function decodeBuild(encoded: string): SharePayload {
  // Restore standard base64
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const inflated = pako.inflate(bytes);
  const json = new TextDecoder().decode(inflated);
  const data = JSON.parse(json) as SharePayload;

  if (!data.build || !data.build.id) {
    throw new Error('Invalid share data: missing build');
  }

  return data;
}
