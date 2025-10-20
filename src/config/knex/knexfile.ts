import env from "#config/env/env.js";
import { Knex } from "knex";
import { z } from "zod";

/**
 * Схема валидации параметров подключения к PostgreSQL
 */
const connectionSchema = z.object({
    host: z.string(),
    port: z.number(),
    database: z.string(),
    user: z.string(),
    password: z.string(),
});

const NODE_ENV = env.NODE_ENV ?? "development";

/**
 * Конфигурация Knex для разных окружений
 * - development: локальная разработка с TypeScript
 * - production: продакшен с скомпилированным JavaScript
 */
const knexConfigs: Record<typeof NODE_ENV, Knex.Config> = {
    development: {
        client: "pg",
        connection: () =>
            connectionSchema.parse({
                host: env.POSTGRES_HOST ?? "localhost",
                port: env.POSTGRES_PORT ?? 5432,
                database: env.POSTGRES_DB ?? "postgres",
                user: env.POSTGRES_USER ?? "postgres",
                password: env.POSTGRES_PASSWORD ?? "postgres",
            }),
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            stub: "src/config/knex/migration.stub.js",
            directory: "./src/postgres/migrations",
            tableName: "migrations",
            extension: "ts",
        },
        seeds: {
            stub: "src/config/knex/seed.stub.js",
            directory: "./src/postgres/seeds",
            extension: "ts",
        },
    },
    production: {
        client: "pg",
        connection: () =>
            connectionSchema.parse({
                host: env.POSTGRES_HOST,
                port: env.POSTGRES_PORT,
                database: env.POSTGRES_DB,
                user: env.POSTGRES_USER,
                password: env.POSTGRES_PASSWORD,
            }),
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            stub: "dist/config/knex/migration.stub.js",
            directory: "./dist/postgres/migrations",
            tableName: "migrations",
            extension: "js",
        },
        seeds: {
            stub: "dist/config/knex/seed.stub.js",
            directory: "./dist/postgres/seeds",
            extension: "js",
        },
    },
};

export default knexConfigs[NODE_ENV];
