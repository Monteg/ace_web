# CMS parity checkpoint

Date: 6 September 2026

Command sequence:

```bash
npm run cms:migrate -- --csv scripts/cms/fixtures/webflow-sample.csv
npm run cms:parity
```

Result:

- local Astro games: 24;
- normalized migration games: 24;
- checked fields per game: 17;
- parity differences: 0;
- migration source conflicts: 1;
- migration warnings: 1;
- unresolved fields: 0;
- assets queued: 50.

Checked per game: slug/presence, name, status, effective order, type, RTP value/mode, volatility, max win, bet, main feature, layout, structured demo, Card, Hero, reconstructed overview, repeatable features and highlights.

The source conflict is the sample Webflow `pirates-rush` order (`10`) versus current Astro effective order (`100`); current Astro wins by migration policy. The warning is identical overview copy in `good-staf` and `toy-story`; it was reported and not silently edited.

This checkpoint uses the committed one-row Webflow fixture, not a full production export. It proves that all 24 current Astro records survive normalization without parity loss. A final production cutover still requires a fresh full Webflow CSV, asset upload, Directus staging import and browser QA.
