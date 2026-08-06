FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl python3 make g++
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate --schema=prisma/schema
RUN npm run build
RUN npm prune --omit=dev --ignore-scripts

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl chromium nss freetype harfbuzz ttf-freefont
ENV NODE_ENV=production
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["node", "dist/core/bin/www.js"]
