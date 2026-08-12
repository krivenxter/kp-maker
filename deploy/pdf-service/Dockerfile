FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PDF_SERVER_PORT=4174

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto-cjk \
    fonts-noto-core \
    libreoffice-impress \
    libreoffice-draw \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY server ./server
COPY tsconfig.node.json ./
COPY calltouch-assets/fonts ./calltouch-assets/fonts

# Используем те же шрифты, что и генератор PPTX, чтобы LibreOffice не делал
# неожиданные подстановки и не менял переносы строк на слайдах.
RUN mkdir -p /usr/local/share/fonts/calltouch \
  && cp -R calltouch-assets/fonts/. /usr/local/share/fonts/calltouch/ \
  && fc-cache -f

EXPOSE 4174

CMD ["pnpm", "server"]
