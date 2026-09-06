import fs from 'node:fs';
import path from 'node:path';
import { createTokenClient } from './lib/directus.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const packagePath = path.resolve(process.cwd(), option('--file', 'cms/migration-output/cms-import.json'));
const apply = args.includes('--apply');
const input = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const order = ['locales', 'games', 'game_translations', 'game_sections', 'game_section_translations', 'game_section_items', 'game_section_item_translations', 'game_gallery', 'game_gallery_translations'];

if (!apply) {
  for (const collection of order) console.log(`${collection}: ${(input[collection] ?? []).length}`);
  console.log('Dry run only. Re-run with --apply and CMS_MIGRATION_TOKEN after reviewing every report.');
  process.exit(0);
}

const client = await createTokenClient('CMS_MIGRATION_TOKEN');
for (const collection of order) {
  const rows = input[collection] ?? [];
  for (const row of rows) {
    const primaryKey = row.id ?? row.code;
    try {
      await client.get(`/items/${collection}/${encodeURIComponent(primaryKey)}`);
      await client.patch(`/items/${collection}/${encodeURIComponent(primaryKey)}`, row);
    } catch (error) {
      if (error.status !== 403 && error.status !== 404) throw error;
      await client.post(`/items/${collection}`, row);
    }
  }
  console.log(`Imported ${rows.length} ${collection} records as working content.`);
}

console.log('Migration import complete. Nothing was published.');
