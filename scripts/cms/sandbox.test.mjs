import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const json = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

test('sandbox exposes the complete one-command lifecycle', () => {
  const scripts = json('package.json').scripts;
  for (const name of ['cms:setup', 'cms:start', 'cms:dev', 'cms:stop', 'cms:status', 'cms:smoke', 'cms:workflow-test', 'cms:reset']) {
    assert.ok(scripts[name], `Missing npm script ${name}.`);
  }
  assert.match(scripts['cms:reset'], /reset\.mjs/);
});

test('PostgreSQL and uploads use persistent named volumes', () => {
  const compose = fs.readFileSync(path.join(root, 'cms', 'docker-compose.yml'), 'utf8');
  assert.match(compose, /ace_cms_db:\/var\/lib\/postgresql\/data/);
  assert.match(compose, /ace_cms_uploads:\/directus\/uploads/);
  assert.match(compose, /name:\s*ace_cms_db/);
  assert.match(compose, /name:\s*ace_cms_uploads/);
});

test('sandbox seeds EN, IT, DE and ES as active locales', () => {
  const foundation = json('cms/schema/01-foundation.json');
  const locales = foundation.seeds.locales.filter((locale) => locale.is_active).map((locale) => locale.code);
  assert.deepEqual(locales, ['en', 'it', 'de', 'es']);
  assert.equal(foundation.seeds.locales.find((locale) => locale.code === 'en').is_default, true);
});

test('live CMS mode is opt-in and local content remains the default', () => {
  const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.match(example, /^CONTENT_SOURCE=local$/m);
  assert.match(example, /^CMS_CONTENT_MODE=release$/m);
  const astro = fs.readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
  assert.match(astro, /@astrojs\/node/);
  assert.match(astro, /output:\s*liveCms\s*\?\s*'server'\s*:\s*'static'/);
  const access = json('cms/access-policies.json');
  const liveReader = access.roles.find((role) => role.name === 'Live Reader');
  assert.equal(liveReader?.app_access, false);
  assert.equal(liveReader?.read_all_content, true);
  assert.deepEqual(liveReader?.collections?.directus_files, ['read']);
});

test('owner documentation and future Sheets plan are committed', () => {
  for (const relative of ['docs/CMS-QUICKSTART-RU.md', 'docs/GOOGLE-SHEETS-PLAN.md', 'docs/assets/cms/README.md']) {
    assert.ok(fs.existsSync(path.join(root, relative)), `${relative} is missing.`);
  }
});
