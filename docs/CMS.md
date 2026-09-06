# Ace Games CMS: руководство редактора

## Что это за система

Ace Games CMS — закрытая редакторская система на Directus. Она управляет играми, изображениями, текстами сайта, FAQ и переводами. Публичный сайт не обращается к CMS из браузера: после публикации Astro собирает обычные статические HTML-страницы.

Это даёт два независимых состояния:

- **Working content** — сохранённые в CMS черновики;
- **Active release** — последняя версия, которая успешно прошла сборку и сейчас показана посетителям.

Кнопка **Save** меняет только working content. Кнопка **Publish** создаёт новый release и запускает сборку. Не путайте эти действия.

## Вход и роли

Production-адрес задаётся переменной `CMS_URL`; планируемый адрес — `https://cms.acegames.io`. Учётную запись создаёт Administrator.

Роли:

| Роль | Возможности |
| --- | --- |
| Administrator | Все настройки Directus, пользователи, schema, content и releases |
| Content Manager | Игры, блоки, изображения, переводы, просмотр и публикация releases |
| Translator | Переводы и чтение исходного контента, без характеристик игры и production publish |
| Viewer | Только чтение |
| Sheet Integration | Ограниченная техническая учётная запись Google Sheets |
| Build Reader | Только чтение конкретных release snapshots во время сборки |

Никогда не передавайте admin token в Google Sheet, frontend или build logs.

## Основные разделы

- **Games** — общие, не переводимые данные игр: slug, status, order, type, RTP, volatility, demo и основные изображения.
- **Game Translations** — название, описание, overview, SEO и alt для каждого языка.
- **Game Sections** — произвольное число структурных блоков страницы игры.
- **Game Section Items** — карточки и пункты внутри repeatable-блоков.
- **Game Gallery** — произвольное число изображений галереи.
- **Site Strings** — известные frontend-слоты Header, главной, каталога, модалок, Footer и служебных страниц.
- **FAQ Items** — повторяемый список FAQ.
- **Files** — Media Library Directus.
- **Locales** — языки и SEO-настройки локалей.
- **Content Releases** — история production snapshots, ошибок и rollback.

Events первой версии остаются в коде и не редактируются через CMS.

После `npm run cms:bootstrap` Games открывается готовой таблицей: Order, Game,
Status, Type, RTP, Demo, Card/Hero media и Translations. Directus сохраняет
поиск, сортировку, фильтры, inline edit и bulk selection. Translator получает
отдельный tabular preset для locale/status/text, Releases сортируются от новой
версии к старой.

## Как создать игру

1. Откройте **Games** и нажмите **Create Item**.
2. Заполните `Internal Name`, уникальный `Slug`, `Release Status`, `Order` и `Game Type`.
3. Заполните характеристики в группе **Game Data**.
4. Загрузите `Card Image` и `Hero Image`. Для двухслойной анимации карточки дополнительно загрузите `Card Background Image` и `Card Logo Image`.
5. Настройте Demo или оставьте `Demo Enabled` выключенным.
6. Сохраните игру. Она остаётся черновиком и не появляется на сайте.
7. В **Translations** добавьте English, заполните все обязательные поля и только после проверки поставьте `Approved`.
8. При необходимости добавьте Sections, Items и Gallery. Для каждого видимого элемента должен существовать Approved English translation.
9. Проверьте страницу и данные, затем публикуйте игру отдельным выбранным изменением.

Slug становится частью URL `/portfolio/{slug}`. После первой успешной публикации обычный Content Manager не может тихо изменить его. Для смены нужен Administrator и 301 redirect в `public/_redirects` в том же релизе.

## Как изменить существующую игру

1. Найдите игру по имени или slug.
2. Измените только требуемые поля.
3. Нажмите **Save**.
4. Если менялся текст, проверьте статус соответствующего перевода.
5. Запустите localization check. English errors нужно исправить; secondary-locale warnings допускают English fallback.
6. Выберите только готовые строки и нажмите **Publish**.

Изменения другой игры, сохранённые в CMS, но не выбранные для Publish, останутся в working content и не попадут в новый snapshot.

## Порядок и Coming Soon

- Меньший `Sort Order` поднимает игру выше.
- `Live` и `Coming Soon` — единственные допустимые release statuses.
- `Coming Soon` остаётся видимой в каталоге, но публичный Play недоступен.
- Смена порядка или статуса требует Save, затем Publish выбранной game row.

## Demo

Готовая Play-ссылка не хранится.

