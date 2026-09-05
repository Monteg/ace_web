# Обновление главной, навигации и Contact modal

Дата: 5 сентября 2026. Документ отражает состав стабильного среза перед фиксацией в GitHub `main`; публикация сайта отдельно не выполнялась.

## Результат

- Обычное меню Header: Games / FAQ / Event. Maths и Studio убраны из Header, Integration остаётся отключённым. Логотип, правый CTA и специальный booking CTA на Event сохранены.
- Desktop: геометрическое центрирование через grid с равными боковыми колонками, uppercase Tanker 19 px / 400. Mobile: те же три направления, отдельная кнопка раскрытия категорий рядом с основной ссылкой Games.
- Games остаётся обычной ссылкой `/games` без фильтра. Dropdown содержит ровно Slots, Instant, Table. Открывается при hover/focus, доступен клавиатурой, ArrowDown переводит к первому пункту, Escape закрывает и возвращает фокус. При уходе указателя/фокуса предусмотрена задержка 180 ms. На mobile подменю открывается кнопкой, не hover.
- Категории ведут на `/games?type=slot#games`, `/games?type=instant#games`, `/games?type=table#games`. Якорь `games` находится на строке фильтров. Существующий фильтр восстанавливает выбор из URL и сохраняет reorder + dim, не скрывая игры.
- Отступ якоря учитывает измеренную через ResizeObserver высоту всей шапки и ещё 16 px. Существующий announcement не изменялся.
- Пользовательский Portfolio заменён на Games в общей навигации, подвале через общий источник nav, заголовках/SEO Games, тексте главной, статусе фильтра и странице 404. Все обычные CTA View portfolio на главной, в hero, 404 и thanks теперь имеют точный текст `View Game`.
- Технические `/games` и `/portfolio/{slug}`, папка game detail и все slugs сохранены. Тексты кампании Event не редактировались из-за жёсткого исключения Event из задачи.
- DISCOVER ACE GAMES сохранён. CTA справа от фильтров теперь имеет ту же высоту, что и chips: около 45.6 CSS px при текущих шрифтах. Согласованы padding, шрифт, pill-radius и размер иконки.
- У Play/Preview внутри GameTile снята синтетическая жирность элемента `b`: Tanker 400. Artwork, положение overlay, hover и прочие параметры карточки не менялись.

## Уточнение владельца: Crash исключён, добавлен Table

Владелец уточнил, что Crash был ошибочно включён в категории. Ожидание Crash mapping отменено. Итоговые категории: Slots / Instant / Table; они соответствуют существующим значениям `slot`, `instant`, `table`.

Dropdown Games содержит ровно эти три пункта. Table ведёт на `/games?type=table#games`, активирует Table и переносит существующий Blackjack в начало каталога, сохраняя остальные карточки ниже с затемнением.

Удалены временные `confirmedCrashSlugs`, `crashMappingPending`, обходная категоризация и сообщение об ожидании Crash mapping. В Maths Explorer подпись Instant & crash заменена на Instant без изменения механики.

Игровые записи, параметры и публичные game detail URL не менялись. Старый URL с `type=crash` использует существующий fallback неизвестного фильтра: All, без специального Crash-состояния.

## Главная: секции и motion

- Craft отключён через `homepageSections.craft: false` в page composition. Компонент, assets и его реализация сохранены. Ссылка `/#craft` исключена из общей навигации; `#studio` и других ссылок на отсутствующую секцию в отрисованной странице нет. Integration также остаётся отключённым.
- Maths Explorer, Proof, Excellence, Future of Gaming и FAQ сохранены. Незатронутые секции не удалялись по приблизительной схеме из ТЗ.
- У FAQ найденная линия оказалась нижней границей предыдущей секции Future of Gaming. Она сохранена толщиной 1 px; перед заголовком FAQ добавлен padding 32 px. Нового divider и отрицательных компенсаций нет. Разметка items, вопросы, ответы, schema и анимация аккордеона сохранены.
- В Wall ScrollTrigger `start: 'top top'` заменён на `start: 'top+=180 top'`. `end: 'bottom top'` и `scrub: 0.6` не изменялись. Обе дорожки (карточки и copy) продолжают идти с одной нулевой позиции общего timeline. Дополнительных spacer, margin и счётчика wheel events нет.
- Проверка hero: на scrollY 100 и 240 исходные transform/opacity обеих дорожек сохранялись, на 420 обе начали синхронно меняться. Narrow-screen и reduced-motion fallback сохранены.

## Общая форма и модальное окно

