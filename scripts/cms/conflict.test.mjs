import assert from 'node:assert/strict';
import test from 'node:test';
import { assertRevision, detectRevisionConflict } from './lib/conflict.mjs';

test('dirty stale Sheet row is a conflict', () => {
  assert.equal(detectRevisionConflict('12', '13', true), true);
  assert.throws(() => assertRevision('12', '13', true), /CONFLICT/);
});

test('matching revision and clean row are safe', () => {
  assert.equal(detectRevisionConflict('13', '13', true), false);
  assert.equal(detectRevisionConflict('12', '13', false), false);
});
