import assert from 'node:assert/strict';
import test from 'node:test';
import { collectAssetIds, releaseChecksum, validateReleasePayload } from './lib/release-schema.mjs';

const id = (suffix) => `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
const english = { locale: 'en', display_name: 'Test Game', short_description: 'A complete test game description.', overview: 'Complete English overview.', main_feature: 'Feature', layout_display: '5x3', seo_title: 'Test Game by Ace Games', seo_description: 'A complete description for the test game that satisfies the required search metadata length.', card_alt: 'Test game card', hero_alt: 'Test game hero', translation_status: 'approved' };
const game = { id: id(1), internal_name: 'Test Game', slug: 'test-game', release_status: 'live', sort_order: 1, game_type: 'slot', rtp_mode: 'fixed', rtp: 0.95, volatility: ['medium'], max_win_value: 1000, max_win_unit: 'x', max_win_approx: false, bet_min: 1, bet_max: 100, demo_enabled: false, demo_mode: null, demo_game_id: null, direct_build: null, direct_version: null, api_host: null, card_image: id(2), hero_image: id(3), translations: [english], sections: [], gallery: [] };
const payload = { locales: [{ code: 'en', name: 'English', native_name: 'English', is_default: true, is_active: true, sort_order: 1, fallback_locale: null, direction: 'ltr', hreflang: 'en' }], site: { en: { 'header.games': 'Games' } }, games: [game] };

test('validates an immutable release payload', () => {
  assert.equal(validateReleasePayload(payload).payload.games.length, 1);
  assert.equal(releaseChecksum(payload).length, 64);
});

test('rejects missing approved English', () => {
  assert.throws(() => validateReleasePayload({ ...payload, games: [{ ...game, translations: [{ ...english, translation_status: 'draft' }] }] }), /approved English/);
});

test('rejects duplicate slugs', () => {
  assert.throws(() => validateReleasePayload({ ...payload, games: [game, { ...game, id: id(4) }] }), /Duplicate game slug/);
});

test('collects media references once', () => {
  assert.deepEqual(collectAssetIds(payload), [id(2), id(3)]);
});
