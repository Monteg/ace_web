# Ace Games: полный контекст проекта для AI-планировщика

Версия документа: 1.1
Дата среза: 5 сентября 2026 года
Репозиторий: C:\Users\Gener\Documents\ChatGPT\ACE_web\acegames-showcase
Публичный домен, заложенный в коде: https://acegames.io
Текущий режим работы команды: локальная разработка
Язык интерфейса сайта: английский
Язык этого документа: русский

## 1. Назначение документа

Этот файл предназначен для AI-ассистента, который будет помогать владельцу продукта:

- разбирать идеи новых функций;
- строить реалистичные планы;
- формировать подробные технические задания;
- находить затрагиваемые страницы, компоненты, данные и интеграции;
- заранее учитывать SEO, accessibility, responsive, performance, legal и deployment;
- не предлагать решения, которые противоречат уже принятой архитектуре;
- отделять существующую функциональность от идей, планов и незаполненных данных;
- задавать владельцу только те вопросы, без которых действительно нельзя принять продуктовый или юридический выбор.

Этот файл не является рекламным текстом сайта. Это одновременно:

1. продуктовая карта;
2. техническая карта;
3. каталог функций;
4. реестр текущих ограничений и технического долга;
5. инструкция по подготовке будущих ТЗ;
6. контекст передачи проекта другому AI.

Если новый AI получил только один файл, ему нужно дать именно этот документ. Для реализации изменений ему также понадобится доступ к репозиторию.

## 2. Как AI должен пользоваться этим контекстом

Перед подготовкой любого плана или ТЗ AI должен:

1. Определить пользовательскую и бизнес-цель запроса.
2. Найти в этом документе затрагиваемые маршруты, компоненты, данные и интеграции.
3. Проверить, не относится ли запрос к уже существующей функции.
4. Проверить раздел с инвариантами и ограничениями.
5. Проверить раздел с известными проблемами и незаполненными данными.
6. Разделить факты, предположения и вопросы владельцу.
7. Описать минимальный объём изменений без незапрошенной переработки соседних секций.
8. Сформировать измеримые критерии приёмки для desktop, tablet, mobile, клавиатуры, reduced motion и production.
9. Указать необходимые проверки и возможные риски.
10. Не придумывать сертификаты, юрисдикции, коммерческие условия, статистику, ссылки, лица команды или юридические формулировки.

Для конкретной реализации приоритет источников такой:

1. прямое текущее указание владельца;
2. фактический код в рабочем дереве;
3. этот документ;
4. TODO.md;
5. AGENTS.md, AI-HANDOVER.md, docs/RECIPES.md и docs/EVENT.md;
6. README.md, PLAN.md и DEPLOY.md.

Причина такого порядка: часть старых документов не обновлена после последних изменений интерфейса и инфраструктуры. Известные расхождения перечислены ниже.

## 3. Краткое описание продукта

Ace Games — B2B-студия iGaming-контента. Компания разрабатывает и лицензирует игры для операторов, агрегаторов, команд game acquisition, product и compliance.

Основные направления каталога:

- slot games;
- instant и crash-подобные игры;
- table games;
- кастомная разработка игр под бренд, аудиторию и рынок партнёра.

Сайт не является казино и не предоставляет потребителям real-money gambling:

- на сайте нельзя внести депозит;
- нельзя сделать ставку на реальные деньги;
- нельзя вывести деньги;
- игровые демо работают в режиме free play;
- выигрыши в демо не имеют денежной ценности;
- глобальный Age Verification Gate ограничивает вход аудиторией 18+.

Основная аудитория:

- представители лицензированных операторов;
- агрегаторы игрового контента;
- product и game acquisition managers;
- compliance и legal teams;
- потенциальные партнёры, которые оценивают каталог, математику, интеграцию и возможность custom development;
- посетители и потенциальные партнёры, планирующие встречу на отраслевом событии.

Основные продуктовые задачи сайта:

- показать качество и разнообразие каталога;
- дать понятные RTP, volatility, max win, bet range, layout и feature;
- дать безопасный доступ к playable demos;
- объяснить in-house компетенции в maths, art, client, server и RGS;
- снять вопросы интеграции и compliance;
- получить B2B-лид через контактную форму или прямой email;
- во время активной кампании привести посетителя на event page и к бронированию встречи.

## 4. Фактическое состояние проекта на дату среза

### 4.1. Что работает

- Astro-сайт собирается статически.
- Существует 32 статические HTML-страницы, включая технический Effects Lab.
- Существуют все 27 URL, которые защищает parity-проверка старого сайта.
- В каталоге 24 игры.
- 21 игра имеет статус live.
- 3 игры имеют статус coming soon.
- 20 игр имеют demo-конфигурацию.
- Домашняя страница содержит hero wall, proof, Excellence cards, каталог, maths explorer, Future of Gaming, FAQ и contact.
- Craft и Integration сохранены в коде, но отключены флагами homepageSections.
- Отдельная страница Games содержит видеогерой, фильтр и полный каталог.
- Каждая игра имеет отдельную страницу.
- Есть Terms of Use и Privacy & Cookie Policy.
- Есть event page для SBC Lisbon 2026.
- Есть глобальный Age Verification Gate.
- Есть временный event announcement bar с возможностью закрытия.
- FAQ работает как анимированный accordion.
- Header содержит Games dropdown с категориями Slots, Instant и Table, FAQ и Event.
- У Header есть настраиваемый animated Border Trail.
- На техническом маршруте /effects-lab отдельно настраиваются motion карточек и Border Trail.
- Excellence cards используют масштабируемую рамку и отдельный horizontal tablet layout.
- Каталожные фильтры переставляют игры и приглушают остальные.
- Демо загружается только после клика Play.
- SEO-метаданные и JSON-LD генерируются на уровне layout и страниц.
- Реализованы responsive images через Astro Image.
- Реализованы reduced-motion fallbacks.
- Контактный backend для Cloudflare Pages описан в functions/api/contact.ts.
- Локальная типизация и production build проходят.

### 4.2. Проверенное качество сборки

На 5 сентября 2026 года выполнены:

- npm run check: 0 errors, 0 warnings, 0 hints для 57 файлов;
- npm run ship: успешно;
- 14 из 14 parity gates: успешно;
- 32 страницы собраны;
- home first-load weight по внутренней проверке: 970 KB;
- representative game page до запуска demo: 302 KB;
- build создаёт 363 optimized image variants;
- у всех 318 отрендеренных img elements есть width, height и alt;
- внутренних битых ссылок по текущей проверке нет;
- пустых iframe src нет;
- на каждой странице ровно один h1;
- на каждой странице есть header, main, footer и skip link.

Отдельные event unit tests не проходят на локальном Node 20.14.0, потому что scripts/event.test.mjs импортирует TypeScript-файлы напрямую. Документация события предполагает Node 24 или новее. Эти тесты не входят в npm run ship.

### 4.3. Состояние Git

- текущая ветка: main;
- основной GitHub remote для передачи проекта: github, https://github.com/Monteg/ace_web.git;
- дополнительный внутренний remote: origin, git.chatgpt-team.site;
- стабильный срез, описанный версией документа 1.1, фиксируется тем же commit, что и это обновление документации;
- рабочая ветка и целевая ветка GitHub: main.

Любой AI-исполнитель обязан считать будущие незакоммиченные изменения пользовательскими. Нельзя выполнять reset, checkout или массово отменять изменения без прямого разрешения владельца.

## 5. Технологический стек

### 5.1. Основные технологии

| Область | Реализация |
| --- | --- |
| Генератор сайта | Astro 5 |
| Рендеринг | Static Site Generation |
| Язык | Astro, TypeScript, JavaScript, CSS, Markdown |
| Runtime framework | отсутствует |
| База данных | отсутствует |
| CMS | отсутствует |
| Контент игр | Astro Content Collection, Markdown frontmatter |
| Валидация контента | Zod через src/content.config.ts |
| Изображения | astro:assets и Sharp |
| Иконки | astro-icon, Phosphor через префикс ph: |
| Анимация hero главной | CSS и GSAP ScrollTrigger |
| Другие анимации | CSS, Web Animations API, requestAnimationFrame |
| Шрифты | Tanker локально, Inter Variable и JetBrains Mono Variable из npm |
| Sitemap | @astrojs/sitemap |
| Формы | нативный HTML, Cloudflare Pages Function, Resend; event form использует mailto |
| Хостинг в документации | Cloudflare Pages |
| Текущая static hosting-конфигурация | .openai/hosting.json |

### 5.2. Установленные версии

Фактическая локальная установка:

- Node.js 20.14.0;
- npm 10.8.1;
- Astro 5.18.2;
- astro-icon 1.2.0;
- GSAP 3.15.0;
- Sharp 0.34.5;
- TypeScript 5.9.3;
- @astrojs/check 0.9.10;
- @astrojs/sitemap 3.7.4;
- Inter Variable 5.3.0;
- JetBrains Mono Variable 5.3.0.

Файл .nvmrc закрепляет major-версию Node 20. package.json использует caret ranges, поэтому фактическая версия некоторых библиотек выше минимальной, указанной в package.json.

### 5.3. Основные команды

    npm install
    npm run dev
    npm run dev -- --port 4400
    npm run build
    npm run preview
    npm run check
    npm run verify
    npm run ship
    npm run new-game -- --slug neon-vault --name "Neon Vault" --type slot

Значение команд:

- npm run dev запускает локальный Astro dev server, обычно на http://localhost:4321;
- npm run build пишет production-результат в dist;
- npm run preview показывает содержимое dist через локальный preview server;
- npm run check выполняет Astro и TypeScript diagnostics;
- npm run verify проверяет уже существующий dist;
- npm run ship выполняет build, затем все parity gates;
- npm run new-game создаёт новый Markdown-record игры.

