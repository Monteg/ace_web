import fs from 'node:fs/promises';
import path from 'node:path';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'outputs', 'google-content-system');
const seed = JSON.parse(await fs.readFile(path.join(ROOT, 'content', 'sheets', 'seed.json'), 'utf8'));
const workbook = Workbook.create();

const COLORS = {
  ink: '#171716',
  cream: '#FFFAF0',
  brand: '#F06424',
  line: '#D7D1C7',
  muted: '#6B665F',
  missing: '#FDE2E1',
  ready: '#DDF3E4',
  changed: '#FFF0BF',
  error: '#F7B5B1',
};


function addSheet(name, headers, rows, options = {}) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const matrix = [headers, ...rows];
  sheet.getRangeByIndexes(0, 0, matrix.length, headers.length).values = matrix;
  const lastRow = Math.max(2, matrix.length);
  const used = sheet.getRangeByIndexes(0, 0, matrix.length, headers.length);
  used.format.font = { name: 'Arial', size: 10, color: COLORS.ink };
  used.format.verticalAlignment = 'top';
  used.format.wrapText = true;
  used.format.borders = { preset: 'all', style: 'thin', color: '#E7E1D8' };
  const header = sheet.getRangeByIndexes(0, 0, 1, headers.length);
  header.format.fill = COLORS.ink;
  header.format.font = { name: 'Arial', size: 10, bold: true, color: COLORS.cream };
  header.format.rowHeightPx = 34;
  header.format.verticalAlignment = 'center';
  sheet.freezePanes.freezeRows(1);
  if (options.freezeColumns) sheet.freezePanes.freezeColumns(options.freezeColumns);
  sheet.tables.add(`A1:${columnName(headers.length)}${matrix.length}`, true, options.tableName);
  for (const [column, width] of Object.entries(options.widths ?? {})) sheet.getRange(`${column}1:${column}${lastRow}`).format.columnWidthPx = width;
  for (const column of options.longText ?? []) sheet.getRange(`${column}2:${column}${lastRow}`).format.rowHeightPx = 56;
  sheet.tabColor = options.tabColor ?? COLORS.brand;
  return { sheet, lastRow };
}

