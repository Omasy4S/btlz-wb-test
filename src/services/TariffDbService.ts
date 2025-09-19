import knex from "#postgres/knex.js";
import { WBWarehouseTariff } from "./WBApiService.js";

export class TariffDbService {
    async saveTariffs(tariffs: WBWarehouseTariff[], date: string): Promise<void> {
        for (const tariff of tariffs) {
            await knex("tariffs")
                .insert({
                    date,
                    warehouse_name: tariff.warehouseName,
                    delivery_coef: tariff.deliveryCoef,
                    return_coef: tariff.returnCoef,
                    storage_coef: tariff.storageCoef,
                    created_at: knex.fn.now(),
                    updated_at: knex.fn.now(),
                })
                .onConflict(["date", "warehouse_name"])
                .merge(["delivery_coef", "return_coef", "storage_coef", "updated_at"]);
        }
    }

    async getTariffsForDate(date: string): Promise<WBWarehouseTariff[]> {
        const rows = await knex("tariffs")
            .where("date", date)
            .orderBy("delivery_coef", "asc");

        return rows.map((row: { warehouse_name: any; delivery_coef: any; return_coef: any; storage_coef: any; }): { warehouseName: any; deliveryCoef: any; returnCoef: any; storageCoef: any; } => ({
            warehouseName: row.warehouse_name,
            deliveryCoef: row.delivery_coef,
            returnCoef: row.return_coef,
            storageCoef: row.storage_coef,
        }));
    }
}