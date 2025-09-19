import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("tariffs", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.date("date").notNullable().index();
        table.string("warehouse_name").notNullable();
        table.decimal("delivery_coef", 10, 4).notNullable();
        table.decimal("return_coef", 10, 4).notNullable();
        table.decimal("storage_coef", 10, 4).notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.unique(["date", "warehouse_name"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("tariffs");
}