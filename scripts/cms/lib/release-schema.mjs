import crypto from 'node:crypto';
import { z } from 'zod';
import { cmsGameSchema, cmsGameTranslationSchema } from './game-schema.mjs';

const translationStatus = z.enum(['draft', 'review', 'approved']);
const localizedBlock = z.object({ locale: z.string().min(2), translation_status: translationStatus }).passthrough();
const assetId = z.string().uuid();

const releaseGameSchema = cmsGameSchema.and(z.object({
  card_image: assetId,
  hero_image: assetId,
  card_background_image: assetId.nullable().optional(),
  card_logo_image: assetId.nullable().optional(),
  translations: z.array(cmsGameTranslationSchema).min(1),
  sections: z.array(z.object({
    id: z.string().uuid(),
    section_type: z.enum(['rich_text', 'feature_grid', 'bullet_list', 'media_text']),
    sort_order: z.coerce.number().int(),
    enabled: z.coerce.boolean(),
    media_file: assetId.nullable().optional(),
    style_preset: z.string(),
    translations: z.array(localizedBlock),
    items: z.array(z.object({
      id: z.string().uuid(),
      sort_order: z.coerce.number().int(),
      enabled: z.coerce.boolean(),
      icon_file: assetId.nullable().optional(),
      image_file: assetId.nullable().optional(),
      translations: z.array(localizedBlock),
    })).default([]),
  })).default([]),
  gallery: z.array(z.object({
    id: z.string().uuid(),
    file: assetId,
    sort_order: z.coerce.number().int(),
    enabled: z.coerce.boolean(),
    translations: z.array(localizedBlock),
  })).default([]),
}));

export const releasePayloadSchema = z.object({
  locales: z.array(z.object({
    code: z.string().min(2).max(12),
    name: z.string().min(1),
    native_name: z.string().min(1),
    is_default: z.coerce.boolean(),
    is_active: z.coerce.boolean(),
    sort_order: z.coerce.number().int(),
    fallback_locale: z.string().nullable().optional(),
    direction: z.enum(['ltr', 'rtl']),
    hreflang: z.string().min(2),
  })).min(1),
  site: z.record(z.record(z.string())).default({ en: {} }),
  games: z.array(releaseGameSchema),
});

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(canonical(value));
}

export function releaseChecksum(payload) {
  return crypto.createHash('sha256').update(stableStringify(payload)).digest('hex');
}

export function validateReleasePayload(input) {
  const payload = releasePayloadSchema.parse(input);
  const defaults = payload.locales.filter((locale) => locale.is_default);
  if (defaults.length !== 1 || defaults[0].code !== 'en') throw new Error('Release must contain exactly one default locale, and it must be English.');
  const activeLocales = payload.locales.filter((locale) => locale.is_active).map((locale) => locale.code);
  const slugs = new Set();
  const warnings = [];

  for (const game of payload.games) {
    if (slugs.has(game.slug)) throw new Error(`Duplicate game slug: ${game.slug}`);
    slugs.add(game.slug);
    const english = game.translations.find((translation) => translation.locale === 'en');
    if (!english || english.translation_status !== 'approved') throw new Error(`${game.slug}: approved English translation is required.`);
    for (const locale of activeLocales.filter((code) => code !== 'en')) {
      if (!game.translations.some((translation) => translation.locale === locale && translation.translation_status === 'approved')) {
        warnings.push({ code: 'GAME_TRANSLATION_FALLBACK', locale, game: game.slug });
      }
    }
    for (const section of game.sections.filter((item) => item.enabled)) {
      const sectionEnglish = section.translations.find((translation) => translation.locale === 'en');
      if (!sectionEnglish || sectionEnglish.translation_status !== 'approved') throw new Error(`${game.slug}: section ${section.id} has no approved English translation.`);
      for (const item of section.items.filter((entry) => entry.enabled)) {
        const itemEnglish = item.translations.find((translation) => translation.locale === 'en');
        if (!itemEnglish || itemEnglish.translation_status !== 'approved') throw new Error(`${game.slug}: section item ${item.id} has no approved English translation.`);
      }
    }
    for (const gallery of game.gallery.filter((item) => item.enabled)) {
      const galleryEnglish = gallery.translations.find((translation) => translation.locale === 'en');
      if (!galleryEnglish || galleryEnglish.translation_status !== 'approved' || !String(galleryEnglish.alt ?? '').trim()) {
        throw new Error(`${game.slug}: gallery item ${gallery.id} has no approved English alt text.`);
      }
    }
  }
  return { payload, warnings };
}

export function collectAssetIds(payload) {
  const ids = new Set();
  const add = (value) => { if (value) ids.add(value); };
  for (const game of payload.games) {
    add(game.card_image);
    add(game.hero_image);
    add(game.card_background_image);
    add(game.card_logo_image);
    for (const section of game.sections) {
      add(section.media_file);
      for (const item of section.items) { add(item.icon_file); add(item.image_file); }
    }
    for (const gallery of game.gallery) add(gallery.file);
  }
  return [...ids];
}
