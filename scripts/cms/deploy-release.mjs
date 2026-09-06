import { spawnSync } from 'node:child_process';
import { loadCmsEnv, requiredEnv } from './lib/env.mjs';
import { signature, stableJson } from '../../cms/extensions/ace-release-workflow/dist/release-core.js';

loadCmsEnv();
const releaseId = requiredEnv('CMS_RELEASE_ID');
const cmsUrl = requiredEnv('CMS_URL').replace(/\/$/, '');
const secret = requiredEnv('DEPLOY_WEBHOOK_SECRET');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const output = [];

function run(name, args) {
  const result = spawnSync(npmCommand, args, { encoding: 'utf8', env: { ...process.env, CONTENT_SOURCE: 'cms' } });
  output.push(`$ npm ${args.join(' ')}\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  if (result.status !== 0) throw new Error(`${name} failed with exit code ${result.status ?? 'unknown'}.`);
}

async function callback(body) {
  const response = await fetch(`${cmsUrl}/ace-releases/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Ace-Signature': signature(body, secret) },
    body: stableJson(body),
  });
  if (!response.ok) throw new Error(`CMS callback failed (${response.status}): ${await response.text()}`);
}

try {
  run('CMS synchronization', ['run', 'cms:sync']);
  run('Astro check', ['run', 'check']);
  run('production gates', ['run', 'ship']);
  await callback({ release_id: releaseId, status: 'success', deploy_id: process.env.DEPLOY_ID ?? null, deploy_url: process.env.DEPLOY_URL ?? null });
  console.log(`Release ${releaseId} passed synchronization, Astro check and all production gates.`);
} catch (error) {
  const errorLog = `${String(error.message ?? error)}\n\n${output.join('\n').slice(-9000)}`;
  try {
    await callback({ release_id: releaseId, status: 'failed', deploy_id: process.env.DEPLOY_ID ?? null, deploy_url: process.env.DEPLOY_URL ?? null, error_log: errorLog });
  } catch (callbackError) {
    console.error(`Release failure callback also failed: ${callbackError.message ?? callbackError}`);
  }
  console.error(errorLog);
  process.exit(1);
}
