import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { loadCmsEnv } from './env.mjs';

export const root = process.cwd();
export const cmsDirectory = path.join(root, 'cms');
export const composeFile = path.join(cmsDirectory, 'docker-compose.yml');
export const envFile = path.join(cmsDirectory, '.env');
const runtimeDirectory = path.join(cmsDirectory, 'data');
const pidFile = path.join(runtimeDirectory, 'astro.pid');
const logFile = path.join(runtimeDirectory, 'astro.log');
const siteUrlFile = path.join(runtimeDirectory, 'site-url.txt');

function randomSecret(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function ensureLocalEnv() {
  if (fs.existsSync(envFile)) {
    loadCmsEnv(root);
    return false;
  }
  const password = randomSecret(18);
  const lines = [
    '# Generated locally by npm run cms:setup. Never commit this file.',
    'CONTENT_SOURCE=cms',
    'CMS_CONTENT_MODE=live',
    'CMS_LIVE_MODE=true',
    'CMS_LIVE_CACHE_SECONDS=5',
    'CMS_URL=http://localhost:8055',
    'POSTGRES_DB=ace_cms',
    'POSTGRES_USER=ace_cms',
    `POSTGRES_PASSWORD=${randomSecret(24)}`,
    `DIRECTUS_KEY=${randomSecret(32)}`,
    `DIRECTUS_SECRET=${randomSecret(48)}`,
    'DIRECTUS_ADMIN_EMAIL=admin@acegames.local',
    `DIRECTUS_ADMIN_PASSWORD=${password}`,
    'STORAGE_DRIVER=local',
    'STORAGE_REGION=auto',
    'DEPLOY_WEBHOOK_URL=',
    'DEPLOY_WEBHOOK_SECRET=',
    'ACE_TRUSTED_PUBLISHERS=admin@acegames.local',
    '',
  ];
  fs.writeFileSync(envFile, lines.join('\n'), { encoding: 'utf8', mode: 0o600 });
  loadCmsEnv(root);
  return true;
}

export function ensureDocker() {
  const version = spawnSync('docker', ['--version'], { encoding: 'utf8', windowsHide: true });
  if (version.error || version.status !== 0) {
    throw new Error('Docker Desktop is not installed. Install and start Docker Desktop with the WSL 2 backend, then run npm run cms:setup.');
  }
  const info = spawnSync('docker', ['info'], { encoding: 'utf8', windowsHide: true });
  if (info.status !== 0) {
    throw new Error('Docker Desktop is installed but not running. Start Docker Desktop, wait until Engine running, then run npm run cms:setup.');
  }
}

export function compose(args, options = {}) {
  const result = spawnSync('docker', ['compose', '--env-file', envFile, '-f', composeFile, ...args], {
    cwd: cmsDirectory,
    env: { ...process.env, ...loadCmsEnv(root) },
    encoding: options.capture ? 'utf8' : undefined,
    stdio: options.capture ? 'pipe' : 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0 && !options.allowFailure) throw new Error(`docker compose ${args.join(' ')} failed.`);
  return result;
}

export async function waitForUrl(url, timeoutMs = 120_000) {
  const started = Date.now();
  let lastError = '';
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok) return response;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

export async function startContainers() {
  ensureDocker();
  ensureLocalEnv();
  compose(['up', '-d']);
  await waitForUrl(`${process.env.CMS_URL ?? 'http://localhost:8055'}/server/health`);
}

function readPid() {
  if (!fs.existsSync(pidFile)) return null;
  const value = Number(fs.readFileSync(pidFile, 'utf8').trim());
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function isProcessRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function astroPid() {
  const pid = readPid();
  if (pid && isProcessRunning(pid)) return pid;
  if (fs.existsSync(pidFile)) fs.rmSync(pidFile, { force: true });
  return null;
}

export async function startAstro() {
  ensureLocalEnv();
  const existing = astroPid();
  if (existing) return existing;
  fs.mkdirSync(runtimeDirectory, { recursive: true });
  const selectedSiteUrl = await chooseSiteUrl();
  const selectedPort = new URL(selectedSiteUrl).port || '4321';
  fs.writeFileSync(siteUrlFile, selectedSiteUrl);
  const log = fs.openSync(logFile, 'a');
  const astroCli = path.join(root, 'node_modules', 'astro', 'astro.js');
  if (!fs.existsSync(astroCli)) throw new Error('Astro is not installed. Run npm install first.');
  const child = spawn(process.execPath, [astroCli, 'dev', '--host', '127.0.0.1', '--port', selectedPort], {
    cwd: root,
    detached: true,
    stdio: ['ignore', log, log],
    env: {
      ...process.env,
      ...loadCmsEnv(root),
      CONTENT_SOURCE: 'cms',
      CMS_CONTENT_MODE: 'live',
      CMS_LIVE_MODE: 'true',
    },
    windowsHide: true,
  });
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid));
  await waitForUrl(selectedSiteUrl, 60_000);
  return child.pid;
}

function portIsFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen({ host: '127.0.0.1', port }, () => server.close(() => resolve(true)));
  });
}

async function chooseSiteUrl() {
  const preferred = siteUrl();
  const preferredPort = Number(new URL(preferred).port || 4321);
  if (await portIsFree(preferredPort)) return `http://localhost:${preferredPort}`;
  for (let port = 4321; port <= 4330; port += 1) {
    if (await portIsFree(port)) return `http://localhost:${port}`;
  }
  throw new Error('No free Astro port was found in 4321-4330. Stop an existing dev server and run npm run cms:start again.');
}

export function siteUrl() {
  if (fs.existsSync(siteUrlFile)) return fs.readFileSync(siteUrlFile, 'utf8').trim();
  return 'http://localhost:4321';
}

export function stopAstro() {
  const pid = astroPid();
  if (!pid) return false;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    process.kill(-pid, 'SIGTERM');
  }
  fs.rmSync(pidFile, { force: true });
  return true;
}

export function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...process.env, ...loadCmsEnv(root) },
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`${script} failed.`);
}

export function printReady() {
  console.log('\nAce CMS ready\n');
  console.log('CMS:\nhttp://localhost:8055\n');
  console.log(`Website:\n${siteUrl()}\n`);
  console.log(`Admin:\n${process.env.DIRECTUS_ADMIN_EMAIL ?? 'see cms/.env'}\n`);
  console.log('The local password is stored only in cms/.env. Run npm run cms:credentials to display it.');
}
