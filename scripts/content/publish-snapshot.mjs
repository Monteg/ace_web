import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';
import { googleToken } from './google-token.mjs';
import { assertSnapshotSchema, CONTENT_LOCALES, mediaCacheKey, normalize, parseDriveReference, parseVolatility, sha256 } from './lib.mjs';

const ROOT = process.cwd();
const args = {};
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index];
  if (!arg.startsWith('--')) continue;
  const next = argv[index + 1];
  args[arg.slice(2)] = next && !next.startsWith('--') ? next : true;
  if (next && !next.startsWith('--')) index += 1;
}
const allowedMime = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml']);
const extensionByMime = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif', 'image/svg+xml': 'svg' };
const maxImageBytes = 20 * 1024 * 1024;

async function googleAccessToken() {
  return (await googleToken(['https://www.googleapis.com/auth/drive.readonly'])).token;
}

async function driveFile(fileId, token) {
  const headers = { authorization: `Bearer ${token}` };
  const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,md5Checksum,modifiedTime`, { headers });
  if (!metadataResponse.ok) throw new Error(`Drive metadata failed for ${fileId}: ${metadataResponse.status}`);
  const metadata = await metadataResponse.json();
  const mediaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, { headers });
  if (!mediaResponse.ok) throw new Error(`Drive download failed for ${fileId}: ${mediaResponse.status}`);
  return { bytes: Buffer.from(await mediaResponse.arrayBuffer()), mimeType: metadata.mimeType, source: metadata };
}

async function loadSnapshot() {
  if (args.snapshot) return JSON.parse(await readFile(path.resolve(ROOT, args.snapshot), 'utf8'));
  if (!args['snapshot-file']) throw new Error('Use --snapshot <file> or --snapshot-file <Google Drive ID>');
  const token = await googleAccessToken();
  const file = await driveFile(args['snapshot-file'], token);
  return JSON.parse(file.bytes.toString('utf8'));
}

async function importImage(reference, slug, role, tokenRef) {
  const parsed = parseDriveReference(reference);
  if (!parsed) return '';
  if (parsed.kind === 'project') return parsed.path;

  let bytes;
  let mimeType;
  let source;
  if (parsed.kind === 'drive') {
    tokenRef.value ||= await googleAccessToken();
    ({ bytes, mimeType, source } = await driveFile(parsed.id, tokenRef.value));
  } else {
    const response = await fetch(parsed.url, { redirect: 'follow' });
    if (!response.ok) throw new Error(`${slug}/${role}: image download failed with ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    mimeType = (response.headers.get('content-type') ?? '').split(';')[0].toLowerCase();
    source = { url: parsed.url, modifiedTime: response.headers.get('last-modified') ?? '' };
  }
  if (bytes.length > maxImageBytes) throw new Error(`${slug}/${role}: image exceeds 20 MB`);
  if (!allowedMime.has(mimeType)) throw new Error(`${slug}/${role}: unsupported MIME ${mimeType || 'unknown'}`);
  const metadata = await sharp(bytes, { failOn: 'error' }).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`${slug}/${role}: image dimensions could not be read`);
  const digest = mediaCacheKey(bytes, mimeType).slice(0, 12);
  const extension = extensionByMime[mimeType];
  const assetDir = path.join(ROOT, 'src', 'assets', 'content', slug);
  const filename = `${role}-${digest}.${extension}`;
  await mkdir(assetDir, { recursive: true });
  await writeFile(path.join(assetDir, filename), bytes, { flag: 'wx' }).catch((error) => {
    if (error.code !== 'EEXIST') throw error;
  });
  return { reference: `../../assets/content/${slug}/${filename}`, digest, mimeType, width: metadata.width, height: metadata.height, source };
}

