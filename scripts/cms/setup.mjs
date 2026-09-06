import { ensureLocalEnv, printReady, runNode, startAstro, startContainers } from './lib/local-stack.mjs';

const created = ensureLocalEnv();
if (created) console.log('Created private local CMS credentials in cms/.env.');
await startContainers();
runNode('scripts/cms/bootstrap.mjs');
runNode('scripts/cms/seed-sandbox.mjs');
await startAstro();
runNode('scripts/cms/smoke.mjs');
printReady();
