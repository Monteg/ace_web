import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolveTranslation } from './lib/i18n.mjs';

test('approved locale value wins and variables are interpolated', () => {
  assert.equal(resolveTranslation({ key: 'hello', locale: 'it', requested: { hello: 'Ciao {name}' }, english: { hello: 'Hello {name}' }, variables: { name: 'Ace' } }), 'Ciao Ace');
});

test('missing secondary value falls back to English and reports it', () => {
  const warnings = [];
  const value = resolveTranslation({ key: 'hello', locale: 'de', requested: {}, english: { hello: 'Hello' }, onFallback: (key, locale) => warnings.push(`${locale}:${key}`) });
  assert.equal(value, 'Hello');
  assert.deepEqual(warnings, ['de:hello']);
});

test('missing English master value is a hard error', () => {
  assert.throws(() => resolveTranslation({ key: 'missing', locale: 'es', requested: {}, english: {} }), /Missing required English/);
});

test('Base emits canonical, locale alternates and x-default', () => {
  const source = new URL('../../src/layouts/Base.astro', import.meta.url);
  const text = requireText(source);
  assert.match(text, /hreflang=\{item\.hreflang\}/);
  assert.match(text, /hreflang="x-default"/);
  assert.match(text, /property="og:locale"/);
});

function requireText(url) {
  return new TextDecoder().decode(requireBytes(url));
}

function requireBytes(url) {
  return readFileSync(url);
}
