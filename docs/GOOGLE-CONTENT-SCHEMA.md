# Google Content schema

## Architecture

`Google Sheet → bound Apps Script validation/snapshot → repository_dispatch → media import → generated JSON + Astro content → check/ship → existing Git deploy`.

The browser has no runtime dependency on Sheets, Drive, Apps Script or a database. Sheet values control content only; spacing, grid, animation, sticky behavior and component structure remain in Astro/CSS.

## Source of truth and registry

- Human-readable site registry: `content/sheets/site-translations.json`.
- Machine seed: `content/sheets/seed.json`.
- Technical game seed: `content/sheets/games.json`.
- Game field registry: `content/sheets/game-translations.json`.
- Generated build snapshot: `src/generated/content/`.
- Published snapshots: `content/published/` (created only by publish workflow).
- Locale configuration: `locales.mjs` (the frontend and Node content tools import this one list).

Run `npm run content:seed` after adding a known frontend slot or changing English source. `Sync Content from Site` merges that registry into Sheets without deleting translations.

## 01 Site Translations

`Key | Page | Section | Context | Type | EN | DE | PT | ES | Status`

The authoring view also contains hidden `Last Synced`, `Last Published Hash` and `Source Hash` metadata. They drive reliable `Changed`/`SOURCE CHANGED` detection and must not be edited by translators.

Key is immutable. EN is required. Secondary locales may be blank. Types: `plain`, `rich`, `button`, `aria`, `seo_title`, `seo_description`, `alt`. Rich text is sanitized Markdown. Script/iframe/object/embed markup is rejected. SEO title max is 70 characters; SEO description max is 165.

## 02 Games

The columns match the owner sheet. Stable identity is `Game ID`; public routing is immutable `Slug`. Enum contracts:

- Status: `live | coming_soon`
- Type: `slot | instant | table`
- Volatility values: `low | medium | high | very_high`
- Demo Mode: `adapter | direct`

`Card Logo`, `Card Background`, and `Hero Image` remain separate. The current frontend supports legacy flat cards, so existing live rows without Card Logo remain valid; newly layered art can be supplied without flattening.

Hidden metadata follows the same hash model as Site Translations. `Validation Status` is deliberately separate from the public game `Status`, so validation can never overwrite `live`/`coming_soon`.

## 03 Game Translations

`Game | Slug | Field Key | Group | Context | Type | EN | DE | PT | ES | Status`

This sheet also has hidden `Last Synced`, `Last Published Hash` and `Source Hash` columns.

Known fields include `display_name`, `short_description`, `overview`, `gameplay`, `main_feature_label`, `main_feature_body`, `bonus`, `multiplier`, `design_atmosphere`, `layout_display`, SEO and alt. Repeatable feature fields are emitted from the current model as `features.feature_N.title/body`; the adapter also accepts additional stable feature IDs.

## Generated files

`site.{locale}.json` maps stable key to non-empty value. `games.{locale}.json` maps slug to non-empty fields. A missing locale field is absent, not an empty value; `src/lib/i18n.ts` and `src/lib/localized-games.ts` resolve requested locale then EN.

`games.shared.json` stores non-translatable fields. `manifest.json` includes schema version, locales, source hash and record counts. `scripts/content/validate-generated.mjs` blocks malformed generated state before Astro diagnostics or build.

## Image import

`parseDriveReference` accepts Drive file URLs/IDs, HTTPS URLs and project paths. Remote bytes are limited to 20 MB and validated through MIME plus Sharp metadata. SHA-256 + MIME is the duplicate key. Files are written as:

`src/assets/content/{slug}/{card-logo|card-background|hero}-{hash12}.{ext}`

PNG/SVG/WebP alpha is preserved. No old asset is removed by the importer. Astro owns responsive optimization at render time.

## CI contract

`.github/workflows/publish-content.yml` receives `ace-content-publish`, checks out the configured branch, runs importer, `npm run check`, `npm run ship`, and only then commits validated content. The existing Git-connected host deploys that commit. Secrets are `GOOGLE_SERVICE_ACCOUNT_JSON` in GitHub and GitHub/allowlist values in Apps Script Properties—never Sheet cells.

The success reporter updates published hashes and clears game `Changed` only after the pipeline succeeds. A failing validation/import/build leaves production and all Changed flags untouched. The workflow marks a successful repository publication; provider-level deployment confirmation depends on the repository's existing hosting integration.