function localeMaps(snapshot) {
  const site = Object.fromEntries(CONTENT_LOCALES.map((locale) => [locale, {}]));
  const games = Object.fromEntries(CONTENT_LOCALES.map((locale) => [locale, {}]));
  for (const row of snapshot.siteTranslations) {
    for (const locale of CONTENT_LOCALES) {
      const value = normalize(row[locale]);
      if (value) site[locale][row.key] = value;
    }
  }
  for (const row of snapshot.gameTranslations) {
    for (const locale of CONTENT_LOCALES) {
      games[locale][row.slug] ||= {};
      const value = normalize(row[locale]);
      if (value) games[locale][row.slug][row.fieldKey] = value;
    }
  }
  return { site, games };
}

function englishGameText(rows) {
  return Object.fromEntries(rows.map((row) => [row.fieldKey, normalize(row.en)]));
}

function markdownBody(fields) {
  const sections = [
    ['overview', ''],
    ['gameplay', 'Core Gameplay'],
    ['main_feature_body', 'Main Feature'],
    ['bonus', 'Bonus Spins & Bonus Game'],
    ['multiplier', 'Multiple Payline Wins'],
    ['design_atmosphere', 'Design & Atmosphere'],
  ];
  return sections.flatMap(([key, heading]) => {
    const value = normalize(fields[key]);
    if (!value) return [];
    return heading ? [`## ${heading}`, '', value] : [value];
  }).join('\n\n').trim();
}

async function updateGameSource(row, imported, fields) {
  const filename = path.join(ROOT, 'src', 'content', 'games', `${row.slug}.md`);
  const parsed = matter(await readFile(filename, 'utf8'));
  const data = parsed.data;
  data.name = fields.display_name;
  data.seo = { title: fields.seo_title, description: fields.seo_description };
  data.status = row.status;
  data.order = Number(row.order);
  data.type = row.type;
  data.specs.rtp = row.rtp === 'configurable' ? 'configurable' : Number(row.rtp);
  data.specs.volatility = parseVolatility(row.volatility);
  if (normalize(row.maxWinValue)) data.specs.maxWin = { value: Number(row.maxWinValue), unit: row.maxWinUnit, approx: Boolean(row.maxWinApprox) };
  else delete data.specs.maxWin;
  if (normalize(row.betMin)) data.specs.bet = { min: Number(row.betMin), max: Number(row.betMax) };
  else delete data.specs.bet;
  if (normalize(fields.main_feature_label)) data.specs.mainFeature = fields.main_feature_label;
  else delete data.specs.mainFeature;
  if (normalize(fields.layout_display)) data.specs.layout = fields.layout_display;
  else delete data.specs.layout;
  const demoEnabled = row.demoEnabled === true || String(row.demoEnabled).toLowerCase() === 'true';
  if (!demoEnabled) delete data.demo;
  else data.demo = row.demoMode === 'adapter'
      ? { mode: 'adapter', gameId: row.demoGameId }
      : { mode: 'direct', build: row.demoBuild, version: Number(row.demoVersion), ...(normalize(row.demoApiHost) ? { apiHost: row.demoApiHost } : {}) };
  data.card = imported.cardBackground.reference ?? imported.cardBackground;
  data.hero = imported.heroImage.reference ?? imported.heroImage;
  if (normalize(row.cardLogo)) {
    data.cardLayers = {
      background: imported.cardBackground.reference ?? imported.cardBackground,
      logo: imported.cardLogo.reference ?? imported.cardLogo,
    };
  } else {
    delete data.cardLayers;
  }
  const featureIds = [...new Set(Object.keys(fields).flatMap((key) => key.match(/^features\.([^.]+)\.(?:title|body)$/)?.[1] ?? []))];
  data.features = featureIds.map((id) => ({ title: fields[`features.${id}.title`], body: fields[`features.${id}.body`] })).filter((feature) => feature.title && feature.body);
  await writeFile(filename, matter.stringify(markdownBody(fields), data));
}

