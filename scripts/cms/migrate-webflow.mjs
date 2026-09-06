import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { parse } from 'csv-parse/sync';
import {
  compareRecords,
  deterministicUuid,
  findDuplicateValues,
  firstParagraph,
  migrateStatus,
  normalizeLegacyType,
  parseBet,
  parseDemo,
  parseMaxWin,
  parseRtp,
  parseVolatility,
  splitMarkdownSections,
  valueFrom,
} from './lib/migration.mjs';

const args = process.argv.slice(2);
const argument = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const csvPath = argument('--csv');
const localOnly = args.includes('--local-only');
if (!csvPath && !localOnly) {
  console.error('Usage: npm run cms:migrate -- --csv <webflow.csv> [--out cms/migration-output]\n   or: npm run cms:migrate -- --local-only [--out cms/migration-output]');
  process.exit(1);
}

const root = process.cwd();
const outputDirectory = path.resolve(root, argument('--out', 'cms/migration-output'));
const rows = localOnly ? [] : parse(fs.readFileSync(path.resolve(root, csvPath)), { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true, trim: true });
const markdownDirectory = path.join(root, 'src', 'content', 'games');
const normalizeAstroAsset = (source) => path.relative(root, path.resolve(markdownDirectory, source)).split(path.sep).join('/');
const currentRecords = new Map(
  fs.readdirSync(markdownDirectory).filter((name) => name.endsWith('.md')).map((name) => {
    const slug = path.basename(name, '.md');
    const parsed = matter(fs.readFileSync(path.join(markdownDirectory, name), 'utf8'));
    return [slug, { slug, ...parsed.data, overview: parsed.content.trim() }];
  }),
);

const warnings = [];
const conflicts = [];
const unresolved = [];
const assets = [];
const longCopy = [];

function legacyRecord(row) {
  const slug = valueFrom(row, 'Slug');
  const name = valueFrom(row, 'Name');
  if (!slug || !name) return null;
  const status = migrateStatus(row);
  if (status.conflict) conflicts.push({ slug, scope: 'status', message: status.conflict });
  const type = normalizeLegacyType(valueFrom(row, 'Game Type'));
  if (!type) unresolved.push({ slug, field: 'game_type', value: valueFrom(row, 'Game Type') });
  if (type === 'instant') warnings.push({ slug, code: 'NEEDS_CRASH_INSTANT_REVIEW', message: 'Legacy Instant type was preserved and requires manual review.' });
  const rtp = parseRtp(valueFrom(row, 'RTP', 'card 1 description', 'Card 1 Description'));
  const maxWin = parseMaxWin(valueFrom(row, 'Max Win', 'card 2 description', 'Card 2 Description'));
  if (maxWin && !maxWin.unit) warnings.push({ slug, code: 'MISSING_MAX_WIN_UNIT', message: 'Max win has a value but no confirmed unit.' });
  const bet = parseBet(valueFrom(row, 'Bet', 'card 4 description', 'Card 4 Description'));
  const demo = parseDemo(valueFrom(row, 'Play Link', 'Iframe'));
  if (demo.warning) warnings.push({ slug, code: 'DEMO_REVIEW', message: demo.warning });
  if (!valueFrom(row, 'Play Link', 'Iframe')) warnings.push({ slug, code: 'MISSING_PLAY_LINK', message: 'No legacy demo link.' });
  const overview = valueFrom(row, 'Overview') ?? '';
  const card = valueFrom(row, 'Game Cover');
  const hero = valueFrom(row, 'hero cover', 'Hero Cover');
  return {
    legacy_webflow_id: valueFrom(row, 'Item ID', '_id'),
    legacy_source_url: valueFrom(row, 'Legacy Source URL', 'Link'),
    internal_name: name,
    slug,
    release_status: status.value,
    sort_order: Number(valueFrom(row, 'order', 'Order') ?? 100),
    game_type: type,
    rtp_mode: rtp?.mode ?? null,
    rtp: rtp?.value ?? null,
    volatility: parseVolatility(valueFrom(row, 'Volatility', 'card 3 description', 'Card 3 Description')),
    max_win_value: maxWin?.value ?? null,
    max_win_unit: maxWin?.unit ?? null,
    max_win_approx: maxWin?.approx ?? false,
    bet_min: bet?.min ?? null,
    bet_max: bet?.max ?? null,
    demo_enabled: demo.enabled,
    demo_mode: demo.config?.mode ?? null,
    demo_game_id: demo.config?.gameId ?? null,
    direct_build: demo.config?.build ?? null,
    direct_version: demo.config?.version ?? null,
    api_host: demo.config?.apiHost ?? null,
    card_image: card,
    hero_image: hero,
    translation: {
      display_name: name,
      short_description: valueFrom(row, 'Short Description') ?? firstParagraph(overview),
      overview,
      main_feature: valueFrom(row, 'Main Feature', 'card 5 description', 'Card 5 Description'),
      layout_display: valueFrom(row, 'Layout', 'card 6 description', 'Card 6 Description'),
      seo_title: valueFrom(row, 'SEO Title') ?? `${name} game by Ace Games`,
      seo_description: valueFrom(row, 'SEO Description') ?? firstParagraph(overview),
      card_alt: valueFrom(row, 'Card Alt') ?? `${name} game card artwork`,
      hero_alt: valueFrom(row, 'Hero Alt') ?? `${name} game hero artwork`,
    },
    row,
  };
}

