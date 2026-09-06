import { spawnSync } from 'node:child_process';

for (const script of ['scripts/cms/apply-schema.mjs', 'scripts/cms/apply-access.mjs']) {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('Ace Games CMS bootstrap complete.');

