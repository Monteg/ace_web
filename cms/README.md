# Ace Games CMS infrastructure

This directory runs the private editorial system. The public Astro website
remains a static build and never queries Directus from a visitor's browser.

## Local start

1. Install Docker Desktop.
2. Copy the repository `.env.example` to `cms/.env`.
3. Replace every `change-me` and `replace-with-*` value.
4. From this directory run `docker compose up -d`.
5. Open `http://localhost:8055` and sign in with the configured admin account.
6. From the repository root run `npm run cms:bootstrap`.
7. Create scoped users/tokens for Sheet Integration and Build Reader; do not
   reuse the Administrator account.
8. Run `npm run test:cms-model`.

Database files and local uploads live in `cms/data/` and are deliberately
ignored by Git. Production uses the same container configuration with an
external PostgreSQL database and an S3-compatible storage driver supplied by
environment variables.

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
presets idempotently. To update only table layouts, run `npm run cms:presets`.

## Production

Use external PostgreSQL and persistent S3-compatible storage configured with
environment variables. Configure `DEPLOY_WEBHOOK_URL`,
`DEPLOY_WEBHOOK_SECRET` and `ACE_TRUSTED_PUBLISHERS`. The public website stays
static and reads only a release during build. See `docs/CMS-RELEASES.md`.
