import fs from 'node:fs';
import path from 'node:path';
import { releaseChecksum, validateReleasePayload } from './lib/release-schema.mjs';

const args = process.argv.slice(2);
const index = args.indexOf('--file');
if (index < 0 || !args[index + 1]) {
  console.error('Usage: npm run cms:validate -- --file <release-payload.json>');
  process.exit(1);
}
const input = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), args[index + 1]), 'utf8'));
const payload = input.payload ?? input;
const result = validateReleasePayload(payload);
const checksum = releaseChecksum(result.payload);
if (input.checksum && input.checksum !== checksum) throw new Error(`Release checksum mismatch: expected ${input.checksum}, calculated ${checksum}`);
console.log(`Release payload valid. Games: ${result.payload.games.length}. Warnings: ${result.warnings.length}. Checksum: ${checksum}`);
