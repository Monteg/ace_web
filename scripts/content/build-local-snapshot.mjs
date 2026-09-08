import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { LOCALES } from '../../locales.mjs';

const ROOT = process.cwd();
const SECONDARY_LOCALES = LOCALES.filter((locale) => locale !== 'en');
const TYPES = new Set(['plain', 'rich', 'button', 'aria', 'seo_title', 'seo_description', 'alt']);
const GAME_TYPES = new Set(['slot', 'instant', 'table']);
const GAME_STATUSES = new Set(['live', 'coming_soon']);
const TRANSLATION_FIELDS = [
  ['display_name', 'Identity', 'Public game name', 'plain'],
  ['short_description', 'Summary', 'Short card and page description', 'plain'],
  ['overview', 'Overview', 'Markdown overview before the first level-two heading', 'rich'],
  ['gameplay', 'Overview', 'Core Gameplay section in Markdown', 'rich'],
  ['main_feature_label', 'Overview', 'Main feature section heading', 'plain'],
  ['main_feature_body', 'Overview', 'Main Feature section in Markdown', 'rich'],
  ['bonus', 'Overview', 'Bonus Spins & Bonus Game section in Markdown', 'rich'],
  ['multiplier', 'Overview', 'Multiple Payline Wins section in Markdown', 'rich'],
  ['design_atmosphere', 'Overview', 'Design & Atmosphere section in Markdown', 'rich'],
  ['layout_display', 'Specs', 'Localized layout value shown to visitors', 'plain'],
  ['seo_title', 'SEO', 'Search and browser title', 'seo_title'],
  ['seo_description', 'SEO', 'Search description', 'seo_description'],
  ['card_logo_alt', 'Media', 'Accessible text for the card logo or card artwork', 'alt'],
  ['hero_alt', 'Media', 'Accessible text for the game hero image', 'alt'],
];
const REQUIRED_GAME_TRANSLATION_FIELDS = new Set([
  'display_name', 'short_description', 'overview', 'layout_display',
  'seo_title', 'seo_description', 'card_logo_alt', 'hero_alt',
]);

const normalize = (value) => (value == null ? '' : String(value).trim());
const hash = (value) => createHash('sha256').update(value).digest('hex');
const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const translationStatus = (english, previous, nextEnglish) => {
  if (!normalize(english)) return 'Error';
  const hasTranslations = SECONDARY_LOCALES.some((locale) => normalize(previous?.[locale]));
  if (previous?.en && previous.en !== nextEnglish && hasTranslations) return 'SOURCE CHANGED';
  return SECONDARY_LOCALES.every((locale) => normalize(previous?.[locale])) ? 'Ready' : 'Missing';
};

function splitMarkdown(markdown) {
  const result = { overview: '' };
  let current = 'overview';
  const buffer = [];

  const commit = () => {
    result[current] = buffer.join('\n').trim();
    buffer.length = 0;
  };

  for (const line of markdown.trim().split(/\r?\n/)) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      commit();
      current = match[1].trim();
      continue;
    }
    buffer.push(line);
  }
  commit();
  return result;
}

function gameTranslationValues(game) {
  const sections = splitMarkdown(game.body);
  return {
    display_name: game.data.name,
    short_description: game.data.seo.description,
    overview: sections.overview ?? '',
    gameplay: sections['Core Gameplay'] ?? '',
    main_feature_label: game.data.specs.mainFeature ?? 'Main Feature',
    main_feature_body: sections['Main Feature'] ?? '',
    bonus: sections['Bonus Spins & Bonus Game'] ?? '',
    multiplier: sections['Multiple Payline Wins'] ?? '',
    design_atmosphere: sections['Design & Atmosphere'] ?? '',
    layout_display: game.data.specs.layout ?? '',
    seo_title: game.data.seo.title,
    seo_description: game.data.seo.description,
    card_logo_alt: `${game.data.name} game artwork`,
    hero_alt: `${game.data.name} hero artwork`,
  };
}

function validateSiteRows(rows) {
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    const location = `site translation row ${index + 2}`;
    if (!normalize(row.key)) throw new Error(`${location}: Key is required`);
    if (seen.has(row.key)) throw new Error(`${location}: duplicate key ${row.key}`);
    seen.add(row.key);
    if (!normalize(row.page) || !normalize(row.section) || !normalize(row.context)) {
      throw new Error(`${location}: Page, Section and Context are required`);
    }
    if (!TYPES.has(row.type)) throw new Error(`${location}: unsupported Type ${row.type}`);
    if (!normalize(row.en)) throw new Error(`${location}: EN is required`);
  }
}

