import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const args = process.argv.slice(2);
const argument = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const importPath = path.resolve(process.cwd(), argument('--import', 'cms/migration-output/cms-import.json'));
const assetsPath = path.resolve(process.cwd(), argument('--assets', 'cms/migration-output/assets-manifest.json'));
const reportPath = path.resolve(process.cwd(), argument('--report', 'cms/migration-output/parity.json'));
if (!fs.existsSync(importPath) || !fs.existsSync(assetsPath)) throw new Error('Run cms:migrate before cms:parity.');

const migrated = JSON.parse(fs.readFileSync(importPath, 'utf8'));
const assets = JSON.parse(fs.readFileSync(assetsPath, 'utf8'));
const gameDirectory = path.join(process.cwd(), 'src', 'content', 'games');
const current = fs.readdirSync(gameDirectory).filter((name) => name.endsWith('.md')).map((name) => {
  const source = matter(fs.readFileSync(path.join(gameDirectory, name), 'utf8'));
  return { slug: path.basename(name, '.md'), ...source.data, overview: source.content.trim() };
});
const differences = [];

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])]));
  if (typeof value === 'string') return value.replace(/\r\n/g, '\n').trim();
  return value ?? null;
}

function compare(slug, field, left, right) {
  if (JSON.stringify(normalized(left)) !== JSON.stringify(normalized(right))) differences.push({ slug, field, local: left ?? null, migration: right ?? null });
}

for (const local of current) {
  const game = migrated.games.find((item) => item.slug === local.slug);
  if (!game) {
    differences.push({ slug: local.slug, field: 'game', local: 'present', migration: 'missing' });
    continue;
  }
  const translation = migrated.game_translations.find((item) => item.game_id === game.id && item.locale === 'en');
  const sections = migrated.game_sections.filter((item) => item.game_id === game.id);
  const richText = sections.filter((item) => item.section_type === 'rich_text').sort((a, b) => a.sort_order - b.sort_order).map((section) => migrated.game_section_translations.find((item) => item.section_id === section.id && item.locale === 'en')).filter(Boolean);
  const rebuiltOverview = [translation?.overview, ...richText.map((section) => `${section.heading ? `## ${section.heading}\n\n` : ''}${section.body_markdown ?? ''}`)].filter(Boolean).join('\n\n');
  const featureSection = sections.find((item) => item.section_type === 'feature_grid');
  const featureItems = featureSection ? migrated.game_section_items.filter((item) => item.section_id === featureSection.id).sort((a, b) => a.sort_order - b.sort_order).map((item) => migrated.game_section_item_translations.find((entry) => entry.item_id === item.id && entry.locale === 'en')).map((entry) => ({ title: entry?.title ?? null, body: entry?.text ?? null })) : [];
  const bulletSection = sections.find((item) => item.section_type === 'bullet_list');
  const bulletItems = bulletSection ? migrated.game_section_items.filter((item) => item.section_id === bulletSection.id).sort((a, b) => a.sort_order - b.sort_order).map((item) => migrated.game_section_item_translations.find((entry) => entry.item_id === item.id && entry.locale === 'en')?.text ?? null).filter(Boolean) : [];
  const asset = (role) => assets.find((item) => item.key === `${local.slug}:${role}`)?.source ?? null;
  const localDemo = local.demo ?? null;
  const migratedDemo = !game.demo_enabled ? null : game.demo_mode === 'adapter'
    ? { mode: 'adapter', gameId: game.demo_game_id }
    : { mode: 'direct', build: game.direct_build, version: game.direct_version, ...(game.api_host ? { apiHost: game.api_host } : {}) };

  compare(local.slug, 'name', local.name, game.internal_name);
  compare(local.slug, 'status', local.status, game.release_status);
  compare(local.slug, 'order', local.order ?? 100, game.sort_order);
  compare(local.slug, 'type', local.type, game.game_type);
  compare(local.slug, 'rtp', local.specs?.rtp === 'configurable' ? null : local.specs?.rtp, game.rtp);
  compare(local.slug, 'rtp_mode', local.specs?.rtp === 'configurable' ? 'configurable' : 'fixed', game.rtp_mode);
  compare(local.slug, 'volatility', local.specs?.volatility, game.volatility);
  compare(local.slug, 'max_win', local.specs?.maxWin ?? null, game.max_win_value == null ? null : { value: game.max_win_value, unit: game.max_win_unit, approx: game.max_win_approx });
  compare(local.slug, 'bet', local.specs?.bet ?? null, game.bet_min == null ? null : { min: game.bet_min, max: game.bet_max });
  compare(local.slug, 'main_feature', local.specs?.mainFeature ?? null, translation?.main_feature ?? null);
  compare(local.slug, 'layout', local.specs?.layout ?? null, translation?.layout_display ?? null);
  compare(local.slug, 'demo', localDemo, migratedDemo);
  compare(local.slug, 'card', local.card, asset('card'));
  compare(local.slug, 'hero', local.hero, asset('hero'));
  compare(local.slug, 'overview', local.overview, rebuiltOverview);
  compare(local.slug, 'features', local.features ?? [], featureItems);
  compare(local.slug, 'highlights', local.highlights ?? [], bulletItems);
}

for (const game of migrated.games) {
  if (!current.some((item) => item.slug === game.slug)) differences.push({ slug: game.slug, field: 'game', local: 'missing', migration: 'present' });
}

const report = {
  checked_at: new Date().toISOString(),
  local_games: current.length,
  migrated_games: migrated.games.length,
  fields_checked_per_game: 17,
  differences,
  result: differences.length ? 'review_required' : 'match',
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Parity: ${current.length} local games, ${migrated.games.length} migrated games, ${differences.length} difference(s).`);
console.log(`Report: ${reportPath}`);
if (differences.length) process.exitCode = 1;
