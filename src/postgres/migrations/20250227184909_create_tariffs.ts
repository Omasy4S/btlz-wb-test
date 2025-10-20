import { Knex } from "knex";

/**
 * Миграция: Создание таблицы tariffs
 * Хранит тарифы WB для коробов по датам
 */
export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("tariffs", (table) => {
        // Первичный ключ
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        
        // Дата тарифа (индексируется для быстрого поиска)
        table.date("date").notNullable().index();
        
        // Название склада
        table.string("warehouse_name").notNullable();
        
        // Коэффициенты (до 4 знаков после запятой)
        table.decimal("delivery_coef", 10, 4).notNullable();
        table.decimal("return_coef", 10, 4).notNullable();
        table.decimal("storage_coef", 10, 4).notNullable();
        
        // Временные метки
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        
        // Уникальность: один склад на одну дату
        table.unique(["date", "warehouse_name"]);
    });
}

/**
 * Откат миграции: Удаление таблицы tariffs
 */
export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("tariffs");
}
