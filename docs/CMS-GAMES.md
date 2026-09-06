# Ace Games CMS: модель игры

## Принцип

Одна запись `games` хранит shared data. Тексты не дублируют RTP и demo для каждого языка: локализуемое содержимое находится в translation collections и ссылается на ту же игру.

## Поля `games`

| Поле | Что означает | Обязательность и пример | Где используется |
| --- | --- | --- | --- |
| `id` | Стабильный UUID | Auto, не редактировать | Relations, Sheet metadata, releases |
| `internal_name` | Внутреннее имя | Required, `Pirates Rush` | CMS table и поиск; публичное имя берётся из translation |
| `slug` | Не локализуемая URL-часть | Required unique, `pirates-rush` | `/portfolio/pirates-rush` для всех языков |
| `published_slug` | Первый опубликованный slug | Auto/read-only | Блокирует незаметное изменение публичного URL |
| `release_status` | Состояние каталога | `live` или `coming_soon` | Sort, badge, доступность Play |
| `sort_order` | Ручной порядок | Integer, обычно шаг 10/100 | Каталог и связанные списки |
| `game_type` | Тип игры | `slot`, `instant`, `crash`, `table` | Filters, badge, catalogue grouping |
| `rtp_mode` | Способ задания RTP | `fixed` или `configurable` | Спецификация игры |
| `rtp` | RTP в decimal form | Для fixed: `0.948`; 0.8–0.995 | Frontend форматирует как `94.8%` |
| `volatility` | Одна или несколько зон | JSON array: `['medium','high']` | Meter, filters, Maths |
| `max_win_value` | Числовой max win | Optional, `120000` | Spec strip |
| `max_win_unit` | Единица max win | Вместе с value: `x` или `coins` | Форматирование max win |
| `max_win_approx` | Значение приблизительное | Boolean | Добавляет корректный qualifier |
| `bet_min` | Минимальная ставка | Optional pair с `bet_max` | Spec strip |
| `bet_max` | Максимальная ставка | `bet_min <= bet_max` | Spec strip |
| `demo_enabled` | Показывать Play/player | Boolean | Вычисление `hasPlayer` |
| `demo_mode` | Транспорт demo | `adapter`, `direct`, null | URL helper |
| `demo_game_id` | Adapter game UUID | Required только для adapter | URL helper |
| `direct_build` | Имя direct build | Required только для direct | URL helper |
| `direct_version` | Версия direct build | Positive integer | URL helper |
| `api_host` | Optional API host | Полный URL | URL helper, только direct |
| `card_image` | Основной cover | Required для publish | Game tile и fallback art |
| `hero_image` | Широкий hero | Required для publish | Detail header и media fallback |
| `card_background_image` | Отдельный background tile | Optional | Layered hover animation |
| `card_logo_image` | Отдельный logo tile | Optional; использовать парой с background | Layered hover animation |
| `legacy_webflow_id` | Старый Webflow item ID | Migration-only | Аудит происхождения |
| `legacy_source_url` | Старый источник | Migration-only | Аудит происхождения |
| `created_at`, `updated_at` | Время Directus | Auto | История и conflict protection |
| `created_by`, `updated_by` | Пользователь Directus | Auto | Аудит и revisions |

### Правила чисел

- RTP хранится decimal, не строкой и не процентом.
- Configurable RTP требует `rtp = null`.
- Max win value и unit задаются вместе либо оба отсутствуют.
- Bet min/max задаются вместе; min не может превышать max.
- Volatility содержит минимум одно значение из фиксированного enum.

### Правила Demo

`demo_enabled = false` означает отсутствие публичного iframe независимо от заполненных технических полей. Для enabled adapter нужен UUID. Для enabled direct нужны build и positive version. Готовые Play URL и `lobbyUrl` не являются данными CMS.

## Поля `game_translations`

