import { createHash } from 'node:crypto';
import { googleToken } from './google-token.mjs';

const args = Object.fromEntries(process.argv.slice(2).flatMap((value, index, all) => value.startsWith('--') ? [[value.slice(2), all[index + 1] ?? '']] : []));
if (!args.spreadsheet || !args.status) throw new Error('--spreadsheet and --status are required');
const { token, account } = await googleToken(['https://www.googleapis.com/auth/spreadsheets']);

const hash = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

async function sheets(pathname, options = {}) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(args.spreadsheet)}${pathname}`, {
    ...options,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...options.headers },
  });
  if (!response.ok) throw new Error(`Sheets API failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function finishPublishedRows() {
  const ranges = [
    "'01 Site Translations'!A2:M",
    "'02 Games'!A2:AC",
    "'03 Game Translations'!A2:N",
  ];
  const query = ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join('&');
  const response = await sheets(`/values:batchGet?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&${query}`);
  const [site = [], games = [], gameText = []] = response.valueRanges.map((entry) => entry.values ?? []);
  const siteStatus = site.map((row) => [row[5] ? (row.slice(6, 9).every(Boolean) ? 'Ready' : 'Missing') : 'Error']);
  const siteHashes = site.map((row) => [hash(row.slice(0, 9)), hash(row[5] ?? '')]);
  const gameStatus = games.map(() => ['Published']);
  const gameChanged = games.map(() => [false]);
  const gameHashes = games.map((row) => [hash(row.slice(0, 23)), hash(row.slice(0, 23))]);
  const gameTextStatus = gameText.map((row) => [row[6] ? (row.slice(7, 10).every(Boolean) ? 'Ready' : 'Missing') : 'Error']);
  const gameTextHashes = gameText.map((row) => [hash(row.slice(0, 10)), hash(row[6] ?? '')]);

  await sheets('/values:batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: [
        { range: `'01 Site Translations'!J2:J${site.length + 1}`, values: siteStatus },
        { range: `'01 Site Translations'!L2:M${site.length + 1}`, values: siteHashes },
        { range: `'02 Games'!X2:X${games.length + 1}`, values: gameChanged },
        { range: `'02 Games'!Z2:Z${games.length + 1}`, values: gameStatus },
        { range: `'02 Games'!AB2:AC${games.length + 1}`, values: gameHashes },
        { range: `'03 Game Translations'!K2:K${gameText.length + 1}`, values: gameTextStatus },
        { range: `'03 Game Translations'!M2:N${gameText.length + 1}`, values: gameTextHashes },
      ].filter((entry) => entry.values.length),
    }),
  });
}

if (args.status === 'Published') await finishPublishedRows();

const row = [[
  new Date().toISOString(),
  account.client_email,
  '', '', '', '',
  args.build || '',
  args.status,
  args.url || '',
  args.error || '',
]];
const range = encodeURIComponent("'05 Publish Log'!A:J");
const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(args.spreadsheet)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ values: row }),
});
if (!response.ok) throw new Error(`Publish log update failed: ${response.status} ${await response.text()}`);
console.log(`Publish status ${args.status} recorded in spreadsheet ${args.spreadsheet}.`);
