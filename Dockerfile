# your node version
FROM node:20-alpine AS deps-prod

WORKDIR /app

COPY ./package*.json .

RUN npm install --omit=dev

FROM deps-prod AS build

RUN npm install --include=dev

# Основные зависимости
RUN npm install knex pg axios node-cron

# Типы для TypeScript
RUN npm install --save-dev @types/knex @types/pg @types/axios @types/node-cron tsx

# Google API
RUN npm install googleapis

# Если не было — для миграций
RUN npm install --save-dev typescript

CMD ["node", "dist/app.js"]

COPY . .

RUN npm run build

FROM node:20-alpine AS prod

WORKDIR /app

COPY --from=build /app/package*.json .
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist