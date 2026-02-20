import { describe, it, expect } from 'vitest';
import { decodePobCode } from '@/lib/pob/decode';
import pako from 'pako';

function encodePob(xml: string): string {
  const bytes = new TextEncoder().encode(xml);
  const compressed = pako.deflate(bytes);
  let b64 = btoa(String.fromCharCode(...compressed));
  // Convert to URL-safe base64
  b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
}

describe('decodePobCode', () => {
  it('decodes a simple XML string', () => {
    const xml = '<PathOfBuilding><Build className="Witch"/></PathOfBuilding>';
    const encoded = encodePob(xml);
    const decoded = decodePobCode(encoded);
    expect(decoded).toBe(xml);
  });

  it('handles URL-safe base64 characters', () => {
    const xml = '<PathOfBuilding><Build className="Shadow" ascendClassName="Assassin"/></PathOfBuilding>';
    const encoded = encodePob(xml);
    // Should not contain + / or =
    expect(encoded).not.toMatch(/[+/]/);
    const decoded = decodePobCode(encoded);
    expect(decoded).toBe(xml);
  });

  it('handles padding stripping', () => {
    const xml = '<Test>data</Test>';
    const encoded = encodePob(xml);
    // Make sure it decodes regardless of padding
    expect(decodePobCode(encoded)).toBe(xml);
  });

  it('throws for invalid input', () => {
    expect(() => decodePobCode('!!!not-valid!!!')).toThrow();
  });

  it('handles complex XML round-trip', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<PathOfBuilding>
  <Build className="Witch" ascendClassName="Elementalist" level="90">
    <PlayerStat stat="Life" value="4500"/>
  </Build>
  <Skills>
    <Skill label="Main Skill" enabled="true" slot="Body Armour">
      <Gem nameSpec="Fireball" enabled="true"/>
      <Gem nameSpec="Spell Echo" enabled="true"/>
    </Skill>
  </Skills>
</PathOfBuilding>`;
    const encoded = encodePob(xml);
    const decoded = decodePobCode(encoded);
    expect(decoded).toBe(xml);
  });
});
