# Google Sheets → GitLab CI/CD: подключение публикации

Эта инструкция настраивает рабочую цепочку:

`Google Sheet → Apps Script → GitLab pipeline → проверка контента → commit в main → Docker image → Kubernetes production → Publish Log`.

Проект GitLab: `money.energy/www`, Project ID: `86013072`, production: `https://acegames.io`.

## Что уже подготовлено в коде

- `google-apps-script/Code.gs` запускает GitLab pipeline через Trigger API и читает registry из GitLab Repository Files API.
- `.gitlab-ci.yml` принимает snapshot, запускает importer, `npm run check` и `npm run ship`, затем коммитит только проверенный контент.
- Этот же pipeline собирает Docker image, разворачивает его в production и только после успешного deploy записывает `Published` в `05 Publish Log`.
- GitHub workflow публикации удалён, поэтому две системы одновременно контент не публикуют.

## 1. Создать Pipeline Trigger Token в GitLab

Нужна роль Maintainer или Owner.

1. Откройте `money.energy/www`.
2. Перейдите `Settings → CI/CD`.
3. Раскройте `Pipeline trigger tokens`.
4. Нажмите `Add new token`.
5. Название: `Google Sheets Publisher`.
6. Скопируйте выданный token. Он понадобится как `GITLAB_TRIGGER_TOKEN` в Apps Script.

Это именно Pipeline Trigger Token, не Personal Access Token.

## 2. Разрешить CI_JOB_TOKEN коммитить проверенный контент

1. В том же проекте откройте `Settings → CI/CD`.
2. Раскройте `Job token permissions`.
3. Включите `Allow Git push requests to the repository`.
4. Убедитесь, что владелец Pipeline Trigger Token имеет право push в защищённую ветку `main`.

GitLab выдаёт `CI_JOB_TOKEN` только на время job. Отдельный постоянный write-token в CI не нужен, а push с этим token не запускает второй pipeline.

## 3. Перенести Google service account в GitLab

1. Откройте `Settings → CI/CD → Variables`.
2. Добавьте переменную:

   - Key: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Type: `File`
   - Value: полный JSON service account
   - Protect variable: включено
   - Environment scope: `All`

3. Если GitLab позволяет, выберите `Masked and hidden`. Если проверка формата не принимает многострочный JSON, оставьте variable типа `File` и `Protected`: pipeline не выводит её содержимое в лог.
4. Саму Google Sheet расшарьте на `client_email` из JSON с ролью `Editor`.

Существующие deployment variables `ACEGAMES_KUBE_TOKEN`, `CF_API_TOKEN` и `CF_ZONE_ID` не меняйте.

## 4. Создать read-only token для Apps Script

Apps Script должен читать `content/sheets/seed.json` из приватного GitLab-проекта. Создайте отдельный Personal Access Token с единственным scope `read_repository`:

1. GitLab user settings → `Access tokens`.
2. Название: `Ace Sheets Registry Read`.
3. Scope: только `read_repository`.
4. Сохраните token. Не добавляйте ему `api` или `write_repository`.

На GitLab Free project access tokens могут быть недоступны, поэтому инструкция использует read-only Personal Access Token. Лучше создать его на отдельном техническом пользователе, если такой пользователь есть.

## 5. Обновить Apps Script у Google Sheet

1. Откройте рабочую таблицу.
2. Выберите `Extensions → Apps Script`.
3. Полностью замените `Code.gs` содержимым файла `google-apps-script/Code.gs` из этого репозитория.
4. Проверьте, что `appsscript.json` совпадает с `google-apps-script/appsscript.json`.
5. Откройте `Project Settings → Script properties` и задайте:

   | Property | Value |
   | --- | --- |
   | `GITLAB_API_URL` | `https://gitlab.com/api/v4` |
   | `GITLAB_PROJECT_ID` | `86013072` |
   | `GITLAB_BRANCH` | `main` |
   | `GITLAB_TRIGGER_TOKEN` | token из шага 1 |
   | `GITLAB_READ_TOKEN` | read-only token из шага 4 |
   | `SERVICE_ACCOUNT_EMAIL` | `client_email` из service-account JSON |
   | `PUBLISH_ALLOWLIST` | email владельцев публикации через запятую |

`GITLAB_REGISTRY_URL` добавлять не обязательно. Скрипт сам строит URL по Project ID и branch.

Удалите старые свойства `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` и `GITHUB_BRANCH`: новый скрипт их не использует.

6. Сохраните проект Apps Script и перезагрузите Google Sheet.
7. Один раз запустите `Ace Games → Sync Content from Site` и подтвердите Google permissions. Скрипт также обновит информационные строки `Target Branch`, `Registry URL` и `Normal Publish Time` на листе `04 Settings`.

## 6. Первый безопасный тест

1. Измените одну тестовую строку перевода, которую легко проверить.
2. Запустите `Ace Games → Validate Translations` и `Validate Games`.
3. Нажмите `Ace Games → Publish Changes`.
4. В `05 Publish Log` должна появиться строка `Queued` со ссылкой на GitLab pipeline.
5. В GitLab откройте `Build → Pipelines`. Для source `trigger` ожидаются jobs:

   - `content:publish`
   - `package:image:content`
   - `deploy:production`
   - при настроенном Cloudflare: `purge:cloudflare`
   - `report:content-success`

6. После deploy в Google Sheet появится `Published`, а Changed-флаги сбросятся.
7. Проверьте изменение на `https://acegames.io`.

## Если публикация упала

- `400` при запуске pipeline: проверьте, что `GITLAB_BRANCH=main` и workflow уже находится в GitLab `main`.
- `401/404` при `Sync Content from Site`: проверьте `GITLAB_PROJECT_ID` и `GITLAB_READ_TOKEN` со scope `read_repository`.
- `403` на `git push`: включите `Allow Git push requests to the repository` и проверьте права владельца trigger token на защищённую `main`.
- Ошибка чтения snapshot: проверьте `SERVICE_ACCOUNT_EMAIL`, доступ этого email к snapshot и GitLab variable `GOOGLE_SERVICE_ACCOUNT_JSON`.
- Ошибка deploy: смотрите `deploy:production`; старый production остаётся активным, а Sheet получит статус `Failed`.

## Правила безопасности

- Не хранить tokens и service-account JSON в Google Sheet, Git или `.gitlab-ci.yml`.
- `GITLAB_TRIGGER_TOKEN` и `GITLAB_READ_TOKEN` хранятся только в Apps Script Properties.
- `GOOGLE_SERVICE_ACCOUNT_JSON` хранится только в GitLab CI/CD Variables.
- При утечке token немедленно revoke/rotate его и обновить соответствующее свойство.

Официальные справки GitLab: [Pipeline trigger tokens](https://docs.gitlab.com/ci/triggers/), [CI_JOB_TOKEN push](https://docs.gitlab.com/ci/jobs/ci_job_token/#allow-git-push-requests-to-your-project-repository), [CI/CD variables](https://docs.gitlab.com/ci/variables/), [Repository Files API](https://docs.gitlab.com/api/repository_files/#retrieve-a-raw-file-from-a-repository).
