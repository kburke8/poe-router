'use client';

import { RegexBuilder } from '@/components/regex/RegexBuilder';

export default function RegexBuilderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-poe-gold">Regex Builder</h1>
      <RegexBuilder />
    </div>
  );
}
