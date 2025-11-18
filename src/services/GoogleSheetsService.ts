import { google, Auth, sheets_v4 } from "googleapis";
import knex from "#postgres/knex.js";
import { WBWarehouseTariff } from "./WBApiService.js";

/**
 * Сервис для работы с Google Sheets API
 * Отвечает за обновление данных о тарифах в Google Таблицах
 */
export class GoogleSheetsService {
    private readonly auth: Auth.GoogleAuth;
    private readonly sheets: sheets_v4.Sheets;
    private readonly SHEET_NAME = "stocks_coefs";

    constructor() {
        // Парсим JSON credentials из переменной окружения один раз при инициализации
        const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS_JSON || "{}";

        let credentials;
        try {
            credentials = JSON.parse(credentialsJson);
        } catch (error) {
            console.error("❌ Ошибка парсинга GOOGLE_SHEETS_CREDENTIALS_JSON");
            throw new Error("Невалидный JSON в GOOGLE_SHEETS_CREDENTIALS_JSON");
        }

        this.auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        this.sheets = google.sheets({ version: "v4", auth: this.auth });
    }

    /**
     * Обновляет все Google Таблицы из БД актуальными тарифами
     * @param tariffs - Массив тарифов для выгрузки (должен быть отсортирован)
     */
    async updateAllSheets(tariffs: WBWarehouseTariff[]): Promise<void> {
        const spreadsheetRows = await knex("spreadsheets").select("spreadsheet_id");

        if (spreadsheetRows.length === 0) {
            console.warn("⚠️ Нет таблиц для обновления в БД");
            return;
        }

        console.log(`📊 Обновление ${spreadsheetRows.length} таблиц(ы)...`);

        // Обновляем все таблицы параллельно для ускорения
        const updatePromises = spreadsheetRows.map((row) =>
            this.updateSheet(row.spreadsheet_id, tariffs)
        );

        await Promise.allSettled(updatePromises);
    }

    /**
     * Обновляет конкретную Google Таблицу
     * @param spreadsheetId - ID Google Таблицы
     * @param tariffs - Массив тарифов для выгрузки
     */
    private async updateSheet(spreadsheetId: string, tariffs: WBWarehouseTariff[]): Promise<void> {
        try {
            // Формируем данные для таблицы: заголовок + строки
            const values = [
                ["Склад", "Коэф. доставки", "Коэф. возврата", "Коэф. хранения"],
                ...tariffs.map((t) => [
                    t.warehouseName,
                    t.deliveryCoef,
                    t.returnCoef,
                    t.storageCoef,
                ]),
            ];

            // Очищаем старые данные
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: this.SHEET_NAME,
            });

            // Записываем новые данные
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${this.SHEET_NAME}!A1`,
                valueInputOption: "RAW",
                requestBody: { values },
            });

            console.log(`✅ Таблица обновлена: ${spreadsheetId}`);
        } catch (error: any) {
            const errorMessage = error?.message || "Неизвестная ошибка";
            console.error(`❌ Ошибка обновления таблицы ${spreadsheetId}: ${errorMessage}`);
            
            // Не пробрасываем ошибку, чтобы не прерывать обновление других таблиц
        }
    }
}