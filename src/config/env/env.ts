import dotenv from "dotenv";
import { z } from "zod";

// Загружаем переменные окружения из .env файла
dotenv.config();

/**
 * Схема валидации переменных окружения
 * Использует Zod для строгой типизации и валидации
 */
const envSchema = z.object({
    // Окружение приложения (development/production)
    NODE_ENV: z.enum(["development", "production"]).default("development"),

    // Настройки подключения к PostgreSQL
    POSTGRES_HOST: z.string().default("localhost"),
    POSTGRES_PORT: z
        .string()
        .regex(/^[0-9]+$/, "POSTGRES_PORT должен быть числом")
        .transform((val) => parseInt(val, 10))
        .default("5432"),
    POSTGRES_DB: z.string().min(1, "POSTGRES_DB обязателен").default("postgres"),
    POSTGRES_USER: z.string().min(1, "POSTGRES_USER обязателен").default("postgres"),
    POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD обязателен").default("postgres"),

    // Порт приложения
    APP_PORT: z
        .string()
        .regex(/^[0-9]+$/, "APP_PORT должен быть числом")
        .transform((val) => parseInt(val, 10))
        .default("5000"),

    // API ключ Wildberries (опционально для тестирования)
    WB_API_KEY: z.string().optional(),

    // Google Sheets credentials в формате JSON (опционально для тестирования)
    GOOGLE_SHEETS_CREDENTIALS_JSON: z.string().optional(),
});

/**
 * Парсинг и валидация переменных окружения
 * При ошибке валидации приложение упадет с понятным сообщением
 */
const env = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    APP_PORT: process.env.APP_PORT,
    WB_API_KEY: process.env.WB_API_KEY,
    GOOGLE_SHEETS_CREDENTIALS_JSON: process.env.GOOGLE_SHEETS_CREDENTIALS_JSON,
});

export default env;
