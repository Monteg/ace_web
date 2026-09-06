import fs from 'node:fs';
import path from 'node:path';
import { createAdminClient, createTokenClient } from './lib/directus.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const manifestPath = path.resolve(process.cwd(), option('--manifest', 'cms/migration-output/assets-manifest.json'));
const apply = args.includes('--apply');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (!apply) {
  const pending = manifest.filter((asset) => asset.preferred && !asset.cms_asset_id);
  console.log(`Dry run: ${pending.length} preferred assets are ready for migration.`);
  console.log('Re-run with --apply and a scoped CMS_MIGRATION_TOKEN to upload them.');
  process.exit(0);
}

const client = args.includes('--admin') ? await createAdminClient() : await createTokenClient('CMS_MIGRATION_TOKEN');
const uploadedBySource = new Map();
const gamesFolder = (await client.get(`/folders?${new URLSearchParams({ 'filter[name][_eq]': 'Games', 'filter[parent][_null]': 'true', limit: '1' })}`))[0];
if (!gamesFolder) throw new Error('CMS Games media folder is missing. Run npm run cms:bootstrap first.');

async function loadAsset(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Asset download failed: ${response.status} ${source}`);
    return { bytes: await response.arrayBuffer(), type: response.headers.get('content-type') || 'application/octet-stream', name: path.basename(new URL(source).pathname) || 'asset' };
  }
  const absolute = path.resolve(process.cwd(), source);
  if (!fs.existsSync(absolute)) throw new Error(`Local asset does not exist: ${absolute}`);
  const mime = {
    '.avif': 'image/avif',
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  }[path.extname(absolute).toLowerCase()] ?? 'application/octet-stream';
  return { bytes: fs.readFileSync(absolute), type: mime, name: path.basename(absolute) };
}

for (const asset of manifest) {
  if (!asset.preferred || asset.cms_asset_id) continue;
  if (uploadedBySource.has(asset.source)) {
    asset.cms_asset_id = uploadedBySource.get(asset.source);
    asset.status = 'reused';
    continue;
  }
  try {
    const source = await loadAsset(asset.source);
    const form = new FormData();
    form.set('title', `${asset.game_slug} ${asset.role}`);
    form.set('folder', gamesFolder.id);
    form.set('metadata', JSON.stringify({ migration_source: asset.source, migration_key: asset.key }));
    form.set('file', new Blob([source.bytes], { type: source.type }), source.name);
    const response = await fetch(`${client.url}/files`, { method: 'POST', headers: { Authorization: `Bearer ${client.token}` }, body: form });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.errors?.map((error) => error.message).join('; ') || response.statusText);
    asset.cms_asset_id = body.data.id;
    asset.status = 'uploaded';
    uploadedBySource.set(asset.source, body.data.id);
  } catch (error) {
    asset.status = 'failed';
    asset.error = error.message;
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

const failed = manifest.filter((asset) => asset.status === 'failed');
const importPath = path.join(path.dirname(manifestPath), 'cms-import.json');
if (fs.existsSync(importPath)) {
  const migration = JSON.parse(fs.readFileSync(importPath, 'utf8'));
  const gamesBySlug = new Map(migration.games.map((game) => [game.slug, game]));
  const galleryById = new Map(migration.game_gallery.map((item) => [item.id, item]));
  for (const asset of manifest.filter((item) => item.cms_asset_id)) {
    const game = gamesBySlug.get(asset.game_slug);
    if (game && asset.role === 'card') game.card_image = asset.cms_asset_id;
    if (game && asset.role === 'hero') game.hero_image = asset.cms_asset_id;
    if (game && asset.role === 'card_background') game.card_background_image = asset.cms_asset_id;
    if (game && asset.role === 'card_logo') game.card_logo_image = asset.cms_asset_id;
    if (asset.role === 'gallery' && asset.target_id && galleryById.has(asset.target_id)) galleryById.get(asset.target_id).file = asset.cms_asset_id;
  }
  fs.writeFileSync(importPath, `${JSON.stringify(migration, null, 2)}\n`);
}
console.log(`Asset migration complete. Failed: ${failed.length}.`);
if (failed.length) process.exitCode = 1;