function validateGame(slug, data) {
  if (!normalize(data.name)) throw new Error(`${slug}: name is required`);
  if (!GAME_TYPES.has(data.type)) throw new Error(`${slug}: type must be slot, instant or table`);
  if (!GAME_STATUSES.has(data.status)) throw new Error(`${slug}: unsupported status ${data.status}`);
  if (!Number.isFinite(data.order)) throw new Error(`${slug}: order must be numeric`);
  if (data.specs?.rtp !== 'configurable' && !Number.isFinite(data.specs?.rtp)) {
    throw new Error(`${slug}: RTP must be numeric or configurable`);
  }
  if (!Array.isArray(data.specs?.volatility) || data.specs.volatility.length === 0) {
    throw new Error(`${slug}: at least one volatility value is required`);
  }
  for (const field of ['card', 'hero']) {
    if (!normalize(data[field])) throw new Error(`${slug}: ${field} image is required`);
  }
}

async function loadGames() {
  const gamesDir = path.join(ROOT, 'src', 'content', 'games');
  const names = (await readdir(gamesDir)).filter((name) => name.endsWith('.md')).sort();
  const games = [];

  for (const name of names) {
    const slug = name.slice(0, -3);
    const raw = await readFile(path.join(gamesDir, name), 'utf8');
    const parsed = matter(raw);
    parsed.data.status ??= 'live';
    parsed.data.order ??= 100;
    parsed.data.gallery ??= [];
    parsed.data.highlights ??= [];
    parsed.data.features ??= [];
    validateGame(slug, parsed.data);
    games.push({ slug, data: parsed.data, body: parsed.content.trim() });
  }
  return games;
}

function buildTechnicalRows(games, existingRows = []) {
  const existing = new Map(existingRows.map((row) => [row.slug, row]));
  const authoringReference = (previous, projectReference) => /^(?:https:\/\/|[-\w]{20,}$)/iu.test(normalize(previous)) ? previous : projectReference;
  return games.map(({ slug, data }) => ({
    id: existing.get(slug)?.id ?? slug,
    name: data.name,
    slug,
    status: data.status,
    order: data.order,
    type: data.type,
    rtp: data.specs.rtp,
    volatility: data.specs.volatility.join(', '),
    maxWinValue: data.specs.maxWin?.value ?? '',
    maxWinUnit: data.specs.maxWin?.unit ?? '',
    maxWinApprox: data.specs.maxWin?.approx ?? false,
    betMin: data.specs.bet?.min ?? '',
    betMax: data.specs.bet?.max ?? '',
    demoMode: data.demo?.mode ?? '',
    demoEnabled: Boolean(data.demo),
    demoGameId: data.demo?.mode === 'adapter' ? data.demo.gameId : '',
    demoBuild: data.demo?.mode === 'direct' ? data.demo.build : '',
    demoVersion: data.demo?.mode === 'direct' ? data.demo.version : '',
    demoApiHost: data.demo?.mode === 'direct' ? data.demo.apiHost ?? '' : '',
    cardLogo: authoringReference(existing.get(slug)?.cardLogo, data.cardLayers?.logo ?? ''),
    cardBackground: authoringReference(existing.get(slug)?.cardBackground, data.cardLayers?.background ?? data.card),
    heroImage: authoringReference(existing.get(slug)?.heroImage, data.hero),
    changed: false,
    publish: true,
    statusLabel: 'Ready',
  }));
}

