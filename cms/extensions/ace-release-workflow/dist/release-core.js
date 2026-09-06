import crypto from 'node:crypto';

const GAME_FIELDS = [
  'id', 'internal_name', 'slug', 'release_status', 'sort_order', 'game_type', 'rtp_mode', 'rtp', 'volatility',
  'max_win_value', 'max_win_unit', 'max_win_approx', 'bet_min', 'bet_max', 'demo_enabled', 'demo_mode',
  'demo_game_id', 'direct_build', 'direct_version', 'api_host', 'card_image', 'hero_image',
  'card_background_image', 'card_logo_image',
];
const GAME_TRANSLATION_FIELDS = ['locale', 'display_name', 'short_description', 'overview', 'main_feature', 'layout_display', 'seo_title', 'seo_description', 'card_alt', 'hero_alt', 'translation_status'];
const SECTION_FIELDS = ['id', 'section_type', 'sort_order', 'enabled', 'media_file', 'style_preset'];
const SECTION_TRANSLATION_FIELDS = ['locale', 'heading', 'body_markdown', 'translation_status'];
const ITEM_FIELDS = ['id', 'sort_order', 'enabled', 'icon_file', 'image_file'];
const ITEM_TRANSLATION_FIELDS = ['locale', 'title', 'text', 'translation_status'];
const GALLERY_FIELDS = ['id', 'file', 'sort_order', 'enabled'];
const GALLERY_TRANSLATION_FIELDS = ['locale', 'alt', 'caption', 'translation_status'];
const LOCALE_FIELDS = ['code', 'name', 'native_name', 'is_default', 'is_active', 'sort_order', 'fallback_locale', 'direction', 'hreflang'];
const GAME_LOCALIZATION_FIELDS = [
  'display_name', 'short_description', 'overview', 'main_feature', 'layout_display',
  'seo_title', 'seo_description', 'card_alt', 'hero_alt',
];

export function relationId(value) {
  if (value && typeof value === 'object') return value.id ?? value.code ?? null;
  return value ?? null;
}

function pick(source, fields) {
  return Object.fromEntries(fields.map((field) => [field, relationId(source?.[field])]).filter(([, value]) => value !== undefined));
}

function translation(source, fields) {
  return { ...pick(source, fields), locale: String(relationId(source?.locale) ?? '') };
}

