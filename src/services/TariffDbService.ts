import knex from "#postgres/knex.js";
import { WBWarehouseTariff } from "./WBApiService.js";

/**
 * Интерфейс записи тарифа в БД
 */
interface TariffDbRow {
    warehouse_name: string;
    delivery_coef: number;
    return_coef: number;
    storage_coef: number;
}

/**
 * Сервис для работы с тарифами в БД
 * Отвечает за сохранение и получение данных о тарифах
 */
export class TariffDbService {
    /**
     * Сохраняет тарифы в БД с обновлением при конфликте
     * Использует upsert логику: если запись существует, обновляет ее
     * @param tariffs - Массив тарифов для сохранения
     * @param date - Дата в формате YYYY-MM-DD
     */
    async saveTariffs(tariffs: WBWarehouseTariff[], date: string): Promise<void> {
        if (tariffs.length === 0) {
            console.warn("⚠️ Пустой массив тарифов, пропускаем сохранение");
            return;
        }

        // Подготовка данных для вставки
        const records = tariffs.map((tariff) => ({
            date,
            warehouse_name: tariff.warehouseName,
            delivery_coef: tariff.deliveryCoef,
            return_coef: tariff.returnCoef,
            storage_coef: tariff.storageCoef,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        }));

        // Оптимизированная вставка с upsert
        await knex("tariffs")
            .insert(records)
            .onConflict(["date", "warehouse_name"])
            .merge(["delivery_coef", "return_coef", "storage_coef", "updated_at"]);
    }

    /**
     * Получает тарифы за указанную дату, отсортированные по коэффициенту доставки
     * @param date - Дата в формате YYYY-MM-DD
     * @returns Массив тарифов, отсортированных по возрастанию
     */
    async getTariffsForDate(date: string): Promise<WBWarehouseTariff[]> {
        const rows = await knex<TariffDbRow>("tariffs")
            .where("date", date)
            .orderBy("delivery_coef", "asc");

        // Преобразование из формата БД в внутренний формат
        return rows.map((row) => ({
            warehouseName: row.warehouse_name,
            deliveryCoef: Number(row.delivery_coef),
            returnCoef: Number(row.return_coef),
            storageCoef: Number(row.storage_coef),
        }));
    }
}