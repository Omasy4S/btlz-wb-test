# ============================================
# Stage 1: Установка production зависимостей
# ============================================
FROM node:20-alpine AS deps-prod

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --omit=dev --ignore-scripts

# ============================================
# Stage 2: Сборка приложения
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем все зависимости (включая dev)
RUN npm ci --ignore-scripts

# Копируем исходный код
COPY . .

# Компилируем TypeScript в JavaScript
RUN npm run build

# ============================================
# Stage 3: Production образ
# ============================================
FROM node:20-alpine AS prod

WORKDIR /app

# Создаем непривилегированного пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Копируем package.json для метаданных
COPY --from=build /app/package*.json ./

# Копируем production зависимости из первого stage
COPY --from=deps-prod /app/node_modules ./node_modules

# Копируем скомпилированный код из второго stage
COPY --from=build /app/dist ./dist

# Меняем владельца файлов на непривилегированного пользователя
RUN chown -R nodejs:nodejs /app

# Переключаемся на непривилегированного пользователя
USER nodejs

# Указываем команду запуска
CMD ["node", "dist/app.js"]
