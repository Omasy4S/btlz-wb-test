import { Knex } from "knex";

/**
 * Миграция: Создание таблицы spreadsheets
 * Хранит ID Google Таблиц для автоматического обновления
 */
export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("spreadsheets", (table) => {
        table.string("spreadsheet_id").primary();
    });
}

/**
 * Откат миграции: Удаление таблицы spreadsheets
 */
export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("spreadsheets");
}
