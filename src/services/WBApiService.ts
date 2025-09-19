import axios, { AxiosInstance } from "axios";
import env from "#config/env/env.js";

export interface WBWarehouseTariff {
    warehouseName: string;
    deliveryCoef: number;
    returnCoef: number;
    storageCoef: number;
}

export class WBApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: "https://common-api.wildberries.ru/api/v1/tariffs/box",
            headers: {
                Authorization: `Bearer ${env.WB_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 10000,
        });
    }

    async getTariffs(date: string): Promise<WBWarehouseTariff[]> {
        try {
            const response = await this.client.get("", {
                params: { date },
            });

            const data = response.data?.response?.data;


            if (!data?.warehouseList || !Array.isArray(data.warehouseList)) {
                throw new Error("Invalid data structure");
            }

            return data.warehouseList.map((warehouse: { warehouseName: any; boxDeliveryCoefExpr: string; boxDeliveryMarketplaceCoefExpr: string; boxStorageCoefExpr: string; }) => ({
                warehouseName: warehouse.warehouseName,
                deliveryCoef: parseFloat(warehouse.boxDeliveryCoefExpr),
                returnCoef: parseFloat(warehouse.boxDeliveryMarketplaceCoefExpr),
                storageCoef: parseFloat(warehouse.boxStorageCoefExpr),
            }));
        } catch (error: any) {
            console.error("❌ Ошибка при получении тарифов WB:", error.message);
            throw error;
        }
    }
}