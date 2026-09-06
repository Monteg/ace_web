import { createAdminClient } from './lib/directus.mjs';
import { readSchemaDefinitions, relationPayload } from './lib/schema.mjs';

const client = await createAdminClient();
const definitions = readSchemaDefinitions();
const currentCollections = new Set((await client.get('/collections?limit=-1')).map((item) => item.collection));

for (const definition of definitions) {
  console.log(`Applying ${definition.name}`);
  for (const collection of definition.collections ?? []) {
    if (!currentCollections.has(collection.collection)) {
      await client.post('/collections', {
        collection: collection.collection,
        meta: collection.meta ?? {},
        schema: { name: collection.collection },
      });
      currentCollections.add(collection.collection);
      console.log(`  created collection ${collection.collection}`);
    } else {
      await client.patch(`/collections/${collection.collection}`, { meta: collection.meta ?? {} });
    }

    const existingFields = new Set((await client.get(`/fields/${collection.collection}`)).map((item) => item.field));
    for (const field of collection.fields ?? []) {
      if (existingFields.has(field.field)) {
        await client.patch(`/fields/${collection.collection}/${field.field}`, field);
      } else {
        await client.post(`/fields/${collection.collection}`, field);
        existingFields.add(field.field);
      }
    }

    const existingRelations = new Set(
      (await client.get(`/relations/${collection.collection}`)).map((item) => `${item.collection}.${item.field}`),
    );
    for (const relation of collection.relations ?? []) {
      const key = `${collection.collection}.${relation.field}`;
      if (!existingRelations.has(key)) {
        await client.post('/relations', relationPayload(collection.collection, relation));
        existingRelations.add(key);
      }
    }
  }

  for (const [collection, rows] of Object.entries(definition.seeds ?? {})) {
    for (const row of rows) {
      const primaryKey = row.id ?? row.code ?? row.key;
      if (primaryKey === undefined) throw new Error(`Seed for ${collection} has no id, code or key`);
      try {
        await client.get(`/items/${collection}/${encodeURIComponent(primaryKey)}`);
      } catch (error) {
        if (error.status !== 403 && error.status !== 404) throw error;
        await client.post(`/items/${collection}`, row);
      }
    }
  }

  for (const folderName of definition.folders ?? []) {
    const query = new URLSearchParams({ 'filter[name][_eq]': folderName, 'filter[parent][_null]': 'true', limit: '1' });
    const folders = await client.get(`/folders?${query}`);
    if (!folders.length) await client.post('/folders', { name: folderName, parent: null });
  }
}

console.log('Directus schema is up to date.');

