import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { readSchemaDefinitions } from './lib/schema.mjs';

const requiredCollections = [
  'locales', 'games', 'game_translations', 'game_sections', 'game_section_translations',
  'game_section_items', 'game_section_item_translations', 'game_gallery',
  'game_gallery_translations', 'site_strings', 'site_string_translations', 'faq_items',
  'faq_item_translations', 'content_releases',
];

test('CMS schema files form a consistent model', () => {
  const definitions = readSchemaDefinitions();
  const collections = definitions.flatMap((definition) => definition.collections ?? []);
  const names = collections.map((collection) => collection.collection);
  assert.equal(new Set(names).size, names.length, 'Collection names must be unique.');
  for (const required of requiredCollections) assert.ok(names.includes(required), `Missing required collection ${required}.`);
  for (const collection of collections) {
    const fields = (collection.fields ?? []).map((field) => field.field);
    assert.equal(new Set(fields).size, fields.length, `${collection.collection} contains duplicate fields.`);
    for (const relation of collection.relations ?? []) {
      assert.ok(fields.includes(relation.field), `${collection.collection}.${relation.field} relation has no matching field.`);
      assert.ok(names.includes(relation.related_collection) || relation.related_collection.startsWith('directus_'), `${collection.collection}.${relation.field} targets an unknown collection.`);
    }
  }
});

test('Directus extension entry points are committed', () => {
  const extensionRoot = path.join(process.cwd(), 'cms', 'extensions');
  for (const directory of fs.readdirSync(extensionRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    const packagePath = path.join(extensionRoot, directory.name, 'package.json');
    if (!fs.existsSync(packagePath)) continue;
    const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const entry = manifest['directus:extension']?.path;
    assert.ok(entry, `${directory.name} has no Directus extension entry point.`);
    assert.ok(fs.existsSync(path.join(extensionRoot, directory.name, entry)), `${directory.name} entry point is missing from Git.`);
  }
});

test('editorial table presets cover games, translations and releases', () => {
  const presets = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'cms', 'presets.json'), 'utf8'));
  const gamePreset = presets.find((preset) => preset.role === 'Content Manager' && preset.collection === 'games');
  assert.ok(gamePreset, 'Content Manager games preset is missing.');
  assert.equal(gamePreset.layout, 'tabular');
  for (const field of ['sort_order', 'internal_name', 'release_status', 'game_type', 'rtp', 'demo_enabled', 'card_image', 'hero_image', 'translations']) {
    assert.ok(gamePreset.layout_query.tabular.fields.includes(field), `Games preset is missing ${field}.`);
  }
  assert.ok(presets.some((preset) => preset.role === 'Translator' && preset.collection === 'game_translations'));
  assert.ok(presets.some((preset) => preset.role === 'Content Manager' && preset.collection === 'content_releases'));
});
