import { z } from 'zod';

export const GAME_TYPES = ['slot', 'instant', 'crash', 'table'];
export const RELEASE_STATUSES = ['live', 'coming_soon'];
export const VOLATILITY_LEVELS = ['low', 'medium', 'high', 'very_high'];
export const TRANSLATION_STATUSES = ['draft', 'review', 'approved'];
export const SECTION_TYPES = ['rich_text', 'feature_grid', 'bullet_list', 'media_text'];

const nullableNumber = z.preprocess(
  (value) => value === '' || value === undefined ? null : value,
  z.coerce.number().nullable(),
);

const nullableString = z.preprocess(
  (value) => value === '' || value === undefined ? null : value,
  z.string().trim().nullable(),
);

export const cmsGameSchema = z.object({
  id: z.string().uuid().optional(),
  internal_name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  release_status: z.enum(RELEASE_STATUSES),
  sort_order: z.coerce.number().int(),
  game_type: z.enum(GAME_TYPES),
  rtp_mode: z.enum(['fixed', 'configurable']),
  rtp: nullableNumber,
  volatility: z.array(z.enum(VOLATILITY_LEVELS)).min(1),
  max_win_value: nullableNumber,
  max_win_unit: z.enum(['x', 'coins']).nullable(),
  max_win_approx: z.coerce.boolean().default(false),
  bet_min: nullableNumber,
  bet_max: nullableNumber,
  demo_enabled: z.coerce.boolean().default(false),
  demo_mode: z.enum(['adapter', 'direct']).nullable(),
  demo_game_id: nullableString,
  direct_build: nullableString,
  direct_version: nullableNumber,
  api_host: nullableString,
  card_image: z.unknown().nullable().optional(),
  hero_image: z.unknown().nullable().optional(),
}).superRefine((game, context) => {
  if (game.rtp_mode === 'fixed' && (game.rtp === null || game.rtp < 0.8 || game.rtp > 0.995)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['rtp'], message: 'Fixed RTP must be between 0.8 and 0.995' });
  }
  if ((game.max_win_value === null) !== (game.max_win_unit === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['max_win_unit'], message: 'Max win value and unit must be provided together' });
  }
  if ((game.bet_min === null) !== (game.bet_max === null) || (game.bet_min !== null && game.bet_max !== null && game.bet_min > game.bet_max)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['bet_min'], message: 'Bet range must contain both values and min must not exceed max' });
  }
  if (!game.demo_enabled) return;
  if (game.demo_mode === 'adapter' && !z.string().uuid().safeParse(game.demo_game_id).success) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['demo_game_id'], message: 'Adapter demo requires a valid game UUID' });
  }
  if (game.demo_mode === 'direct') {
    if (!game.direct_build || !Number.isInteger(game.direct_version) || game.direct_version <= 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['direct_build'], message: 'Direct demo requires build and positive integer version' });
    }
    if (game.api_host && !z.string().url().safeParse(game.api_host).success) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['api_host'], message: 'API host must be a valid URL' });
    }
  }
  if (!game.demo_mode) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['demo_mode'], message: 'Enabled demo requires a mode' });
  }
});

export const cmsGameTranslationSchema = z.object({
  locale: z.string().trim().min(2).max(12),
  display_name: z.string().trim().min(2).max(160),
  short_description: z.string().trim().min(1),
  overview: z.string().trim().min(1),
  main_feature: z.string().trim().nullable().optional(),
  layout_display: z.string().trim().nullable().optional(),
  seo_title: z.string().trim().min(1).max(70),
  seo_description: z.string().trim().min(60).max(165),
  card_alt: z.string().trim().min(1).max(255),
  hero_alt: z.string().trim().min(1).max(255),
  translation_status: z.enum(TRANSLATION_STATUSES),
});

export function validatePublishableGame(input, translations = []) {
  const game = cmsGameSchema.parse(input);
  if (!game.card_image || !game.hero_image) throw new Error(`${game.slug}: published games require card and hero media`);
  const english = translations.find((translation) => translation.locale === 'en');
  if (!english) throw new Error(`${game.slug}: missing required English translation`);
  const parsedEnglish = cmsGameTranslationSchema.parse(english);
  if (parsedEnglish.translation_status !== 'approved') throw new Error(`${game.slug}: English translation is not approved`);
  return game;
}

export function validateGameDataset(records, { publish = false } = {}) {
  const slugs = new Set();
  const ids = new Set();
  const parsed = records.map((record) => {
    const game = publish
      ? validatePublishableGame(record, record.translations ?? [])
      : cmsGameSchema.parse(record);
    if (slugs.has(game.slug)) throw new Error(`Duplicate game slug: ${game.slug}`);
    slugs.add(game.slug);
    if (game.id) {
      if (ids.has(game.id)) throw new Error(`Duplicate game id: ${game.id}`);
      ids.add(game.id);
    }
    const localeKeys = new Set();
    for (const translation of record.translations ?? []) {
      const key = `${game.id ?? game.slug}:${translation.locale}`;
      if (localeKeys.has(key)) throw new Error(`Duplicate game translation: ${key}`);
      localeKeys.add(key);
      cmsGameTranslationSchema.parse(translation);
    }
    return game;
  });
  return parsed;
}
