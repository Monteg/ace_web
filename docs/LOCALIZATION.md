# Localization

## Locales and routing

The single runtime locale list is `locales.mjs`: `en`, `it`, `pt`, `es`. Both `src/lib/i18n.ts` and `astro.config.mjs` consume it; English remains unprefixed.

- EN: `/`, `/games`, `/portfolio/pirates-rush`
- DE: `/de`, `/de/games`, `/de/portfolio/pirates-rush`
- PT and ES follow the same pattern.

Slugs are never translated. Astro's native i18n fallback generates localized games, event, legal, thanks, under-18, 404 and every game route; explicit locale index pages provide `/de`, `/pt`, and `/es`. `effects-lab` is intentionally excluded from the sitemap.

## Field-level fallback

`t(key, locale)` and `gameText(slug, field, locale)` resolve the requested non-empty locale value, then EN. Fallback never redirects and never changes the page URL. Missing locale values are warnings in authoring, not build errors.

The Event page uses `getLocalizedEvent()` for campaign copy, featured-game descriptions, team and topic content. Its surrounding UI, SEO, date formatting, accessibility labels, booking form and generated meeting email also resolve through locale-aware helpers and `event.*` translation keys.

## Language switcher

`Header.astro` strips any current locale prefix and applies the chosen locale to the same pathname, query and hash. A visitor on `/de/portfolio/pirates-rush` switching to PT lands on `/pt/portfolio/pirates-rush`, not the homepage.

## SEO

`Base.astro` sets localized `<html lang>`, canonical, all four hreflang alternates and `x-default`. Page title/description and OG title/description use the same localized content. Sitemap includes active locale routes and excludes `under-18`/technical pages.

## Adding a locale later

Add the locale once to `locales.mjs`, generate its Sheet column and JSON file, add it to Apps Script `ACE.locales`, and include the statically imported generated JSON in the adapter. Components do not contain their own locale lists or fallback rules.

## Adding a content slot

1. Add one registry row with stable key, Page, Section, Context, Type and EN.
2. Render it through `t()` or the higher-level content adapter.
3. Run `npm run content:seed` and tests.
4. After merge, run `Sync Content from Site`; do not create arbitrary keys directly in Sheets.

## QA matrix

Check widths 375, 768, 1024 and 1440, especially long Portuguese/German strings. Do not globally shrink typography to fix one translation. Verify visible labels, aria-labels, alt text, form controls, canonical/hreflang, game cards, layered hover clipping and the locale-preserving switcher.
