import fs from 'node:fs';
import path from 'node:path';
import { createTokenClient } from './lib/directus.mjs';
import { collectAssetIds, releaseChecksum, validateReleasePayload } from './lib/release-schema.mjs';
import { loadCmsEnv, requiredEnv } from './lib/env.mjs';

loadCmsEnv();
const releaseId = requiredEnv('CMS_RELEASE_ID');
const client = await createTokenClient('CMS_BUILD_TOKEN');
const release = await client.get(`/items/content_releases/${encodeURIComponent(releaseId)}?fields=id,version,status,payload,checksum,is_active,deploy_status`);
if (!['validating', 'deploying', 'published'].includes(release.status)) throw new Error(`Release ${releaseId} is not buildable: ${release.status}`);
const { payload, warnings } = validateReleasePayload(release.payload);
const checksum = releaseChecksum(payload);
if (checksum !== release.checksum) throw new Error(`Release ${releaseId} checksum mismatch.`);

const root = process.cwd();
const output = path.resolve(root, 'src', 'generated', 'cms');
const allowedRoot = path.resolve(root, 'src', 'generated', 'cms');
if (output !== allowedRoot) throw new Error('Refusing to replace an unexpected generated directory.');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, 'site'), { recursive: true });
fs.mkdirSync(path.join(output, 'games'), { recursive: true });
fs.mkdirSync(path.join(output, 'assets'), { recursive: true });

const contentTypeExtension = { 'image/avif': '.avif', 'image/gif': '.gif', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/svg+xml': '.svg', 'image/webp': '.webp' };
const assetManifest = {};
for (const id of collectAssetIds(payload)) {
  const response = await fetch(`${client.url}/assets/${id}`, { headers: { Authorization: `Bearer ${client.token}` } });
  if (!response.ok) throw new Error(`CMS media ${id} could not be downloaded: ${response.status}`);
  const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
  const extension = contentTypeExtension[contentType];
  if (!extension) throw new Error(`CMS media ${id} has unsupported type ${contentType}`);
  const filename = `${id}${extension}`;
  fs.writeFileSync(path.join(output, 'assets', filename), Buffer.from(await response.arrayBuffer()));
  assetManifest[id] = filename;
}

const localizedGames = Object.fromEntries(payload.locales.map((locale) => [locale.code, {}]));
const sharedGames = payload.games.map((game) => {
  const { translations, sections, gallery, ...shared } = game;
  for (const locale of payload.locales) {
    localizedGames[locale.code][game.id] = {
      game: translations.find((translation) => translation.locale === locale.code) ?? null,
      sections: Object.fromEntries(sections.map((section) => [section.id, section.translations.find((translation) => translation.locale === locale.code) ?? null])),
      items: Object.fromEntries(sections.flatMap((section) => section.items.map((item) => [item.id, item.translations.find((translation) => translation.locale === locale.code) ?? null]))),
      gallery: Object.fromEntries(gallery.map((item) => [item.id, item.translations.find((translation) => translation.locale === locale.code) ?? null])),
    };
  }
  return {
    ...shared,
    sections: sections.map(({ translations: ignored, items, ...section }) => ({ ...section, items: items.map(({ translations: itemTranslations, ...item }) => item) })),
    gallery: gallery.map(({ translations: ignored, ...item }) => item),
  };
});

const writeJson = (target, value) => fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
writeJson(path.join(output, 'meta.json'), { release_id: release.id, version: release.version, checksum, generated_at: new Date().toISOString(), locales: payload.locales, warnings, assets: assetManifest });
writeJson(path.join(output, 'games', 'shared.json'), sharedGames);
for (const locale of payload.locales) {
  writeJson(path.join(output, 'site', `${locale.code}.json`), payload.site[locale.code] ?? {});
  writeJson(path.join(output, 'games', `${locale.code}.json`), localizedGames[locale.code]);
}
console.log(`CMS release v${release.version} synchronized. Games: ${sharedGames.length}. Media: ${Object.keys(assetManifest).length}. Warnings: ${warnings.length}.`);
