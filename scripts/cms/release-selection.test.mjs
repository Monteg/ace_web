import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checksum,
  mergeSelectedRelease,
  normalizeWorkingContent,
  secureEqual,
  signature,
  validateSnapshot,
} from '../../cms/extensions/ace-release-workflow/dist/release-core.js';

const id = (suffix) => `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
const locale = { code: 'en', name: 'English', native_name: 'English', is_default: true, is_active: true, sort_order: 1, fallback_locale: null, direction: 'ltr', hreflang: 'en' };

function game(suffix, slug, overview) {
  return {
    id: id(suffix),
    internal_name: slug,
    slug,
    release_status: 'live',
    sort_order: suffix,
    game_type: 'slot',
    rtp_mode: 'fixed',
    rtp: 0.95,
    volatility: ['medium'],
    max_win_value: 1000,
    max_win_unit: 'x',
    max_win_approx: false,
    bet_min: 1,
    bet_max: 100,
    demo_enabled: false,
    demo_mode: null,
    demo_game_id: null,
    direct_build: null,
    direct_version: null,
    api_host: null,
    card_image: id(suffix + 100),
    hero_image: id(suffix + 200),
    card_background_image: null,
    card_logo_image: null,
    translations: [{
      locale: 'en',
      display_name: slug,
      short_description: `${slug} description`,
      overview,
      main_feature: 'Bonus',
      layout_display: '5x3',
      seo_title: `${slug} by Ace Games`,
      seo_description: `A complete search description for ${slug} with enough useful detail for prospective casino operators.`,
      card_alt: `${slug} card`,
      hero_alt: `${slug} hero`,
      translation_status: 'approved',
    }],
    sections: [{
      id: id(suffix + 300),
      section_type: 'rich_text',
      sort_order: 1,
      enabled: true,
      media_file: null,
      style_preset: 'default',
      translations: [{ locale: 'en', heading: 'Details', body_markdown: overview, translation_status: 'approved' }],
      items: [],
    }],
    gallery: [],
  };
}

function payload(firstOverview = 'First live', secondOverview = 'Second live') {
  return {
    locales: [locale],
    site: { en: { 'header.games': 'Games', 'header.faq': 'FAQ' } },
    required_site_keys: ['header.games', 'header.faq'],
    faq: [],
    games: [game(1, 'first-game', firstOverview), game(2, 'second-game', secondOverview)],
  };
}

test('normalization exports only approved website strings', () => {
  const normalized = normalizeWorkingContent({
    locales: [locale],
    games: [],
    siteStrings: [
      { key: 'header.games', active: true, required: true, translations: [{ locale: 'en', value: 'Games', translation_status: 'approved' }] },
      { key: 'header.draft', active: true, required: false, translations: [{ locale: 'en', value: 'Draft', translation_status: 'draft' }] },
    ],
  });
  assert.deepEqual(normalized.site.en, { 'header.games': 'Games' });
  assert.deepEqual(normalized.required_site_keys, ['header.games']);
});

test('selected game replaces only that game in the prior release', () => {
  const previous = payload();
  const working = payload('First changed', 'Second unfinished');
  const merged = mergeSelectedRelease(previous, working, { games: [id(1)] });
  assert.equal(merged.games[0].translations[0].overview, 'First changed');
  assert.equal(merged.games[1].translations[0].overview, 'Second live');
});

test('selected translation field does not leak another draft field', () => {
  const previous = payload();
  const working = payload('First selected', 'Second live');
  working.games[0].translations[0].short_description = 'Unselected working copy';
  const merged = mergeSelectedRelease(previous, working, { translations: ['game:first-game:overview'] });
  assert.equal(merged.games[0].translations[0].overview, 'First selected');
  assert.equal(merged.games[0].translations[0].short_description, 'first-game description');
});

test('selected structural row and media update are isolated', () => {
  const previous = payload();
  const working = payload();
  working.games[0].sections[0].style_preset = 'wide';
  working.games[1].sections[0].style_preset = 'compact';
  working.games[0].hero_image = id(999);
  const merged = mergeSelectedRelease(previous, working, { content: [id(301)], media: [`${id(1)}:hero`] });
  assert.equal(merged.games[0].sections[0].style_preset, 'wide');
  assert.equal(merged.games[1].sections[0].style_preset, 'default');
  assert.equal(merged.games[0].hero_image, id(999));
});

test('snapshot validation catches incomplete English while allowing fallback warnings', () => {
  const valid = payload();
  valid.locales.push({ ...locale, code: 'it', name: 'Italian', native_name: 'Italiano', is_default: false, sort_order: 2, fallback_locale: 'en', hreflang: 'it' });
  valid.site.it = {};
  assert.ok(validateSnapshot(valid).warnings.length > 0);
  valid.games[0].translations[0].translation_status = 'draft';
  assert.throws(() => validateSnapshot(valid), /approved English/);
});

test('release checksums and webhook signatures are deterministic', () => {
  assert.equal(checksum({ b: 2, a: 1 }), checksum({ a: 1, b: 2 }));
  const first = signature({ release_id: id(1), status: 'success' }, 'secret');
  const second = signature({ status: 'success', release_id: id(1) }, 'secret');
  assert.equal(first, second);
  assert.equal(secureEqual(first, second), true);
  assert.equal(secureEqual(first, `${second}0`), false);
});
