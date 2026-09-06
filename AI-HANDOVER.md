# AI handover: running, changing and deploying this site

Written for an AI assistant (Claude Code, Codex, Cursor, Copilot, or any
other) that a person will work with to maintain the Ace Games website. The
person may not read code. You are expected to do the work, verify it, and
explain the outcome in plain language.

Rules and invariants are in `AGENTS.md`. This file is the how-to.

---

## 1. First five minutes on a new machine

```bash
node --version        # must print v20 or higher; install from nodejs.org if not
npm install           # downloads dependencies into node_modules/, about 20 seconds
npm run ship          # builds the site and runs the checks; must end with "N/N gates passed"
npm run dev           # starts http://localhost:4321 (or: npm run dev -- --port 4400)
```

If any gate says FAIL, stop and read that line.
Every gate prints what it found. Do not proceed with other work on a broken
baseline.

With `CONTENT_SOURCE=local`, no database or account is required. CMS work uses
the Docker/Directus setup in `docs/CMS.md` and environment names from
`.env.example`. Never commit credentials. The contact form needs three
production secrets (section 8).

## 2. Mental model in one paragraph

After cutover, Directus working content is published as an immutable release;
the build downloads that one release into ignored `src/generated/cms/` and
renders static pages. `src/lib/content-source.ts` is the transition adapter.
`CONTENT_SOURCE=local` still reads Markdown and TypeScript data as a read-only
legacy fallback. Site effects remain code-owned. Events remain outside CMS in
the first version. Nothing is fetched from Directus in a visitor's browser.

## 3. Add a game in CMS

Follow `docs/CMS.md`: create Games item, fill shared specs/demo/media, create
Approved English game/section/item/gallery translations, Save, then publish
only the ready rows. Field-level rules are in `docs/CMS-GAMES.md`; release
semantics are in `docs/CMS-RELEASES.md`.

## 3.1. Legacy local fallback only

Use this workflow only while `CONTENT_SOURCE=local` or to maintain the frozen
migration backup. Do not update it in parallel with Directus after cutover.

**Step 1: images.** Put the key art at `src/assets/games/<slug>.webp` and the
wide banner at `src/assets/heroes/<slug>.webp`. Any dimensions; the build
makes the sizes it needs. PNG or JPG also work if you change the extension in
the record. The slug is lowercase letters, digits and hyphens, and it becomes
the URL: `neon-vault` lives at `/portfolio/neon-vault`.

**Step 2: scaffold the record.**

```bash
npm run new-game -- --slug neon-vault --name "Neon Vault" --type slot
```

This writes `src/content/games/neon-vault.md` with every field present and
the ones you must fill marked `TODO`. A `TODO` left in the file fails
`npm run ship`, so it cannot slip onto the live site. `--type` is `slot`, `instant`, `crash` or `table`.

**Step 3: fill it in.** Open the file. The front matter (between the `---`
lines) is data; everything below is the overview prose. Field by field:

| field | what to put | rules |
| --- | --- | --- |
| `name` | display name | as the studio spells it |
| `type` | `slot`, `instant`, `crash` or `table` | drives the badge, the filters, the maths board |
| `status` | `live` or `coming_soon` | `coming_soon` hides Play, adds the pill, no demo required |
| `order` | a number, default 100 | lower comes first in the catalogue and the home grid; live titles always precede coming soon |
| `seo.title` | tab title, up to 70 chars | e.g. `Neon Vault - slot game by Ace Games` |
| `seo.description` | 60 to 165 chars | one honest sentence about the mechanic |
| `card` / `hero` | paths to the two images | relative to the record's own folder (`../../assets/...`), as scaffolded |
| `gallery` | list of `{ image, alt }` screenshots | optional; one image is static, two or more get manual arrows, count, swipe and keyboard navigation |
| `specs.rtp` | a number, `0.945`, or the word `configurable` | never a string like `"94.5%"`; the template formats it |
| `specs.maxWin` | `{ value: 5000, unit: x }` or `{ value: 120000, unit: coins, approx: true }` | omit the whole line if unknown; the page then shows "On request" |
| `specs.volatility` | list from `low`, `medium`, `high`, `very_high` | one band, or several if the game has selectable modes |
| `specs.bet` | `{ min: 0.2, max: 100 }` | omit if unknown |
| `specs.mainFeature`, `specs.layout` | short strings | e.g. `Expanding wilds`, `5x3 reels, 20 paylines` |
| `demo` | see section 4 | omit entirely for a title with no demo |
| `highlights` | 3 to 5 short bullets | shown under the spec strip |
| `features` | list of `{ title, body }` | shown in the sidebar of the game page |

