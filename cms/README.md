# Ace Games CMS infrastructure

This directory runs the private editorial system. The public Astro website
remains a static build and never queries Directus from a visitor's browser.

## Local start

1. Install Docker Desktop.
2. Copy the repository `.env.example` to `cms/.env`.
3. Replace every `change-me` and `replace-with-*` value.
4. From this directory run `docker compose up -d`.
5. Open `http://localhost:8055` and sign in with the configured admin account.
6. From the repository root run `npm run cms:bootstrap` after the Games model
   commit has been applied.

Database files and local uploads live in `cms/data/` and are deliberately
ignored by Git. Production uses the same container configuration with an
external PostgreSQL database and an S3-compatible storage driver supplied by
environment variables.

Do not expose an administrator token to Astro client code or Google Sheets.
Build and Sheets tokens use separate scoped Directus policies.

