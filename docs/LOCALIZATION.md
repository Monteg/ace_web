# Ace Games localization

## Master locale и fallback

English (`en`) — единственный default и master locale. Нельзя удалить English, сделать другой язык вторым default или публиковать обязательный контент без Approved English.

Алгоритм один для всего сайта:

1. Найти requested locale translation.
2. Использовать её только при `translation_status = approved`.
3. Иначе использовать Approved English и записать build warning.
4. Если English отсутствует, остановить publish/build.

Frontend не должен показывать `undefined`, `null`, `translation_missing` или технический key посетителю.

## Статусы переводов

| Status | Значение | Попадает в локализованный output |
| --- | --- | --- |
| `draft` | Работа не закончена | Нет, используется English fallback |
| `review` | Готово к редактуре/проверке | Нет, используется English fallback |
| `approved` | Проверено и разрешено к публикации | Да |
| Blank | Перевод отсутствует | Нет, считается Missing |

Save не меняет production. Status Approved сам по себе тоже не меняет production: соответствующую translation row нужно включить в Publish.

## Что локализуется

- Header, announcement и Age Gate;
- homepage headings, descriptions, cards, buttons, aria labels и FAQ;
- Games page, filters и GameTile labels;
- game detail text, specs labels, media/player/gallery UI;
- modal и Contact form;
- Footer;
- thanks, 404 и under-18;
- Terms/Privacy shell и page metadata;
- title, description, OG locale, alt и aria strings;
- global enums типов, статусов и volatility.

Events первой версии исключены и остаются English-only. `/effects-lab` — закрытая техническая English-only страница.

## Структура данных

- `locales` — доступные языки;
- `game_translations` — identity, overview, SEO и alt игры;
- `game_section_translations` — heading/body блоков;
- `game_section_item_translations` — title/text repeatable items;
- `game_gallery_translations` — alt/caption изображений;
- `site_string_translations` — UI slots;
- `faq_item_translations` — question/answer.

Shared values RTP, demo, order, game type и media relations не дублируются на языках.

## Как добавить язык

1. Administrator создаёт запись в `locales`.
2. Заполняет:
   - `code`: короткий URL code, например `it`;
   - `name`: English name;
   - `native_name`: название для switcher;
   - `is_default`: false;
   - `is_active`: сначала false;
   - `sort_order`;
   - `fallback_locale`: `en`;
   - `direction`: `ltr` или `rtl`;
   - `hreflang`: SEO value.
3. Переводчики заполняют Site Strings, FAQ, Games, Sections, Items, Gallery alt и SEO.
4. Localization report проверяется по Missing/Draft/Review.
5. После готовности язык включается через `is_active` и публикуется release.
6. Build проверяет routes, metadata и fallback.

Locale columns в Google Sheets создаются динамически при Pull. Добавление Polish в CMS создаст PL/PL Status columns без изменения Apps Script schema.

## Как переводить игру

1. Откройте parent game и English source.
2. Создайте translation для нужной locale.
3. Переведите все поля, включая SEO title/description и оба alt.
4. Не переводите slug и технические значения.
5. Сохраните Draft.
6. После языковой проверки смените status на Review, затем Approved.
7. Повторите для enabled sections, items и gallery.
8. Опубликуйте выбранные translation keys.

Game translation status относится ко всей translation record. Если Approved secondary translation существует, обязательные поля должны быть заполнены согласованно.

## Как переводить UI сайта

`site_strings.key` — стабильный контракт между CMS и кодом. Примеры: `header.games`, `home.hero.title`, `footer.legal`, `game.play`.

- Редактор меняет `value`, а не key.
- `page`, `section`, `context` помогают фильтровать и понимать место строки.
- `type` фиксирует назначение: plain, rich, button, aria, seo_title, seo_description.
- `required` означает hard error при пустом English.
- `max_length` даёт редакторское ограничение, если оно задано.
- `active = false` исключает slot из новых releases.

Создать дополнительный repeatable FAQ/item можно без кода. Создание произвольного key, например `home.random_banner`, не создаёт layout: frontend должен знать, где отрисовать slot.

## Translation Matrix в Google Sheets

Одна строка — одно конкретное поле, колонки языков формируются из active locales. Системные поля скрыты.

Полезные фильтры:

- Scope = `Site`, `Website`, `Game`, `Game Content`, `Media`;
- Page = `Home`, `Game`, `Global`;
- Type = `seo_title`, `seo_description`, `aria`, `rich`;
- locale status = Draft/Review/Approved;
- blank locale value = Missing;
- Entity/Context = нужная игра или UUID блока.

Цвета: red — missing, yellow — draft, blue — review, green — approved.

## URL rules

English без prefix:

- `/`;
- `/games`;
- `/portfolio/pirates-rush`.

Secondary locale:

- `/it`;
- `/it/games`;
- `/it/portfolio/pirates-rush`.

Game slug не переводится. Language Switcher сохраняет текущий page path. Автоматического browser-language redirect нет: вход по умолчанию всегда English.

## SEO

Для каждого active locale build формирует:

- `<html lang>` и `dir`;
- localized `<title>` и description;
- locale-specific canonical;
- `hreflang` для всех active locales;
- `x-default` на English URL;
- localized Open Graph locale/title/description;
- localized structured data;
- localized sitemap URLs.

Missing secondary SEO создаёт warning и English fallback. Missing English SEO блокирует release.

## Localization report и QA

Минимальные отчёты:

- Missing Italian;
- Draft German;
- untranslated SEO;
- untranslated alt;
- games without Approved translation;
- процент Approved/Missing на каждой игре и locale.

В Directus эти данные отдаёт авторизованный read-only endpoint
`/ace-releases/localization-report`. Query parameters: `scope=games|site`,
`locale`, `state=missing|draft|review|approved`, `seo_missing=true`,
`without_approved=true`, `game=<slug-or-uuid>`. Процент означает заполненность
полей; approval показывается отдельно, поэтому заполненный Draft не выглядит
как Published/Approved. В Google Sheet команда **Проверить локализацию** строит
тот же редакторский срез с conditional formatting.

Минимальные browser checks для каждой новой locale:

- `/` и `/{locale}`;
- `/games` и `/{locale}/games`;
- `/portfolio/pirates-rush` и `/{locale}/portfolio/pirates-rush`;
- Language Switcher сохраняет route;
- длинные строки не создают overflow;
- fallback показывает English, а не пустоту;
- metadata, alt и aria локализованы;
- canonical/hreflang/x-default корректны.

Автоматические тесты находятся в `scripts/cms/localization.test.mjs` и `src/i18n/routes.test.mjs`. Выполнить `npm run test:cms-model`, `npm run check` и `npm run ship`.
