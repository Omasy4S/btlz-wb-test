import axios, { AxiosInstance, AxiosError } from "axios";
import env from "#config/env/env.js";

/**
 * Интерфейс тарифа склада Wildberries
 */
export interface WBWarehouseTariff {
    warehouseName: string;
    deliveryCoef: number;
    returnCoef: number;
    storageCoef: number;
}

/**
 * Интерфейс ответа API Wildberries
 */
interface WBApiResponse {
    response: {
        data: {
            warehouseList: Array<{
                warehouseName: string;
                boxDeliveryCoefExpr: string;
                boxDeliveryMarketplaceCoefExpr: string;
                boxStorageCoefExpr: string;
            }>;
        };
    };
}

/**
 * Сервис для работы с API Wildberries
 * Отвечает за получение тарифов для коробов
 */
export class WBApiService {
    private readonly client: AxiosInstance;
    private readonly API_ENDPOINT = "https://common-api.wildberries.ru/api/v1/tariffs/box";
    private readonly TIMEOUT_MS = 10000;

    constructor() {
        this.client = axios.create({
            baseURL: this.API_ENDPOINT,
            headers: {
                Authorization: `Bearer ${env.WB_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: this.TIMEOUT_MS,
        });
    }

    /**
     * Получает тарифы для коробов на указанную дату
     * @param date - Дата в формате YYYY-MM-DD
     * @returns Массив тарифов складов
     * @throws Error при ошибке запроса или неверной структуре данных
     */
    async getTariffs(date: string): Promise<WBWarehouseTariff[]> {
        try {
            const response = await this.client.get<WBApiResponse>("", {
                params: { date },
            });

            const data = response.data?.response?.data;

            // Валидация структуры ответа
            if (!data?.warehouseList || !Array.isArray(data.warehouseList)) {
                throw new Error("Неверная структура данных от WB API");
            }

            // Преобразование данных в внутренний формат
            return data.warehouseList.map((warehouse) => ({
                warehouseName: warehouse.warehouseName,
                deliveryCoef: parseFloat(warehouse.boxDeliveryCoefExpr),
                returnCoef: parseFloat(warehouse.boxDeliveryMarketplaceCoefExpr),
                storageCoef: parseFloat(warehouse.boxStorageCoefExpr),
            }));
        } catch (error) {
            // Обработка ошибок Axios
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status;
                const message = axiosError.message;
                
                console.error(`❌ Ошибка WB API [${status || 'N/A'}]: ${message}`);
                
                if (status === 401) {
                    throw new Error("Неверный API ключ WB");
                } else if (status === 429) {
                    throw new Error("Превышен лимит запросов к WB API");
                }
            }
            
            throw error;
        }
    }
}