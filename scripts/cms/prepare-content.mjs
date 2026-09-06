import { spawnSync } from 'node:child_process';

if ((process.env.CONTENT_SOURCE ?? 'local') !== 'cms') {
  console.log('Content source: local Markdown');
  process.exit(0);
}
const result = spawnSync(process.execPath, ['scripts/cms/sync.mjs'], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
