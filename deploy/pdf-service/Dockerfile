FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PDF_SERVER_PORT=4174

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-dejavu \
    fontconfig \
    fonts-liberation \
    fonts-noto-cjk \
    fonts-noto-core \
    libreoffice-impress \
    libreoffice-draw \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server ./server
COPY calltouch-assets/fonts ./calltouch-assets/fonts
COPY deploy/pdf-service/fonts.conf /etc/fonts/local.conf

# Используем только те же шрифты, что и генератор PPTX. Manrope намеренно не
# устанавливаем в PDF-образ, чтобы LibreOffice не выбирал старый fallback.
RUN mkdir -p /usr/local/share/fonts/calltouch \
  && cp calltouch-assets/fonts/DelaGothicOne-Regular.ttf /usr/local/share/fonts/calltouch/ \
  && cp calltouch-assets/fonts/museosanscyrl-300.otf /usr/local/share/fonts/calltouch/ \
  && cp calltouch-assets/fonts/museosanscyrl-700.otf /usr/local/share/fonts/calltouch/ \
  && cp calltouch-assets/fonts/static/Unbounded_*.ttf /usr/local/share/fonts/calltouch/ \
  && fc-cache -f \
  && echo 'PDF font regular:' \
  && fc-match -f '%{family} / %{style}\n' 'Museo Sans Cyrl:weight=regular' \
  && echo 'PDF font bold:' \
  && fc-match -f '%{family} / %{style}\n' 'Museo Sans Cyrl:weight=bold' \
  && echo 'PDF heading fonts:' \
  && fc-match -f '%{family} / %{style}\n' 'Dela Gothic One' \
  && fc-match -f '%{family} / %{style}\n' 'Unbounded'

EXPOSE 4174

CMD ["node", "--experimental-strip-types", "server/exportPdf.ts"]
