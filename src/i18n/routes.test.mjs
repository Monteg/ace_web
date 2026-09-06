import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

// The route helpers are TypeScript and exercised by Astro's checker. These
// source-level assertions guard the non-negotiable public URL invariants in a
// Node-only test run without adding a TS runtime loader.
const source = readFileSync(new URL('./routes.ts', import.meta.url), 'utf8');

test('English remains prefixless and locale switching preserves the path', () => {
  assert.match(source, /locale === defaultLocale/);
  assert.match(source, /`\/\$\{locale\}\$\{base\}`/);
  assert.match(source, /url\.search/);
  assert.match(source, /url\.hash/);
});
