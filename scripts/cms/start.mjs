import { printReady, startAstro, startContainers } from './lib/local-stack.mjs';

await startContainers();
await startAstro();
printReady();
