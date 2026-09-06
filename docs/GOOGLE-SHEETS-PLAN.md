# План Google Sheets после проверки Ace CMS

На этом этапе новый Google Sheets connector не внедряется. Сначала владелец проверяет Directus UI, создание игр, изображения, порядок и локализацию.

## Будущая схема

```text
Google Sheet
    ↕
Ace CMS API
    ↕
PostgreSQL — та же база, которую использует Directus
```

Directus останется основной CMS и владельцем данных. Таблица будет дополнительным bulk editor для массовых правок, а не второй независимой базой.

## Планируемые листы

### Games

Общие поля: ID, Order, Internal Name, Slug, Status, Type, RTP, Volatility, Max Win, Bet, Demo и revision metadata.

### Translations

Одна строка на локализуемое поле или понятная language matrix: entity, locale, field, value, status, missing/fallback и revision.

### Game Content

Повторяемые sections и items: game, section type, Display Area (`detail_slot`), position, enabled, locale, heading/body и translation status. Display Area — структурное shared-поле и не локализуется.

### Media

Связи с Directus Files: game, role Card/Hero/Gallery, file ID, title, alt, caption и modified date. Бинарные файлы остаются в CMS storage, а не в ячейках.

## Судьба существующей Google Sheet

- существующий файл можно оставить;
- текущий Apps Script будет заменён;
- обращения к Webflow API исчезнут;
- таблица начнёт читать и писать Ace CMS API;
- Directus UI и Google Sheet будут видеть одни и те же записи PostgreSQL;
- технические ID и revision будут скрыты от обычного редактора, но использоваться для conflict protection.

## Безопасность и синхронизация

Будущий Apps Script получит отдельный scoped token роли **Sheet Integration**, а не Administrator token. Pull обновляет таблицу из CMS; Push отправляет только изменённые строки и проверяет revision, чтобы не перетереть более свежую правку из Directus.

Реализация начинается только после подтверждения, что модель полей и редакторский UX в Directus подходят владельцу.
