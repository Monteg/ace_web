# Ace Games CMS releases

## Термины

| Термин | Значение |
| --- | --- |
| Working CMS | Текущее редактируемое состояние Directus |
| Save | Сохранение working draft и revision history |
| Publish selection | Только отмеченные game/translation/content/media rows |
| Release snapshot | Неизменяемая нормализованная JSON-версия публичного контента |
| Deploy | Static Astro build конкретного release ID |
| Active release | Единственный snapshot, подтверждённый успешным callback |
| Rollback | Новый deploy из содержимого старого published snapshot |

## Почему snapshot обязателен

Working CMS может одновременно содержать готовое изменение Ace City и незаконченный перевод Gold of Ra. Публикация Ace City должна заменить только выбранную сущность/поле в предыдущем active payload. Gold of Ra остаётся byte-equivalent предыдущему release.

Snapshot также даёт checksum, воспроизводимую сборку, понятную историю и безопасный rollback без восстановления всей CMS database.

## `content_releases`

| Поле | Назначение |
| --- | --- |
| `id` | UUID release |
| `version` | Последовательный integer, выдаётся под PostgreSQL advisory lock |
| `status` | draft/validating/deploying/published/failed/retired |
| `created_at`, `created_by` | Аудит |
| `source_release` | Предыдущий active или snapshot rollback source |
| `payload` | Нормализованный immutable content JSON |
| `checksum` | SHA-256 canonical JSON |
| `deploy_status` | Provider/build state |
| `deploy_id`, `deploy_url` | Provider references |
| `error_log` | Sanitized build/provider error |
| `is_active` | Ровно один live snapshot |

Content Manager и Sheet Integration имеют read-only доступ к collection. Создание и изменение lifecycle выполняет custom endpoint; fields payload/checksum/version read-only в UI.

## Publish workflow

```text
selected working changes
        ↓
normalize shared/localized relations
        ↓
merge into previous active snapshot
        ↓
validate hard errors + collect warnings
        ↓
create vN + SHA-256 checksum
        ↓
signed DEPLOY_WEBHOOK_URL request
        ↓
CMS_RELEASE_ID → sync → check → ship
        ↓
signed success/failure callback
        ↓
success: atomically activate vN
failure: mark Failed, keep previous active
```

Первый release или `publish_all` берёт полный working snapshot. Последующие Sheet publishes merge selected changes:

- selected Game ID заменяет всю игру;
- selected translation key заменяет конкретное поле/status, не чужие поля;
- selected section/item заменяет конкретную structural entity;
- selected media row меняет конкретную relation/gallery item;
- другие games и draft translations остаются из предыдущего active payload.

## Validation

Hard errors до deploy:

- default locale не единственный English;
- required English site string пуст;
- English FAQ/game/section/item/gallery translation отсутствует или не Approved;
- duplicate/invalid slug или UUID;
- invalid type/status/RTP/volatility/max-win/bet;
- missing Card/Hero;
- invalid demo;
- broken parent/media relation.

Warnings:

- missing/draft secondary translation;
- secondary SEO fallback;
- secondary alt fallback.

Build повторно валидирует Zod snapshot schema и checksum перед скачиванием assets.

## Deploy webhook contract

Environment:

- `DEPLOY_WEBHOOK_URL`;
- `DEPLOY_WEBHOOK_SECRET`;
- `ACE_TRUSTED_PUBLISHERS`;
- `CMS_URL`, `CMS_BUILD_TOKEN`, `CMS_RELEASE_ID` на build host.

Request body — canonical JSON:

```json
{
  "checksum": "sha256-hex",
  "release_id": "uuid",
  "version": 45,
  "warnings": []
}
```

Header `X-Ace-Signature` — HMAC-SHA256 request body. Provider должен передать `release_id` как `CMS_RELEASE_ID`, `CONTENT_SOURCE=cms` и выполнить:

```bash
npm ci
npm run cms:deploy-release
```

`cms:deploy-release` выполняет sync, Astro check и `npm run ship`, затем всегда пытается отправить signed callback.

Success callback:

```json
{
  "release_id": "uuid",
  "status": "success",
  "deploy_id": "provider-id",
  "deploy_url": "https://deployment.example"
}
```

Failure callback добавляет `status: failed` и `error_log`. Callback signature считается от canonical JSON object. Повторный success callback идемпотентно оставляет release active; checksum проверяется ещё раз.

## Endpoint API

- `POST /ace-releases/publish` — authenticated trusted publisher; body `{ selections, publish_all?, source? }`.
- `POST /ace-releases/rollback` — authenticated trusted publisher; body `{ release_id }`.
- `POST /ace-releases/callback` — HMAC-authenticated deployment provider.

Server проверяет email Directus user по `ACE_TRUSTED_PUBLISHERS`. Проверка email внутри Apps Script — дополнительный UX guard, не security boundary.

## CLI

Полный initial/staging release:

```bash
npm run cms:publish -- --all
```

Selective release из JSON:

```bash
npm run cms:publish -- --selection selections.json
```

Format:

```json
{
  "games": ["game-uuid"],
  "translations": ["game:pirates-rush:overview", "header.games"],
  "content": ["section-or-item-uuid"],
  "media": ["game-uuid:hero", "gallery-uuid"]
}
```

Rollback:

```bash
npm run cms:rollback -- --release <published-release-uuid>
```

CLI publish/rollback использует scoped authenticated token named `CMS_MIGRATION_TOKEN` в текущей первой версии. В production рекомендуется отдельный release operator token с trusted Directus email.

## Failure semantics

| Failure | Новый release | Текущий public site |
| --- | --- | --- |
| Validation | Не создаётся | Без изменений |
| Webhook не настроен | Failed/not_configured | Без изменений |
| Provider недоступен | Failed/request_failed | Без изменений |
| Provider rejected | Failed/rejected | Без изменений |
| Sync/check/ship упал | Failed | Без изменений |
| Callback signature invalid | Не активируется | Без изменений |
| Checksum mismatch | Не активируется | Без изменений |

Новый release никогда не становится active до success callback.

## Rollback semantics

Rollback не переключает `is_active` сразу. Он копирует payload выбранного successful Published release в новый version N, ставит `source_release`, запускает обычный deploy и активирует его только после checks. Working CMS не меняется.

Это важно: после rollback редакторские drafts сохраняются, поэтому следующую публикацию нужно снова внимательно выбирать.

## Операционный checklist

1. Проверить trusted publisher и active release.
2. Проверить selection и localization warnings.
3. Нажать Publish один раз.
4. Убедиться, что release имеет Deploying и provider ID.
5. Дождаться Published/Failed; не редактировать snapshot.
6. Для Failed прочитать Error Log и исправить working data или infrastructure.
7. Создать новый publish после исправления; не переиспользовать failed payload вручную.
8. При регрессии redeploy последний known-good release.

## Ограничения текущей среды

Unit tests проверяют merge isolation, validation, checksum, signatures и schema entry points. Local static build проходит. На машине разработки нет Docker и production credentials, поэтому PostgreSQL transaction, Directus endpoint loading и реальный deploy webhook должны быть отдельно проверены в staging до cutover.