function ordered(items) {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

function normalizeGame(source) {
  return {
    ...pick(source, GAME_FIELDS),
    sort_order: Number(source.sort_order),
    rtp: source.rtp == null ? null : Number(source.rtp),
    max_win_value: source.max_win_value == null ? null : Number(source.max_win_value),
    bet_min: source.bet_min == null ? null : Number(source.bet_min),
    bet_max: source.bet_max == null ? null : Number(source.bet_max),
    direct_version: source.direct_version == null ? null : Number(source.direct_version),
    volatility: Array.isArray(source.volatility) ? source.volatility : [],
    translations: (source.translations ?? []).map((item) => translation(item, GAME_TRANSLATION_FIELDS)),
    sections: ordered(source.sections).map((section) => ({
      ...pick(section, SECTION_FIELDS),
      sort_order: Number(section.sort_order),
      translations: (section.translations ?? []).map((item) => translation(item, SECTION_TRANSLATION_FIELDS)),
      items: ordered(section.items).map((item) => ({
        ...pick(item, ITEM_FIELDS),
        sort_order: Number(item.sort_order),
        translations: (item.translations ?? []).map((entry) => translation(entry, ITEM_TRANSLATION_FIELDS)),
      })),
    })),
    gallery: ordered(source.gallery).map((item) => ({
      ...pick(item, GALLERY_FIELDS),
      sort_order: Number(item.sort_order),
      translations: (item.translations ?? []).map((entry) => translation(entry, GALLERY_TRANSLATION_FIELDS)),
    })),
  };
}

export function normalizeWorkingContent({ locales = [], games = [], siteStrings = [], faqItems = [] }) {
  const normalizedLocales = ordered(locales.filter((locale) => locale.is_active)).map((locale) => ({
    ...pick(locale, LOCALE_FIELDS),
    code: String(locale.code),
    fallback_locale: relationId(locale.fallback_locale),
    sort_order: Number(locale.sort_order),
  }));
  const site = Object.fromEntries(normalizedLocales.map((locale) => [locale.code, {}]));
  const requiredSiteKeys = [];
  for (const slot of siteStrings.filter((item) => item.active)) {
    if (slot.required) requiredSiteKeys.push(slot.key);
    for (const entry of slot.translations ?? []) {
      const locale = String(relationId(entry.locale) ?? '');
      if (site[locale] && entry.translation_status === 'approved' && String(entry.value ?? '').trim()) site[locale][slot.key] = String(entry.value);
    }
  }
  return {
    locales: normalizedLocales,
    site,
    required_site_keys: [...new Set(requiredSiteKeys)].sort(),
    faq: ordered(faqItems).map((item) => ({
      id: item.id,
      sort_order: Number(item.sort_order),
      enabled: Boolean(item.enabled),
      translations: (item.translations ?? []).map((entry) => translation(entry, ['locale', 'question', 'answer_markdown', 'translation_status'])),
    })),
    games: ordered(games).map(normalizeGame),
  };
}

function completion(fields, source) {
  const missingFields = fields.filter((field) => !present(source?.[field]));
  return {
    completed: fields.length - missingFields.length,
    total: fields.length,
    percent: Math.round(((fields.length - missingFields.length) / fields.length) * 100),
    missing_fields: missingFields,
  };
}

/**
 * Creates the filterable localization report served by the Directus endpoint.
 * It intentionally reads working content, not a release snapshot, so editors can
 * find gaps before publishing. A percentage measures filled fields; approval is
 * reported separately and never inferred from completeness.
 */
export function buildLocalizationReport({ locales = [], games = [], siteStrings = [] }) {
  const activeLocales = ordered(locales.filter((locale) => locale.is_active));
  const gameRows = [];
  for (const game of ordered(games)) {
    for (const locale of activeLocales) {
      const code = String(relationId(locale.code) ?? '');
      const entry = (game.translations ?? []).find((item) => String(relationId(item.locale) ?? '') === code);
      const progress = completion(GAME_LOCALIZATION_FIELDS, entry);
      gameRows.push({
        scope: 'game',
        game_id: game.id,
        game: game.internal_name,
        slug: game.slug,
        locale: code,
        state: entry?.translation_status ?? 'missing',
        approved: entry?.translation_status === 'approved',
        seo_missing: !present(entry?.seo_title) || !present(entry?.seo_description),
        alt_missing: !present(entry?.card_alt) || !present(entry?.hero_alt),
        ...progress,
      });
    }
  }

  const siteRows = activeLocales.map((locale) => {
    const code = String(relationId(locale.code) ?? '');
    const entries = siteStrings.map((slot) => {
      const entry = (slot.translations ?? []).find((item) => String(relationId(item.locale) ?? '') === code);
      return { key: slot.key, entry };
    });
    const missingKeys = entries.filter(({ entry }) => !present(entry?.value)).map(({ key }) => key);
    const approved = entries.filter(({ entry }) => entry?.translation_status === 'approved' && present(entry.value)).length;
    const total = entries.length;
    return {
      scope: 'site',
      locale: code,
      state: missingKeys.length ? 'missing' : approved === total ? 'approved' : 'draft',
      approved,
      completed: total - missingKeys.length,
      total,
      percent: total ? Math.round(((total - missingKeys.length) / total) * 100) : 100,
      missing_keys: missingKeys,
    };
  });

  return { games: gameRows, site: siteRows };
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function replaceById(items, replacement, missingMessage) {
  const index = items.findIndex((item) => item.id === replacement?.id);
  if (!replacement) throw new Error(missingMessage);
  if (index === -1) items.push(copy(replacement));
  else items[index] = copy(replacement);
}

function copyTranslationField(target, source, field, label) {
  if (!source) throw new Error(`Selected ${label} does not exist in working content.`);
  for (const sourceTranslation of source.translations ?? []) {
    const index = (target.translations ?? []).findIndex((item) => item.locale === sourceTranslation.locale);
    if (index === -1) {
      target.translations.push(copy(sourceTranslation));
    } else {
      target.translations[index][field] = sourceTranslation[field] ?? null;
      target.translations[index].translation_status = sourceTranslation.translation_status;
    }
  }
}

function findSection(payload, id) {
  for (const game of payload.games) {
    const section = game.sections.find((item) => item.id === id);
    if (section) return { game, section };
  }
  return null;
}

function findItem(payload, id) {
  for (const game of payload.games) {
    for (const section of game.sections) {
      const item = section.items.find((entry) => entry.id === id);
      if (item) return { game, section, item };
    }
  }
  return null;
}

function findGallery(payload, id) {
  for (const game of payload.games) {
    const item = game.gallery.find((entry) => entry.id === id);
    if (item) return { game, item };
  }
  return null;
}

function mergeTranslationSelection(next, working, key) {
  if (!key.includes(':')) {
    let found = false;
    for (const locale of working.locales) {
      if (Object.prototype.hasOwnProperty.call(working.site[locale.code] ?? {}, key)) {
        next.site[locale.code] ??= {};
        next.site[locale.code][key] = working.site[locale.code][key];
        found = true;
      } else if (next.site[locale.code]) {
        delete next.site[locale.code][key];
      }
    }
    if (!found) throw new Error(`Selected site string ${key} has no approved value in working content.`);
    return;
  }
  const [scope, id, field] = key.split(':');
  if (!scope || !id || !field) throw new Error(`Invalid translation selection: ${key}`);
  if (scope === 'game') {
    const source = working.games.find((game) => game.slug === id);
    const target = next.games.find((game) => game.id === source?.id || game.slug === id);
    if (!target) throw new Error(`Selected game translation ${key} has no live parent. Publish the game row first.`);
    copyTranslationField(target, source, field, key);
    return;
  }
  if (scope === 'section') {
    const source = findSection(working, id)?.section;
    const target = findSection(next, id)?.section;
    if (!target) throw new Error(`Selected section translation ${key} has no live parent. Publish the content row first.`);
    copyTranslationField(target, source, field, key);
    return;
  }
  if (scope === 'item') {
    const source = findItem(working, id)?.item;
    const target = findItem(next, id)?.item;
    if (!target) throw new Error(`Selected item translation ${key} has no live parent. Publish the content row first.`);
    copyTranslationField(target, source, field, key);
    return;
  }
  if (scope === 'gallery') {
    const source = findGallery(working, id)?.item;
    const target = findGallery(next, id)?.item;
    if (!target) throw new Error(`Selected gallery translation ${key} has no live parent. Publish the media row first.`);
    copyTranslationField(target, source, field, key);
    return;
  }
  if (scope === 'faq') {
    const source = working.faq.find((item) => item.id === id);
    const target = next.faq.find((item) => item.id === id);
    if (!target) throw new Error(`Selected FAQ translation ${key} has no live parent.`);
    copyTranslationField(target, source, field, key);
    return;
  }
  throw new Error(`Unsupported translation selection: ${key}`);
}

function mergeContentSelection(next, working, id) {
  const sourceSection = findSection(working, id);
  if (sourceSection) {
    const targetGame = next.games.find((game) => game.id === sourceSection.game.id);
    if (!targetGame) throw new Error(`Selected section ${id} belongs to a game that is not live.`);
    replaceById(targetGame.sections, sourceSection.section, `Selected section ${id} is missing.`);
    return;
  }
  const sourceItem = findItem(working, id);
  if (sourceItem) {
    const targetSection = findSection(next, sourceItem.section.id)?.section;
    if (!targetSection) throw new Error(`Selected item ${id} belongs to a section that is not live.`);
    replaceById(targetSection.items, sourceItem.item, `Selected item ${id} is missing.`);
    return;
  }
  throw new Error(`Selected content item ${id} does not exist in working content.`);
}

function mergeMediaSelection(next, working, id) {
  if (id.startsWith('section:')) {
    const sectionId = id.slice('section:'.length);
    const source = findSection(working, sectionId)?.section;
    const target = findSection(next, sectionId)?.section;
    if (!source || !target) throw new Error(`Selected section media ${id} has no live parent.`);
    target.media_file = source.media_file;
    return;
  }
  const gameMedia = id.match(/^([0-9a-f-]+):(hero|card|card_background|card_logo)$/i);
  if (gameMedia) {
    const [, gameId, role] = gameMedia;
    const source = working.games.find((game) => game.id === gameId);
    const target = next.games.find((game) => game.id === gameId);
    if (!source || !target) throw new Error(`Selected game media ${id} has no live parent.`);
    const field = { hero: 'hero_image', card: 'card_image', card_background: 'card_background_image', card_logo: 'card_logo_image' }[role];
    target[field] = source[field];
    return;
  }
  const sourceGallery = findGallery(working, id);
  if (sourceGallery) {
    const targetGame = next.games.find((game) => game.id === sourceGallery.game.id);
    if (!targetGame) throw new Error(`Selected gallery media ${id} has no live parent.`);
    replaceById(targetGame.gallery, sourceGallery.item, `Selected gallery media ${id} is missing.`);
    return;
  }
  throw new Error(`Selected media ${id} does not exist in working content.`);
}

export function mergeSelectedRelease(previous, working, selections = {}) {
  if (!previous) return copy(working);
  const next = copy(previous);
  next.locales = copy(working.locales);
  next.required_site_keys = copy(working.required_site_keys);
  for (const locale of working.locales) next.site[locale.code] ??= {};
  for (const gameId of new Set(selections.games ?? [])) {
    const source = working.games.find((game) => game.id === gameId);
    if (!source) throw new Error(`Selected game ${gameId} does not exist in working content.`);
    replaceById(next.games, source, `Selected game ${gameId} is missing.`);
  }
  for (const key of new Set(selections.translations ?? [])) mergeTranslationSelection(next, working, key);
  for (const id of new Set(selections.content ?? [])) mergeContentSelection(next, working, id);
  for (const id of new Set(selections.media ?? [])) mergeMediaSelection(next, working, id);
  next.games = ordered(next.games);
  next.faq = ordered(next.faq);
  return next;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function stableJson(value) {
  return JSON.stringify(canonical(value));
}

export function checksum(value) {
  return crypto.createHash('sha256').update(stableJson(value)).digest('hex');
}

export function signature(value, secret) {
  return crypto.createHmac('sha256', secret).update(typeof value === 'string' ? value : stableJson(value)).digest('hex');
}

export function secureEqual(left, right) {
  const first = Buffer.from(String(left ?? ''), 'utf8');
  const second = Buffer.from(String(right ?? ''), 'utf8');
  return first.length === second.length && crypto.timingSafeEqual(first, second);
}

export function assertPublishSelection(selections) {
  const total = ['games', 'translations', 'content', 'media'].reduce((sum, key) => sum + (Array.isArray(selections?.[key]) ? selections[key].length : 0), 0);
  if (!total) throw new Error('Select at least one game, translation, content item, or media item to publish.');
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function approvedEnglish(translations, label) {
  const value = translations.find((entry) => entry.locale === 'en' && entry.translation_status === 'approved');
  if (!value) throw new Error(`${label} has no approved English translation.`);
  return value;
}

function present(value) {
  return String(value ?? '').trim().length > 0;
}

function assertUuid(value, label) {
  if (!UUID.test(String(value ?? ''))) throw new Error(`${label} must reference a valid CMS asset.`);
}

export function validateSnapshot(payload) {
  const warnings = [];
  if (!payload || !Array.isArray(payload.locales) || !Array.isArray(payload.games) || !payload.site) throw new Error('Release payload is incomplete.');
  const defaults = payload.locales.filter((locale) => locale.is_default);
  if (defaults.length !== 1 || defaults[0].code !== 'en') throw new Error('English must be the only default locale.');
  const activeLocales = payload.locales.filter((locale) => locale.is_active).map((locale) => locale.code);
  for (const key of payload.required_site_keys ?? []) {
    if (!present(payload.site.en?.[key])) throw new Error(`Required English site string is missing: ${key}`);
    for (const locale of activeLocales.filter((code) => code !== 'en')) {
      if (!present(payload.site[locale]?.[key])) warnings.push({ code: 'SITE_STRING_FALLBACK', locale, key });
    }
  }
  for (const faq of (payload.faq ?? []).filter((item) => item.enabled)) {
    approvedEnglish(faq.translations, `FAQ ${faq.id}`);
    for (const locale of activeLocales.filter((code) => code !== 'en')) {
      if (!faq.translations.some((entry) => entry.locale === locale && entry.translation_status === 'approved')) warnings.push({ code: 'FAQ_TRANSLATION_FALLBACK', locale, faq: faq.id });
    }
  }
  const slugs = new Set();
  const gameIds = new Set();
  for (const game of payload.games) {
    if (!UUID.test(String(game.id ?? ''))) throw new Error('Every published game requires a UUID.');
    if (gameIds.has(game.id)) throw new Error(`Duplicate game id: ${game.id}`);
    gameIds.add(game.id);
    if (!SLUG.test(String(game.slug ?? ''))) throw new Error(`${game.internal_name || game.id}: invalid slug.`);
    if (slugs.has(game.slug)) throw new Error(`Duplicate game slug: ${game.slug}`);
    slugs.add(game.slug);
    if (!['live', 'coming_soon'].includes(game.release_status)) throw new Error(`${game.slug}: invalid release status.`);
    if (!['slot', 'instant', 'crash', 'table'].includes(game.game_type)) throw new Error(`${game.slug}: invalid game type.`);
    if (!Array.isArray(game.volatility) || !game.volatility.length || game.volatility.some((value) => !['low', 'medium', 'high', 'very_high'].includes(value))) throw new Error(`${game.slug}: invalid volatility.`);
    if (game.rtp_mode === 'fixed' && (!Number.isFinite(Number(game.rtp)) || Number(game.rtp) < 0.8 || Number(game.rtp) > 0.995)) throw new Error(`${game.slug}: fixed RTP must be between 0.8 and 0.995.`);
    if (!['fixed', 'configurable'].includes(game.rtp_mode)) throw new Error(`${game.slug}: invalid RTP mode.`);
    if ((game.max_win_value == null) !== (game.max_win_unit == null) || (game.max_win_unit != null && !['x', 'coins'].includes(game.max_win_unit))) throw new Error(`${game.slug}: invalid max win configuration.`);
    if ((game.bet_min == null) !== (game.bet_max == null) || (game.bet_min != null && Number(game.bet_min) > Number(game.bet_max))) throw new Error(`${game.slug}: invalid bet range.`);
    if (game.demo_enabled && game.demo_mode === 'adapter' && !UUID.test(String(game.demo_game_id ?? ''))) throw new Error(`${game.slug}: adapter demo requires a UUID.`);
    if (game.demo_enabled && game.demo_mode === 'direct' && (!present(game.direct_build) || !Number.isInteger(Number(game.direct_version)) || Number(game.direct_version) <= 0)) throw new Error(`${game.slug}: direct demo configuration is incomplete.`);
    if (game.demo_enabled && !['adapter', 'direct'].includes(game.demo_mode)) throw new Error(`${game.slug}: enabled demo requires a mode.`);
    assertUuid(game.card_image, `${game.slug} card image`);
    assertUuid(game.hero_image, `${game.slug} hero image`);
    const english = approvedEnglish(game.translations, game.slug);
    for (const field of ['display_name', 'short_description', 'overview', 'seo_title', 'seo_description', 'card_alt', 'hero_alt']) {
      if (!present(english[field])) throw new Error(`${game.slug}: English ${field} is required.`);
    }
    for (const locale of activeLocales.filter((code) => code !== 'en')) {
      const localized = game.translations.find((entry) => entry.locale === locale && entry.translation_status === 'approved');
      if (!localized) warnings.push({ code: 'GAME_TRANSLATION_FALLBACK', locale, game: game.slug });
      else {
        if (!present(localized.seo_title) || !present(localized.seo_description)) warnings.push({ code: 'SEO_TRANSLATION_FALLBACK', locale, game: game.slug });
        if (!present(localized.card_alt) || !present(localized.hero_alt)) warnings.push({ code: 'ALT_TRANSLATION_FALLBACK', locale, game: game.slug });
      }
    }
    for (const section of game.sections.filter((item) => item.enabled)) {
      approvedEnglish(section.translations, `${game.slug} section ${section.id}`);
      if (section.media_file) assertUuid(section.media_file, `${game.slug} section media`);
      for (const item of section.items.filter((entry) => entry.enabled)) {
        approvedEnglish(item.translations, `${game.slug} item ${item.id}`);
        if (item.icon_file) assertUuid(item.icon_file, `${game.slug} item icon`);
        if (item.image_file) assertUuid(item.image_file, `${game.slug} item image`);
      }
    }
    for (const gallery of game.gallery.filter((item) => item.enabled)) {
      assertUuid(gallery.file, `${game.slug} gallery image`);
      const galleryEnglish = approvedEnglish(gallery.translations, `${game.slug} gallery ${gallery.id}`);
      if (!present(galleryEnglish.alt)) throw new Error(`${game.slug}: gallery ${gallery.id} requires English alt text.`);
    }
  }
  return { payload, warnings };
}
