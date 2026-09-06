import { createAdminClient } from './lib/directus.mjs';
import { compose, ensureDocker, ensureLocalEnv, siteUrl } from './lib/local-stack.mjs';
import { resolveTranslation } from './lib/i18n.mjs';

ensureLocalEnv();
ensureDocker();

const database = compose(['exec', '-T', 'database', 'pg_isready', '-U', process.env.POSTGRES_USER ?? 'ace_cms', '-d', process.env.POSTGRES_DB ?? 'ace_cms'], { capture: true, allowFailure: true });
if (database.status !== 0) throw new Error(`PostgreSQL connection failed: ${database.stderr ?? database.stdout}`);

const health = await fetch(`${process.env.CMS_URL}/server/health`);
if (!health.ok) throw new Error(`Directus health failed: ${health.status}`);
const client = await createAdminClient();
const [games, locales, siteStrings, files] = await Promise.all([
  client.get('/items/games?fields=id,slug,internal_name,card_image,hero_image,translations.*&limit=-1&sort=sort_order'),
  client.get('/items/locales?fields=*&limit=-1&sort=sort_order'),
  client.get('/items/site_strings?fields=id,key,translations.*&limit=-1'),
  client.get('/files?aggregate[count]=id'),
]);

const pirates = games.find((game) => game.slug === 'pirates-rush');
if (!pirates) throw new Error('Pirates Rush was not found in CMS.');
const english = pirates.translations?.find((translation) => (translation.locale?.code ?? translation.locale) === 'en');
if (!english?.display_name || english.translation_status !== 'approved') throw new Error('Pirates Rush has no Approved English translation.');
if (!pirates.card_image || !pirates.hero_image) throw new Error('Pirates Rush Card/Hero media relations are incomplete.');
if (!locales.some((locale) => locale.code === 'en') || locales.filter((locale) => locale.is_active).length < 4) throw new Error('Expected EN plus three active sandbox locales.');
if (!siteStrings.length) throw new Error('Website Content is empty.');

const fallback = resolveTranslation({ key: 'pirates.name', locale: 'it', requested: {}, english: { 'pirates.name': english.display_name } });
if (fallback !== english.display_name) throw new Error('English fallback test failed.');

const website = await fetch(`${siteUrl()}/games`, { signal: AbortSignal.timeout(10_000) });
if (!website.ok || !(await website.text()).includes(english.display_name)) throw new Error('Astro live CMS loader did not render Pirates Rush.');
const italian = await fetch(`${siteUrl()}/it/portfolio/pirates-rush`, { signal: AbortSignal.timeout(10_000) });
if (!italian.ok || !(await italian.text()).includes(english.display_name)) throw new Error('Italian route or English fallback failed.');

console.log('PostgreSQL connection     PASS');
console.log('Directus health/auth      PASS');
console.log(`Games query               PASS (${games.length})`);
console.log(`Locales query             PASS (${locales.length})`);
console.log(`Site strings query        PASS (${siteStrings.length})`);
console.log(`Files query               PASS (${files?.[0]?.count?.id ?? 0})`);
console.log('Pirates Rush read/media   PASS');
console.log('English fallback          PASS');
console.log('Astro live CMS loader     PASS');
