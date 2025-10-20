# 🚀 Сервис сбора тарифов Wildberries → PostgreSQL → Google Таблицы

> Автоматический сбор тарифов WB для коробов, сохранение в БД и выгрузка в N Google Таблиц.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

---

## 📋 Описание

Сервис выполняет две основные задачи:

1. **Ежечасный сбор тарифов WB** — получает актуальные тарифы для коробов через API Wildberries и сохраняет их в PostgreSQL
2. **Автоматическое обновление Google Таблиц** — выгружает данные из БД в N Google Таблиц с сортировкой по коэффициенту доставки

### ✨ Особенности

- ✅ **Полностью на TypeScript** с строгой типизацией
- ✅ **Docker-контейнеризация** — запуск одной командой
- ✅ **Knex.js** для работы с PostgreSQL (миграции, seeds, query builder)
- ✅ **Upsert логика** — обновление данных при повторном получении за тот же день
- ✅ **Graceful shutdown** — корректное завершение работы
- ✅ **Подробное логирование** — отслеживание всех этапов работы
- ✅ **Валидация env** с помощью Zod

---

## 🏗️ Архитектура

```
btlz-wb-test/
├── src/
│   ├── app.ts                      # Главный файл приложения
│   ├── config/
│   │   ├── env/env.ts             # Валидация переменных окружения
│   │   └── knex/knexfile.ts       # Конфигурация Knex.js
│   ├── postgres/
│   │   ├── knex.ts                # Утилиты для миграций и seeds
│   │   ├── migrations/            # Миграции БД
│   │   └── seeds/                 # Начальные данные
│   └── services/
│       ├── WBApiService.ts        # Работа с API Wildberries
│       ├── TariffDbService.ts     # Работа с БД
│       └── GoogleSheetsService.ts # Работа с Google Sheets API
├── Dockerfile                      # Multi-stage Docker сборка
├── compose.yaml                    # Docker Compose конфигурация
├── example.env                     # Пример переменных окружения
└── README.md                       # Документация
```

---

## 🚀 Быстрый старт

### 1️⃣ Клонирование репозитория

```bash
git clone https://github.com/lucard17/btlz-wb-test.git
cd btlz-wb-test
```

### 2️⃣ Настройка переменных окружения

Создайте файл `.env` в корне проекта на основе `example.env`:

```bash
cp example.env .env
```

Заполните обязательные переменные:

```env
# PostgreSQL (можно оставить как есть для тестирования)
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Порт приложения
APP_PORT=5000

# API ключ Wildberries (получите на hh.ru)
WB_API_KEY=your_actual_wb_api_key_here

# Google Sheets credentials (JSON в одну строку)
GOOGLE_SHEETS_CREDENTIALS_JSON={"type":"service_account",...}
```

#### 🔑 Как получить Google Sheets credentials:

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **Google Sheets API**
4. Создайте **Service Account** и скачайте JSON ключ
5. Скопируйте содержимое JSON файла в одну строку и вставьте в `.env`
6. Дайте Service Account доступ к вашим Google Таблицам (Share → добавьте email из JSON)

### 3️⃣ Запуск приложения

**Вариант 1: Полный запуск (рекомендуется)**

```bash
docker compose up --build
```

**Вариант 2: Только приложение (если БД уже запущена)**

```bash
docker compose up -d --build app
```

**Вариант 3: Только БД (для разработки)**

```bash
docker compose up -d --build postgres
```

### 4️⃣ Проверка работы

Приложение автоматически:
- ✅ Применит миграции к БД
- ✅ Добавит тестовую Google Таблицу из seeds
- ✅ Выполнит первый сбор тарифов
- ✅ Настроит cron для ежечасного запуска

Логи можно посмотреть командой:

```bash
docker compose logs -f app
```

---

## 🛠️ Разработка

### Локальный запуск (без Docker)

1. Установите зависимости:

```bash
npm install
```

