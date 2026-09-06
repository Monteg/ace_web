import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createAdminClient } from './lib/directus.mjs';

const sourcePath = path.resolve(process.cwd(), 'src', 'data', 'site.ts');
const source = ts.createSourceFile(sourcePath, fs.readFileSync(sourcePath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
let faqNode;
source.forEachChild((node) => {
  if (!ts.isVariableStatement(node)) return;
  for (const declaration of node.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'faq' || !declaration.initializer) continue;
    let expression = declaration.initializer;
    while (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) expression = expression.expression;
    if (ts.isArrayLiteralExpression(expression)) faqNode = expression;
  }
});
if (!faqNode) throw new Error('Could not find the local FAQ seed.');

const entries = faqNode.elements.map((element) => {
  if (!ts.isObjectLiteralExpression(element)) throw new Error('FAQ seed entries must be object literals.');
  const read = (name) => {
    const property = element.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText(source).replaceAll("'", '').replaceAll('"', '') === name);
    return property && ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer) ? property.initializer.text : null;
  };
  return { question: read('q'), answer: read('a') };
}).filter((entry) => entry.question && entry.answer);

const client = await createAdminClient();
const current = await client.get('/items/faq_items?limit=1');
if (current.length) {
  console.log('FAQ seed skipped because CMS already contains FAQ entries.');
  process.exit(0);
}
for (const [index, entry] of entries.entries()) {
  const item = await client.post('/items/faq_items', { sort_order: index + 1, enabled: true });
  await client.post('/items/faq_item_translations', { faq_item_id: item.id, locale: 'en', question: entry.question, answer_markdown: entry.answer, translation_status: 'approved' });
}
console.log(`FAQ seed complete. Created ${entries.length} entries.`);