const legacyRecords = new Map(rows.map(legacyRecord).filter(Boolean).map((record) => [record.slug, record]));
const allSlugs = [...new Set([...currentRecords.keys(), ...legacyRecords.keys()])].sort();
const output = { locales: [{ code: 'en', name: 'English', native_name: 'English', is_default: true, is_active: true, sort_order: 1, fallback_locale: null, direction: 'ltr', hreflang: 'en' }], games: [], game_translations: [], game_sections: [], game_section_translations: [], game_section_items: [], game_section_item_translations: [], game_gallery: [], game_gallery_translations: [] };

for (const slug of allSlugs) {
  const current = currentRecords.get(slug);
  const legacy = legacyRecords.get(slug);
  if (current && legacy) {
    const currentComparable = { internal_name: current.name, release_status: current.status, sort_order: current.order, game_type: current.type, rtp: current.specs?.rtp, volatility: current.specs?.volatility, max_win_value: current.specs?.maxWin?.value, max_win_unit: current.specs?.maxWin?.unit, bet_min: current.specs?.bet?.min, bet_max: current.specs?.bet?.max, demo_enabled: Boolean(current.demo) };
    const differences = compareRecords(currentComparable, legacy, ['internal_name', 'release_status', 'sort_order', 'game_type', 'rtp', 'volatility', 'max_win_value', 'max_win_unit', 'bet_min', 'bet_max', 'demo_enabled']);
    if (differences.length) conflicts.push({ slug, scope: 'parity', resolution: 'Astro retained', differences });
  }

  const id = deterministicUuid(`game:${slug}`);
  const source = current ? {
    internal_name: current.name,
    slug,
    release_status: current.status,
    sort_order: current.order ?? 100,
    game_type: current.type,
    rtp_mode: current.specs?.rtp === 'configurable' ? 'configurable' : 'fixed',
    rtp: typeof current.specs?.rtp === 'number' ? current.specs.rtp : null,
    volatility: current.specs?.volatility ?? [],
    max_win_value: current.specs?.maxWin?.value ?? null,
    max_win_unit: current.specs?.maxWin?.unit ?? null,
    max_win_approx: current.specs?.maxWin?.approx ?? false,
    bet_min: current.specs?.bet?.min ?? null,
    bet_max: current.specs?.bet?.max ?? null,
    demo_enabled: Boolean(current.demo),
    demo_mode: current.demo?.mode ?? null,
    demo_game_id: current.demo?.mode === 'adapter' ? current.demo.gameId : null,
    direct_build: current.demo?.mode === 'direct' ? current.demo.build : null,
    direct_version: current.demo?.mode === 'direct' ? current.demo.version : null,
    api_host: current.demo?.mode === 'direct' ? current.demo.apiHost ?? null : null,
    legacy_webflow_id: legacy?.legacy_webflow_id ?? null,
    legacy_source_url: legacy?.legacy_source_url ?? null,
  } : legacy;
  if (!source) continue;
  const game = { id, ...Object.fromEntries(Object.entries(source).filter(([key]) => !['translation', 'row', 'card_image', 'hero_image'].includes(key))), card_image: null, hero_image: null, card_background_image: null, card_logo_image: null };
  output.games.push(game);

  const translationId = deterministicUuid(`game-translation:${slug}:en`);
  const currentContent = current ? splitMarkdownSections(current.overview) : null;
  const translation = current ? {
    display_name: current.name,
    short_description: current.seo?.description ?? firstParagraph(current.overview),
    overview: currentContent.intro,
    main_feature: current.specs?.mainFeature ?? null,
    layout_display: current.specs?.layout ?? null,
    seo_title: current.seo?.title,
    seo_description: current.seo?.description,
    card_alt: `${current.name} game card artwork`,
    hero_alt: `${current.name} game hero artwork`,
  } : legacy.translation;
  output.game_translations.push({ id: translationId, game_id: id, locale: 'en', translation_status: 'draft', ...translation });
  longCopy.push({ owner: slug, field: 'overview', value: translation.overview });

  const richSections = currentContent
    ? currentContent.sections
    : [1, 2].map((number) => ({ heading: valueFrom(legacy?.row ?? {}, `Description ${String(number).padStart(2, '0')} Title`, `Description ${number} Title`), body: valueFrom(legacy?.row ?? {}, `Description ${String(number).padStart(2, '0')}`, `Description ${number}`) })).filter((section) => section.body);
  for (const [index, section] of richSections.entries()) {
    const richId = deterministicUuid(`section:${slug}:rich:${index}`);
    output.game_sections.push({ id: richId, game_id: id, section_type: 'rich_text', detail_slot: 'additional', sort_order: (index + 1) * 10, enabled: true, media_file: null, style_preset: 'default' });
    output.game_section_translations.push({ id: deterministicUuid(`section-translation:${slug}:rich:${index}:en`), section_id: richId, locale: 'en', heading: section.heading ?? null, body_markdown: section.body, translation_status: 'draft' });
  }

  const features = current?.features ?? [1, 2, 3].map((number) => ({ title: valueFrom(legacy?.row ?? {}, `Card ${String(number).padStart(2, '0')} Title`, `Card ${number} Title`), body: valueFrom(legacy?.row ?? {}, `Card ${String(number).padStart(2, '0')} Text`, `Card ${number} Text`) })).filter((feature) => feature.title || feature.body);
  for (const [index, feature] of features.entries()) {
    const featureSectionId = deterministicUuid(`section:${slug}:features`);
    if (!output.game_sections.some((section) => section.id === featureSectionId)) {
      output.game_sections.push({ id: featureSectionId, game_id: id, section_type: 'feature_grid', detail_slot: 'sidebar_features', sort_order: 20, enabled: true, media_file: null, style_preset: 'default' });
      output.game_section_translations.push({ id: deterministicUuid(`section-translation:${slug}:features:en`), section_id: featureSectionId, locale: 'en', heading: 'Features', body_markdown: null, translation_status: 'draft' });
    }
    const itemId = deterministicUuid(`section-item:${slug}:feature:${index}`);
    output.game_section_items.push({ id: itemId, section_id: featureSectionId, sort_order: (index + 1) * 10, enabled: true, icon_file: null, image_file: null });
    output.game_section_item_translations.push({ id: deterministicUuid(`section-item-translation:${slug}:feature:${index}:en`), item_id: itemId, locale: 'en', title: feature.title ?? null, text: feature.body ?? null, translation_status: 'draft' });
  }

  const bullets = current?.highlights ?? [1, 2, 3, 4].map((number) => valueFrom(legacy?.row ?? {}, `List Item ${String(number).padStart(2, '0')}`, `List Item ${number}`)).filter(Boolean);
  for (const [index, bullet] of bullets.entries()) {
    const bulletSectionId = deterministicUuid(`section:${slug}:highlights`);
    if (!output.game_sections.some((section) => section.id === bulletSectionId)) {
      output.game_sections.push({ id: bulletSectionId, game_id: id, section_type: 'bullet_list', detail_slot: 'sidebar_features', sort_order: 30, enabled: true, media_file: null, style_preset: 'default' });
      output.game_section_translations.push({ id: deterministicUuid(`section-translation:${slug}:highlights:en`), section_id: bulletSectionId, locale: 'en', heading: 'Highlights', body_markdown: null, translation_status: 'draft' });
    }
    const itemId = deterministicUuid(`section-item:${slug}:highlight:${index}`);
    output.game_section_items.push({ id: itemId, section_id: bulletSectionId, sort_order: (index + 1) * 10, enabled: true, icon_file: null, image_file: null });
    output.game_section_item_translations.push({ id: deterministicUuid(`section-item-translation:${slug}:highlight:${index}:en`), item_id: itemId, locale: 'en', title: null, text: bullet, translation_status: 'draft' });
  }

  for (const role of ['card', 'hero']) {
    const currentSource = current?.[role] ?? null;
    const legacySource = legacy?.[`${role}_image`] ?? null;
    if (currentSource) assets.push({ key: `${slug}:${role}`, game_slug: slug, role, source: normalizeAstroAsset(currentSource), source_type: 'astro', preferred: true, cms_asset_id: null, status: 'pending' });
    else if (legacySource) assets.push({ key: `${slug}:${role}`, game_slug: slug, role, source: legacySource, source_type: 'legacy_url', preferred: true, cms_asset_id: null, status: 'pending' });
    else unresolved.push({ slug, field: `${role}_image`, value: null });
  }

  if (current?.cardLayers?.background) assets.push({ key: `${slug}:card-background`, game_slug: slug, role: 'card_background', source: normalizeAstroAsset(current.cardLayers.background), source_type: 'astro', preferred: true, cms_asset_id: null, status: 'pending' });
  if (current?.cardLayers?.logo) assets.push({ key: `${slug}:card-logo`, game_slug: slug, role: 'card_logo', source: normalizeAstroAsset(current.cardLayers.logo), source_type: 'astro', preferred: true, cms_asset_id: null, status: 'pending' });

  const gallerySources = current?.gallery?.map((item) => ({ source: item.image, alt: item.alt })) ?? [];
  for (let index = 1; index <= 20; index += 1) {
    const source = legacy ? valueFrom(legacy.row, `image slide ${String(index).padStart(2, '0')}`, `image slide ${index}`) : null;
    if (source && !gallerySources.some((item) => item.source === source)) gallerySources.push({ source, alt: `${translation.display_name} gallery image ${index}` });
  }
  for (const [index, item] of gallerySources.entries()) {
    const galleryId = deterministicUuid(`gallery:${slug}:${index}`);
    output.game_gallery.push({ id: galleryId, game_id: id, file: null, sort_order: (index + 1) * 10, enabled: true });
    output.game_gallery_translations.push({ id: deterministicUuid(`gallery-translation:${slug}:${index}:en`), gallery_id: galleryId, locale: 'en', alt: item.alt, caption: null, translation_status: 'draft' });
    const remote = /^https?:/i.test(item.source);
    assets.push({ key: `${slug}:gallery:${index}`, game_slug: slug, role: 'gallery', source: remote ? item.source : normalizeAstroAsset(item.source), source_type: remote ? 'legacy_url' : 'astro', preferred: true, cms_asset_id: null, status: 'pending', target_id: galleryId });
  }
}

