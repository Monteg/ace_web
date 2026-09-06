# Google Sheets ↔ Ace CMS

## Назначение

Существующий Spreadsheet остаётся bulk-editor, но больше не работает с Webflow. Canonical working data находится в Directus, а production — в active release snapshot.

Apps Script лежит в `integrations/google-sheets/AceCms.gs`, manifest — `appsscript.json`. Скрипт не содержит Webflow token/site/collection IDs и не загружает assets в Webflow.

## Установка

1. Откройте существующий Ace Games Spreadsheet.
2. Откройте **Extensions → Apps Script**.
3. Замените script содержимым `integrations/google-sheets/AceCms.gs`.
4. Добавьте/обновите `appsscript.json` из репозитория.
5. Сохраните проект и перезагрузите Spreadsheet.
6. Появится меню **Ace CMS**.
7. Выберите **1. Настроить подключение**.
8. Введите `ACE_CMS_URL` и token отдельной Directus-учётной записи **Sheet Integration**.
9. Administrator должен добавить email этой Directus-учётной записи в server-side `ACE_TRUSTED_PUBLISHERS`. Для дополнительной UI-защиты тот же allow-list задаётся как Apps Script Property.

Token хранится в Script Properties. Не записывайте его в cells, shared notes или Git.

## Ежедневный workflow

1. Откройте Sheet.
2. **Ace CMS → Обновить Games/Translations/Game Content/Media из CMS**.
3. Измените нужные cells.
4. `Changed` установится автоматически.
5. **Сохранить изменения**.
6. Проверьте Status и исправьте ошибки.
7. Поставьте `Publish` только на готовых строках.
8. **Проверить локализацию**.
9. **Опубликовать отмеченные**.
10. Status станет `Deploying vN`. Production меняется только после успешного build callback.

Save и Publish — разные действия. Save никогда не публикует автоматически.

## Tabs

### Games

Одна строка — одна игра. Основные columns: Game ID, Name, Slug, Release Status, Order, Game Type, RTP, Volatility, Max Win, Bet, Demo, Hero, Game Cover, Card Background, Card Logo, Changed, Publish, Status, Revision.

`Game ID` и `Revision` — служебные. Не копируйте UUID между разными играми.

### Translations

Одна строка — одно поле. Базовые columns: Key, Scope, Entity, Page, Section, Context, Type. После них динамически идут `EN`, `EN Status`, `IT`, `IT Status` и другие active locales. В конце находятся Change/Publish/Status/Revision и скрытые relation metadata.

Key examples:

- `header.games`;
- `game:pirates-rush:overview`;
- `section:{uuid}:body_markdown`;
- `item:{uuid}:text`;
- `gallery:{uuid}:alt`;
- `faq:{uuid}:question`.

### Game Content

Одна строка — section или section item. Для section задайте Game, Block Type, **Display Area**, Order, Enabled и optional Image. Допустимые Display Area: `sidebar_features`, `gameplay`, `main_feature`, `bonus`, `multiplier`, `additional`; пустое значение сохраняется как `additional`. Зона задаётся явно и не определяется по тексту заголовка. Для item задайте Parent Block ID, `Item Kind = item`, Order, Enabled и optional Image. Тексты редактируются в Translations, не в structural row.

### Media

Одна строка — asset relation. Roles: `hero`, `card`, `card_background`, `card_logo`, `gallery`, `section`.

Для gallery новая строка может не иметь Media ID, но должна иметь Game или Parent ID, file reference, Order и Enabled. Media ID вернётся после Save.

## Создание игры из новой строки

1. Добавьте строку в Games.
2. Оставьте Game ID пустым.
3. Заполните минимум Name, Slug, Release Status, Order, Game Type, RTP Mode/RTP, Volatility и валидную demo-конфигурацию либо выключите demo.
4. Поставьте Changed.
5. Нажмите Save.
6. Скрипт валидирует значения, создаст CMS draft, вернёт UUID и Status `Создано в CMS · Draft`.
7. Pull Translations, заполните English, добавьте media/content.
8. Не публикуйте игру до полного checklist.

## Изображения из Google Drive и URL

Cell принимает:

- Google Drive File ID;
- Google Drive file URL;
- public HTTPS URL;
- existing CMS asset UUID;
- existing CMS `/assets/{uuid}` URL.

Для Drive скрипт:

1. извлекает file ID;
2. читает через `DriveApp`;
3. проверяет MIME (`avif`, `gif`, `jpeg`, `png`, `svg+xml`, `webp`);
4. проверяет размер;
5. ищет mapping ранее загруженного Drive ID;
6. загружает только новый файл в Directus Files;
7. заменяет cell CMS asset URL.

Не используйте закрытый URL, который Directus не может скачать. Не удаляйте mapping ради повторной загрузки одного файла.

## Markdown

Rich text хранится как Markdown, например:

```md
## Core Gameplay

Pirates Rush features a progressive multiplier.

- Fixed paylines
- Free Spins
```

Не вставляйте `<script>`, iframe или произвольный HTML. Build дополнительно sanitizes Markdown output.

## Local changes и conflicts

Pull сохраняет строку с `Changed = TRUE`. Если CMS не менялась, локальная строка остаётся. Если после последнего Pull кто-то обновил ту же CMS entity, Revision отличается и строка получает:

`CONFLICT: CMS item changed after last Sheet sync. Reload or reconcile this row.`

Скрипт не перезаписывает CMS устаревшей строкой.

Как решить:

1. Скопируйте свои изменения во временное безопасное место.
2. Снимите Changed или удалите конфликтную локальную строку.
3. Выполните Pull.
4. Сравните CMS-версию со своей.
5. Внесите итог вручную, Save и только затем Publish.

## Статусы и цвета

| Status | Значение |
| --- | --- |
| Draft | Запись в CMS, не готова к production |
| Local changes | Cell отредактирована после Pull/Save |
| Saved to CMS | Working data сохранены |
| Translation incomplete | Нужны поля или status |
| Ready to publish | Validation пройдена |
| Publishing/Deploying vN | Создан snapshot и идёт build |
| Published | Release активирован callback'ом |
| Conflict | CMS revision стала новее Sheet |
| Build failed | Новый release не активирован |

Translation colors: red blank, yellow draft, blue review, green approved.

## Filters

Sheet включает стандартные filters. Практические комбинации:

- blank IT + Scope=Game — Missing Italian в играх;
- DE Status=Draft — незаконченный German;
- Type=seo_title/seo_description — только SEO;
- Scope=Site + Page=Home — homepage UI;
- Entity=Pirates Rush — всё по одной игре;
- Publish=TRUE — текущий release selection.

## Security

- Spreadsheet не является security boundary.
- Не используйте admin token.
- Sheet Integration не имеет user/schema/database administration.
- Server дополнительно сверяет email authenticated Directus user с `ACE_TRUSTED_PUBLISHERS`.
- Если таблица доступна Anyone with link can edit, production publish из неё запрещён: уберите integration account из allow-list.
- Не публикуйте Apps Script project publicly.

## Что нельзя редактировать

- Game ID, parent UUID, hidden relation metadata и Revision без reconciliation;
- опубликованный slug без Admin + redirect;
- ready-made demo URL вместо structured fields;
- translation enums в каждой игре;
- arbitrary HTML;
- release payload/checksum;
- Events через эти tabs.

## Проверка установки

После подключения выполните Pull каждого tab, создайте test draft без Publish, измените его напрямую в CMS и убедитесь, что старый Sheet revision получает Conflict. Затем удалите test draft. Production publish проверяйте только в staging с настроенным signed callback.