Для adapter:

- `Demo Enabled`: on;
- `Demo Mode`: `adapter`;
- `Demo Game ID`: UUID игры.

Для direct build:

- `Demo Enabled`: on;
- `Demo Mode`: `direct`;
- `Direct Build`: имя build;
- `Direct Version`: положительное целое число;
- `API Host`: optional URL.

Frontend сам собирает URL. Чтобы убрать player, выключите `Demo Enabled`.

## Media Library

Используйте папки `Games`, `Site`, `Brand`, `Legacy`, а внутри `Games` — подпапку конкретной игры. Directus поддерживает upload, drag and drop, preview, reuse и import URL.

Перед загрузкой:

- используйте финальный файл, а не временный URL;
- задайте понятное имя;
- не загружайте одинаковый файл повторно;
- убедитесь, что изображение принадлежит Ace Games или разрешено к использованию;
- заполните локализованный alt в translation record.

Production storage задаётся через `STORAGE_*` и может быть любым S3-compatible provider. Провайдер не зашит в schema.

## Контентные блоки

`Game Sections` поддерживает:

- `rich_text` — Markdown heading/body;
- `feature_grid` — repeatable cards из Section Items;
- `bullet_list` — repeatable bullets из Section Items;
- `media_text` — media и локализованный текст.

Можно добавлять, выключать и переставлять любое число блоков. Новый произвольный layout всё ещё требует frontend component; CMS не является arbitrary page builder.

## Save и Publish

### Save

- сохраняет working data;
- создаёт revision history Directus;
- не меняет публичный сайт;
- допускает незавершённые secondary translations.

### Publish

- проверяет выбранные сущности;
- сливает их с предыдущим active snapshot;
- создаёт immutable `content_releases` record с checksum;
- вызывает provider-neutral deploy webhook;
- запускает CMS sync, Astro check, build и 14 production gates;
- только после signed success callback делает release активным.

Если сборка упала, новый release получает `Failed`, а предыдущий остаётся live.

## Ошибки и предупреждения

Publish блокируется при:

- пустом обязательном English поле;
- English translation не в `Approved`;
- неправильном slug, RTP, type или status;
- пустом volatility;
- некорректном max win или bet range;
- неполной demo-конфигурации;
- отсутствующих Card/Hero;
- broken relation;
- неправильном media UUID;
- изменённом checksum.

Warnings не ломают English-сайт: missing/draft secondary translation, untranslated alt или SEO используют English fallback. Их нужно закрыть до языкового запуска.

В `Content Releases` смотрите `Status`, `Deploy Status`, `Deploy URL` и `Error Log`. Не пытайтесь исправлять JSON snapshot вручную.

## Отчёт локализации

Read-only отчёт working content доступен авторизованным CMS-пользователям по
`GET /ace-releases/localization-report`. Он не читает active release, поэтому
показывает проблемы до публикации. Для каждой игры и locale возвращаются
процент заполнения, текущий status, missing fields, SEO/alt gaps и признак
Approved. Для Site Strings возвращается locale summary.

Фильтры можно комбинировать:

- `?locale=it&state=missing` — Missing Italian;
- `?locale=de&state=draft` — Draft German;
- `?scope=games&seo_missing=true` — untranslated SEO;
- `?scope=games&without_approved=true` — games без Approved translation;
- `?game=pirates-rush` — одна игра.

Для редактора без API-инструментов тот же отчёт с цветами и фильтрами доступен
через **Ace CMS → Проверить локализацию** в Google Sheet.

## Rollback

1. Откройте **Content Releases**.
2. Найдите прошлый release со статусом `Published`.
3. Запустите действие **Redeploy** для его UUID или попросите администратора выполнить `npm run cms:rollback -- --release <uuid>`.
4. Система создаст новый release с новой версией, но содержимым выбранного snapshot.
5. После успешной сборки он станет active.

Rollback не удаляет и не перезаписывает working drafts.

## Локальный запуск для разработчика

1. Установить Docker Desktop.
2. Скопировать `.env.example` в `cms/.env` и заменить все небезопасные значения.
3. Выполнить `docker compose up -d` из `cms/`.
4. Выполнить `npm run cms:bootstrap` из корня проекта.
5. Открыть `http://localhost:8055`.

На машине, где была подготовлена эта версия, Docker отсутствовал. Поэтому schema, scripts и тесты проверены статически, но реальный Directus stack и production webhook требуют интеграционного прогона после выдачи инфраструктуры и credentials.
