import { compose, ensureDocker, ensureLocalEnv, stopAstro } from './lib/local-stack.mjs';

ensureLocalEnv();
const stoppedSite = stopAstro();
ensureDocker();
compose(['down']);
console.log(`Astro         ${stoppedSite ? 'Stopped' : 'Already stopped'}`);
console.log('PostgreSQL    Stopped');
console.log('Directus      Stopped');
console.log('Named volumes were preserved.');