function columnName(number) {
  let value = number;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function statusFormatting(range) {
  range.conditionalFormats.add('containsText', { text: 'Missing', format: { fill: COLORS.missing, font: { color: '#8B1E18', bold: true } } });
  range.conditionalFormats.add('containsText', { text: 'Ready', format: { fill: COLORS.ready, font: { color: '#145A2B', bold: true } } });
  range.conditionalFormats.add('containsText', { text: 'Changed', format: { fill: COLORS.changed, font: { color: '#7A5600', bold: true } } });
  range.conditionalFormats.add('containsText', { text: 'SOURCE CHANGED', format: { fill: COLORS.changed, font: { color: '#7A5600', bold: true } } });
  range.conditionalFormats.add('containsText', { text: 'Error', format: { fill: COLORS.error, font: { color: '#7D0904', bold: true } } });
  range.conditionalFormats.add('containsText', { text: 'Failed', format: { fill: COLORS.error, font: { color: '#7D0904', bold: true } } });
}

const siteHeaders = ['Key', 'Page', 'Section', 'Context', 'Type', 'EN', 'DE', 'PT', 'ES', 'Status'];
const siteRows = seed.siteTranslations.map((row) => [row.key, row.page, row.section, row.context, row.type, row.en, row.de, row.pt, row.es, '']);
const site = addSheet('01 Site Translations', siteHeaders, siteRows, {
  freezeColumns: 5,
  tableName: 'SiteTranslations',
  widths: { A: 245, B: 110, C: 130, D: 330, E: 120, F: 430, G: 430, H: 430, I: 430, J: 120 },
  longText: ['D', 'F', 'G', 'H', 'I'],
});
site.sheet.getRange(`E2:E${site.lastRow}`).dataValidation = { rule: { type: 'list', values: ['plain', 'rich', 'button', 'aria', 'seo_title', 'seo_description', 'alt'] } };
site.sheet.getRange('J2').formulas = [['=IF(F2="","Error",IF(AND(G2<>"",H2<>"",I2<>""),"Ready","Missing"))']];
site.sheet.getRange(`J2:J${site.lastRow}`).fillDown();
statusFormatting(site.sheet.getRange(`J2:J${site.lastRow}`));

const gameHeaders = ['Game ID', 'Internal Name', 'Slug', 'Status', 'Order', 'Type', 'RTP Mode', 'RTP', 'Volatility', 'Max Win Value', 'Max Win Unit', 'Max Win Approx', 'Bet Min', 'Bet Max', 'Demo Enabled', 'Demo Mode', 'Adapter Game ID', 'Direct Build', 'Direct Version', 'API Host', 'Card Logo', 'Card Background', 'Hero Image', 'Changed', 'Publish', 'Validation Status'];
const gameRows = seed.games.map((row) => [
  row.id, row.name, row.slug, row.status, row.order, row.type, row.rtp === 'configurable' ? 'configurable' : 'fixed', row.rtp,
  row.volatility, row.maxWinValue, row.maxWinUnit, row.maxWinApprox, row.betMin, row.betMax, row.demoEnabled,
  row.demoMode, row.demoGameId, row.demoBuild, row.demoVersion, row.demoApiHost, row.cardLogo, row.cardBackground, row.heroImage,
  false, true, 'Ready',
]);
const games = addSheet('02 Games', gameHeaders, gameRows, {
  freezeColumns: 3,
  tableName: 'Games',
  widths: { A: 160, B: 180, C: 170, D: 110, E: 75, F: 90, G: 100, H: 85, I: 145, J: 105, K: 95, L: 110, M: 80, N: 80, O: 105, P: 95, Q: 260, R: 180, S: 100, T: 230, U: 340, V: 340, W: 340, X: 90, Y: 90, Z: 130 },
});
games.sheet.getRange(`D2:D${games.lastRow}`).dataValidation = { rule: { type: 'list', values: ['live', 'coming_soon'] } };
games.sheet.getRange(`F2:F${games.lastRow}`).dataValidation = { rule: { type: 'list', values: ['slot', 'instant', 'table'] } };
games.sheet.getRange(`G2:G${games.lastRow}`).dataValidation = { rule: { type: 'list', values: ['fixed', 'configurable'] } };
games.sheet.getRange(`K2:K${games.lastRow}`).dataValidation = { rule: { type: 'list', values: ['x', 'coins'] } };
games.sheet.getRange(`P2:P${games.lastRow}`).dataValidation = { rule: { type: 'list', values: ['', 'adapter', 'direct'] } };
games.sheet.getRange(`X2:Y${games.lastRow}`).dataValidation = { rule: { type: 'list', values: [true, false] } };
statusFormatting(games.sheet.getRange(`Z2:Z${games.lastRow}`));

const gameTextHeaders = ['Game', 'Slug', 'Field Key', 'Group', 'Context', 'Type', 'EN', 'DE', 'PT', 'ES', 'Status'];
const gameTextRows = seed.gameTranslations.map((row) => [row.game, row.slug, row.fieldKey, row.group, row.context, row.type, row.en, row.de, row.pt, row.es, '']);
const gameText = addSheet('03 Game Translations', gameTextHeaders, gameTextRows, {
  freezeColumns: 6,
  tableName: 'GameTranslations',
  widths: { A: 170, B: 160, C: 235, D: 120, E: 340, F: 115, G: 460, H: 460, I: 460, J: 460, K: 120 },
  longText: ['E', 'G', 'H', 'I', 'J'],
});
gameText.sheet.getRange(`F2:F${gameText.lastRow}`).dataValidation = { rule: { type: 'list', values: ['plain', 'rich', 'button', 'aria', 'seo_title', 'seo_description', 'alt'] } };
gameText.sheet.getRange('K2').formulas = [['=IF(G2="","Error",IF(AND(H2<>"",I2<>"",J2<>""),"Ready","Missing"))']];
gameText.sheet.getRange(`K2:K${gameText.lastRow}`).fillDown();
statusFormatting(gameText.sheet.getRange(`K2:K${gameText.lastRow}`));

const settingsRows = [
  ['Project', 'Ace Games'],
  ['Default Locale', 'en'],
  ['Locales', 'en,de,pt,es'],
  ['Target Branch', 'main'],
  ['Registry URL', 'https://gitlab.com/api/v4/projects/86013072/repository/files/content%2Fsheets%2Fseed.json/raw?ref=main'],
  ['Production URL', 'https://acegames.io'],
  ['Normal Publish Time', '3–6 minutes'],
  ['Markdown', 'Use Markdown in rich fields; HTML/script is rejected'],
  ['Image Limit', '20 MB per source image'],
];
addSheet('04 Settings', ['Setting', 'Value'], settingsRows, { freezeColumns: 1, tableName: 'Settings', widths: { A: 210, B: 620 }, tabColor: '#7D7469' });

const log = addSheet('05 Publish Log', ['Timestamp', 'User', 'Changed Site Strings', 'Changed Game Strings', 'Changed Games', 'Changed Images', 'Build ID', 'Status', 'Deployment URL', 'Error'], [], {
  tableName: 'PublishLog',
  widths: { A: 190, B: 220, C: 150, D: 160, E: 120, F: 130, G: 170, H: 110, I: 260, J: 440 },
  tabColor: '#7D7469',
});
statusFormatting(log.sheet.getRange('H2:H1000'));

workbook.recalculate();
await fs.mkdir(OUTPUT_DIR, { recursive: true });
const inspection = await workbook.inspect({ kind: 'workbook,sheet,table', maxChars: 8000, tableMaxRows: 3, tableMaxCols: 12, tableMaxCellChars: 70 });
await fs.writeFile(path.join(OUTPUT_DIR, 'inspection.ndjson'), inspection.ndjson ?? String(inspection));
const previewRanges = {
  '01 Site Translations': 'A1:J18',
  '02 Games': 'A1:Z14',
  '03 Game Translations': 'A1:K18',
  '04 Settings': 'A1:B10',
  '05 Publish Log': 'A1:J8',
};
for (const name of Object.keys(previewRanges)) {
  const preview = await workbook.render({ sheetName: name, range: previewRanges[name], scale: 0.8, format: 'png' });
  await fs.writeFile(path.join(OUTPUT_DIR, `${name.replaceAll(' ', '-').toLowerCase()}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(OUTPUT_DIR, 'Ace Games — Content & Localization.xlsx'));
console.log(`Workbook created: ${path.join(OUTPUT_DIR, 'Ace Games — Content & Localization.xlsx')}`);
