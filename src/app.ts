import { WBApiService } from "./services/WBApiService.js";
import { TariffDbService } from "./services/TariffDbService.js";
import { GoogleSheetsService } from "./services/GoogleSheetsService.js";
import { migrate, seed } from "#postgres/knex.js";
import cron from "node-cron";

// Запускаем миграции и сиды
await migrate.latest();
await seed.run();

console.log("? Миграции и сиды применены");

// Проверим, есть ли API ключ
if (!process.env.WB_API_KEY || process.env.WB_API_KEY === "your_wb_api_key_will_be_here") {
    console.warn("??  WB_API_KEY не установлен или имеет значение по умолчанию. Сервис будет работать, но запросы к WB API будут падать.");
}

// Проверим Google Credentials
if (!process.env.GOOGLE_SHEETS_CREDENTIALS_JSON || process.env.GOOGLE_SHEETS_CREDENTIALS_JSON === "{}") {
    console.warn("??  GOOGLE_SHEETS_CREDENTIALS_JSON не установлен. Обновление таблиц будет пропускаться или падать.");
}

// Инициализируем сервисы 
const wbService = new WBApiService();
const dbService = new TariffDbService();
const sheetsService = new GoogleSheetsService();

// Основная задача
async function fetchAndSaveTariffs() {
    const today = new Date().toISOString().split("T")[0];
    console.log(`🔄 Сбор тарифов за ${today}`);

    try {
        const tariffs = await wbService.getTariffs(today);
        console.log(`📥 Получено ${tariffs.length} складов`);

        await dbService.saveTariffs(tariffs, today);
        console.log("💾 Сохранено в БД");

        const sortedTariffs = await dbService.getTariffsForDate(today);
        await sheetsService.updateAllSheets(sortedTariffs);
        console.log("📤 Обновлено в Google Таблицах");
    } catch (error: any) {
        console.error("❌ Ошибка:", error.message);
    }
}


// Запускаем сразу при старте
fetchAndSaveTariffs();

// Запускаем каждый час
cron.schedule("0 * * * *", () => {
    console.log("? Запланированный запуск...");
    fetchAndSaveTariffs();
});

console.log("Сервис запущен. Сбор тарифов каждые 60 минут.");