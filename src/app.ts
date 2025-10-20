/**
 * Главный файл приложения
 * Сервис для сбора тарифов WB и выгрузки в Google Таблицы
 */

import { WBApiService } from "./services/WBApiService.js";
import { TariffDbService } from "./services/TariffDbService.js";
import { GoogleSheetsService } from "./services/GoogleSheetsService.js";
import { migrate, seed } from "#postgres/knex.js";
import cron from "node-cron";

/**
 * Инициализация базы данных: применение миграций и seeds
 */
async function initializeDatabase(): Promise<void> {
    console.log("🔧 Инициализация базы данных...");
    await migrate.latest();
    await seed.run();
    console.log("✅ Миграции и seeds применены");
}

/**
 * Проверка наличия необходимых переменных окружения
 */
function validateEnvironment(): void {
    if (!process.env.WB_API_KEY || process.env.WB_API_KEY === "your_wb_api_key_will_be_here") {
        console.warn("⚠️  WB_API_KEY не установлен. Запросы к WB API будут падать.");
    }

    if (!process.env.GOOGLE_SHEETS_CREDENTIALS_JSON || process.env.GOOGLE_SHEETS_CREDENTIALS_JSON === "{}") {
        console.warn("⚠️  GOOGLE_SHEETS_CREDENTIALS_JSON не установлен. Обновление таблиц будет пропускаться.");
    }
}

// Инициализируем сервисы
const wbService = new WBApiService();
const dbService = new TariffDbService();
const sheetsService = new GoogleSheetsService();

/**
 * Основная функция: получение, сохранение и выгрузка тарифов
 */
async function fetchAndSaveTariffs(): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Сбор тарифов за ${today}`);

    try {
        // Получаем тарифы из WB API
        const tariffs = await wbService.getTariffs(today);
        console.log(`📥 Получено ${tariffs.length} складов`);

        // Сохраняем в БД
        await dbService.saveTariffs(tariffs, today);
        console.log("💾 Сохранено в БД");

        // Получаем отсортированные данные и выгружаем в Google Sheets
        const sortedTariffs = await dbService.getTariffsForDate(today);
        await sheetsService.updateAllSheets(sortedTariffs);
        console.log("✅ Цикл обновления завершен успешно");
    } catch (error: any) {
        console.error("❌ Ошибка в цикле обновления:", error.message);
    }
}

/**
 * Graceful shutdown: корректное завершение работы приложения
 */
function setupGracefulShutdown(): void {
    const shutdown = () => {
        console.log("\n🛑 Получен сигнал завершения. Останавливаем сервис...");
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

/**
 * Запуск приложения
 */
async function main(): Promise<void> {
    try {
        await initializeDatabase();
        validateEnvironment();
        setupGracefulShutdown();

        // Запускаем первый сбор сразу при старте
        await fetchAndSaveTariffs();

        // Настраиваем cron для ежечасного запуска
        cron.schedule("0 * * * *", () => {
            console.log("⏰ Запланированный запуск...");
            fetchAndSaveTariffs();
        });

        console.log("\n🚀 Сервис запущен. Сбор тарифов каждый час (0 минут).");
    } catch (error: any) {
        console.error("❌ Критическая ошибка при запуске:", error.message);
        process.exit(1);
    }
}

// Запуск приложения
main();