# Calltouch PDF service

Сервис принимает настоящий `.pptx`, конвертирует его через LibreOffice в headless-режиме и возвращает `.pdf`. Слайды не превращаются в скриншоты: PPTX остаётся источником PDF-конвертации.

## Локальная проверка контейнера

Из корня проекта:

```bash
docker build -f deploy/pdf-service/Dockerfile -t calltouch-pdf-service .
docker run --rm -p 4174:4174 -e PDF_CORS_ORIGIN=http://localhost:5173 calltouch-pdf-service
```

Проверка доступности:

```bash
curl http://localhost:4174/api/export/pdf/health
```

Ожидаемый ответ:

```json
{"available":true}
```

## Production

Разверните этот Dockerfile на сервисе, который поддерживает Docker и долгоживущий HTTP-процесс. В переменной `PDF_CORS_ORIGIN` укажите адрес Vercel-приложения, например `https://ct-kp-maker.vercel.app`.

В настройках Vercel добавьте:

```text
VITE_PDF_API_URL=https://<адрес-pdf-сервиса>
```

После redeploy frontend будет обращаться к `/api/export/pdf/health` и `/api/export/pdf` уже на отдельном сервисе.
