import fs from 'node:fs';
import path from 'node:path';
import { createAdminClient } from './lib/directus.mjs';

const client = await createAdminClient();
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'cms', 'access-policies.json'), 'utf8'));
const collections = new Set((await client.get('/collections?limit=-1')).map((item) => item.collection));

async function findOne(endpoint, name) {
  const query = new URLSearchParams({ 'filter[name][_eq]': name, limit: '1' });
  return (await client.get(`/${endpoint}?${query}`))[0] ?? null;
}

for (const definition of config.roles) {
  let role = await findOne('roles', definition.name);
  if (!role) {
    role = await client.post('/roles', {
      name: definition.name,
      icon: definition.icon,
      description: definition.description,
    });
  }

  let policy = await findOne('policies', definition.name);
  if (!policy) {
    policy = await client.post('/policies', {
      name: definition.name,
      icon: definition.icon,
      description: definition.description,
      app_access: definition.app_access,
      admin_access: false,
    });
  }

  const accessQuery = new URLSearchParams({ 'filter[role][_eq]': role.id, 'filter[policy][_eq]': policy.id, limit: '1' });
  if (!(await client.get(`/access?${accessQuery}`)).length) {
    await client.post('/access', { role: role.id, policy: policy.id });
  }

  const requested = definition.read_all_content
    ? {
        ...Object.fromEntries([...collections].filter((name) => !name.startsWith('directus_')).map((name) => [name, ['read']])),
        ...(definition.collections ?? {}),
      }
    : definition.collections ?? {};

  for (const [collection, actions] of Object.entries(requested)) {
    if (!collections.has(collection)) {
      console.warn(`  skipped ${definition.name}: collection ${collection} is not installed yet`);
      continue;
    }
    for (const action of actions) {
      const query = new URLSearchParams({
        'filter[policy][_eq]': policy.id,
        'filter[collection][_eq]': collection,
        'filter[action][_eq]': action,
        limit: '1',
      });
      const existing = (await client.get(`/permissions?${query}`))[0];
      const payload = {
        policy: policy.id,
        collection,
        action,
        permissions: {},
        validation: {},
        presets: null,
        fields: ['*'],
      };
      if (existing) await client.patch(`/permissions/${existing.id}`, payload);
      else await client.post('/permissions', payload);
    }
  }
}

// Live pages render content server-side, while image bytes are delivered by
// Directus' asset endpoint. Only the dedicated Games folder is public; CMS
// exports, private uploads and all content collections stay authenticated.
const publicPolicy = await findOne('policies', 'Public');
const publicFolder = (await client.get(`/folders?${new URLSearchParams({ 'filter[name][_eq]': 'Games', 'filter[parent][_null]': 'true', limit: '1' })}`))[0];
if (publicPolicy && publicFolder) {
  const query = new URLSearchParams({
    'filter[policy][_eq]': publicPolicy.id,
    'filter[collection][_eq]': 'directus_files',
    'filter[action][_eq]': 'read',
    limit: '1',
  });
  const existing = (await client.get(`/permissions?${query}`))[0];
  const payload = {
    policy: publicPolicy.id,
    collection: 'directus_files',
    action: 'read',
    permissions: { folder: { _eq: publicFolder.id } },
    validation: {},
    presets: null,
    fields: ['id', 'storage', 'filename_disk', 'filename_download', 'title', 'type', 'width', 'height', 'filesize', 'folder', 'modified_on'],
  };
  if (existing) await client.patch(`/permissions/${existing.id}`, payload);
  else await client.post('/permissions', payload);
} else {
  console.warn('Public Games media permission was not applied because the built-in Public policy or Games folder was not found.');
}

console.log('Directus roles and policies are up to date.');
