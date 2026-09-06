import fs from 'node:fs';
import path from 'node:path';

export function readSchemaDefinitions(root = process.cwd()) {
  const directory = path.join(root, 'cms', 'schema');
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ name, ...JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')) }));
}

export function relationPayload(collection, relation) {
  return {
    collection,
    field: relation.field,
    related_collection: relation.related_collection,
    schema: {
      table: collection,
      column: relation.field,
      foreign_key_table: relation.related_collection,
      foreign_key_column: 'id',
      on_delete: relation.on_delete ?? 'SET NULL',
    },
    meta: relation.meta ?? null,
  };
}

