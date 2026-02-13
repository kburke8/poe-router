import pako from 'pako';

/**
 * Decode a Path of Building export code (base64 + zlib deflateRaw).
 * Returns the raw XML string.
 */
export function decodePobCode(code: string): string {
  // Convert URL-safe Base64 to standard Base64
  let b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  // Pad if necessary
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }

  // Decode base64 to bytes
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Decompress — try inflate (with zlib header) first, fall back to inflateRaw
  let inflated: Uint8Array;
  try {
    inflated = pako.inflate(bytes);
  } catch {
    inflated = pako.inflateRaw(bytes);
  }

  // Decode UTF-8
  return new TextDecoder('utf-8').decode(inflated);
}
