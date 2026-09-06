import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createAdminClient } from './lib/directus.mjs';

const sourcePath = path.resolve(process.cwd(), 'src', 'i18n', 'en.ts');
const source = ts.createSourceFile(sourcePath, fs.readFileSync(sourcePath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
let messagesNode;
source.forEachChild((node) => {
  if (!ts.isVariableStatement(node)) return;
  for (const declaration of node.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && declaration.name.text === 'englishMessages') {
      const expression = declaration.initializer && ts.isAsExpression(declaration.initializer) ? declaration.initializer.expression : declaration.initializer;
      if (expression && ts.isObjectLiteralExpression(expression)) messagesNode = expression;
    }
  }
});
if (!messagesNode) throw new Error('Could not find the englishMessages inventory.');

const messages = messagesNode.properties.map((property) => {
  if (!ts.isPropertyAssignment(property) || (!ts.isStringLiteral(property.name) && !ts.isIdentifier(property.name))) throw new Error('English inventory must contain literal key/value pairs only.');
  const value = property.initializer;
  if (!ts.isStringLiteral(value) && !ts.isNoSubstitutionTemplateLiteral(value)) throw new Error(`English value for ${property.name.getText(source)} must be a static string.`);
  return { key: property.name.text, value: value.text };
});

const client = await createAdminClient();
let created = 0;
for (const [index, message] of messages.entries()) {
  const existing = await client.get(`/items/site_strings?${new URLSearchParams({ 'filter[key][_eq]': message.key, limit: '1' })}`);
  if (existing.length) continue;
  const [page = 'global', section = 'general'] = message.key.split('.');
  const type = message.key.includes('seo.title') ? 'seo_title'
    : message.key.includes('seo.description') ? 'seo_description'
      : message.key.includes('aria') || message.key.includes('label') ? 'aria'
        : /(?:submit|play|load|view|confirm|leave|talk|home)$/.test(message.key) ? 'button'
          : 'plain';
  const item = await client.post('/items/site_strings', { key: message.key, page, section, context: null, type, required: true, max_length: null, sort_order: index + 1, active: true });
  await client.post('/items/site_string_translations', { site_string_id: item.id, locale: 'en', value: message.value, translation_status: 'approved' });
  created += 1;
}
console.log(`English site string seed complete. Created ${created}; preserved ${messages.length - created}.`);
