import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("spreadsheets", (table) => {
        table.string("spreadsheet_id").primary();
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("spreadsheets");
}