Below the front matter write the overview: two or three paragraphs, then an
optional `## Core gameplay` heading with more. Plain sentences, no marketing
adjectives, no em-dashes.

**Step 4: check.** `npm run ship`. A wrong value fails the build naming the
file and the field path (for example `specs.rtp`): `rtp` outside 0.80 to
0.995, a volatility word not in the list, a `demo` block with a missing field.
A leftover `TODO` fails the gates instead. Fix, rerun. On some Node versions a
failed build ends with an extra `Assertion failed ... async.c` line; ignore it,
the real message is above it.

**Step 5: look.** `npm run dev`, open `/portfolio/<slug>`, `/games` and `/`.
The `/games` tile, the maths board on `/` and the sitemap pick the game up on
their own. The home grid shows only the first twelve titles by `status` and
`order`, so a new game appears there only if you give it a low `order`.
Nothing else to register.

## 4. Demo links

Two shapes, both built into a URL by `src/lib/format.ts`. Never paste a full
URL into a record.

Adapter (a game started through the adapter API by id):

```yaml
demo:
  mode: adapter
  gameId: 23c82a10-dd24-4ce1-89aa-1ceee5a8e39a
```

Direct (a build served from the CDN, optionally with an API host):

```yaml
demo:
  mode: direct
  build: rocket
  version: 34
  apiHost: https://rocket-api.demo.rstars.cc
```

For adapter demos the lobby URL the game returns to is derived from the
page's own slug, so a demo can never send a player back to a different game's
page. Direct builds carry no lobby URL. If the game
team gives you a full URL, take the id or the build and version out of it.

To remove a demo, delete the `demo` block. The page then shows "Demo on
request" (or "In development" for `coming_soon`) instead of a player.

## 5. Change words on the site

| what | where |
| --- | --- |
| hero, section headings, buttons and UI labels | existing Directus Site String keys; `src/i18n/en.ts` is the seeded English contract, not a second post-cutover editor |
| FAQ questions and answers | Directus `faq_items` and `faq_item_translations` |
| nav and global enum labels | Directus Site Strings; links/layout remain code-owned |
| company/contact/footer copy | existing Directus Site String slots; structural facts not yet modelled stay in `src/data/site.ts` |
| a new arbitrary UI slot | add frontend placement and seed its key; a CMS key alone cannot create layout |
| privacy policy, terms | `src/content/legal/*.md` |
| a game's copy | Directus game/section/item translations; local Markdown only before cutover |

After any CMS copy change, Save, approve, publish only the intended keys and
let the release run `check` and `ship`. For code-owned copy changes, run the
same commands locally.

## 6. Change how it looks

Start in `src/styles/tokens.css`. It holds every colour, type size, spacing
step, radius, shadow and duration. Changing a token changes the whole site
consistently. Only if a token cannot express the change should you edit a
component's `<style>` block.

Things that are easy and safe:

- Brand orange: `--brand` and `--brand-hover`. Orange CTA buttons currently
  use the owner-approved white `--on-brand-button` label and icon treatment.
  Keep this consistent and do not reuse it for small body text.
- Section spacing: `--sp-9`.
- Display type size: `--step-4` (headings) and `--step-5` (game page title).
  The home hero has its own `clamp()` on `.wall-copy .d0` in `Wall.astro`.
- The wall's speed and angle: the three `animation` durations and the
  `rotateX`/`rotateZ` in `Wall.astro`.

Things that are deliberate and should stay unless the owner asks:

- The single cream block. Adding a second light block breaks the theme lock.
- One accent colour. Do not introduce a second.
- Pill buttons and `--radius-l` cards.
- The volatility meter on tiles and the maths board's lanes: they are the
  parts buyers screenshot.

### 6.1. Tune the interactive effects

Open `/effects-lab` locally. This is a technical, `noindex` route without the
public Header or Footer and it must stay out of navigation and the sitemap.

The first tool controls the three cards in **Redefining iGaming Excellence**:
maximum tilt, hover scale, perspective, response time, artwork depth, text
depth, glare strength and glare travel. The second tool controls the Border
Trail around the public navigation: orbit duration, trail length, line
thickness, intensity and blur.

The effects are deliberately independent. Each tool has its own preview and
its own Apply to site, Copy settings and Reset actions. Apply stores a preset
in the current browser and dispatches a same-tab update. The storage keys are:

- `ace_experience_card_effects_v1`;
- `ace_border_trail_effects_v1`.

