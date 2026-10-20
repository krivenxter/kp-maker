# Деплой фронтенда в Yandex Object Storage

Workflow `.github/workflows/deploy-yandex-cloud.yml` запускается при push в `main` параллельно с Vercel и может запускаться вручную в GitHub Actions.

## Настройка

Используется отдельный бакет `kp-maker`: деплой синхронизирует файлы в корень и удаляет объекты, которых больше нет в сборке.

В настройках бакета включи публичное чтение объектов, укажи `index.html` как главную страницу и страницу ошибки для SPA. Короткий HTTPS-адрес сайта: `https://kp-maker.website.yandexcloud.net`. Приложение обращается к ресурсам по путям `/assets/...`, `/fonts/...` и `/backgrounds/...`, поэтому URL с путём `/имя-бакета/` не подходит без дополнительной настройки.

В настройках репозитория GitHub добавь **Variables**:

- `YC_OBJECT_STORAGE_BUCKET` — необязательная замена имени бакета (по умолчанию `kp-maker`);
- `VITE_PDF_API_URL` — необязательная замена URL PDF-сервиса (по умолчанию `https://kp-maker.onrender.com`).

Добавь **Secrets**:

- `YC_OBJECT_STORAGE_ACCESS_KEY_ID`;
- `YC_OBJECT_STORAGE_SECRET_KEY`.

Создай отдельный сервисный аккаунт для GitHub Actions с ролью `storage.editor`, ограниченной только бакетом `kp-maker`. Workflow использует AWS CLI с S3 endpoint Yandex Object Storage.

Чтобы PDF-экспорт работал с обоих сайтов, `PDF_CORS_ORIGIN` на PDF-сервисе должен разрешать origins Vercel и Yandex Cloud. После настройки публичного URL проверь загрузку сайта, переход по шагам и PDF-экспорт.
