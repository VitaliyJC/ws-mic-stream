FROM node:22-alpine

WORKDIR /app

# сначала только манифесты — чтобы кешировалось
COPY package.json ./
# если есть package-lock.json — СКОПИРУЙ ТОЖЕ:
# COPY package-lock.json ./

# установка зависимостей
RUN npm ci --omit=dev || npm install --omit=dev

# теперь исходники
COPY ws.js ./ws.js
COPY public ./public

# безопасный пользователь
RUN adduser -D appuser && chown -R appuser:appuser /app
USER appuser

ENV HTTP_PORT=8080

EXPOSE 8080
CMD ["node","ws.js"]