async function main() {
  const snapshot = assertSnapshotSchema(await loadSnapshot());
  if (args['validate-only']) {
    console.log(`Snapshot valid: ${snapshot.siteTranslations.length} site strings, ${snapshot.gameTranslations.length} game strings, ${snapshot.games.length} games.`);
    return;
  }
  const tokenRef = { value: '' };
  const mediaManifest = {};
  const textBySlug = snapshot.gameTranslations.reduce((result, row) => {
    (result[row.slug] ||= []).push(row);
    return result;
  }, {});
  for (const row of snapshot.games) {
    const imported = {
      cardBackground: await importImage(row.cardBackground, row.slug, 'card-background', tokenRef),
      heroImage: await importImage(row.heroImage, row.slug, 'hero', tokenRef),
      cardLogo: normalize(row.cardLogo) ? await importImage(row.cardLogo, row.slug, 'card-logo', tokenRef) : '',
    };
    mediaManifest[row.slug] = Object.fromEntries(Object.entries(imported).map(([role, value]) => [role, typeof value === 'string' ? { reference: value } : value]));
    await updateGameSource(row, imported, englishGameText(textBySlug[row.slug] ?? []));
  }

  const { site, games } = localeMaps(snapshot);
  const generatedDir = path.join(ROOT, 'src', 'generated', 'content');
  await mkdir(generatedDir, { recursive: true });
  for (const locale of CONTENT_LOCALES) {
    await writeFile(path.join(generatedDir, `site.${locale}.json`), `${JSON.stringify(site[locale], null, 2)}\n`);
    await writeFile(path.join(generatedDir, `games.${locale}.json`), `${JSON.stringify(games[locale], null, 2)}\n`);
  }
  const shared = Object.fromEntries(snapshot.games.map((row) => [row.slug, row]));
  const manifest = {
    schemaVersion: 1,
    publishedAt: snapshot.publishedAt ?? new Date().toISOString(),
    publishId: snapshot.publishId ?? process.env.PUBLISH_ID ?? process.env.CI_PIPELINE_ID ?? 'local',
    sourceHash: sha256(JSON.stringify(snapshot)),
    locales: CONTENT_LOCALES,
    siteTranslationCount: snapshot.siteTranslations.length,
    gameCount: snapshot.games.length,
    gameTranslationCount: snapshot.gameTranslations.length,
    media: mediaManifest,
  };
  await writeFile(path.join(generatedDir, 'games.shared.json'), `${JSON.stringify(shared, null, 2)}\n`);
  await writeFile(path.join(generatedDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const sheetDir = path.join(ROOT, 'content', 'sheets');
  const secondaryLocales = CONTENT_LOCALES.filter((locale) => locale !== 'en');
  const siteRows = snapshot.siteTranslations.map((row) => ({ ...row, status: secondaryLocales.every((locale) => normalize(row[locale])) ? 'Ready' : 'Missing' }));
  const gameRows = snapshot.games.map((row) => ({ ...row, changed: false, publish: true, statusLabel: 'Published' }));
  const gameTextRows = snapshot.gameTranslations.map((row) => ({ ...row, status: secondaryLocales.every((locale) => normalize(row[locale])) ? 'Ready' : 'Missing' }));
  await writeFile(path.join(sheetDir, 'site-translations.json'), `${JSON.stringify(siteRows, null, 2)}\n`);
  await writeFile(path.join(sheetDir, 'games.json'), `${JSON.stringify(gameRows, null, 2)}\n`);
  await writeFile(path.join(sheetDir, 'game-translations.json'), `${JSON.stringify(gameTextRows, null, 2)}\n`);
  await writeFile(path.join(sheetDir, 'seed.json'), `${JSON.stringify({ siteTranslations: siteRows, games: gameRows, gameTranslations: gameTextRows, manifest }, null, 2)}\n`);
  await mkdir(path.join(ROOT, 'content', 'published'), { recursive: true });
  await writeFile(path.join(ROOT, 'content', 'published', 'snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Published snapshot prepared: ${snapshot.siteTranslations.length} site strings, ${snapshot.gameTranslations.length} game strings, ${snapshot.games.length} games.`);
}

await main();
