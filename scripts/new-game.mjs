/**
 * Scaffold a game record.
 *
 *   npm run new-game -- --slug neon-vault --name "Neon Vault" --type slot
 *
 * Writes src/content/games/<slug>.md with every field present and the ones
 * that need a real value marked TODO, then tells you which two images to add.
 * A leftover TODO fails `npm run verify`, so a half-filled record cannot ship.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const slug = get('--slug');
const name = get('--name');
const type = get('--type') ?? 'slot';

const usage = 'usage: npm run new-game -- --slug <slug> --name "<Name>" [--type slot|instant|table]';
if (!slug || !name) {
  console.error(usage);
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`slug must be lowercase letters, digits and hyphens: got "${slug}"`);
  process.exit(1);
}
if (!['slot', 'instant', 'table'].includes(type)) {
  console.error(`type must be slot, instant or table: got "${type}"`);
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const target = resolve(root, 'src', 'content', 'games', `${slug}.md`);
if (existsSync(target)) {
  console.error(`${target} already exists; pick another slug or edit that file`);
  process.exit(1);
}

const typeWord = { slot: 'slot', instant: 'instant', table: 'table' }[type];
const record = `---
name: "${name.replace(/"/g, "'")}"
type: ${type}
status: coming_soon
order: 100              # lower numbers come first in the catalogue; 100 is the default
seo:
  title: "${name.replace(/"/g, "'")} - ${typeWord} game by Ace Games"
  description: "TODO one honest sentence about the mechanic, between 60 and 165 characters, no marketing adjectives"
card: ../../assets/games/${slug}.webp
hero: ../../assets/heroes/${slug}.webp
# gallery:
#   - image: ../../assets/heroes/${slug}.webp
#     alt: "TODO meaningful screenshot description"
specs:
  rtp: 0.96              # a number like 0.96, or the word configurable
  # maxWin: { value: 5000, unit: x }          # or { value: 120000, unit: coins, approx: true }; delete if unknown
  volatility: [medium]   # one or more of: low, medium, high, very_high
  # bet: { min: 0.2, max: 100 }               # delete if unknown
  mainFeature: "TODO short feature name"
  layout: "TODO e.g. 5x3 reels, 20 paylines"
# demo:                                       # delete this whole block if there is no demo yet
#   mode: adapter
#   gameId: TODO-paste-the-uuid-from-the-game-team
features:
  - title: "TODO feature name"
    body: "TODO one sentence on what it does for the player."
---

TODO two or three plain paragraphs describing the game: the grid or the mechanic,
how a round plays, what the main feature does, and how wins scale.

## Core gameplay

TODO the round flow in plain sentences.
`;

writeFileSync(target, record, { encoding: 'utf8' });

const card = resolve(root, 'src', 'assets', 'games', `${slug}.webp`);
const hero = resolve(root, 'src', 'assets', 'heroes', `${slug}.webp`);
const mark = (f) => (existsSync(f) ? 'found  ' : 'missing');

console.log(`
created  src/content/games/${slug}.md

images
  ${mark(card)}  src/assets/games/${slug}.webp     key art (any size)
  ${mark(hero)}  src/assets/heroes/${slug}.webp    wide banner (any size)

next
  1. add any missing image above
  2. open the record and replace every TODO (a leftover TODO fails npm run ship)
  3. set status: live when the title is released
  4. npm run ship
`);