2. Запустите PostgreSQL:

```bash
docker compose up -d postgres
```

3. Примените миграции и seeds:

```bash
npm run knex:dev migrate latest
npm run knex:dev seed run
```

4. Запустите приложение в режиме разработки:

```bash
npm run dev
```

### Полезные команды

```bash
# Проверка типов TypeScript
npm run tsc:check

# Форматирование кода
npm run prettier-format

# Создание новой миграции
npm run knex:dev migrate make migration_name

# Откат последней миграции
npm run knex:dev migrate rollback

# Создание нового seed
npm run knex:dev seed make seed_name

# Сборка проекта
npm run build

# Запуск production версии
npm start
```

---

## 📊 Структура базы данных

### Таблица `tariffs`

Хранит тарифы WB для коробов по датам.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `date` | DATE | Дата тарифа (индексируется) |
| `warehouse_name` | VARCHAR | Название склада |
| `delivery_coef` | DECIMAL(10,4) | Коэффициент доставки |
| `return_coef` | DECIMAL(10,4) | Коэффициент возврата |
| `storage_coef` | DECIMAL(10,4) | Коэффициент хранения |
| `created_at` | TIMESTAMP | Дата создания записи |
| `updated_at` | TIMESTAMP | Дата последнего обновления |

**Уникальный ключ**: `(date, warehouse_name)` — один склад на одну дату.

### Таблица `spreadsheets`

Хранит ID Google Таблиц для автоматического обновления.

| Поле | Тип | Описание |
|------|-----|----------|
| `spreadsheet_id` | VARCHAR | ID Google Таблицы (первичный ключ) |

---

## 🔄 Как работает сервис

### Алгоритм работы

1. **При запуске**:
   - Применяются миграции к БД
   - Выполняются seeds (добавление тестовой таблицы)
   - Проверяются переменные окружения
   - Выполняется первый сбор тарифов

2. **Каждый час**:
   - Получение тарифов из WB API для текущей даты
   - Сохранение/обновление в БД (upsert)
   - Получение отсортированных данных из БД
   - Обновление всех Google Таблиц из БД

3. **Обновление данных**:
   - Если тарифы за текущий день уже есть — они обновляются
   - Данные сортируются по `delivery_coef` (возрастание)
   - Все таблицы обновляются параллельно для ускорения

---

## 📝 Добавление новых Google Таблиц

Чтобы добавить новую таблицу для автоматического обновления:

1. **Создайте Google Таблицу** и дайте доступ Service Account
2. **Создайте лист с именем** `stocks_coefs`
3. **Добавьте ID таблицы в БД**:

```sql
INSERT INTO spreadsheets (spreadsheet_id) VALUES ('your-spreadsheet-id-here');
```

Или через seed файл в `src/postgres/seeds/spreadsheets.ts`.

---

## 🐛 Решение проблем

### Ошибка "WB_API_KEY не установлен"

Убедитесь, что в `.env` файле указан корректный API ключ WB.

### Ошибка "Невалидный JSON в GOOGLE_SHEETS_CREDENTIALS_JSON"

Проверьте, что JSON credentials скопирован в одну строку без переносов.

### Ошибка подключения к PostgreSQL

Убедитесь, что контейнер БД запущен:

```bash
docker compose ps
```

### Таблицы не обновляются

1. Проверьте, что Service Account имеет доступ к таблице
2. Убедитесь, что в таблице есть лист `stocks_coefs`
3. Проверьте логи на наличие ошибок Google API

---

## 📦 Технологический стек

- **Runtime**: Node.js 20 (Alpine)
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL 16
- **Query Builder**: Knex.js 3.1
- **Validation**: Zod 3.23
- **Scheduler**: node-cron 4.2
- **HTTP Client**: Axios 1.12
- **Google API**: googleapis 144.0

---

## 📄 Лицензия

ISC

---

## 👤 Автор

**Omyy4s**

---
