import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { LOCALES } from '../../locales.mjs';

const ROOT = process.cwd();
const REQUIRED_FILES = [
  'manifest.json',
  'games.shared.json',
  ...LOCALES.flatMap((locale) => [`site.${locale}.json`, `games.${locale}.json`]),
];

const generatedDir = path.join(ROOT, 'src', 'generated', 'content');
const manifest = JSON.parse(await readFile(path.join(generatedDir, 'manifest.json'), 'utf8'));
const errors = [];

for (const name of REQUIRED_FILES) {
  try {
    JSON.parse(await readFile(path.join(generatedDir, name), 'utf8'));
  } catch (error) {
    errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const siteEn = JSON.parse(await readFile(path.join(generatedDir, 'site.en.json'), 'utf8'));
const gamesEn = JSON.parse(await readFile(path.join(generatedDir, 'games.en.json'), 'utf8'));
const shared = JSON.parse(await readFile(path.join(generatedDir, 'games.shared.json'), 'utf8'));

if (manifest.schemaVersion !== 1) errors.push('manifest.schemaVersion must be 1');
if (JSON.stringify(manifest.locales) !== JSON.stringify(LOCALES)) errors.push('manifest.locales is invalid');
if (Object.keys(siteEn).length !== manifest.siteTranslationCount) errors.push('site EN row count does not match manifest');
if (Object.keys(shared).length !== manifest.gameCount) errors.push('shared game count does not match manifest');

for (const [slug, game] of Object.entries(shared)) {
  if (!['slot', 'instant', 'table'].includes(game.type)) errors.push(`${slug}: invalid game type ${game.type}`);
  if (!['live', 'coming_soon'].includes(game.status)) errors.push(`${slug}: invalid game status ${game.status}`);
  if (!gamesEn[slug]?.display_name) errors.push(`${slug}: missing English display_name`);
  if (!gamesEn[slug]?.seo_title || !gamesEn[slug]?.seo_description) errors.push(`${slug}: missing English SEO`);
  if (!game.cardBackground || !game.heroImage) errors.push(`${slug}: missing required image reference`);
}

if (errors.length) {
  console.error(`Generated content validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Generated content valid: ${manifest.siteTranslationCount} site keys, ${manifest.gameCount} games, ${manifest.gameTranslationCount} game translation rows.`);
