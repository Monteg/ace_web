import assert from 'node:assert/strict';
import test from 'node:test';
import { cmsGameSchema, validateGameDataset, validatePublishableGame } from './lib/game-schema.mjs';

const valid = {
  id: '23c82a10-dd24-4ce1-89aa-1ceee5a8e39a',
  internal_name: 'Pirates Rush',
  slug: 'pirates-rush',
  release_status: 'live',
  sort_order: 10,
  game_type: 'slot',
  rtp_mode: 'fixed',
  rtp: 0.948,
  volatility: ['medium', 'high'],
  max_win_value: 120000,
  max_win_unit: 'coins',
  max_win_approx: true,
  bet_min: 1,
  bet_max: 5000,
  demo_enabled: true,
  demo_mode: 'adapter',
  demo_game_id: '23c82a10-dd24-4ce1-89aa-1ceee5a8e39a',
  direct_build: null,
  direct_version: null,
  api_host: null,
  card_image: 'card-file-id',
  hero_image: 'hero-file-id',
};

const english = {
  locale: 'en',
  display_name: 'Pirates Rush',
  short_description: 'A high-seas treasure hunt with progressive multipliers.',
  overview: 'Pirates Rush drops players into a high-seas treasure hunt filled with danger and opportunity.',
  main_feature: 'Progressive Payline Multiplier',
  layout_display: '5x3 Reels, 11 Fixed Paylines',
  seo_title: 'Pirates Rush slot game by Ace Games',
  seo_description: 'Explore Pirates Rush, a high-seas slot with progressive multipliers, fixed paylines and a persistent multiplier during Free Spins.',
  card_alt: 'Pirates Rush game card artwork',
  hero_alt: 'Pirates Rush pirate adventure artwork',
  translation_status: 'approved',
};

test('accepts a valid structured game and approved English content', () => {
  assert.equal(cmsGameSchema.parse(valid).slug, 'pirates-rush');
  assert.equal(validatePublishableGame(valid, [english]).game_type, 'slot');
});

test('rejects invalid fixed RTP', () => {
  assert.equal(cmsGameSchema.safeParse({ ...valid, rtp: 0.7 }).success, false);
});

test('rejects an enabled adapter without a UUID', () => {
  assert.equal(cmsGameSchema.safeParse({ ...valid, demo_game_id: 'not-an-id' }).success, false);
});

test('rejects an inverted bet range', () => {
  assert.equal(cmsGameSchema.safeParse({ ...valid, bet_min: 50, bet_max: 10 }).success, false);
});

test('rejects duplicate slugs', () => {
  assert.throws(() => validateGameDataset([valid, { ...valid, id: undefined }]), /Duplicate game slug/);
});

test('requires approved English before publish', () => {
  assert.throws(() => validatePublishableGame(valid, [{ ...english, translation_status: 'draft' }]), /not approved/);
});