Определение готовности существующего проекта: npm run check без диагностик и npm run ship со всеми PASS. Для event-функций дополнительно нужен совместимый запуск scripts/event.test.mjs.

## 6. Архитектурная модель

Сайт построен без клиентского framework runtime. Основной поток данных:

    Markdown и TypeScript data
        → Astro Content Collections и page frontmatter
        → Astro components
        → статические HTML, CSS, JavaScript и responsive assets
        → CDN или static host

Клиентский JavaScript используется точечно:

- mobile navigation;
- age gate;
- event campaign timing и dismissal;
- reveal-on-scroll;
- FAQ accordion animation;
- catalogue filter;
- GSAP hero scroll effect;
- game page parallax;
- lazy creation of demo iframe;
- copy demo URL;
- event meeting email builder;
- error state на thanks page;
- autoplay/reduced-motion управление видео hero.

На сервере во время обычного просмотра нет Astro runtime. Исключение — отдельная Cloudflare Pages Function для POST /api/contact, если сайт развёрнут на Cloudflare Pages и настроены secrets.

## 7. Карта репозитория

    acegames-showcase/
      .github/
        copilot-instructions.md
      .openai/
        hosting.json
      docs/
        AI-PROJECT-CONTEXT-RU.md
        EVENT.md
        RECIPES.md
      functions/
        api/
          contact.ts
      public/
        fonts/
          Tanker-Regular.otf
          Tanker-Regular.woff2
        partners/
          README.txt
        _headers
        _redirects
        favicon.png
        robots.txt
      scripts/
        event.test.mjs
        new-game.mjs
        verify.mjs
      src/
        assets/
          brand/
          games/
          heroes/
          site/
        components/
          event/
          showcase/
          AgeGate.astro
          ContactForm.astro
          ContactModal.astro
          DemoEmbed.astro
          Footer.astro
          Header.astro
          StatTile.astro
        content/
          games/
          legal/
        data/
          border-trail-settings.ts
          events.ts
          experience-card-settings.ts
          site.ts
        layouts/
          Base.astro
        lib/
          border-trail.ts
          catalogue-filter.ts
          event-booking.ts
          event.ts
          experience-card-motion.ts
          format.ts
          game-categories.ts
        pages/
          games/
          portfolio/
          404.astro
          [legal].astro
          effects-lab.astro
          event.astro
          index.astro
          thanks.astro
        styles/
          base.css
          fonts.css
          tokens.css
        content.config.ts
      AGENTS.md
      AI-HANDOVER.md
      DEPLOY.md
      PLAN.md
      README.md
      TODO.md
      package.json
      astro.config.mjs

### 7.1. Где находится source of truth

