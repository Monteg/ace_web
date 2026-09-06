import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createAdminClient } from './lib/directus.mjs';
import { ensureDocker, ensureLocalEnv, siteUrl } from './lib/local-stack.mjs';

ensureLocalEnv();
ensureDocker();

const client = await createAdminClient();
const website = siteUrl();
const suffix = Date.now().toString(36);
const gameId = crypto.randomUUID();
const slug = `cms-test-game-${suffix}`;
const versionKey = `editorial-${suffix}`;
const uploaded = [];
const results = [];
let versionId = null;
let gameCreated = false;
let italianCreated = false;
let italianId = null;
let italianBefore = null;
let piratesBefore = null;

const translationFields = [
  'translation_status', 'display_name', 'short_description', 'overview',
  'main_feature', 'layout_display', 'seo_title', 'seo_description', 'card_alt', 'hero_alt',
];
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const relationId = (value) => value?.id ?? value?.code ?? value;
const pass = (label) => results.push(`${label.padEnd(27)} PASS`);

async function upload(filePath, title, folder) {
  const bytes = fs.readFileSync(filePath);
  const form = new FormData();
  form.set('title', title);
  form.set('folder', folder);
  form.set('file', new Blob([bytes], { type: 'image/webp' }), path.basename(filePath));
  const file = await client.request('/files', { method: 'POST', body: form });
  uploaded.push(file.id);
  return file.id;
}

async function websiteHtml(url, expected, timeoutMs = 20_000) {
  const started = Date.now();
  let detail = 'no response';
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const html = await response.text();
      if (response.ok && (!expected || html.includes(expected))) return html;
      detail = `${response.status}; expected text was not rendered`;
    } catch (error) {
      detail = error.message;
    }
    await wait(1000);
  }
  throw new Error(`Website check failed for ${url}: ${detail}`);
}

function editableTranslation(row) {
  return Object.fromEntries(translationFields.map((field) => [field, row[field] ?? null]));
}

