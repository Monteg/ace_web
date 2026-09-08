# Ace Games — Google Content: быстрый старт

Рабочая таблица: [Ace Games — Content & Localization](https://docs.google.com/spreadsheets/d/1bqKvO2lhsg7wwndABXyDQU9S3j5XpHDn3ZR0U5faAOk/edit)

Google Sheet используется только редакторами. Посетители сайта никогда не загружают текст или изображения из Google Sheets/Drive: кнопка Publish создаёт неизменяемый snapshot, после чего Astro собирает обычный статический сайт.

Сейчас в таблице уже находятся 230 строк сайта, 24 игры и 366 переводимых полей игр. English заполнен реальным контентом проекта; IT/PT/ES оставлены пустыми и поэтому показывают English fallback до перевода.

## Что находится на листах

- `01 Site Translations` — весь интерфейс, страницы, SEO, aria-label и общие alt. EN — исходный язык; IT, PT и ES — переводы.
- `02 Games` — технические данные 24 игр: порядок, live/coming soon, тип, RTP, volatility, max win, bet, demo и три изображения.
- `03 Game Translations` — название, описание, game detail, features, SEO и alt каждой игры.
- `04 Settings` — публичные настройки проекта. Секретов здесь нет и быть не должно.
- `05 Publish Log` — история публикаций и текст ошибки, если CI не прошёл.

## Как перевести строку

1. Откройте `01 Site Translations`.
2. Найдите строку по `Page`, `Section` или `Key`.
3. Прочитайте `Context`: он объясняет, где и как используется фраза.
4. Введите перевод в IT, PT или ES. Для `rich` используйте Markdown, не HTML.
5. Не меняйте `Key`: это технический контракт с кодом.

Пустая locale-ячейка означает English fallback. Например, пустой IT для кнопки на `/it/games` покажет английский текст, но URL останется итальянским.

Статусы:

- `Missing` — один или несколько переводов пусты; публикация разрешена и сработает EN fallback.
- `Ready` — все три перевода заполнены.
- `Changed` / `SOURCE CHANGED` — значение отличается от опубликованного либо изменился английский источник.
- `Error` — блокирующая ошибка: например, пустой EN, дубль ключа или небезопасный HTML.

## Как изменить игру

На `02 Games` найдите строку по Slug. Доступны только типы `slot`, `instant`, `table` и статусы `live`, `coming_soon`. RTP хранится как число `0.948`, а сайт показывает `94.8%`. Несколько volatility пишутся через запятую: `medium,high`.

Demo не является готовой Play URL:

- adapter: включите `Demo Enabled`, выберите `adapter`, заполните `Adapter Game ID`;
- direct: включите `Demo Enabled`, выберите `direct`, заполните `Direct Build`, `Direct Version` и при необходимости `API Host`.

## Как заменить изображения

Три независимых поля:

- `Card Logo` — прозрачный логотип поверх карточки;
- `Card Background` — фон карточки;
- `Hero Image` — широкий арт открытой страницы игры.

В ячейку можно вставить Google Drive URL вида `https://drive.google.com/file/d/FILE_ID/view`, сам File ID, существующий project asset или публичный HTTPS URL. Допустимы PNG, JPEG, WebP, AVIF и SVG, до 20 MB. Для logo сохраняется прозрачность.

При Publish importer скачивает файл, проверяет MIME, размер и dimensions, вычисляет SHA-256 и сохраняет deterministic asset внутри проекта. Production не hotlink'ит Google Drive. Старый файл не удаляется до успешной сборки. Исходник в Drive лучше не удалять, пока в `05 Publish Log` не появился `Published`.

## Как подключить кнопку Publish один раз

Исходник Apps Script находится в `google-apps-script/Code.gs`, manifest — в `google-apps-script/appsscript.json`.

1. Откройте таблицу, затем `Extensions → Apps Script`.
2. Вставьте содержимое `Code.gs` в редактор, добавьте/замените `appsscript.json`.
3. В `Project Settings → Script properties` добавьте:
   - `GITHUB_TOKEN` — fine-grained token с правом Contents/Actions для `Monteg/ace_web`;
   - `GITHUB_OWNER=Monteg`;
   - `GITHUB_REPO=ace_web`;
   - `GITHUB_BRANCH=main`;
   - `PUBLISH_ALLOWLIST` — email владельцев через запятую;
   - `SERVICE_ACCOUNT_EMAIL` — email service account из GitHub Secret.
4. В GitHub repository secrets добавьте `GOOGLE_SERVICE_ACCOUNT_JSON`. Расшарьте создаваемые snapshot-файлы на `SERVICE_ACCOUNT_EMAIL` (скрипт делает это автоматически).
5. Расшарьте саму Google Sheet на `SERVICE_ACCOUNT_EMAIL` с ролью Editor: CI должен записать итог в Publish Log и сбросить Changed только после успешной сборки.
6. Перезагрузите Sheet и разрешите Apps Script доступ только к этой таблице, Drive-файлам, внешнему GitHub request и email текущего пользователя.

Apps Script нельзя вложить в уже созданную таблицу через обычный Drive API: шаги 1–2 выполняются один раз вручную под Google-аккаунтом владельца. После этого меню `Ace Games` появляется автоматически при каждом открытии файла.

## Публикация

1. В меню `Ace Games` запустите `Validate Translations` и `Validate Games`.
2. Исправьте все `Error`. `Missing` не блокирует публикацию.
3. Нажмите `Ace Games → Publish Changes`.
4. Нормальное время — 1–3 минуты. GitHub Actions импортирует snapshot/media, выполняет `npm run check` и `npm run ship`, затем коммитит только прошедший проверки контент в main. Текущий production остаётся прежним при любой ошибке.
5. Результат смотрите в `05 Publish Log`. При `Failed` откройте текст Error: Changed не сбрасывается. При `Published` технические hashes обновляются, а Changed у игр сбрасывается.

Синхронизация новых code-slots выполняется через `Ace Games → Sync Content from Site`: новые keys добавляются, существующие переводы сохраняются, исчезнувшие keys помечаются `Inactive`.

## Быстрая проверка после подключения

1. В `01 Site Translations` временно заполните IT для `footer.company`, нажмите Publish и откройте `/it`.
2. Очистите тестовый IT: на `/it` должен появиться English fallback, без key/undefined.
3. В `03 Game Translations` измените IT `pirates-rush / overview`, опубликуйте и откройте `/it/portfolio/pirates-rush`.
4. Для медиа сначала используйте отдельный разрешённый тестовый PNG/WebP в Drive. По очереди замените Card Logo, Card Background и Hero Image, проверяя карточку, hover/clipping и открытую страницу. После каждого теста верните исходную ссылку и снова опубликуйте.
