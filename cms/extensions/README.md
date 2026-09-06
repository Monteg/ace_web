# Directus extensions

Ace Games-specific Directus extensions are mounted from this directory.

- `ace-game-validation` protects structured game fields and published slugs.
- `ace-release-workflow` exposes authenticated publish, rollback and signed
  deployment-callback endpoints. It snapshots content without turning Directus
  into a runtime dependency for website visitors.

Authentication, user management, revision history, CRUD and the media library
remain native Directus features.