try {
  const folders = await client.get(`/folders?${new URLSearchParams({ 'filter[name][_eq]': 'Games', 'filter[parent][_null]': 'true', limit: '1' })}`);
  if (!folders[0]) throw new Error('Games media folder is missing. Run npm run cms:setup first.');
  const games = await client.get('/items/games?fields=id,slug,internal_name,sort_order,release_status,hero_image,translations.*&limit=-1&sort=sort_order');
  const pirates = games.find((game) => game.slug === 'pirates-rush');
  if (!pirates) throw new Error('Pirates Rush is missing. Run npm run cms:setup first.');
  const piratesEnglish = pirates.translations.find((entry) => relationId(entry.locale) === 'en');
  if (!piratesEnglish) throw new Error('Pirates Rush English translation is missing.');
  piratesBefore = {
    sort_order: pirates.sort_order,
    hero_image: relationId(pirates.hero_image),
  };

  const cardId = await upload(path.resolve('src/assets/games/pirates-rush.webp'), `${slug} card test`, folders[0].id);
  const heroId = await upload(path.resolve('src/assets/heroes/pirates-rush.webp'), `${slug} hero test`, folders[0].id);

  await client.post('/items/games', {
    id: gameId,
    internal_name: 'CMS Test Game',
    slug,
    published_slug: slug,
    release_status: 'coming_soon',
    sort_order: 999,
    game_type: 'slot',
    rtp_mode: 'fixed',
    rtp: 0.945,
    volatility: ['medium'],
    max_win_value: 1000,
    max_win_unit: 'x',
    max_win_approx: false,
    bet_min: 1,
    bet_max: 100,
    demo_enabled: false,
    card_image: cardId,
    hero_image: cardId,
  });
  gameCreated = true;
  await client.post('/items/game_translations', {
    game_id: gameId,
    locale: 'en',
    translation_status: 'approved',
    display_name: 'CMS Test Game',
    short_description: 'Temporary English content used by the automated editorial workflow test.',
    overview: 'Temporary content. It is deleted automatically after the test.',
    seo_title: 'CMS Test Game | Ace Games',
    seo_description: 'Temporary CMS workflow test page.',
    card_alt: 'Temporary CMS test game card',
    hero_alt: 'Temporary CMS test game hero',
  });

  const testGamesHtml = await websiteHtml(`${website}/games`, 'CMS Test Game');
  if (!testGamesHtml.includes('Coming soon')) throw new Error('CMS Test Game does not render its Coming Soon state.');
  const testDetailHtml = await websiteHtml(`${website}/portfolio/${slug}`, 'CMS Test Game');
  if (testDetailHtml.includes('Play the demo') || testDetailHtml.includes('<iframe')) throw new Error('Coming Soon test game unexpectedly exposes Play/demo UI.');
  const homeHtml = await websiteHtml(website, 'CMS Test Game');
  const mathsStart = homeHtml.indexOf('<section id="maths"');
  const mathsEnd = homeHtml.indexOf('</section>', mathsStart);
  if (mathsStart < 0 || homeHtml.slice(mathsStart, mathsEnd).includes('CMS Test Game')) throw new Error('Coming Soon test game leaked into Maths Explorer.');
  pass('Create Coming Soon game');
  pass('Coming Soon behavior');

  await client.patch(`/items/games/${gameId}`, { sort_order: 998, hero_image: heroId });
  const changed = await client.get(`/items/games/${gameId}?fields=id,sort_order,card_image,hero_image`);
  if (Number(changed.sort_order) !== 998 || relationId(changed.card_image) === relationId(changed.hero_image)) throw new Error('Test game order or media update did not persist.');
  pass('Create/reorder/media fields');

  const version = await client.post('/versions', {
    key: versionKey,
    name: 'Automated editorial draft',
    collection: 'games',
    item: gameId,
  });
  versionId = version.id;
  await client.post(`/versions/${versionId}/save`, { internal_name: 'CMS Test Game Published' });
  const beforePromote = await client.get(`/items/games/${gameId}`);
  if (beforePromote.internal_name !== 'CMS Test Game') throw new Error('Save changed Main before Publish/Promote.');
  const comparison = await client.get(`/versions/${versionId}/compare`);
  await client.post(`/versions/${versionId}/promote`, { mainHash: comparison.mainHash });
  const afterPromote = await client.get(`/items/games/${gameId}`);
  if (afterPromote.internal_name !== 'CMS Test Game Published') throw new Error('Publish/Promote did not update Main.');
  pass('Save draft isolation');
  pass('Publish/Promote to Main');

  const existingItalian = pirates.translations.find((entry) => relationId(entry.locale) === 'it');
  if (existingItalian) {
    italianId = existingItalian.id;
    italianBefore = editableTranslation(existingItalian);
  } else {
    const created = await client.post('/items/game_translations', {
      game_id: pirates.id,
      locale: 'it',
      translation_status: 'draft',
      display_name: piratesEnglish.display_name,
      short_description: piratesEnglish.short_description,
      overview: piratesEnglish.overview,
      seo_title: piratesEnglish.seo_title,
      seo_description: piratesEnglish.seo_description,
      card_alt: piratesEnglish.card_alt,
      hero_alt: piratesEnglish.hero_alt,
    });
    italianId = created.id;
    italianCreated = true;
  }
  await client.patch(`/items/game_translations/${italianId}`, {
    translation_status: 'approved',
    display_name: 'Pirates Rush — prova CMS',
    short_description: 'Descrizione italiana pubblicata dal test CMS.',
    overview: 'Panoramica italiana pubblicata dal test CMS.',
  });
  await websiteHtml(`${website}/it/portfolio/pirates-rush`, 'Descrizione italiana pubblicata dal test CMS.');
  await client.patch(`/items/game_translations/${italianId}`, { short_description: '' });
  await websiteHtml(`${website}/it/portfolio/pirates-rush`, piratesEnglish.short_description);
  pass('Italian translation');
  pass('English field fallback');

  const otherLive = games.find((game) => game.slug !== 'pirates-rush' && game.release_status === 'live');
  const newPiratesOrder = Math.min(...games.map((game) => Number(game.sort_order))) - 100;
  await client.patch(`/items/games/${pirates.id}`, { sort_order: newPiratesOrder });
  const reorderedHtml = await websiteHtml(`${website}/games`, piratesEnglish.display_name);
  if (otherLive) {
    const piratesLink = `href="/portfolio/pirates-rush"`;
    const otherLink = `href="/portfolio/${otherLive.slug}"`;
    const piratesPosition = reorderedHtml.indexOf(piratesLink);
    const otherPosition = reorderedHtml.indexOf(otherLink);
    if (piratesPosition < 0 || otherPosition < 0 || piratesPosition > otherPosition) throw new Error('Pirates Rush order did not move ahead of the comparison game.');
  }
  pass('Pirates Rush order');

  await client.patch(`/items/games/${pirates.id}`, { hero_image: heroId });
  const mediaHtml = await websiteHtml(`${website}/portfolio/pirates-rush`, `/assets/${heroId}`);
  if (!mediaHtml.includes(`/assets/${heroId}`)) throw new Error('Pirates Rush test hero was not rendered.');
  const asset = await fetch(`${process.env.CMS_URL}/assets/${heroId}`, { signal: AbortSignal.timeout(5000) });
  if (!asset.ok || !String(asset.headers.get('content-type')).startsWith('image/')) throw new Error('Public Games media delivery failed.');
  pass('Pirates Rush media swap');
  pass('Public media delivery');

  console.log(results.join('\n'));
} finally {
  if (versionId) await client.delete(`/versions/${versionId}`).catch(() => {});
  if (piratesBefore && piratesBefore.hero_image) {
    const pirates = (await client.get(`/items/games?filter[slug][_eq]=pirates-rush&limit=1`).catch(() => []))[0];
    if (pirates) await client.patch(`/items/games/${pirates.id}`, piratesBefore).catch(() => {});
  }
  if (italianId) {
    if (italianCreated) await client.delete(`/items/game_translations/${italianId}`).catch(() => {});
    else if (italianBefore) await client.patch(`/items/game_translations/${italianId}`, italianBefore).catch(() => {});
  }
  if (gameCreated) await client.delete(`/items/games/${gameId}`).catch(() => {});
  for (const fileId of uploaded) await client.delete(`/files/${fileId}`).catch(() => {});
}
