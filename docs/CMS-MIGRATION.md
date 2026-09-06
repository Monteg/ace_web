# Webflow + Astro → Ace Games CMS migration

## Источники и приоритет

Миграция не считает Webflow единственной истиной. Для одинакового slug приоритет:

1. текущий нормализованный Astro record;
2. legacy Webflow field только для данных, которых нет в Astro;
3. manual review для конфликтов и неоднозначностей.

Importer никогда не публикует и не «улучшает» тексты автоматически.

## Команды

```bash
npm run cms:migrate -- --csv path/to/webflow-games.csv
npm run cms:parity
npm run cms:migrate-assets
npm run cms:import
```

По умолчанию dry-run package создаётся в ignored `cms/migration-output/`:

- `cms-import.json` — records для normalized collections;
- `assets-manifest.json` — очередь Astro/legacy assets;
- `conflicts.json` — различия источников;
- `warnings.json` — подозрительные, но не блокирующие случаи;
- `unresolved.json` — поля, которые нельзя определить;
- `report.md` — totals;
- `parity.json` — сравнение 17 ключевых полей всех игр.

Ни одна команда migration не делает content active. Для API upload/import нужен scoped `CMS_MIGRATION_TOKEN`, не admin token.

## Field mapping

| Legacy Webflow | CMS |
| --- | --- |
| Name | `internal_name` + EN `display_name` |
| Slug | `games.slug` |
| Relised / Coming | `release_status` через строгую truth table |
| order | `sort_order` |
| Game Type | typed `game_type` |
| card 1 / RTP | `rtp_mode`, `rtp` |
| card 2 / Max Win | `max_win_value`, unit, approx |
| card 3 / Volatility | enum array |
| card 4 / Bet | `bet_min`, `bet_max` |
| card 5 | localized `main_feature` |
| card 6 | localized `layout_display` |
| Play Link / Iframe | structured adapter/direct demo |
| Game cover | `card_image` asset relation |
| hero cover | `hero_image` asset relation |
| image slide 01..N | unlimited `game_gallery` |
| Overview | EN Markdown overview |
| Description 01/02 | repeatable rich_text sections |
| Card 01..03 title/text/icon | feature_grid items/translations/media |
| List Item 01..04 | bullet_list items/translations |
| List Image | section media |
| Slider / Iframe flags | удалены; state выводится из demo/gallery |

## Status mapping

Только две комбинации принимаются:

| Relised | Coming | Result |
| --- | --- | --- |
| true | false | `live` |
| false | true | `coming_soon` |

Любая другая комбинация записывается как `MIGRATION CONFLICT`. Скрипт не угадывает.

## Demo mapping

- Host `adapter-api-demo.rstars.cc`: извлекается `gameId`, проверяется UUID, `lobbyUrl` отбрасывается.
- Известный direct CDN format: извлекаются build/version/apiHost.
- Неизвестный/сломанный URL: demo остаётся disabled и создаётся warning.

После импорта frontend снова строит URL из typed data и текущего slug.

## Type и stats

Legacy `Slot`, `Instant`, `Table` нормализуются без переосмысления. Архитектура поддерживает `Crash`, но importer не превращает Instant в Crash автоматически. Каждая legacy Instant game получает `NEEDS_CRASH_INSTANT_REVIEW`.

RTP, max win, volatility и bet парсятся семантически. Неподтверждённая max-win unit, неверный диапазон или inconsistent label попадают в report.

## Content anomalies

Скрипт отдельно ищет:

- идентичный длинный текст у разных игр;
- reuse одного asset у разных owners/roles;
- отсутствующий Play Link;
- missing unit;
- conflicting status;
- unknown type/demo format;
- отсутствующие card/hero;
- incomplete gallery state.

Такие случаи не исправляются молча. Например идентичные overviews `good-staf` и `toy-story` остаются в report до решения владельца контента.

## Media migration

1. Asset manifest сначала выбирает актуальный Astro asset.
2. Legacy URL используется только если нового asset нет.
3. `cms:migrate-assets` читает source, проверяет MIME и загружает в Directus один раз.
4. Manifest получает `cms_asset_id`.
5. `cms:import` связывает UUID с games/sections/gallery.
6. Перед cutover убедиться, что production release не зависит от Webflow CDN.

Рекомендуется после upload вручную проверить crop/card/hero, прозрачность layered logos и alt.

## Текущий dry-run отчёт

Дата прогона: 6 сентября 2026. Вход: `scripts/cms/fixtures/webflow-sample.csv` плюс все current Astro records.

| Проверка | Результат |
| --- | --- |
| Astro games | 24 |
| Migrated games | 24 |
| Parity fields per game | 17 |
| Parity differences | 0 |
| Source conflicts | 1 |
| Warnings | 1 |
| Unresolved fields | 0 |
| Assets queued | 50 |

Source conflict: sample Webflow row `pirates-rush` имеет `sort_order = 10`, тогда как current Astro record использует default `100`. По правилу приоритета сохранено current Astro value.

Warning: `good-staf` и `toy-story` имеют идентичный overview. Текст не изменён автоматически.

Этот dry-run подтверждает parity с current Astro intention, но не является финальным экспортом всей Webflow production collection: в репозитории есть только sample CSV. Перед реальным cutover повторить команды на полном актуальном CSV и заменить этот раздел фактическим отчётом.

## Manual review checklist

1. Получить полный свежий Webflow CSV.
2. Запустить migration в чистую output directory.
3. Просмотреть все conflicts, warnings и unresolved.
4. Подтвердить Instant vs Crash вручную.
5. Подтвердить all live/coming-soon statuses и order.
6. Проверить demo каждого live title.
7. Проверить max-win units, RTP и bet ranges.
8. Сопоставить 24 Card/Hero и все gallery images.
9. Решить duplicate copy/assets, ничего не заменяя предположениями.
10. Загрузить media, затем импортировать records как Draft.
11. Проверить relation counts и English translation completeness.
12. Перевести English statuses в Approved только после editorial review.
13. Запустить `cms:parity`, schema/model tests и staging full publish.
14. Выполнить browser QA на English и минимум одной secondary locale.
15. Только после успешного staging release переключить production `CONTENT_SOURCE=cms`.

## Cutover и rollback миграции

До cutover используется `CONTENT_SOURCE=local`. Затем build получает `CONTENT_SOURCE=cms` и конкретный `CMS_RELEASE_ID`. Markdown остаётся read-only legacy backup на переходный период; нельзя редактировать CMS и Markdown параллельно как две истины.

Если первый CMS release не проходит parity/gates, production остаётся на предыдущем static deploy. Если CMS release уже активен, используйте release rollback, а не ручное редактирование snapshot JSON.