Defaults live in their matching `src/data/*-settings.ts` file. Runtime
normalization and application live in `src/lib/experience-card-motion.ts` and
`src/lib/border-trail.ts`. Do not add the Border Trail to the card or combine
the two settings objects.

The excellence cards use a scalable frame generated through Astro `getImage`
and CSS `border-image`. At 561 to 992 px they switch to a horizontal layout;
phones remain vertical. Verify all three layouts whenever card art, copy or
frame geometry changes.

## 7. Partner logos, stats, certificates: filling the gaps

Everything the owner has not supplied renders as a dashed orange underline.
`TODO.md` lists all of them. To close one:

- **Operator or aggregator logos:** put SVG files in `public/partners/`
  (light or single-colour marks read best on the dark ground), then list them
  in `partners` in `src/data/site.ts` as `{ name: 'Unibet', src: '/partners/unibet.svg' }`.
  The wall appears on its own once the list is not empty.
- **Proof figures:** set `value` on the four entries of `heroStats`.
- **Certificates, jurisdictions, integration route:** set `value` on the rows
  of `integration`. A row with a value shows it; a row with `null` shows the
  hint, dashed.
- **Licence line in the footer:** add it to `src/components/Footer.astro`
  next to the company address, in plain text, with the licence number and the
  issuing authority. Do not write one without the real number.
- **Per-game figures** (`maxWin`, `bet`, `layout`, `mainFeature`): add them to
  the game's record.

Never fill a gap with a guess. A dashed underline is honest; a wrong licence
number is a legal problem.

## 8. Deploy

Full runbook in `DEPLOY.md`. The short form:

1. Push the repo to GitHub.
2. Cloudflare Pages, connect the repo, build command `npm run build`, output
   `dist`, environment variable `NODE_VERSION` = `20`.
3. Add the three secrets for the contact form: `RESEND_API_KEY`, `CONTACT_TO`,
   `CONTACT_FROM` (see `.env.example`). Until they exist the form lands on
   an honest "not connected yet" page.
4. Every push to `main` deploys. Every other branch gets a preview URL.

Before any deploy: `npm run ship` passes every gate and `npx astro check` says 0 errors.

## 9. Verify like a reviewer

After a change, do all of these, not some:

1. `npx astro check` (0 errors).
2. `npm run ship` (every gate passes).
3. `npm run dev`, open the changed page at 1440 px wide and at 375 px wide.
   If you have no browser, `npm run preview` and fetch the page with curl to
   confirm it serves, then tell the person which pages to look at themselves.
   Look for: text that wraps into more than two lines in a heading, a button
   whose text wraps, anything off the right edge, an image that has not
   loaded, an em-dash.
4. If you changed a game record, open its page, the catalogue and the home
   page; the tile and the maths board dot must reflect the change.
5. If you changed motion, reload with reduced motion enabled in the OS and
   confirm the page is still complete and readable.

Then report: what changed (files), what you checked, and what you could not
check.

## 10. Things that look like bugs and are not

- **A dashed orange underline under a figure or a phrase.** That is a gap the
  owner has not filled. Do not "fix" it by inventing a value.
- **Three games with "Coming soon" and no demo** (Blackjack, Good Stuff, Toy
  Story). They are unreleased. Their pages exist so the URLs survive.
- **`PartnerWall` renders nothing.** The `partners` list is empty on purpose.
- **The home hero video from the old site is gone.** It is replaced by the
  wall of key art. The separate `/games` hero currently uses an external S3
  MP4 and has its own performance risk.
- **The privacy policy names Webflow.** Accurate for the old host; the owner
  and their lawyer update that text after the move. Listed in `TODO.md`.
- **`astro check` must be clean.** The current stable snapshot reports 0
  errors, 0 warnings and 0 hints.

## 11. Things not to do

- Do not add a CMS, a database, React, Tailwind, or a component library. The
  site is Markdown, tokens and Astro components on purpose.
- Do not introduce a new third-party asset dependency without a documented
  reason, CSP review and fallback. The current `/games` hero is the one known
  exception and loads its MP4 from the Ace Games S3 bucket.
- Do not put a full demo URL in a record.
- Do not change a slug without a redirect.
- Do not remove or loosen a gate in `scripts/verify.mjs`. The only sanctioned
  edit is removing a retired slug from `OLD` alongside its 301.
- Do not edit `dist/`; it is rebuilt from source every time.

## 12. If something is unclear

Ask the person one specific question, with the two options you see and your
recommendation. Do not ask five questions at once, and do not guess at a
fact about the business (a licence, a market, a number of operators). The
design decisions are already made and explained in `PLAN.md`; you do not need
to re-open them to do the work.
