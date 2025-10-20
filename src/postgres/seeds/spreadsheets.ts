import { Knex } from "knex";

/**
 * Seed: Добавление Google Таблиц для автоматического обновления
 * 
 * ВАЖНО: Замените ID ниже на ID вашей реальной Google Таблицы!
 * Формат ID: найдите в URL таблицы между /d/ и /edit
 * Пример: https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
 * 
 * Можно добавить несколько таблиц, просто добавьте объекты в массив
 */
export async function seed(knex: Knex): Promise<void> {
    await knex("spreadsheets")
        .insert([
            { spreadsheet_id: "YOUR_GOOGLE_SPREADSHEET_ID_HERE" },
            // Добавьте дополнительные таблицы при необходимости:
            // { spreadsheet_id: "ANOTHER_SPREADSHEET_ID" },
        ])
        .onConflict(["spreadsheet_id"])
        .ignore();
}