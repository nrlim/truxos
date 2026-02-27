import { FuelType, Toll, Truck, Driver, Route } from '@prisma/client';

export const FUEL_PRICES: Record<FuelType, number> = {
    [FuelType.BIOSOLAR]: 6800,
    [FuelType.DEXLITE]: 14550,
    [FuelType.PERTAMINA_DEX]: 15100,
};

export interface EstimationInput {
    route: Route & { tolls: Toll[] };
    truck: Truck;
    driver: Driver;
    additionalDistanceKm?: number;
}

export function calculateEstimatedCost({
    route,
    truck,
    driver,
    additionalDistanceKm = 0,
}: EstimationInput) {
    // 1. Fuel Cost
    const baseDistance = Number(route.baseDistanceKm);
    const totalDistance = baseDistance + Number(additionalDistanceKm);
    const fuelLiter = truck.fuelRatio > 0 ? totalDistance / truck.fuelRatio : 0;
    const fuelCost = fuelLiter * FUEL_PRICES[truck.fuelType];

    // 2. Toll Cost
    const tollCost = route.tolls.reduce(
        (acc, toll) => acc + Number(toll.fee.toString()),
        0
    );

    // 3. Driver Allowance
    const allowance = Number(driver.dailyAllowance.toString());

    // Total Estimated Cost
    const total = fuelCost + tollCost + allowance;

    return {
        fuelCost: Math.round(fuelCost),
        tollCost: Math.round(tollCost),
        allowance: Math.round(allowance),
        total: Math.round(total),
        totalDistance: Math.round(totalDistance),
        estimatedLiters: fuelLiter,
    };
}