| Поле | Назначение | Required | Где показано |
| --- | --- | --- | --- |
| `game_id` | Parent game | Да | Relation |
| `locale` | Язык | Да | Locale route/fallback |
| `display_name` | Публичное название | Да | Card accessibility, heading, metadata |
| `short_description` | Короткое описание | Да | Catalogue/detail intro |
| `overview` | Основной Markdown | Да | Game detail |
| `main_feature` | Короткая характеристика | Нет | Spec strip |
| `layout_display` | Читаемое расположение reels/lines | Нет | Spec strip |
| `seo_title` | `<title>` и OG title | Да, до 70 символов | Localized metadata |
| `seo_description` | Meta/OG description | Да, 60–165 символов | Localized metadata |
| `card_alt` | Alt cover | Да | Accessibility |
| `hero_alt` | Alt hero | Да | Accessibility |
| `translation_status` | Workflow | `draft`, `review`, `approved` | Publish/fallback |
| `updated_at`, `updated_by` | Revision metadata | Auto | Conflict protection |

Public build использует requested translation только со статусом `approved`. Иначе берёт Approved English. Нет Approved English — hard error.

## `game_sections`

| Поле | Назначение |
| --- | --- |
| `id` | UUID блока |
| `game_id` | Parent game |
| `section_type` | `rich_text`, `feature_grid`, `bullet_list`, `media_text` |
| `detail_slot` | Явная зона detail page: `sidebar_features`, `gameplay`, `main_feature`, `bonus`, `multiplier`, `additional` |
| `sort_order` | Порядок на detail page |
| `enabled` | Включён ли блок в snapshot |
| `media_file` | Optional image для media-aware layouts |
| `style_preset` | `default`, `wide`, `compact`, `media_left`, `media_right` |

`game_section_translations` содержит `heading`, `body_markdown`, `locale`, `translation_status`. Markdown допускает headings, paragraphs, lists и links; arbitrary HTML/scripts не являются canonical content.

`detail_slot` определяет renderer без эвристик по заголовку:

- `sidebar_features` — список **Features** справа от demo;
- `gameplay`, `main_feature`, `bonus`, `multiplier` — семантические группы, которые текущий стабильный шаблон выводит последовательно в Overview;
- `additional` — обычный дополнительный блок в том же контентном потоке.

Значения групп сохраняются в CMS, поэтому будущий tabbed renderer можно подключить без повторной миграции контента. В этой ветке интерфейс detail page намеренно остаётся таким же, как в стабильной версии `d82682a`.

Новые и legacy sections по умолчанию получают `additional`. Bootstrap безопасно заполняет только существующие записи с `NULL`, не перезаписывая ручной выбор. Импортёр переводит legacy `feature_grid` и `bullet_list` в `sidebar_features`.

## `game_section_items`

Repeatable items позволяют иметь любое число feature cards или bullets без изменения schema.

| Shared field | Назначение |
| --- | --- |
| `section_id` | Parent section |
| `sort_order` | Порядок внутри блока |
| `enabled` | Показ/скрытие |
| `icon_file` | Optional icon |
| `image_file` | Optional image |

Localized fields в `game_section_item_translations`: `title`, `text`, `locale`, `translation_status`.

## `game_gallery`

Каждая строка — самостоятельный gallery item:

- `game_id`: parent game;
- `file`: CMS asset;
- `sort_order`: позиция;
- `enabled`: публиковать ли элемент.

`game_gallery_translations` хранит обязательный `alt`, optional `caption` и status. Количество элементов не ограничено. UI-состояние вычисляется из данных:

| Demo | Gallery | Результат |
| --- | --- | --- |
| Да | Да | player + gallery |
| Да | Нет | player only |
| Нет | Да | gallery only |
| Нет | Нет | hero fallback |

Старые `Slider`/`Iframe` flags не используются.

## Какие значения переводятся глобально

Enums не копируются в каждую игру. UI использует `site_strings` keys:

- `game.type.slot`, `game.type.instant`, `game.type.crash`, `game.type.table`;
- `game.volatility.low`, `medium`, `high`, `very_high`;
- `game.status.live`, `game.status.coming_soon`;
- `game.play`, `game.gallery`, `game.related_games`.

## Publish checklist игры

1. Slug корректен и не меняет опубликованный URL без redirect.
2. Card и Hero загружены в CMS storage.
3. Specs проходят ограничения.
4. Demo либо выключено, либо полностью настроено.
5. English game translation заполнена и Approved.
6. Каждый enabled section/item имеет Approved English.
7. Каждый enabled gallery item имеет file и Approved English alt.
8. Secondary statuses и fallback warnings просмотрены.
9. Выбраны только изменения, которые должны войти в release.