function buildTranslationRows(games, existingRows = []) {
  const existing = new Map(existingRows.map((row) => [`${row.slug}::${row.fieldKey}`, row]));
  const rows = [];
  for (const game of games) {
    const values = gameTranslationValues(game);
    for (const [fieldKey, group, context, type] of TRANSLATION_FIELDS) {
      if (!normalize(values[fieldKey]) && !REQUIRED_GAME_TRANSLATION_FIELDS.has(fieldKey)) continue;
      const previous = existing.get(`${game.slug}::${fieldKey}`);
      rows.push({
        game: game.data.name,
        slug: game.slug,
        fieldKey,
        group,
        context,
        type,
        en: values[fieldKey] ?? '',
        it: previous?.it ?? '',
        pt: previous?.pt ?? '',
        es: previous?.es ?? '',
        status: translationStatus(values[fieldKey], previous, values[fieldKey]),
      });
    }
    for (const [index, feature] of (game.data.features ?? []).entries()) {
      const featureId = `feature_${index + 1}`;
      const titleKey = `features.${featureId}.title`;
      const previousTitle = existing.get(`${game.slug}::${titleKey}`);
      rows.push({
        game: game.data.name,
        slug: game.slug,
        fieldKey: titleKey,
        group: 'Features',
        context: `Stable repeatable feature ${featureId} title`,
        type: 'plain',
        en: feature.title,
        it: previousTitle?.it ?? '',
        pt: previousTitle?.pt ?? '',
        es: previousTitle?.es ?? '',
        status: translationStatus(feature.title, previousTitle, feature.title),
      });
      const bodyKey = `features.${featureId}.body`;
      const previousBody = existing.get(`${game.slug}::${bodyKey}`);
      rows.push({
        game: game.data.name,
        slug: game.slug,
        fieldKey: bodyKey,
        group: 'Features',
        context: `Stable repeatable feature ${featureId} body`,
        type: 'rich',
        en: feature.body,
        it: previousBody?.it ?? '',
        pt: previousBody?.pt ?? '',
        es: previousBody?.es ?? '',
        status: translationStatus(feature.body, previousBody, feature.body),
      });
    }
  }
  return rows;
}

function rowsToGameLocales(gameRows, translationRows) {
  const byLocale = Object.fromEntries(LOCALES.map((locale) => [locale, {}]));
  for (const game of gameRows) {
    for (const locale of LOCALES) byLocale[locale][game.slug] = {};
  }
  for (const row of translationRows) {
    for (const locale of LOCALES) {
      const value = normalize(row[locale]);
      if (value) byLocale[locale][row.slug][row.fieldKey] = value;
    }
  }
  return byLocale;
}

async function main() {
  const siteRows = JSON.parse(await readFile(path.join(ROOT, 'content', 'sheets', 'site-translations.json'), 'utf8')).map((row) => ({
    ...row,
    status: !normalize(row.en) ? 'Error' : SECONDARY_LOCALES.every((locale) => normalize(row[locale])) ? 'Ready' : 'Missing',
  }));
  const existingGameTranslations = await readFile(path.join(ROOT, 'content', 'sheets', 'game-translations.json'), 'utf8')
    .then(JSON.parse)
    .catch(() => []);
  const existingGames = await readFile(path.join(ROOT, 'content', 'sheets', 'games.json'), 'utf8')
    .then(JSON.parse)
    .catch(() => []);
  validateSiteRows(siteRows);
  const games = await loadGames();
  const technicalRows = buildTechnicalRows(games, existingGames);
  const translationRows = buildTranslationRows(games, existingGameTranslations);
  const gameLocales = rowsToGameLocales(technicalRows, translationRows);

  const generatedDir = path.join(ROOT, 'src', 'generated', 'content');
  await mkdir(generatedDir, { recursive: true });

  for (const locale of LOCALES) {
    const site = Object.fromEntries(siteRows.map((row) => [row.key, normalize(row[locale])]).filter(([, value]) => value));
    await writeFile(path.join(generatedDir, `site.${locale}.json`), stableJson(site));
    await writeFile(path.join(generatedDir, `games.${locale}.json`), stableJson(gameLocales[locale]));
  }

  const shared = Object.fromEntries(technicalRows.map((row) => [row.slug, row]));
  const seed = { siteTranslations: siteRows, games: technicalRows, gameTranslations: translationRows };
  const manifestInput = stableJson(seed);
  const manifest = {
    schemaVersion: 1,
    sourceHash: hash(manifestInput),
    locales: LOCALES,
    siteTranslationCount: siteRows.length,
    gameCount: technicalRows.length,
    gameTranslationCount: translationRows.length,
  };

  await writeFile(path.join(generatedDir, 'games.shared.json'), stableJson(shared));
  await writeFile(path.join(generatedDir, 'manifest.json'), stableJson(manifest));
  await writeFile(path.join(ROOT, 'content', 'sheets', 'games.json'), stableJson(technicalRows));
  await writeFile(path.join(ROOT, 'content', 'sheets', 'game-translations.json'), stableJson(translationRows));
  await writeFile(path.join(ROOT, 'content', 'sheets', 'seed.json'), stableJson({ ...seed, manifest }));

  console.log(`Generated ${siteRows.length} site translations, ${technicalRows.length} games and ${translationRows.length} game translation rows.`);
}

await main();