warnings.push(...findDuplicateValues(longCopy).map((item) => ({ code: 'DUPLICATE_LONG_COPY', message: `${item.first} and ${item.second} share identical ${item.field}` })));
const duplicateAssets = findDuplicateValues(assets.map((asset) => ({ owner: asset.game_slug, field: asset.role, value: asset.source })), 1);
warnings.push(...duplicateAssets.map((item) => ({ code: 'DUPLICATE_ASSET', message: `${item.first} and ${item.second} reference the same ${item.field} asset` })));

fs.mkdirSync(outputDirectory, { recursive: true });
const writeJson = (name, value) => fs.writeFileSync(path.join(outputDirectory, name), `${JSON.stringify(value, null, 2)}\n`);
writeJson('cms-import.json', output);
writeJson('assets-manifest.json', assets);
writeJson('conflicts.json', conflicts);
writeJson('warnings.json', warnings);
writeJson('unresolved.json', unresolved);
const report = `# Ace Games CMS migration report\n\nGenerated: ${new Date().toISOString()}\n\n- Games: ${output.games.length}\n- Conflicts: ${conflicts.length}\n- Warnings: ${warnings.length}\n- Unresolved fields: ${unresolved.length}\n- Assets queued: ${assets.length}\n\nNothing was published or uploaded. Review every JSON report before importing.\n`;
fs.writeFileSync(path.join(outputDirectory, 'report.md'), report);
console.log(report);
console.log(`Migration package written to ${outputDirectory}`);
