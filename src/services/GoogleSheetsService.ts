import { google, Auth, sheets_v4 } from "googleapis";
import knex from "#postgres/knex.js";
import { WBWarehouseTariff } from "./WBApiService.js";

export class GoogleSheetsService {
    private auth: Auth.GoogleAuth;
    private sheets: sheets_v4.Sheets;

    constructor() {
        // Парсим JSON из строки
        const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON || "{}");

        this.auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        this.sheets = google.sheets({ version: "v4", auth: this.auth });
    }

    async updateAllSheets(tariffs: WBWarehouseTariff[]): Promise<void> {
        const spreadsheetRows = await knex("spreadsheets").select("spreadsheet_id");

        for (const row of spreadsheetRows) {
            const spreadsheetId = row.spreadsheet_id;
            await this.updateSheet(spreadsheetId, tariffs);
        }
    }

    private async updateSheet(spreadsheetId: string, tariffs: WBWarehouseTariff[]): Promise<void> {
        try {
            const values = [
                ["Склад", "Коэф. доставки", "Коэф. возврата", "Коэф. хранения"],
                ...tariffs.map((t) => [
                    t.warehouseName,
                    t.deliveryCoef,
                    t.returnCoef,
                    t.storageCoef,
                ]),
            ];

            await this.sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: "stocks_coefs",
            });

            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "stocks_coefs!A1",
                valueInputOption: "RAW",
                requestBody: { values },
            });

            console.log(`✅ Обновлено: ${spreadsheetId}`);
        } catch (error: any) {
            console.error(`❌ Ошибка: ${spreadsheetId}`, error.message);
        }
    }
}