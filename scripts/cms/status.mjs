import { astroPid, compose, ensureLocalEnv, siteUrl } from './lib/local-stack.mjs';

ensureLocalEnv();

function runningServices() {
  try {
    const result = compose(['ps', '--status', 'running', '--services'], { capture: true, allowFailure: true });
    return new Set(String(result.stdout ?? '').split(/\r?\n/).map((value) => value.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function online(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return response.ok;
  } catch {
    return false;
  }
}

const services = runningServices();
const directus = services.has('directus') && await online('http://localhost:8055/server/health');
const astro = Boolean(astroPid()) && await online(siteUrl());

console.log(`PostgreSQL    ${services.has('database') ? 'Running' : 'Stopped'}`);
console.log(`Directus      ${directus ? 'Running' : 'Stopped'}`);
console.log(`Astro         ${astro ? 'Running' : 'Stopped'}`);
console.log('\nCMS:\nhttp://localhost:8055');
console.log(`\nSite:\n${siteUrl()}`);
console.log(`\nContent mode:\n${directus && astro ? 'LIVE CMS' : 'Not running'}`);
