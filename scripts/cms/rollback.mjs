import { createTokenClient } from './lib/directus.mjs';

const index = process.argv.indexOf('--release');
const releaseId = index === -1 ? '' : String(process.argv[index + 1] ?? '');
if (!releaseId) {
  console.error('Usage: npm run cms:rollback -- --release <release-uuid>');
  process.exit(2);
}
const client = await createTokenClient('CMS_MIGRATION_TOKEN');
const result = await client.post('/ace-releases/rollback', { release_id: releaseId, source: 'cli' });
console.log(`Rollback was captured as release v${result.version} and is deploying (${result.id}).`);
