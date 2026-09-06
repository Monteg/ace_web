import { ensureLocalEnv } from './lib/local-stack.mjs';

ensureLocalEnv();
console.log(`CMS: ${process.env.CMS_URL}`);
console.log(`Admin: ${process.env.DIRECTUS_ADMIN_EMAIL}`);
console.log(`Password: ${process.env.DIRECTUS_ADMIN_PASSWORD}`);
