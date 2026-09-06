import fs from 'node:fs';
import path from 'node:path';
import { createAdminClient } from './lib/directus.mjs';

const client = await createAdminClient();
const presets = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'cms', 'presets.json'), 'utf8'));

async function roleId(name) {
  const query = new URLSearchParams({ 'filter[name][_eq]': name, fields: 'id,name', limit: '1' });
  const role = (await client.get(`/roles?${query}`))[0];
  if (!role) throw new Error(`Apply access policies before presets: role ${name} is missing.`);
  return role.id;
}

for (const definition of presets) {
  const role = await roleId(definition.role);
  const query = new URLSearchParams({
    'filter[role][_eq]': role,
    'filter[collection][_eq]': definition.collection,
    'filter[user][_null]': 'true',
    'filter[bookmark][_null]': 'true',
    limit: '1',
  });
  const existing = (await client.get(`/presets?${query}`))[0];
  const payload = {
    role,
    user: null,
    bookmark: null,
    collection: definition.collection,
    layout: definition.layout,
    layout_query: definition.layout_query,
    layout_options: definition.layout_options ?? {},
  };
  if (existing) await client.patch(`/presets/${existing.id}`, payload);
  else await client.post('/presets', payload);
}

console.log(`Directus table presets are up to date (${presets.length}).`);
