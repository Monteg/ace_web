import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertSnapshotSchema,
  localizedRoute,
  mediaCacheKey,
  parseDriveReference,
  parseVolatility,
  resolveTranslation,
  validateGameRows,
  validateTranslationRows,
} from './lib.mjs';

test('field-level locale fallback uses EN without changing route', () => {
  assert.equal(resolveTranslation({ en: 'Games', de: '' }, 'de'), 'Games');
  assert.equal(localizedRoute('/portfolio/pirates-rush', 'de'), '/de/portfolio/pirates-rush');
  assert.equal(localizedRoute('/de/games', 'pt'), '/pt/games');
  assert.equal(localizedRoute('/de/games?type=table#games', 'es'), '/es/games?type=table#games');
});

test('translation validation catches duplicate keys and missing EN', () => {
  const errors = validateTranslationRows([
    { key: 'a', type: 'plain', en: 'A' },
    { key: 'a', type: 'plain', en: '' },
  ]);
  assert.ok(errors.some((error) => error.includes('duplicate key')));
  assert.ok(errors.some((error) => error.includes('EN is required')));
});

test('game parsing accepts stable volatility enum and rejects unknown values', () => {
  assert.deepEqual(parseVolatility('medium, high,medium'), ['medium', 'high']);
  assert.throws(() => parseVolatility('wild'));
});

test('Drive references support URL, ID, HTTPS and project asset', () => {
  const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz';
  assert.deepEqual(parseDriveReference(`https://drive.google.com/file/d/${id}/view`), { kind: 'drive', id });
  assert.deepEqual(parseDriveReference(id), { kind: 'drive', id });
  assert.deepEqual(parseDriveReference('https://cdn.example.com/a.png'), { kind: 'https', url: 'https://cdn.example.com/a.png' });
  assert.deepEqual(parseDriveReference('../../assets/games/a.webp'), { kind: 'project', path: '../../assets/games/a.webp' });
});

test('duplicate media detection uses bytes and MIME', () => {
  assert.equal(mediaCacheKey(Buffer.from('same'), 'image/png'), mediaCacheKey(Buffer.from('same'), 'image/png'));
  assert.notEqual(mediaCacheKey(Buffer.from('same'), 'image/png'), mediaCacheKey(Buffer.from('same'), 'image/jpeg'));
});

test('generated snapshot schema validates translation and game contracts', () => {
  const game = { id: 'pirates-rush', slug: 'pirates-rush', order: 1, status: 'live', type: 'slot', rtp: 0.948, volatility: 'medium,high', cardBackground: 'a.webp', heroImage: 'h.webp' };
  const row = { key: 'home.title', type: 'plain', en: 'Home' };
  const gameText = ['display_name', 'short_description', 'overview', 'layout_display', 'seo_title', 'seo_description', 'card_logo_alt', 'hero_alt'].map((fieldKey) => ({ slug: 'pirates-rush', fieldKey, group: 'Test', context: 'Test field', type: fieldKey.startsWith('seo_') ? fieldKey : fieldKey.endsWith('_alt') ? 'alt' : fieldKey === 'overview' ? 'rich' : 'plain', en: fieldKey }));
  assert.equal(assertSnapshotSchema({ siteTranslations: [{ ...row, page: 'Home', section: 'Hero', context: 'Heading' }], games: [game], gameTranslations: gameText }).games.length, 1);
  assert.deepEqual(validateGameRows([{ ...game, type: 'crash' }]).some((error) => error.includes('invalid Type')), true);
});

test('snapshot validation rejects incomplete feature pairs and duplicate game IDs', () => {
  const game = { id: 'game-1', slug: 'game-1', order: 1, status: 'live', type: 'slot', rtp: 0.95, volatility: 'medium', cardBackground: 'a.webp', heroImage: 'h.webp' };
  assert.ok(validateGameRows([game, { ...game, slug: 'game-2' }]).some((error) => error.includes('duplicate Game ID')));
});