- Существующая форма извлечена в `ContactForm.astro`, включая поля, disclosure и декоративную надпись. На главной используется тот же компонент, что и в Games modal, без независимой копии полей.
- Контракт сохранён: обязательные `name`, `company`, `email`; необязательный `message`; `website` honeypot; privacy link; обычный `POST /api/contact`. У двух мест использования разные префиксы id для корректной связи label/input.
- В нижнем блоке Missing a mechanic? кнопка Let's talk открывает `ContactModal.astro` на текущей странице, не меняя URL. Layout и остальной copy блока сохранены. При отключённом JavaScript остаётся прежняя ссылка на форму главной как noscript fallback.
- Используется native `dialog` с accessible title, затемнением и видимой кнопкой закрытия. Начальный фокус в поле имени, Tab/Shift+Tab остаются внутри, Escape/крестик/backdrop закрывают окно и возвращают фокус на открывшую кнопку. Фоновая прокрутка блокируется.
- Максимальная ширина окна 640 px, mobile gutters 16 px; доступная высота ограничена viewport, при необходимости прокручивается окно. Все поля и кнопки имеют высоту не менее 44 px.
- Анимация открытия 240 ms, закрытия 180 ms: opacity и небольшой translate/scale, без новой библиотеки. Reduced motion отключает анимацию и задержку закрытия.
- Отправка не переписана в AJAX; существующий переход через `/thanks` сохранён. Backend, Resend и CSP не менялись.

## Стрелка Contact

- Размер desktop/tablet: 132×54 → 108×44 px, уменьшение примерно на 18%.
- Размер mobile: 112×48 → 92×39 px, уменьшение примерно на 18%.
- Позиция смещена так, чтобы хвост находился по горизонтали возле промежутка `us / a`, а не у восклицательного знака. Проверенный разброс в статическом reduced-motion состоянии на четырёх ширинах составил менее 2 px относительно этого промежутка. До нижней границы текста оставлено около 9 px.
- Исходный SVG path, направление, текст Drop us a message! и GSAP gesture сохранены. На узких экранах ряд действий допускает перенос, исключая переполнение.

## Изменённые в этой задаче файлы

Пути ниже относительно корня `acegames-showcase`.

| Файл | Изменение |
| --- | --- |
| `src/components/Header.astro` | Центрированное меню, dropdown, mobile/keyboard, измерение sticky height |
| `src/data/site.ts` | Games label, Craft flag, исключение orphaned nav, настройки видимости секций |
| `src/lib/game-categories.ts` (новый) | Общие категории Slots / Instant / Table |
| `src/lib/format.ts` | Подпись Instant вместо Instant & crash в общих фильтрах |
| `src/lib/catalogue-filter.ts` | Сохранение reorder/dim и URL, исправленная терминология; временный Crash fallback удалён |
| `src/components/showcase/Wall.astro` | View Game и задержка ScrollTrigger на 180 px |
| `src/components/showcase/GameTile.astro` | Font-weight 400 у Play; категории берутся напрямую из игровых записей |
| `src/components/showcase/CatalogueHero.astro` | Только пользовательские названия Games; video без изменений |
| `src/pages/index.astro` | Размер CTA, общая форма, отключение Craft, FAQ spacing, терминология |
| `src/pages/games/index.astro` | URL anchor, фильтры, SEO/copy, открытие Contact modal |
| `src/components/ContactForm.astro` (новый) | Единственная реализация переиспользуемой формы, уменьшенная стрелка |
| `src/components/ContactModal.astro` (новый) | Native dialog, focus/scroll management, animation |
| `src/pages/404.astro` | Games / View Game в тексте и CTA |
| `src/pages/thanks.astro` | CTA View Game |
| `docs/NAVIGATION-CONTACT-UPDATE.md` (новый) | Этот отчёт |

Остальные изменения, уже находившиеся в рабочем дереве до задачи, не откатывались и не присваиваются этой задаче. `Footer.astro`, `Craft.astro`, `base.css`, зависимости и lockfile в рамках этой правки не редактировались; меню Footer обновляется через общий источник данных.

## Проверки

- `npm run check`: 57 файлов, 0 errors / 0 warnings / 0 hints.
- `npm run ship`: 14/14 gates, 32 страницы; публичные URL сохранены.
- `git diff --check`: без ошибок whitespace.
- Browser/visual QA: 375, 768, 1024, 1440 px; дополнительно modal на 375×640 px.
- Проверены `/`, `/games`, `/games?type=slot#games`, `/games?type=instant#games`, `/games?type=table#games`, `/portfolio/stars-digger`.
- Проверены hover/focus/dropdown/Escape, клики по всем трём категориям на desktop и mobile, активный filter после перехода, видимость filters ниже sticky Header, отсутствие horizontal overflow, modal Tab/Shift+Tab/close/backdrop/focus return/body scroll lock, FAQ, reduced motion, синхронность hero.
- POST и redirect проверены локальным перехватом запроса: все пять имён полей и пустой honeypot сохранены, после имитации ответа 303 открыт `/thanks`. Настоящие письма не отправлялись; доставку через production backend эта проверка не подтверждает.
- Хэши Event-компонентов, event data/booking, Age Gate, игровых записей и detail pages, legal content, MathsExplorer, contact backend и CSP совпали с состоянием перед задачей. Содержимое FAQ items/CSS/animation также сравнено с исходным состоянием и сохранено. Специальный CTA на `/event` по-прежнему ведёт на `#book-meeting`.

После уточнения владельца данных для Crash больше не требуется: категория исключена. Table работает на существующих игровых данных.
