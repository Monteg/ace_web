import { compose, ensureDocker, ensureLocalEnv, stopAstro } from './lib/local-stack.mjs';

if (!process.argv.includes('--confirm-destroy-local-cms')) {
  console.error('Destructive command refused. Re-run: npm run cms:reset -- --confirm-destroy-local-cms');
  process.exit(2);
}
ensureLocalEnv();
ensureDocker();
stopAstro();
compose(['down', '--volumes', '--remove-orphans']);
console.log('Local PostgreSQL and upload volumes were deleted. cms/.env was preserved.');
