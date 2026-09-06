import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createAdminClient } from './lib/directus.mjs';

const root = process.cwd();
const output = path.join(root, 'cms', 'migration-output', 'sandbox');
const client = await createAdminClient();
const existing = await client.get('/items/games?aggregate[count]=id&limit=1');
const count = Number(existing?.[0]?.count?.id ?? existing?.[0]?.count ?? 0);

if (count >= 24) {
  console.log(`Sandbox game seed preserved ${count} existing CMS games.`);
  process.exit(0);
}
if (count > 0) throw new Error(`Sandbox contains only ${count} games. Refusing to overwrite a partial/non-empty database. Run the explicit cms:reset command, then cms:setup.`);

function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('scripts/cms/migrate-webflow.mjs', ['--local-only', '--out', output]);

const importPath = path.join(output, 'cms-import.json');
const payload = JSON.parse(fs.readFileSync(importPath, 'utf8'));
for (const collection of [
  'game_translations',
  'game_section_translations',
  'game_section_item_translations',
  'game_gallery_translations',
]) {
  for (const row of payload[collection] ?? []) row.translation_status = 'approved';
}
for (const game of payload.games ?? []) game.published_slug = game.slug;
fs.writeFileSync(importPath, `${JSON.stringify(payload, null, 2)}\n`);

run('scripts/cms/migrate-assets.mjs', ['--manifest', path.join(output, 'assets-manifest.json'), '--admin', '--apply']);
run('scripts/cms/import-migration.mjs', ['--file', importPath, '--admin', '--apply']);

const games = await client.get('/items/games?aggregate[count]=id');
console.log(`Sandbox seed complete: ${games?.[0]?.count?.id ?? 0} current Ace Games records.`);
