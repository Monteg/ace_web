import fs from 'node:fs';
import { createTokenClient } from './lib/directus.mjs';

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
};
const all = process.argv.includes('--all');
const selectionFile = argument('--selection');
if (!all && !selectionFile) {
  console.error('Usage: npm run cms:publish -- --all | --selection selections.json');
  process.exit(2);
}
const selections = selectionFile ? JSON.parse(fs.readFileSync(selectionFile, 'utf8')) : {};
const client = await createTokenClient('CMS_MIGRATION_TOKEN');
const result = await client.post('/ace-releases/publish', { publish_all: all, selections, source: 'cli' });
console.log(`Release v${result.version} is deploying (${result.id}).`);
if (result.warnings?.length) console.warn(`${result.warnings.length} fallback warning(s) were recorded.`);
