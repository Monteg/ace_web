# Ace Games CMS infrastructure

This directory runs the private editorial system. Astro reads Directus only on
the server; visitor browsers never fetch CMS text directly. The default
production build remains static until live mode is deliberately selected.

## Local start

1. Install and start Docker Desktop.
2. From the repository root run `npm run cms:setup`.
3. Open `http://localhost:8055` and `http://localhost:4321`.
4. Run `npm run cms:credentials` to display the generated local login.

The setup command generates a private `cms/.env`, starts PostgreSQL and
Directus, applies schema/access/presets, seeds the current 24 games and real
media, starts Astro in live CMS mode and runs the smoke checks.

PostgreSQL and uploads use the named volumes `ace_cms_db` and
`ace_cms_uploads`. `npm run cms:stop` preserves both. The explicitly
destructive `npm run cms:reset -- --confirm-destroy-local-cms` removes them.
Production can use an external PostgreSQL database and S3-compatible storage
through environment variables.

Do not expose an administrator token to Astro client code or Google Sheets.
Build and Sheets tokens use separate scoped Directus policies.

## What is mounted

- `schema/`: locales, games, translations, repeatable content, gallery, site
  strings, FAQ and release snapshots;
- `access-policies.json`: Content Manager, Translator, Viewer, Sheet
  Integration and Build Reader;
- `presets.json`: default Directus table layouts for Games, Translations and
  Releases;
- `extensions/ace-game-validation`: game and published-slug protection;
- `extensions/ace-release-workflow`: selective publish, webhook callback and
  rollback, plus the read-only localization report.

`npm run cms:bootstrap` applies the schema, seed data, access policies and UI
presets idempotently. `npm run cms:smoke` performs read-only health checks;
`npm run cms:workflow-test` exercises and rolls back Create Game, Coming Soon,
translation/fallback, ordering, media upload/swap and Directus version publish.
To update only table layouts, run `npm run cms:presets`.

## Content modes

- `CONTENT_SOURCE=local` keeps the established Markdown production fallback.
- `CONTENT_SOURCE=cms` with `CMS_CONTENT_MODE=live` server-renders current
  Directus Main content with a five-second stale-safe cache.
- `CONTENT_SOURCE=cms` with `CMS_CONTENT_MODE=release` retains immutable static
  releases and the deployment webhook workflow.

In Directus live mode, edit in a named Content Version, press Save, then
**Promote Version** to publish it to Main. The site never reads unpromoted
versions.

## Production

Static release production uses external PostgreSQL and persistent
S3-compatible storage plus `DEPLOY_WEBHOOK_URL`, `DEPLOY_WEBHOOK_SECRET` and
`ACE_TRUSTED_PUBLISHERS`; see `docs/CMS-RELEASES.md`. Runtime staging uses the
Astro Node adapter included in this repository and a server-only
`CMS_LIVE_TOKEN` assigned to the **Live Reader** policy. Production DNS is not
changed by these scripts.
