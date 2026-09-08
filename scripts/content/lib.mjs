import { createHash } from 'node:crypto';
import { LOCALES } from '../../locales.mjs';

export const CONTENT_LOCALES = LOCALES;
export const GAME_TYPES = new Set(['slot', 'instant', 'table']);
export const GAME_STATUSES = new Set(['live', 'coming_soon']);
export const VOLATILITY_VALUES = new Set(['low', 'medium', 'high', 'very_high']);
export const TRANSLATION_TYPES = new Set(['plain', 'rich', 'button', 'aria', 'seo_title', 'seo_description', 'alt']);

export function normalize(value) {
  return value == null ? '' : String(value).trim();
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function resolveTranslation(row, locale) {
  return normalize(row?.[locale]) || normalize(row?.en);
}

export function validateTranslationRows(rows, label = 'translation') {
  const seen = new Set();
  const errors = [];
  rows.forEach((row, index) => {
    const place = `${label} row ${index + 2}`;
    const key = normalize(row.key ?? `${row.slug}:${row.fieldKey}`);
    if (!key) errors.push(`${place}: key is required`);
    else if (seen.has(key)) errors.push(`${place}: duplicate key ${key}`);
    else seen.add(key);
    if (!normalize(row.en)) errors.push(`${place}: EN is required`);
    if (!TRANSLATION_TYPES.has(normalize(row.type))) errors.push(`${place}: invalid Type ${row.type}`);
    for (const locale of CONTENT_LOCALES) {
      const value = normalize(row[locale]);
      if (/<\/?(?:script|iframe|object|embed)\b/iu.test(value)) errors.push(`${place}: unsafe HTML in ${locale.toUpperCase()}`);
    }
    if (row.type === 'seo_title' && normalize(row.en).length > 70) errors.push(`${place}: EN SEO title exceeds 70 characters`);
    if (row.type === 'seo_description' && normalize(row.en).length > 165) errors.push(`${place}: EN SEO description exceeds 165 characters`);
  });
  return errors;
}

export function parseDriveReference(input) {
  const value = normalize(input);
  if (!value) return null;
  const urlMatch = value.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([-\w]{20,})/iu);
  if (urlMatch) return { kind: 'drive', id: urlMatch[1] };
  if (/^[-\w]{20,}$/u.test(value) && !value.includes('/')) return { kind: 'drive', id: value };
  if (/^https:\/\//iu.test(value)) return { kind: 'https', url: value };
  return { kind: 'project', path: value.replaceAll('\\', '/') };
}

export function mediaCacheKey(bytes, mimeType) {
  return `${sha256(bytes)}:${normalize(mimeType).toLowerCase()}`;
}

export function parseVolatility(value) {
  const values = normalize(value).split(',').map((item) => item.trim()).filter(Boolean);
  if (!values.length || values.some((item) => !VOLATILITY_VALUES.has(item))) throw new Error('Volatility must contain low, medium, high or very_high');
  return [...new Set(values)];
}

export function validateGameRows(rows) {
  const errors = [];
  const slugs = new Set();
  const ids = new Set();
  rows.forEach((row, index) => {
    const place = `game row ${index + 2}`;
    const id = normalize(row.id);
    if (!id) errors.push(`${place}: Game ID is required`);
    else if (ids.has(id)) errors.push(`${place}: duplicate Game ID ${id}`);
    else ids.add(id);
    const slug = normalize(row.slug);
    if (!slug) errors.push(`${place}: Slug is required`);
    else if (slugs.has(slug)) errors.push(`${place}: duplicate slug ${slug}`);
    else slugs.add(slug);
    if (!GAME_STATUSES.has(normalize(row.status))) errors.push(`${place}: invalid Status`);
    if (!GAME_TYPES.has(normalize(row.type))) errors.push(`${place}: invalid Type`);
    if (!Number.isFinite(Number(row.order))) errors.push(`${place}: Order must be numeric`);
    const rtp = row.rtp;
    if (rtp !== 'configurable' && !(Number(rtp) >= 0.8 && Number(rtp) <= 0.995)) errors.push(`${place}: invalid RTP`);
    try { parseVolatility(row.volatility); } catch (error) { errors.push(`${place}: ${error.message}`); }
    if ((normalize(row.maxWinValue) && !['x', 'coins'].includes(normalize(row.maxWinUnit))) || (!normalize(row.maxWinValue) && normalize(row.maxWinUnit)) || (normalize(row.maxWinValue) && !(Number(row.maxWinValue) > 0))) errors.push(`${place}: incomplete or invalid max win pair`);
    if ((normalize(row.betMin) && !normalize(row.betMax)) || (!normalize(row.betMin) && normalize(row.betMax)) || (normalize(row.betMin) && (!(Number(row.betMin) > 0) || !(Number(row.betMax) > 0) || Number(row.betMin) > Number(row.betMax)))) errors.push(`${place}: invalid bet pair`);
    if (row.demoEnabled === true || String(row.demoEnabled).toLowerCase() === 'true') {
      if (row.demoMode === 'adapter' && !normalize(row.demoGameId)) errors.push(`${place}: adapter demo requires Adapter Game ID`);
      else if (row.demoMode === 'direct' && (!normalize(row.demoBuild) || !normalize(row.demoVersion))) errors.push(`${place}: direct demo requires build and version`);
      else if (!['adapter', 'direct'].includes(row.demoMode)) errors.push(`${place}: invalid demo mode`);
    }
    if (normalize(row.demoApiHost)) {
      try { new URL(row.demoApiHost); } catch { errors.push(`${place}: invalid API Host URL`); }
    }
    if (row.status === 'live') {
      if (!normalize(row.cardBackground)) errors.push(`${place}: Card Background is required`);
      if (!normalize(row.heroImage)) errors.push(`${place}: Hero Image is required`);
    }
  });
  return errors;
}

export function localizedRoute(pathname, locale) {
  const pieces = normalize(pathname || '/').split('/').filter(Boolean);
  if (CONTENT_LOCALES.includes(pieces[0])) pieces.shift();
  const base = `/${pieces.join('/')}`.replace(/\/$/u, '') || '/';
  return locale === 'en' ? base : base === '/' ? `/${locale}` : `/${locale}${base}`;
}

export function assertSnapshotSchema(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.siteTranslations) || !Array.isArray(snapshot.games) || !Array.isArray(snapshot.gameTranslations)) {
    throw new Error('Snapshot must contain siteTranslations, games and gameTranslations arrays');
  }
  const errors = [
    ...validateTranslationRows(snapshot.siteTranslations, 'site translation'),
    ...validateTranslationRows(snapshot.gameTranslations, 'game translation'),
    ...validateGameRows(snapshot.games),
  ];
  const gameSlugs = new Set(snapshot.games.map((row) => normalize(row.slug)));
  const requiredGameFields = ['display_name', 'short_description', 'overview', 'layout_display', 'seo_title', 'seo_description', 'card_logo_alt', 'hero_alt'];
  const fieldsBySlug = new Map();
  snapshot.siteTranslations.forEach((row, index) => {
    if (!normalize(row.page) || !normalize(row.section) || !normalize(row.context)) errors.push(`site translation row ${index + 2}: Page, Section and Context are required`);
  });
  snapshot.gameTranslations.forEach((row, index) => {
    const slug = normalize(row.slug);
    if (!gameSlugs.has(slug)) errors.push(`game translation row ${index + 2}: unknown game slug ${slug}`);
    if (!normalize(row.fieldKey) || !normalize(row.group) || !normalize(row.context)) errors.push(`game translation row ${index + 2}: Field Key, Group and Context are required`);
    (fieldsBySlug.get(slug) ?? fieldsBySlug.set(slug, new Set()).get(slug)).add(normalize(row.fieldKey));
  });
  for (const slug of gameSlugs) {
    const fields = fieldsBySlug.get(slug) ?? new Set();
    for (const field of requiredGameFields) if (!fields.has(field)) errors.push(`${slug}: missing required game translation ${field}`);
    const featureIds = [...fields].flatMap((field) => field.match(/^features\.([^.]+)\.(?:title|body)$/u)?.[1] ?? []);
    for (const id of new Set(featureIds)) {
      if (!fields.has(`features.${id}.title`) || !fields.has(`features.${id}.body`)) errors.push(`${slug}: feature ${id} requires both title and body`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return snapshot;
}
