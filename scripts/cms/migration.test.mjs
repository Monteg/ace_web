import assert from 'node:assert/strict';
import test from 'node:test';
import { deterministicUuid, findDuplicateValues, migrateStatus, parseBet, parseDemo, parseMaxWin, parseRtp, splitMarkdownSections } from './lib/migration.mjs';

test('status migration accepts only the two explicit legacy combinations', () => {
  assert.equal(migrateStatus({ Relised: 'true', Coming: 'false' }).value, 'live');
  assert.equal(migrateStatus({ Relised: 'false', Coming: 'true' }).value, 'coming_soon');
  assert.match(migrateStatus({ Relised: 'true', Coming: 'true' }).conflict, /Unsupported/);
});

test('demo migration extracts structured adapter data and drops lobbyUrl', () => {
  const result = parseDemo('https://adapter-api-demo.rstars.cc/api/external/game/start?gameId=23c82a10-dd24-4ce1-89aa-1ceee5a8e39a&lobbyUrl=https://wrong.example');
  assert.deepEqual(result.config, { mode: 'adapter', gameId: '23c82a10-dd24-4ce1-89aa-1ceee5a8e39a' });
});

test('typed stats are parsed semantically', () => {
  assert.deepEqual(parseRtp('94.8%'), { mode: 'fixed', value: 0.948 });
  assert.deepEqual(parseMaxWin('120,000+ coins'), { value: 120000, unit: 'coins', approx: true });
  assert.deepEqual(parseBet('1.00 - 5000.00'), { min: 1, max: 5000 });
});

test('deterministic IDs remain stable', () => {
  assert.equal(deterministicUuid('game:pirates-rush'), deterministicUuid('game:pirates-rush'));
  assert.notEqual(deterministicUuid('game:pirates-rush'), deterministicUuid('game:ace-city'));
});

test('duplicate long copy is reported without modifying it', () => {
  const copy = 'A'.repeat(100);
  assert.equal(findDuplicateValues([{ owner: 'one', field: 'overview', value: copy }, { owner: 'two', field: 'overview', value: copy }]).length, 1);
});

test('Markdown intro and repeatable sections are separated without duplication', () => {
  const result = splitMarkdownSections('Intro copy.\n\n## Core Gameplay\n\nCore copy.\n\n## Bonus\n\nBonus copy.');
  assert.equal(result.intro, 'Intro copy.');
  assert.deepEqual(result.sections, [{ heading: 'Core Gameplay', body: 'Core copy.' }, { heading: 'Bonus', body: 'Bonus copy.' }]);
});