| Тип информации | Source of truth |
| --- | --- |
| Компания, адрес, email, nav, CTA | src/data/site.ts |
| Hero stats | src/data/site.ts |
| Integration и compliance rows | src/data/site.ts |
| FAQ | src/data/site.ts |
| Partners и social | src/data/site.ts |
| Игры | src/content/games/*.md |
| Схема игры | src/content.config.ts |
| Terms и Privacy | src/content/legal/*.md |
| Event dates, copy, team, games, booking | src/data/events.ts |
| Форматирование игровых спецификаций | src/lib/format.ts |
| Маршруты страниц | src/pages |
| Глобальный HTML head и shell | src/layouts/Base.astro |
| Design tokens | src/styles/tokens.css |
| Общие стили и UI primitives | src/styles/base.css |
| Незаполненные факты | TODO.md |
| Redirects | public/_redirects |
| Security и cache headers | public/_headers |
| Contact email handler | functions/api/contact.ts |
| Категории каталога и Games dropdown | src/lib/game-categories.ts |
| Контент Excellence cards | why в src/data/site.ts |
| Defaults motion карточек | src/data/experience-card-settings.ts |
| Runtime motion карточек | src/lib/experience-card-motion.ts |
| Defaults Border Trail | src/data/border-trail-settings.ts |
| Runtime Border Trail | src/lib/border-trail.ts |
| Техническая настройка эффектов | src/pages/effects-lab.astro |
| Release gates | scripts/verify.mjs |

Массив why является source of truth для Excellence cards, а process для Future of Gaming. Флаги homepageSections являются source of truth для включения Craft и Integration: в текущем стабильном срезе оба значения false.

## 8. Маршруты и информационная архитектура

| URL | Назначение | Источник |
| --- | --- | --- |
| / | Главная B2B landing page | src/pages/index.astro |
| /games | Полный каталог | src/pages/games/index.astro |
| /portfolio/{slug} | Детальная страница игры | src/pages/portfolio/[slug].astro |
| /event | SBC Lisbon 2026 campaign page | src/pages/event.astro |
| /effects-lab | Техническая настройка двух независимых визуальных эффектов, noindex, без public chrome | src/pages/effects-lab.astro |
| /terms-conditions | Terms of Use | src/pages/[legal].astro |
| /privacy-policy | Privacy & Cookie Policy | src/pages/[legal].astro |
| /thanks | Результат контактной формы | src/pages/thanks.astro |
| /404 | 404 page | src/pages/404.astro |

Маршруты игр генерируются из имён файлов Markdown. Например:

    src/content/games/ace-city.md
        → /portfolio/ace-city

Slug является частью публичного URL и SEO-истории. Переименование slug без 301 запрещено.

### 8.1. Redirects

Текущие redirect rules:

- /utility/style-guide → /terms-conditions, 301;
- /index.html → /, 301;
- /portfolio → /games, 301;
- /portfolio/ → /games, 301;
- https://www.acegames.io/* → https://acegames.io/:splat, 301.

Локальный Astro dev server не обязан воспроизводить правила public/_redirects. Их нужно проверять на целевом хостинге.

## 9. Глобальная оболочка сайта

### 9.1. Base.astro

Base.astro отвечает за:

- html lang="en";
- импорт шрифтов и глобальных стилей;
- title и meta description;
- self-referencing canonical;
- Open Graph;
- Twitter card;
- favicon и apple touch icon;
- sitemap link;
- theme-color;
- preload Tanker WOFF2;
- Organization JSON-LD;
- подключение дополнительного page-level JSON-LD;
- noindex для служебных страниц;
- early event campaign script;
- early age gate state script;
- AgeGate;
- skip link;
- Header;
- main;
- Footer;
- глобальный reveal-on-scroll.

Props Base:

| Prop | Тип | Назначение |
| --- | --- | --- |
| title | string | title, og:title, twitter:title |
| description | string | description, og:description, twitter:description |
| image | string, optional | OG и Twitter image |
| canonicalPath | string, optional | чистый публичный путь |
| schema | object или array, optional | дополнительные JSON-LD graphs |
| noindex | boolean, optional | robots noindex, follow |
| showSiteChrome | boolean, optional, default true | управляет рендером public Header и Footer на служебных страницах |

Если image не передан, Base использует /og-default.png. Такого файла сейчас нет ни в public, ни в dist. Это известный дефект для страниц, которым не передан индивидуальный share image.

### 9.2. Header

Header:

- sticky;
- визуально оформлен как тёмная полупрозрачная pill-панель;
- содержит logo;
- содержит Games, FAQ и Event;
- все labels используют uppercase Tanker;
- Games имеет dropdown с категориями Slots, Instant и Table из CATALOGUE_CATEGORIES;
- dropdown работает через hover, focus, click, ArrowDown и Escape;
- содержит orange stroke и независимый animated Border Trail;
- Border Trail читает сохранённые настройки из browser storage;
- содержит primary CTA;
- на /event меняет CTA на Book a meeting и ведёт к #book-meeting;
- на desktop показывает nav и CTA;
- на ширине до 992 px переключается на burger menu;
- обновляет aria-expanded и aria-label;
- закрывает menu после выбора ссылки;
- закрывает menu по Escape и возвращает focus на burger.

Header включает EventAnnouncementBar над nav.

### 9.3. Footer

Footer:

- повторяет logo и B2B positioning;
- отображает nav из src/data/site.ts;
- добавляет Contact;
- содержит ссылки на Privacy и Terms;
- показывает legal email;
- показывает social только если массив social заполнен;
- содержит 18+;
- содержит юридическое пояснение о free-play demo и отсутствии consumer gambling;
- подставляет текущий год во время build.

Event link в Footer сейчас отсутствует, потому что Footer использует базовый nav, а Header добавляет Event локально.

### 9.4. Reveal-on-scroll

Элементы с class rv:

- изначально видимы в сгенерированном HTML;
- при наличии JavaScript получают hidden start state через class rv-on;
- появляются через opacity и translateY;
- наблюдаются IntersectionObserver;
- элементы, уже находящиеся в viewport, показываются сразу;
- при reduced motion остаются видимыми без анимации.

Это progressive enhancement: сбой JavaScript не должен скрыть контент.

## 10. Глобальный Age Verification Gate

Компонент: src/components/AgeGate.astro.

Поведение:

- показывается до основного сайта, если localStorage не содержит age_verified_18=true;
- early inline script в head ставит class age-verified или age-gate-required до первого paint;
- закрывает и inert-ит site shell;
- блокирует прокрутку wheel, touch и часть keyboard navigation;
- удерживает keyboard focus внутри модального окна;
- Escape не закрывает gate;
- подтверждение 18+ сохраняется в persistent localStorage;
- после подтверждения выполняется примерно 300 ms exit animation;
- затем основной сайт разблокируется;
- отказ переводит пользователя на https://www.google.com/ через location.replace;
- на mobile affirmative action визуально переставлена первой;
- reduced motion учтён.

Важные продуктовые свойства:

- подтверждение хранится без срока окончания, пока пользователь не очистит localStorage;
- gate является UI-ограничением, а не серверной проверкой возраста;
- значение не отправляется на backend;
- при недоступном storage gate показывается;
- текст и действие отказа являются важным product/legal решением и не должны меняться без явного согласования.

## 11. Event announcement campaign

Компоненты и функции:

- src/components/event/EventAnnouncementBar.astro;
- early script в src/layouts/Base.astro;
- currentEvent в src/data/events.ts;
- isCampaignActive в src/lib/event.ts.

Текущая кампания:

- id: sbc-lisbon-2026;
- campaign start: 1 сентября 2026, 00:00, Europe/Lisbon;
- event: 29 сентября — 1 октября 2026;
- eventEnd: 2 октября 2026, 00:00, exclusive;
- текущий URL: /event.

Поведение banner:

- отображается только в активном campaign window;
- build-time class даёт no-JS default;
- early client script корректирует состояние по реальному времени;
- таймер ждёт ближайшую временную границу;
- состояние перепроверяется на pageshow и visibilitychange;
- close button доступен только с JavaScript;
- закрытие хранится в sessionStorage;
- ключ event-specific: ace-announcement-dismissed:sbc-lisbon-2026;
- dismissal сохраняется при reload и внутренней навигации в текущей вкладке;
- новая вкладка или новая browser session снова покажет banner, если кампания активна;
- после close focus переходит на logo в Header;
- Event link остаётся в nav даже вне campaign window.

## 12. Главная страница

Файл: src/pages/index.astro.

Порядок основных блоков:

1. Wall hero.
2. Proof stats.
3. Redefining iGaming Excellence.
4. Catalogue preview.
5. Maths Explorer.
6. Craft, только если homepageSections.craft=true; сейчас отключён.
7. Future of Gaming.
8. Partner Wall, только при наличии логотипов.
9. Integration and compliance, только если homepageSections.integration=true; сейчас отключён.
10. FAQ.
11. Contact.

### 12.1. Wall hero

Компонент: src/components/showcase/Wall.astro.

Функции:

- три горизонтальных ряда карточек из реального каталога;
- каждый ряд продублирован для бесшовного движения;
- разные длительности движения создают ощущение глубины;
- CSS perspective и tilt;
- GSAP и ScrollTrigger загружаются динамически;
- на широком экране hero wall уплощается и исчезает при scroll;
- copy поднимается и исчезает синхронно;
- при reduced motion и на узком экране GSAP scroll behavior не включается;
- без JS остаётся статическая композиция.

Это отдельное визуальное решение главной страницы. Оно не должно автоматически копироваться в hero других страниц.

### 12.2. Proof stats

Данные: heroStats в src/data/site.ts.  
UI: src/components/StatTile.astro.

Текущее состояние:

- Prototypes: 30+;
- Game Releases: 21;
- Players Reached: 1M+;
- Operator Ecosystem: Private.

Stats используют три локальных proof icons и Phosphor briefcase icon. Значения редактируются в heroStats.

### 12.3. Redefining iGaming Excellence

Компоненты:

- src/components/showcase/Excellence.astro;
- src/components/showcase/ExperienceCard.astro;
- src/components/showcase/ScalableCardFrame.astro.

Контент: why и sectionCopy.excellenceTitle в src/data/site.ts.

Текущий UI:

- три тематические карты Trust, Innovation и Retention;
- фон карты реализован масштабируемой CSS nine-slice рамкой через Astro getImage и border-image;
- artwork и editable HTML copy являются отдельными слоями;
- на pointer devices карточка реагирует tilt, scale, 3D depth и glare;
- параметры нормализуются и могут быть применены из Effects Lab;
- на desktop три вертикальные карты в ряд;
- на tablet 561-992 px три горизонтальные карты в одну колонку;
- на phone до 560 px вертикальная карта;
- coarse pointer и prefers-reduced-motion отключают tilt и glare.

### 12.4. Catalogue preview

Логика:

- все игры сортируются: live первыми, coming soon после них, затем order, затем name;
- первые 12 позиций выводятся как GameTile;
- фильтры: All, Slots, Instant, Table;
- filter не скрывает игры, а переставляет совпадающие первыми и приглушает остальные;
- CTA ведёт на полный /games.

### 12.5. Maths Explorer

Компонент: src/components/showcase/MathsExplorer.astro.

Функции:

- каталог раскладывается по четырём volatility lanes;
- горизонтальное положение определяется RTP;
- adjustable volatility визуализируется как диапазон;
- configurable RTP получает отдельную область;
- hover и keyboard focus показывают карточку с данными;
- на touch первый tap раскрывает tooltip, следующий может открыть игру;
- фильтрация приглушает, но не удаляет;
- положение и ticks рассчитываются из данных каталога.

### 12.6. Craft

Компонент: src/components/showcase/Craft.astro.

Это единственный светлый cream-блок на главной. Он раскрывает три компетенции:

- Maths;
- Art;
- Engine.

Блок использует реальные изображения игр, а не stock assets. В текущем стабильном срезе он сохранён в коде, но не рендерится, потому что homepageSections.craft=false.

### 12.7. Future of Gaming

Компонент: src/components/showcase/FutureOfGaming.astro.

Четыре карточки строятся из массива process в src/data/site.ts:

- Expert Engineering Team;
- Game Strategy & Product Design;
- Build & Integrate;
- Monitor & Optimize.

На desktop используется сетка 2x2 с artwork слева и copy справа; на узких viewport карточки и затем вся grid переходят в одну колонку.

### 12.8. Partner Wall

Компонент: src/components/showcase/PartnerWall.astro.

Сейчас partners в src/data/site.ts пуст, поэтому компонент ничего не рендерит.

Когда данные будут добавлены:

- SVG хранятся в public/partners;
- список задаётся в src/data/site.ts;
- marquee дублируется для loop;
- скорость зависит от числа logo;
- hover ставит движение на pause;
- reduced motion переключает wall в статическую grid.

### 12.9. Integration and compliance

Три группы:

- Integration;
- Compliance;
- Commercial and product.

Сейчас заполнены только:

- Legal entity: ACEGAMES LTD, Limassol, Cyprus;
- Platforms: HTML5, portrait and landscape, mobile first.

Остальные десять значений неизвестны и показываются как dashed need-state. AI не должен превращать подсказки в утверждения. Например, текст GLI, iTech Labs, BMM, whichever is true является вопросом владельцу, а не фактом.

В текущем стабильном срезе блок не рендерится, потому что homepageSections.integration=false. Данные сохранены для будущего включения.

### 12.10. FAQ

Текущие вопросы:

1. What types of casino games do you develop?
2. How long does it take to develop a casino game?
3. Can I order a fully customized casino game?
4. How do you ensure game quality and fairness?
5. Do you provide post-launch support?

Все пять ответов заполнены в src/data/site.ts.

Текущий UI:

- FAQ занимает ширину основного site container;
- каждый item является отдельной dark card;
- используется semantic details и summary;
- вся строка вопроса кликабельна;
- плюс расположен справа;
- плюс плавно поворачивается на 45 градусов и становится крестиком;
- answer анимируется по height, opacity и translateY;
- open item имеет деликатный active state;
- duration около 300 ms;
- reduced motion отключает сложное движение;
- FAQPage JSON-LD включает только вопросы с реальным ответом.

### 12.11. Contact

Компоненты: src/components/ContactForm.astro и домашняя placement-секция в src/pages/index.astro.

Визуальная композиция:

- широкое локальное изображение contact-pigeon-v3.png заполняет фон секции;
- слева остаётся editable HTML heading Contact our team today;
- справа расположена компактная dark form card;
- рядом с CTA находится handwritten Drop us a message и анимированная vector arrow;
- reduced motion сохраняет статичную стрелку и читабельный layout.

Форма:

- POST /api/contact;
- поля name, company и email обязательны;
- message необязателен;
- поле website является скрытым honeypot;
- рядом есть privacy disclosure;
- direct email: info@acegames.io.

Локальный Astro dev server не исполняет Cloudflare Pages Functions. Поэтому production contact flow нельзя считать проверенным только по localhost.

## 13. Страница каталога Games

Файл: src/pages/games/index.astro.  
Hero: src/components/showcase/CatalogueHero.astro.

Функции:

- отдельный h1 для каталога;
- ItemList JSON-LD для 24 игр;
- hero;
- фильтры с URL query parameter type;
- grid на 4 колонки desktop, 3 на medium, 2 на tablet, 1 на узком mobile;
- все 24 GameTile;
- tail CTA Missing a mechanic?;
- tail CTA открывает reusable ContactModal, а без JavaScript ведёт на домашнюю contact section;
- первые четыре GameTile получают eager loading.

ContactModal использует native dialog, reusable ContactForm, focus return, keyboard focus wrapping, Escape и backdrop close, scroll lock и reduced-motion fallback.

### 13.1. Текущий video hero

Hero использует внешний MP4:

    https://ace-games.s3.eu-north-1.amazonaws.com/ace_games_hero_banner.mp4

Фактический HEAD на дату среза:

- Content-Type: video/mp4;
- Content-Length: 116,440,314 bytes;
- размер приблизительно 111 MiB;
- Accept-Ranges: bytes;
- источник: Amazon S3.

Настройки элемента:

- autoplay;
- muted;
- loop;
- playsinline;
- preload="metadata";
- poster берётся из hero art одной из выбранных игр;
- декоративные overlays, grading и grain;
- responsive object-position;
- при prefers-reduced-motion autoplay останавливается.

Hero game ids для poster/context:

- way-to-olympus;
- cyber-star;
- pirates-rush;
- ace-city.

Это текущий главный performance risk. Для production нужно подготовить оптимизированные video variants, задать poster, проверить mobile network, Safari, data saver и fallback.

### 13.2. Каталожный фильтр

mountCatalogueFilter:

- принимает id grid и selector chips;
- сохраняет первоначальный порядок;
- измеряет item positions;
- перемещает совпавший type в начало;
- добавляет is-dim остальным;
- обновляет aria-pressed;
- обновляет live status note;
- записывает type в query string через history.replaceState;
- восстанавливает filter из URL;
- делает FLIP animation через Web Animations API;
- duration 560 ms;
- reduced motion переставляет элементы без анимации.

Фильтр специально никогда не скрывает элементы.

### 13.3. Технический Effects Lab

Маршрут: /effects-lab.
Файл: src/pages/effects-lab.astro.

Страница предназначена для локальной настройки эффектов перед будущим переносом в CMS/admin:

- не показывается в public navigation;
- исключена из sitemap;
- имеет noindex;
- использует Base с showSiteChrome=false, поэтому public Header и Footer отсутствуют;
- Age Gate и глобальные базовые стили сохраняются.

Tool 01 Motion Settings показывает отдельный live preview ExperienceCard и восемь sliders. Tool 02 Border Trail расположен ниже отдельным блоком, имеет собственный live preview и пять sliders. Оба инструмента имеют независимые Apply to site, Copy settings и Reset. Не объединять их preview, storage или apply flow.

## 14. GameTile

Компонент: src/components/showcase/GameTile.astro.

Текущий визуальный и функциональный контракт:

- artwork занимает основную часть карточки;
- visible game title убран, потому что название уже присутствует в artwork;
- текстовое название всё ещё существует как screen-reader-only content и в aria-label;
- видимая metadata содержит RTP и volatility meter;
- type badge показывается поверх artwork;
- coming soon badge показывается для unreleased title;
- hover affordance показывает Play или Preview;
- на touch affordance остаётся доступным без hover;
- вся карточка ведёт на /portfolio/{slug};
- на узких container sizes metadata упрощается;
- карточка использует реальные данные record, а не дублированный текст.

Если artwork новой игры не содержит читаемого названия, решение нельзя принимать автоматически. Нужно либо подготовить artwork с title, либо согласовать локальное возвращение visible title.

## 15. Детальная страница игры

Файл: src/pages/portfolio/[slug].astro.

Структура:

1. GameHeader.
2. SpecStrip.
3. Demo или no-demo state.
4. Overview из Markdown.
5. Highlights.
6. Features.
7. Related live games того же type.

### 15.1. GameHeader

Компонент:

- использует hero image как full banner;
- добавляет overlays для читаемости;
- выводит breadcrumbs;
- показывает type и status;
- вычисляет fit заголовка на основе длины name;
- показывает CTA к demo или контактному сценарию;
- размещает card art как отдельный floating layer;
- на desktop card art реагирует на scroll через requestAnimationFrame;
- IntersectionObserver включает цикл только пока hero видим;
- narrow screens и reduced motion отключают parallax.

### 15.2. SpecStrip

Шесть ячеек:

- RTP;
- Volatility;
- Max win;
- Bet range;
- Layout;
- Main feature.

Неизвестные optional values показываются как On request, а не угадываются.

### 15.3. Demo

Если demo существует:

- URL вычисляется функцией demoUrl;
- iframe не существует при initial render;
- poster загружается как responsive image;
- только click Play создаёт iframe;
- frame получает title;
- allow: fullscreen, autoplay, gamepad;
- sandbox: allow-scripts allow-same-origin allow-popups;
- loading overlay скрывается после iframe load;
- рядом есть 18+ и пояснение free play;
- пользователь может скопировать demo link.

Если demo отсутствует:

- iframe не создаётся;
- показывается In development для coming soon;
- для live без demo показывается Demo on request;
- CTA ведёт к contact.

### 15.4. Related games

- только игры того же type;
- только live;
- текущая игра исключается;
- максимум три;
- порядок зависит от порядка all collection.

## 16. Event page

URL: /event.  
Файл: src/pages/event.astro.  
Конфигурация: src/data/events.ts.  
Компоненты: src/components/event.

### 16.1. Текущий event

| Поле | Значение |
| --- | --- |
| Event | SBC Lisbon |
| Location | Lisbon |
| Time zone | Europe/Lisbon |
| Campaign start | 1 September 2026 |
| Event dates | 29 September – 1 October 2026 |
| Public URL | /event |
| Common booking URL | отсутствует |

### 16.2. Секции

- EventHero;
- WhyAceGames;
- EventStats;
- FeaturedGames;
- EventTeam;
- EventTopics;
- EventBooking.

### 16.3. EventHero

- date и location;
- h1 Meet Ace Games at SBC Lisbon;
- tagline;
- introduction;
- CTA Book a meeting;
- collage из Ace City, Zeus Run и Chicken Doom;
- responsive images.

### 16.4. Why Ace Games

Три аргумента:

- different kind of game;
- tested with real players;
- exclusive games for partner brand.

### 16.5. Event stats

- 25+ games;
- 15+ years of game-development experience;
- 600K+ unique players testing games.

Эти event-specific значения уже опубликованы в event data. Если они меняются, нужно проверить согласованность с Hero Stats и другими marketing claims.

### 16.6. Featured games

- Ace City;
- Zeus Runner;
- Plinko;
- Chicken Doom.

Первый item визуально lead и использует hero image, остальные используют card art.

### 16.7. Event team

Участники:

- Angelina;
- Timur;
- Mykola.

Есть:

- expertise;
- LinkedIn;
- CTA на встречу.

Пока отсутствуют:

- portraits;
- positions;
- individual booking URLs.

UI показывает initial и Portrait coming soon. AI не должен генерировать лица или job titles без отдельного запроса и подтверждения.

### 16.8. Topics

- Player acquisition & retention;
- Custom games;
- Game formats;
- Integration & distribution.

### 16.9. Booking flow

При bookingUrl:

- локальная форма заменяется CTA на внешний scheduler.

Без bookingUrl:

- форма собирает name, company, work email, member, preferred day, optional Lisbon time и message;
- member CTA может preselect person через /event?member={id}#book-meeting;
- day options генерируются из event dates;
- submit не отправляет данные на сервер;
- buildMeetingEmail создаёт subject, body и encoded mailto link;
- пользователь должен открыть email app и самостоятельно отправить письмо;
- message можно просмотреть и скопировать из draft.

Порядок выбора booking URL:

1. individual member.bookingUrl;
2. common event.bookingUrl;
3. local event form.

Атрибуты data-event-track присутствуют, но analytics provider не подключён. Они ничего не отправляют.

## 17. Legal, thanks и 404

### 17.1. Legal pages

Контент:

- src/content/legal/terms-conditions.md;
- src/content/legal/privacy-policy.md.

Layout:

- src/pages/[legal].astro;
- ширина reading column до 980 px;
- centered title;
- Last updated;
- Markdown body.

Terms охватывают:

- website purpose;
- demo games;
- acceptable use;
- intellectual property;
- privacy;
- disclaimer and liability;
- third-party links;
- updates;
- Cyprus governing law;
- contacts.

Privacy охватывает:

- collected information;
- purposes;
- cookies and technologies;
- service providers;
- sharing and transfers;
- retention and security;
- GDPR rights;
- children;
- updates;
- contacts.

Legal content требует review после окончательного выбора hosting и service providers. Сейчас Privacy продолжает называть Webflow и Hetzner, хотя код и планы используют другие системы.

### 17.2. Thanks

URL /thanks имеет noindex.

Поддерживает:

- success default;
- status=error;
- reason=invalid;
- reason=unconfigured;
- reason=send-failed;
- reason=unreadable.

Client script меняет heading, text и CTA для error states.

### 17.3. 404

- noindex;
- содержит один h1;
- использует общий shell;
- даёт понятный путь обратно.

## 18. Модель данных игры

Каждый record находится в src/content/games/{slug}.md.

### 18.1. Обязательные поля

| Поле | Тип | Правило |
| --- | --- | --- |
| name | string | минимум 2 символа |
| type | enum | slot, instant, table |
| status | enum | live, coming_soon; default live |
| order | number | default 100 |
| seo.title | string | максимум 70 символов |
| seo.description | string | 60–165 символов |
| card | image | Astro image reference |
| hero | image | Astro image reference |
| specs.rtp | number или configurable | число 0.8–0.995 |
| specs.volatility | array | минимум одно значение |

Volatility values:

- low;
- medium;
- high;
- very_high.

### 18.2. Optional fields

| Поле | Тип |
| --- | --- |
| specs.maxWin | value, unit, approx |
| specs.bet | min, max |
| specs.mainFeature | string |
| specs.layout | string |
| demo | adapter или direct |
| highlights | string array |
| features | array title + body |

### 18.3. Max win

unit:

- x;
- coins.

approx=true добавляет плюс после значения.

### 18.4. Demo adapter

Структура:

    demo:
      mode: adapter
      gameId: действительный UUID

URL строится через adapter-api-demo.rstars.cc. lobbyUrl выводится из текущего slug игры.

### 18.5. Demo direct

Структура:

    demo:
      mode: direct
      build: имя build
      version: целое число
      apiHost: полный URL, если нужен

URL строится через cdn.rstars.cc.

### 18.6. Markdown body

После frontmatter хранится:

- overview;
- Core gameplay;
- дополнительные heading и paragraphs при необходимости.

Эта часть рендерится через Astro Content render.

## 19. Текущий каталог игр

Все записи имеют effective order 100, потому что явный order не задан. Сортировка внутри status выполняется по name.

| Slug | Name | Type | Status | RTP | Volatility | Demo |
| --- | --- | --- | --- | --- | --- | --- |
| ace-city | Ace City | slot | live | 95.3% | High | adapter |
| blackjack | Blackjack | table | coming soon | Configurable | Medium | нет |
| chicken-doom | Chicken Doom | instant | live | 97.0% | Low, Medium, High | direct |
| cyber-star | Cyber Star | slot | live | 95.8% | High, Very high | adapter |
| gold-of-ra | Gold of Ra | slot | live | 94.0% | Medium, High | adapter |
| good-staf | Good Stuff | instant | coming soon | Configurable | Low, Medium, High | нет |
| jackpot-vibe | Jackpot Vibe | slot | live | 95.1% | Medium, High | adapter |
| meme-star | Meme Star | instant | live | 97.4% | Medium, High | direct |
| montezuma | Montezuma Gold | slot | live | 95.6% | High | adapter |
| pigeon-road | Pigeon Road | instant | live | 97.0% | Low, Medium, High | direct |
| pirates-rush | Pirates Rush | slot | live | 94.8% | Medium, High | adapter |
| plinko-game | Plinko | instant | live | 94.9% | Low, Very high | adapter |
| ring-spin | Ring Spin | slot | live | 95.0% | Medium, High | adapter |
| star-go | Star Go | instant | live | 95.0% | Medium, High | direct |
| star-loot | Star Loot | instant | live | 97.4% | Low, Medium, High | direct |
| star-miner | Star Miner | instant | live | 95.8% | Medium, High | direct |
| star-rocket | Star Rocket | instant | live | 96.4% | Low, Medium, High | direct |
| stars-digger | Stars Digger | instant | live | 95.1% | Medium, High | нет |
| sweet-candy | Sweet Candy | slot | live | 96.0% | High, Very high | adapter |
| toy-story | Toy Story | instant | coming soon | Configurable | Low, Medium, High | нет |
| vikings-gold | Vikings Gold | slot | live | 94.2% | Medium, High | adapter |
| way-to-olympus | Way to Olympus | slot | live | 94.4% | Medium, High | adapter |
| wild-wwst | Wild West | slot | live | 95.8% | High, Very high | adapter |
| zeus-run | Zeus Run | slot | live | 94.5% | Low, High | direct |

Сводка:

- 12 slot;
- 11 instant;
- 1 table;
- 21 live;
- 3 coming soon;
- 12 adapter demo;
- 8 direct demo;
- 4 без demo.

## 20. Функции и утилиты

### 20.1. rtp

Файл: src/lib/format.ts.

Вход:

- number;
- configurable.

Выход:

- 0.945 → 94.5%;
- configurable → Configurable.

Правило: в content хранится decimal, а не готовая строка с процентом.

### 20.2. maxWin

Вход:

- optional object value, unit, approx.

Выход:

- 5000 x → 5,000x;
- 100000 coins + approx → 100,000+ coins;
- undefined → null.

### 20.3. volatility

Вход: массив enum values.

Выход:

- одно или два значения → читаемые labels через slash;
- более двух значений → Adjustable.

### 20.4. bet

Вход: min и max.

Выход: оба значения с двумя знаками после decimal, через дефис.

### 20.5. demoUrl

Вход:

- structured demo config;
- slug;
- origin, default https://acegames.io.

Выход:

- adapter start URL с encoded gameId и lobbyUrl;
- direct CDN URL с optional encoded apiHost.

### 20.6. mountCatalogueFilter

Файл: src/lib/catalogue-filter.ts.

Вход:

- gridId;
- chipSelector.

Эффекты:

- DOM reorder;
- dim state;
- aria state;
- live note;
- URL query;
- FLIP animation.

### 20.7. isCampaignActive

Файл: src/lib/event.ts.

Возвращает true, если now находится между campaignStart inclusive и eventEnd exclusive.

### 20.8. eventDateRange

Форматирует eventStart и последний день перед eventEnd в Europe/Lisbon.

Текущие результаты:

- long: 29 September–1 October;
- short: 29 Sep–1 Oct.

### 20.9. memberBookingUrl

Возвращает:

1. person URL;
2. общий event URL;
3. local preselected form URL.

### 20.10. meetingDays

Генерирует массив всех календарных event days в event timezone.

Текущие values:

- 2026-09-29;
- 2026-09-30;
- 2026-10-01.

### 20.11. buildMeetingEmail

Файл: src/lib/event-booking.ts.

Создаёт:

- human-readable email body;
- encoded mailto href;
- subject с названием event и company.

### 20.12. selectMeetingMember

Принимает select и requested member id. Меняет value только если такой option действительно существует. Это предотвращает внедрение произвольного значения из query string.

### 20.13. Contact helper functions

Файл: functions/api/contact.ts.

- clean: trim и ограничение длины;
- escapeHtml: HTML escaping для email body;
- back: 303 redirect на /thanks с query params;
- onRequestPost: основной POST handler.

### 20.14. Experience card motion

Файлы:

- src/data/experience-card-settings.ts;
- src/lib/experience-card-motion.ts.

Defaults:

    {
      "tiltMax": 12,
      "hoverScale": 1.015,
      "perspective": 2200,
      "response": 0.9,
      "artDepth": 96,
      "copyDepth": 120,
      "glareOpacity": 0.28,
      "glareTravel": 48
    }

Runtime валидирует диапазоны, читает и сохраняет localStorage key ace_experience_card_effects_v1, применяет CSS custom properties и data attributes, синхронизирует вкладки через storage event и текущую вкладку через ace:experience-card-settings. GSAP подключается только для fine pointer без reduced motion.

### 20.15. Border Trail

Файлы:

- src/components/showcase/OrbitBorder.astro;
- src/data/border-trail-settings.ts;
- src/lib/border-trail.ts.

Defaults:

    {
      "orbitDuration": 5.6,
      "orbitLength": 32,
      "orbitWidth": 1.5,
      "orbitOpacity": 0.62,
      "orbitBlur": 7
    }

Runtime валидирует диапазоны, сохраняет localStorage key ace_border_trail_effects_v1 и применяет CSS custom properties только к data-border-trail-host. Настройки синхронизируются через storage event и ace:border-trail-settings. Эффект Header и card motion не имеют общего settings object.

## 21. Contact backend и внешняя отправка email

Endpoint: POST /api/contact.

Environment variables:

| Variable | Назначение |
| --- | --- |
| RESEND_API_KEY | API key Resend |
| CONTACT_TO | получатель lead |
| CONTACT_FROM | verified sender |

Flow:

1. Разобрать FormData.
2. Если FormData unreadable, redirect с reason=unreadable.
3. Если honeypot website заполнен, вернуть fake success.
4. Trim и truncate fields.
5. Проверить name, company, email.
6. Проверить минимальный email pattern.
7. Проверить secrets.
8. Сформировать plain text и escaped HTML.
9. POST https://api.resend.com/emails.
10. При error вернуть reason=send-failed.
11. При success вернуть status=ok.

Ограничения:

- name 120;
- company 160;
- email 200;
- message 5000;
- message не обязателен.

Текущая защита от abuse:

- honeypot;
- basic validation;
- output escaping.

Сейчас нет:

- server-side rate limiting;
- CAPTCHA или Turnstile;
- CSRF token;
- persistent lead storage;
- admin UI;
- retry queue;
- monitoring;
- spam scoring;
- explicit backend validation consent.

Добавление любого такого механизма должно учитывать privacy policy и accessibility.

## 22. SEO

### 22.1. Глобально

- title;
- meta description;
- canonical;
- Open Graph;
- Twitter summary_large_image;
- Organization JSON-LD;
- robots.txt;
- sitemap-index.xml;
- один h1;
- semantic landmarks.

### 22.2. Page-specific

- home: FAQPage JSON-LD только для answered FAQ;
- games: ItemList JSON-LD;
- game page: Product и BreadcrumbList;
- event: custom canonical и generated 1200 px JPG share image из Ace City hero;
- thanks и 404: noindex.

### 22.3. URL policy

- trailingSlash: never;
- Astro build format: file;
- site: https://acegames.io;
- existing /portfolio/{slug} URLs сохраняются;
- rename и retire всегда требуют 301.

### 22.4. Известная SEO-проблема

Default OG image /og-default.png отсутствует. Страницы без явно переданного image публикуют URL несуществующего ресурса.

## 23. Design system

### 23.1. Цвета

Dark surfaces:

- ink-0: #0c0c0b;
- ink: #111110;
- ink-2: #171715;
- ink-3: #1e1e1b;
- ink-4: #262623;
- line: #2c2c28;
- line-2: #3b3a35.

Text:

- fg: #f4f1e6;
- fg-2: #a9a69a;
- fg-3: #7d7a70.

Brand:

- brand: #ff5600;
- brand-hover: #ff6b22;
- brand-deep: #c43f00;
- peach: #f6cb95.

Current primary button:

- background orange;
- text white через on-brand-button;
- icon white;
- normal Tanker weight 400;
- letter spacing 0.04em;
- icon stroke width 8.

Cream block:

- cream: #fffff5;
- cream-2: #f6f3e4;
- cream ink values;
- cream line.

Categorical tints:

- mint;
- pink;
- lemon;
- ice;
- peach;
- sky.

### 23.2. Typography

- Tanker: display headings и button labels;
- Inter Variable: body и UI text;
- JetBrains Mono Variable: numbers, metadata, eyebrow.

Fluid type steps:

- step -1;
- step 0;
- step 1;
- step 2;
- step 3;
- step 4;
- step 5.

Display classes:

- d0: hero;
- d1: section headline;
- d2;
- d3;
- d4.

### 23.3. Layout

- max content width: 1320 px;
- horizontal gutter: clamp 20 px, 4vw, 48 px;
- section vertical spacing: clamp 72 px, 9vw, 140 px;
- radius small: 8 px;
- radius: 14 px;
- radius large: 22 px;
- pill: 999 px.

### 23.4. Buttons

- buttons are pills;
- primary is orange with white text и icon;
- ghost uses translucent dark surface;
- min default height 52 px;
- small min height 44 px;
- trailing icon может находиться в отдельном disc;
- hover, active и reduced motion должны сохраняться;
- новые orange buttons обязаны использовать существующий btn-primary, если нет убедительной причины создавать variant.

### 23.5. Cards

- default larger card radius: radius-l;
- background через surface tokens;
- subtle warm shadows;
- borders не заменяют hierarchy без необходимости;
- GameTile title не дублируется поверх artwork в текущем варианте.

### 23.6. Focus

Глобальный focus-visible:

- 3 px solid brand;
- offset 3 px;
- radius 4 px.

Нельзя удалять focus outline ради эстетики без равноценной замены.

## 24. Motion system

Tokens:

- ease: cubic-bezier(0.32, 0.72, 0, 1);
- ease-out: cubic-bezier(0.16, 1, 0.3, 1);
- duration 1: 0.18 s;
- duration 2: 0.5 s;
- duration 3: 0.9 s.

Используемые типы motion:

- continuous CSS drift в Wall;
- ScrollTrigger scrub в Wall;
- fade и translate reveal;
- FAQ height, opacity, translate и icon rotation;
- catalogue FLIP;
- GameHeader scroll parallax;
- ExperienceCard pointer tilt, depth и glare;
- animated Border Trail вокруг Header;
- handwritten contact arrow loop;
- button micro-movement;
- image hover scale;
- AgeGate enter/exit;
- CatalogueHero video.

Правила:

- meaningful motion;
- основной акцент на transform и opacity;
- без резких layout jumps;
- prefers-reduced-motion обязателен;
- контент должен оставаться доступным без анимации;
- новый heavy animation требует performance budget и mobile fallback;
- нельзя повторять одну и ту же hero-анимацию на всех страницах без продуктовой причины.

## 25. Responsive model

Основные объявленные breakpoints:

- 480;
- 768;
- 992;
- 1280;
- 1440.

Фактически отдельные компоненты также используют:

- 440;
- 520;
- 560;
- 600;
- 760;
- 780;
- 900;
- 1040;
- 1100.

Ключевые responsive behavior:

- Header переходит в burger до 992 px;
- Games grid: 4 → 3 → 2 → 1;
- Excellence: три vertical cards на desktop, три horizontal cards в колонку на 561-992 px, vertical cards на phone;
- Effects Lab: preview и controls становятся одной колонкой до 900 px;
- Event grids сворачиваются в одну колонку;
- Event stats становятся vertical;
- booking form pairs становятся single column;
- GameHeader упрощает parallax;
- FAQ сохраняет полную ширину container и адаптирует paddings;
- mobile controls имеют touch target минимум 44 px;
- AgeGate меняет порядок действий;
- video hero корректирует object-position.

Для каждой UI-фичи ТЗ должно содержать проверку минимум на 375, 768, 1024 и 1440 px. При card-level adaptive behavior нужно также проверять container width, а не только viewport.

## 26. Accessibility

Уже реализовано:

- semantic header, nav, main, footer;
- skip link;
- один h1;
- alt для изображений;
- width и height для img;
- aria labels для icon-only buttons;
- aria-expanded у burger;
- Escape close для mobile menu;
- focus return после закрытия menu и announcement;
- focus trap в Age Gate;
- details/summary для FAQ;
- aria-live для filter result;
- keyboard focus для Maths Explorer;
- minimum 44 px control sizes;
- reduced motion;
- no-JS readable reveal content.

Требует обязательной проверки при новых фичах:

- tab order;
- focus visibility;
- focus return после modal/drawer;
- color contrast;
- screen reader label;
- touch target;
- zoom 200%;
- keyboard-only interaction;
- reduced motion;
- content без JavaScript, где это заявлено как progressive enhancement.

Особое замечание: белый текст на #ff5600 может не проходить WCAG AA для обычного мелкого текста. Это текущее осознанное визуальное решение владельца и оно синхронизировано с AGENTS.md. При планировании новых кнопок следует сохранять согласованность CTA, не переносить это сочетание на мелкий body text и отдельно проверять contrast.

## 27. Performance

### 27.1. Что сделано хорошо

- static output;
- responsive image generation;
- width и height предотвращают image layout shift;
- demo iframe создаётся только после click;
- Wall GSAP загружается динамически;
- ScrollTrigger включается только там, где нужен;
- parallax loop работает только пока element visible;
- poster используется до demo;
- first-load budgets проверяются scripts/verify.mjs;
- immutable caching для fonts, media и _astro.

### 27.2. Asset inventory

Source assets:

- 24 card WebP;
- общий объём card art: 2,709,600 bytes;
- 24 hero WebP;
- общий объём hero art: 3,288,184 bytes;
- 16 site-level art assets для Excellence, Future, Contact и proof;
- крупные source PNG Excellence оптимизируются Astro при build;
- build генерирует responsive variants.

### 27.3. Главный риск

Games hero MP4 весит 116,440,314 bytes. preload=metadata не гарантирует, что autoplay не начнёт большой download. Нужны:

- короткий loop;
- меньший bitrate;
- WebM и оптимизированный MP4;
- отдельный mobile source;
- poster-first strategy;
- измерение LCP, transferred bytes и decode cost;
- проверка Save-Data;
- fallback при network error;
- решение о self-hosting или CDN.

### 27.4. Performance budgets

Текущие automated budgets:

- home до 1.5 MB;
- representative game page до 1.5 MB до Play.

Результат стабильного среза: home около 970 KB, representative game page около 302 KB, 363 optimized image variants и 318 rendered img elements без пропущенных dimensions или alt.

Games page video в эти gates не входит. Будущее ТЗ на hero video обязано иметь отдельный video budget.

## 28. Security headers и CSP

public/_headers задаёт:

- X-Content-Type-Options: nosniff;
- X-Frame-Options: SAMEORIGIN;
- Referrer-Policy: strict-origin-when-cross-origin;
- Permissions-Policy запрещает geolocation, microphone, camera, clipboard-read и clipboard-write;
- CSP default-src self;
- CSP form-action self;
- CSP frame-ancestors self;
- CSP img-src self и data;
- CSP font-src self;
- CSP style-src self и unsafe-inline;
- CSP script-src self и unsafe-inline;
- CSP frame-src cdn.rstars.cc и adapter-api-demo.rstars.cc;
- CSP connect-src self.

Известные конфликты:

1. CSP не содержит media-src для Amazon S3. На хостинге, который применяет public/_headers, внешний video hero будет заблокирован через default-src self.
2. Permissions-Policy clipboard-write=() может мешать Copy demo link. Это нужно проверять на реальном production host.
3. Event form имеет mailto action как no-JS fallback, но form-action self может блокировать mailto. С JavaScript submit перехватывается.
4. Любой новый external script, image, font, frame, media или API требует сознательного обновления CSP.

Нельзя просто удалить CSP ради работы новой интеграции. ТЗ должно перечислять точные origins и минимально необходимые directives.

## 29. Внешние сервисы и домены

| Домен или сервис | Назначение |
| --- | --- |
| acegames.io | canonical origin |
| adapter-api-demo.rstars.cc | adapter demo start и iframe |
| cdn.rstars.cc | direct game builds |
| pigeon-road-api.demo.rstars.cc | API для Pigeon Road и Chicken Doom |
| trading-api.demo.rstars.cc | API для Meme Star |
| grabber-api.demo.rstars.cc | API для Star Loot |
| monopoly-api.demo.rstars.cc | API для Star Go |
| miner-api.demo.rstars.cc | API для Star Miner |
| rocket-api.demo.rstars.cc | API для Star Rocket |
| racing-crash-api.testing.rstars.cc | текущий testing API для Zeus Run |
| api.resend.com | отправка contact email |
| ace-games.s3.eu-north-1.amazonaws.com | внешний Games hero video |
| linkedin.com | ссылки event team |
| google.com | redirect при отказе Age Gate |

Наличие домена в source не означает, что он разрешён CSP или подтверждён для production. Zeus Run явно использует testing host и требует подтверждения.

## 30. Hosting и deployment

В репозитории присутствуют две инфраструктурные линии.

### 30.1. OpenAI Sites static config

.openai/hosting.json:

- project_id: appgprj_6a997e6d1c208191b86206072b5a4ff5;
- static directory: dist.

Это указывает на static deployment через Sites.

### 30.2. Cloudflare Pages plan

DEPLOY.md описывает:

- Git-based Cloudflare Pages;
- build command npm run build;
- output dist;
- Node 20;
- Resend secrets;
- domain migration;
- rollback;
- Cloudflare Web Analytics.

functions/api/contact.ts является Cloudflare Pages Function и зависит от этой среды.

### 30.3. Неопределённость

До production deployment нужно выбрать фактическую платформу и проверить:

- исполняется ли functions/api/contact.ts;
- применяются ли public/_headers;
- применяются ли public/_redirects;
- работает ли clean URL для file output;
- доступны ли environment secrets;
- где настраивается custom domain;
- где доступен rollback;
- кто хранит analytics;
- какие service providers должны быть перечислены в Privacy.

Нельзя считать Cloudflare Pages и Sites взаимозаменяемыми без проверки serverless functions и headers.

## 31. Automated verification

scripts/verify.mjs проверяет dist.

14 gates:

1. Все 27 оригинальных URL существуют.
2. Нет href="#".
3. Нет внутренних ссылок на отсутствующий route.
4. У каждого img есть width и height.
5. У каждого img есть alt.
6. Нет iframe с пустым src.
7. На каждой странице ровно один h1.
8. На каждой странице есть main, header, footer и skip link.
9. На каждой странице есть canonical и description.
10. Нет запрещённых следов старого template или host.
11. Нет TODO в сгенерированной странице.
12. Нет em dash в нелегальном page copy.
13. Home меньше 1.5 MB.
14. Representative game page меньше 1.5 MB до Play.

Forbidden legacy strings включают Webflow-related template leaks, старые brand/template references и dummy UUID. Legal pages имеют узкое исключение для Webflow, потому что Privacy пока содержит этот текст.

Нельзя ослаблять gates, чтобы заставить build пройти. Единственное описанное исключение: при retirement игры old slug удаляется из OLD одновременно с добавлением 301.

## 32. Известные расхождения старой документации и текущего кода

| Тема | Старый документ | Текущий код |
| --- | --- | --- |
| Games hero | старые планы исключали S3 video | внешний S3 MP4 снова подключён |
| AWS cleanup | DEPLOY.md предлагает удалить bucket | текущий Games hero зависит от этого bucket |
| Event tests | docs/EVENT.md требует Node 24+ | проект закреплён на Node 20 |
| Hosting | DEPLOY.md описывает Cloudflare | .openai/hosting.json описывает Sites static |
| Privacy provider list | Webflow и Hetzner | код также использует Resend, rstars и S3; target hosting не определён |

README.md, AGENTS.md и AI-HANDOVER.md синхронизированы с текущими кнопками, GameTile, Effects Lab и Excellence cards в стабильном срезе 5 сентября 2026 года. Для оставшихся строк таблицы AI должен ссылаться на фактический код и последнее решение владельца.

## 33. Известные незавершённые места

### 33.1. Site-wide

- testing laboratory;
- standards и certificate numbers;
- jurisdictions;
- integration method;
- aggregators;
- integration docs URL;
- integration time;
- commercial model;
- languages;
- currencies;
- live operators count;
- markets count;
- delivery time;
- real social profiles;
- partner logos;
- booking calendar URL;
- game sheet PDF;
- team portraits;
- team positions;
- production booking URLs;
- final hosting architecture;
- legal provider list;
- default OG image;
- analytics provider.

### 33.2. Game data risks

TODO.md содержит конкретные проблемы:

- подозрительно скопированный body copy;
- перепутанные label/value из старых stat cards;
- одинаковые specs у разных игр;
- возможные reskins;
- отсутствующие max win и bet;
- отсутствие demo у live Stars Digger;
- testing backend у Zeus Run;
- demo Chicken Doom на backend Pigeon Road;
- trademark clearance для Toy Story, Plinko, Montezuma Gold и Wheel of Fortune naming.

AI-планировщик должен проверять TODO.md перед ТЗ на game content, SEO, legal, catalogue completeness или launch.

## 34. Critical issues, которые стоит вынести в ближайший backlog

Приоритеты ниже являются технической рекомендацией, а не автоматически утверждённым roadmap.

### P0 до production

1. Выбрать реальный hosting target.
2. Обеспечить работу contact endpoint на выбранном host.
3. Исправить CSP для video или перенести video на разрешённый origin.
4. Сжать и адаптировать 111 MiB Games hero video.
5. Обновить Privacy под фактические processors и hosting.
6. Проверить Age Gate copy и persistence с legal.
7. Подтвердить production host Zeus Run.

### P1

1. Добавить существующий default OG image или убрать default reference.
2. Подключить analytics к data-event-track либо удалить ложное ожидание tracking.
3. Исправить event test command и согласовать Node version.
4. Проверить clipboard policy.
5. Проверить event mailto fallback под CSP.
6. Заполнить наиболее важные integration и compliance values.
7. Добавить booking scheduler для event.

### P2

1. Синхронизировать исторические PLAN и DEPLOY с окончательно выбранной production architecture.
2. Добавить team portraits и positions.
3. Добавить real social и partner logos после подтверждения.
4. Разобрать content duplication и trademark issues в game records.
5. Добавить automated browser tests для Age Gate, FAQ, filter, contact и event booking.

## 35. Инварианты проекта

Будущее ТЗ не должно нарушать эти правила без отдельного решения владельца.

1. Публичные game URLs сохраняются.
2. Rename или retirement slug требует 301.
3. У каждой страницы один h1.
4. Контент не должен становиться невидимым только из-за сбоя JavaScript.
5. Game values живут в content, labels и formatting — в templates/helpers.
6. RTP хранится decimal или configurable.
7. Demo URL не хранится готовой строкой.
8. Нет demo config — нет iframe.
9. External demo загружается только после явного Play.
10. Raster images из src/assets идут через Astro asset pipeline: Image с sizes либо getImage для CSS nine-slice.
11. Filters reorder and dim, но не hide.
12. Неизвестный факт показывается как need-state или не показывается.
13. Нельзя выдумывать business, compliance, legal или performance claims.
14. Motion имеет reduced-motion fallback.
15. Focus и keyboard behavior являются частью фичи.
16. Primary visual language остаётся dark, orange, peach, cream и текущая typography.
17. Изменение одной секции не даёт права перестраивать соседние.
18. npm run check и npm run ship обязательны перед завершением implementation task.
19. Dirty worktree сохраняется.
20. Security headers меняются только минимально и осознанно.

## 36. Матрица влияния изменений

| Запрос | Основные файлы | Дополнительные проверки |
| --- | --- | --- |
| Изменить company data | src/data/site.ts | Footer, JSON-LD, contact, legal consistency |
| Изменить CTA | src/data/site.ts, возможно Header | home, header, mobile menu, event override |
| Изменить button style | tokens.css, base.css | все orange buttons, focus, contrast |
| Изменить Header или Games dropdown | Header.astro, game-categories.ts | desktop hover/focus, keyboard, mobile, Event CTA |
| Изменить Border Trail | OrbitBorder, border settings/lib, Effects Lab | live preview, Apply, storage sync, reduced motion |
| Изменить Excellence cards | Excellence, ExperienceCard, ScalableCardFrame, why | desktop/tablet/mobile, fine/coarse pointer, reduced motion |
| Изменить motion presets | data settings, matching lib, Effects Lab | normalization, separate storage keys, cross-tab sync |
| Добавить игру | content record, card, hero | schema, all catalogs, detail, sitemap, performance |
| Изменить RTP | game record | tile, spec strip, maths explorer, SEO copy |
| Добавить demo | game record | demoUrl, CSP frame-src, lazy iframe |
| Retire игру | content location, redirects, verify OLD | old URL, sitemap, related lists |
| Изменить FAQ | site.ts, возможно index styles/script | accordion, FAQ schema, mobile, keyboard |
| Добавить partner logo | public/partners, site.ts | SVG quality, marquee, reduced motion |
| Изменить Games hero | CatalogueHero.astro, assets, headers | video budget, CSP, poster, mobile |
| Изменить Age Gate | AgeGate.astro, Base.astro | focus trap, storage, scroll lock, legal |
| Новый event | events.ts, event components | timezone, banner window, booking, SEO |
| Добавить scheduler | events.ts | external origin, privacy, CSP, tracking |
| Изменить contact | index, contact.ts, thanks | validation, spam, secrets, privacy |
| Новый route | pages, Header/Footer/nav | h1, metadata, sitemap, 404 links |
| Legal update | content/legal | lawyer review, updated date, providers |
| Analytics | Base или integration module | consent, privacy, CSP, event attributes |
| Hosting migration | hosting config, headers, redirects, function | domain, email, rollback, form |

## 37. Рабочий процесс для новой фичи

### 37.1. Discovery

AI должен зафиксировать:

- кто пользователь;
- какую проблему он решает;
- какой бизнес-результат нужен;
- на каких страницах проблема видна;
- какой текущий behavior заменяется;
- какие данные уже есть;
- каких фактов не хватает;
- есть ли внешний сервис;
- есть ли legal или compliance consequence;
- как измерить успех.

### 37.2. Scope

ТЗ должно явно перечислять:

- in scope;
- out of scope;
- затрагиваемые routes;
- затрагиваемые components;
- data changes;
- runtime changes;
- external dependencies;
- fallback;
- responsive states;
- accessibility states;
- error states;
- analytics;
- SEO;
- performance budget;
- migration и rollback.

### 37.3. Implementation plan

Хороший план идёт в порядке:

1. Source data и schema.
2. Shared primitives.
3. Page composition.
4. Client behavior.
5. Error и fallback states.
6. SEO и structured data.
7. Security и privacy.
8. Automated checks.
9. Visual browser QA.
10. Deployment-specific verification.

### 37.4. Definition of done

Фича считается готовой только если:

- соответствует согласованному visual behavior;
- не меняет out-of-scope sections;
- работает при реальных data states;
- keyboard flow проверен;
- reduced motion проверен;
- mobile и desktop проверены;
- errors и empty states предусмотрены;
- npm run check проходит;
- npm run ship проходит;
- external integration проверена в окружении, где она действительно работает;
- документация и privacy обновлены, если изменились processors или data flow.

## 38. Структура качественного ТЗ

AI должен выдавать ТЗ в следующем составе.

### 38.1. Название

Краткое действие и объект. Например: Оптимизация видеогероя страницы Games.

### 38.2. Контекст

- что существует сейчас;
- что не устраивает;
- почему изменение важно;
- связанные решения и ограничения.

### 38.3. Цель

Один измеримый пользовательский и бизнес-результат.

### 38.4. Scope

Конкретные страницы, компоненты, данные, integrations.

### 38.5. Out of scope

Что нельзя менять в этой задаче.

### 38.6. User stories

Не абстрактные роли, а реальные сценарии:

- acquisition manager открывает каталог;
- compliance specialist ищет certificates;
- mobile visitor просматривает hero;
- keyboard user управляет accordion;
- event visitor выбирает member и day.

### 38.7. Functional requirements

Каждое требование должно описывать:

- trigger;
- behavior;
- state change;
- output;
- error state;
- persistence;
- fallback.

### 38.8. Content requirements

- final copy;
- data owner;
- formats;
- max lengths;
- translations;
- запрет на invented claims.

### 38.9. UI requirements

- layout;
- width;
- hierarchy;
- typography;
- color tokens;
- spacing;
- borders;
- radius;
- hover;
- focus;
- active;
- disabled;
- loading;
- empty;
- error;
- mobile.

### 38.10. Motion requirements

- property;
- duration;
- easing;
- trigger;
- interruption behavior;
- reduced-motion alternative;
- layout stability.

### 38.11. Accessibility

- semantic element;
- keyboard controls;
- focus management;
- screen reader label;
- live region;
- contrast;
- zoom;
- touch targets.

### 38.12. Performance

- asset budget;
- loading strategy;
- preload;
- lazy behavior;
- mobile source;
- failure fallback;
- metrics.

### 38.13. SEO

- title;
- description;
- canonical;
- image;
- JSON-LD;
- sitemap;
- redirect.

### 38.14. Security и privacy

- collected data;
- storage;
- retention;
- third party;
- CSP origin;
- secrets;
- consent;
- policy update.

### 38.15. Acceptance criteria

Критерии должны быть проверяемыми. Не использовать формулировки лучше, красиво, плавно без числа или наблюдаемого результата.

### 38.16. Test plan

- source validation;
- unit;
- build;
- browser desktop;
- browser mobile;
- keyboard;
- reduced motion;
- slow network;
- production host.

### 38.17. Release и rollback

- feature flag или direct release;
- data migration;
- cache;
- monitoring;
- rollback action.

### 38.18. Open questions

Только вопросы, ответы на которые меняют scope, legal meaning, data model, integration или дизайн.

## 39. Полный пример ТЗ: оптимизация Games video hero

### Контекст

На /games CatalogueHero показывает внешний autoplay MP4 размером 116,440,314 bytes. Локально видео может воспроизводиться, но production CSP не разрешает Amazon S3 media. Большой файл может тормозить mobile loading и расходовать трафик.

### Цель

Сохранить выразительный игровой video hero, обеспечить быстрый initial render и надёжное воспроизведение на desktop и mobile без блокировки CSP.

### In scope

- CatalogueHero;
- video assets и sources;
- poster;
- public/_headers;
- reduced motion;
- network failure fallback;
- performance measurement.

### Out of scope

- Wall на главной;
- catalog grid;
- GameTile;
- game records;
- изменение headline и основного copy.

### Functional requirements

1. Hero сразу показывает poster.
2. Video начинает autoplay только muted и playsinline.
3. Desktop получает оптимизированный source.
4. Mobile получает отдельный меньший source.
5. При error остаётся poster без пустой чёрной области.
6. При reduced motion видео не запускается.
7. Controls не показываются, если отдельное product decision не требует controls.
8. Loop не содержит заметного скачка.
9. Video не блокирует h1, CTA и navigation.

### Performance requirements

1. Poster проходит через responsive image pipeline.
2. Mobile video transfer budget задаётся до реализации.
3. Desktop video transfer budget задаётся до реализации.
4. Первый screen остаётся usable до загрузки video.
5. Проверяются Slow 4G, Safari iOS и Chrome Android.
6. Проверяются LCP, transferred bytes и dropped frames.

### Security

1. Выбранный video origin явно добавляется в media-src.
2. Остальные CSP directives не расширяются.
3. Если video self-hosted, media-src self остаётся достаточным.

### Acceptance

1. /games не показывает CSP error.
2. На reduced motion виден стабильный poster.
3. При offline after HTML load виден poster и headline.
4. На 375 px нет horizontal overflow.
5. На 1440 px video покрывает hero без искажения.
6. npm run check и npm run ship проходят.
7. Production URL проверен с реальными response headers.

## 40. Полный пример ТЗ: заполнение compliance блока

### Контекст

Integration and compliance section содержит десять незаполненных значений. Три FAQ также не имеют подтверждённых ответов. Эти данные критичны для B2B buyer.

### Цель

Опубликовать только проверенные integration и compliance facts, убрать соответствующие need-states и синхронизировать FAQ.

### Обязательные входные данные от владельца

- точный integration method;
- live aggregators;
- documentation URL;
- typical go-live time;
- laboratory;
- standard;
- certificate numbers;
- approved jurisdictions;
- commercial model;
- languages;
- currencies.

### Functional requirements

1. Значения меняются только в src/data/site.ts.
2. Templates не получают hardcoded facts.
3. FAQ ответы обновляются теми же подтверждёнными формулировками.
4. FAQPage JSON-LD автоматически включает новые answered items.
5. Links имеют реальные URL и понятный label.
6. Неизвестные строки остаются need-state.

### Acceptance

1. Нет противоречий между table и FAQ.
2. Все опубликованные claims имеют owner source.
3. На mobile rows читаются без overflow.
4. Structured data содержит только видимый реальный answer.
5. npm run check и npm run ship проходят.

## 41. Вопросы, которые AI должен задавать владельцу

### Для новой UI-фичи

- Какую конкретную проблему текущего интерфейса решаем?
- Какие страницы входят в scope?
- Есть ли reference только по структуре или также по стилю и motion?
- Какие элементы нельзя менять?
- Какой результат будет считаться успешным?

### Для внешней интеграции

- Какой provider выбран?
- Есть ли production URL и credentials?
- Какие данные передаются?
- Где они хранятся и сколько?
- Нужен ли consent?
- Есть ли privacy и legal approval?
- Какой fallback при outage?

### Для game content

- Status live или coming soon?
- Точные RTP и volatility?
- Max win и bet range?
- Layout и main feature?
- Adapter UUID или direct build?
- API host production или testing?
- Есть ли права на название и artwork?

### Для event

- Точные dates и timezone?
- Campaign display window?
- Team members, titles, photos?
- Common или individual scheduler?
- Какие games featured?
- Какие tracking и success metrics?

### Для video и motion

- Есть ли финальный source?
- Нужен ли autoplay?
- Есть ли poster?
- Какой mobile budget?
- Что показывать при reduced motion?
- Нужен ли sound и как он включается?

## 42. Что AI не должен делать

- Не придумывать сертификаты и юрисдикции.
- Не придумывать operator logos.
- Не придумывать job titles команды.
- Не использовать generated portraits вместо реальных без отдельного запроса.
- Не менять legal copy без явной задачи и review note.
- Не менять публичные slugs без redirect.
- Не добавлять iframe src пустым.
- Не загружать все demos при открытии страницы.
- Не отключать CSP целиком.
- Не добавлять тяжёлую библиотеку без необходимости.
- Не дублировать game title на card без учёта текущего решения.
- Не переносить Wall hero на Games как готовый ответ.
- Не скрывать nonmatching games в filter.
- Не удалять focus styles.
- Не заставлять motion работать при reduced motion.
- Не считать data-event-track работающей аналитикой.
- Не считать contact form работающей на любом static host.
- Не выдавать localhost behavior за production verification.
- Не отменять чужие незакоммиченные изменения.
- Не завершать implementation task без check и ship.

## 43. Рекомендованный формат ответа AI-планировщика

Когда владелец присылает новую идею, AI отвечает в таком порядке:

1. Коротко формулирует, что именно будет улучшено.
2. Объясняет, как это вписывается в текущий сайт.
3. Указывает затрагиваемые страницы и системы.
4. Выделяет решения, которые уже можно принять из текущего контекста.
5. Задаёт только критичные вопросы.
6. Предлагает один рекомендуемый вариант и при необходимости один альтернативный.
7. Даёт детальное ТЗ.
8. Добавляет acceptance criteria.
9. Добавляет test plan.
10. Отмечает риски, зависимости и out of scope.

## 44. Готовый handoff prompt для другого AI

Ниже текст, который можно отправить второму AI вместе с этим файлом:

    Ты помогаешь владельцу Ace Games планировать развитие сайта и составлять
    технические задания. Сначала полностью изучи файл AI-PROJECT-CONTEXT-RU.md.
    Считай фактический код более свежим источником, чем старые README и планы.
    Не придумывай бизнес-факты, сертификаты, юрисдикции, цифры, ссылки или
    юридические утверждения. Для каждой идеи определи цель, scope, out of scope,
    затрагиваемые маршруты, компоненты, данные, состояния, responsive,
    accessibility, motion, performance, SEO, security, privacy, тесты и rollback.
    Сначала предложи рекомендуемый подход, затем подготовь проверяемое ТЗ.
    Если данных не хватает, отдели блокирующие вопросы от необязательных.
    Не предлагай переписывать весь сайт, если задача относится к одной секции.

## 45. Краткая памятка

Если нужно быстро понять проект:

- это Astro static B2B iGaming showcase;
- 24 игры и 32 pages;
- source data разделён на site.ts, events.ts и Markdown collections;
- главная hero использует moving game wall;
- Games hero использует тяжёлое внешнее видео;
- cards не дублируют visible title;
- demos создают iframe только после Play;
- Age Gate хранит подтверждение в localStorage;
- event banner закрывается на sessionStorage;
- FAQ semantic и animated;
- Excellence cards имеют scalable frame, pointer motion и отдельный tablet layout;
- /effects-lab независимо настраивает card motion и Header Border Trail;
- form backend зависит от Cloudflare Pages и Resend;
- production hosting ещё нужно окончательно согласовать;
- CSP и S3 video сейчас конфликтуют;
- default OG image отсутствует;
- часть compliance, partner, team и booking data не заполнена;
- check и ship проходят;
- event unit tests требуют более нового Node или отдельного TypeScript runner;
- любое новое ТЗ должно сохранять URLs, accessibility, responsive, reduced motion и правдивость данных.

## 46. Поддержание документа

Этот файл нужно обновлять, если меняется хотя бы один из пунктов:

- route;
- page composition;
- component behavior;
- game schema;
- external provider;
- storage key;
- contact flow;
- hosting target;
- CSP;
- analytics;
- age verification logic;
- event configuration;
- button system;
- experience-card presets и storage contract;
- Border Trail presets и storage contract;
- adaptive component layout;
- catalogue behavior;
- performance budget;
- legal provider list;
- release command.

При обновлении нужно менять дату среза, фактические counts, список известных конфликтов и результаты проверок. Документ не должен постепенно превращаться в список планов: реализованное, planned и unknown всегда должны быть явно разделены.
