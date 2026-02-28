"use server";

import { prisma } from "@/lib/prisma";
import { calculateEstimatedCost } from "@/lib/estimation";

export async function getReportFilterOptions(tenantId: string) {
    const drivers = await prisma.driver.findMany({
        where: { tenantId },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" }
    });
    const trucks = await prisma.truck.findMany({
        where: { tenantId },
        select: { type: true },
        distinct: ["type"]
    });
    return { drivers, truckTypes: trucks.map(t => t.type) };
}

export async function getReportData({
    tenantId,
    startDate,
    endDate,
    truckType,
    driverId,
}: {
    tenantId: string;
    startDate?: Date | null;
    endDate?: Date | null;
    truckType?: string;
    driverId?: string;
}) {
    const whereClause: any = {
        tenantId,
        status: "COMPLETED", // Typically we only report on completed ones
    };

    if (startDate && endDate) {
        const endDateWithTime = new Date(endDate);
        endDateWithTime.setHours(23, 59, 59, 999);

        whereClause.departureDate = {
            gte: startDate,
            lte: endDateWithTime,
        };
    }

    if (truckType) {
        whereClause.truck = {
            type: truckType,
        };
    }

    if (driverId) {
        whereClause.driverId = driverId;
    }

    const manifests = await prisma.manifest.findMany({
        where: whereClause,
        orderBy: { departureDate: "asc" },
        include: {
            truck: true,
            driver: true,
            route: {
                include: { tolls: true },
            },
            expenses: true,
            tenant: true,
        },
    });

    if (manifests.length === 0) {
        return null;
    }

    const tenantName = manifests[0].tenant.name;

    // Process Summaries
    let totalDistance = 0;
    let totalFuelEstimated = 0;
    let totalTollsEstimated = 0;
    let grandTotalCost = 0;

    const expenseBreakdown: Record<string, number> = {};
    const transactionTable = [];

    for (const m of manifests) {
        const est = calculateEstimatedCost({
            route: m.route as any,
            truck: m.truck,
            driver: m.driver,
            additionalDistanceKm: m.additionalDistanceKm,
        });

        const manifestDistance = m.route.baseDistanceKm + m.additionalDistanceKm;
        totalDistance += manifestDistance;

        let actualAddedExpense = 0;
        let manifestFuelExpense = 0;
        let manifestMaintenance = 0;
        let manifestTolls = 0;
        let manifestOthers = 0;

        for (const exp of m.expenses) {
            const val = Number(exp.amount || 0);
            actualAddedExpense += val;

            if (exp.category === "BAHAN_BAKAR") {
                manifestFuelExpense += val;
            } else if (exp.category === "PERBAIKAN") {
                manifestMaintenance += val;
            } else if (exp.category === "PARKIR" || exp.category === "PUNGLI" || exp.category === "LAIN_LAIN" || exp.category === "DARURAT") {
                manifestOthers += val;
            }
        }

        // Tally Expense Breakdown
        expenseBreakdown["Fuel"] = (expenseBreakdown["Fuel"] || 0) + (manifestFuelExpense || est.fuelCost);
        expenseBreakdown["Maintenance"] = (expenseBreakdown["Maintenance"] || 0) + manifestMaintenance;
        expenseBreakdown["Tolls"] = (expenseBreakdown["Tolls"] || 0) + (manifestTolls || est.tollCost);
        expenseBreakdown["Others"] = (expenseBreakdown["Others"] || 0) + manifestOthers;

        totalFuelEstimated += est.fuelCost;
        totalTollsEstimated += est.tollCost;

        const finalCost = Number(m.totalEstimatedCost || 0) + actualAddedExpense;
        grandTotalCost += finalCost;

        transactionTable.push({
            date: m.departureDate.toISOString(),
            manifestId: m.manifestNumber,
            truckPlate: m.truck.licensePlate,
            driverName: m.driver.fullName,
            routeStr: `${m.route.origin} - ${m.route.destination}`,
            totalDistance: manifestDistance,
            estimatedCost: Number(m.totalEstimatedCost || 0),
            estFuel: est.fuelCost,
            estToll: est.tollCost,
            estAllowance: est.allowance,
            actualAddedExpense,
            actFuel: manifestFuelExpense,
            actMaintenance: manifestMaintenance,
            actOthers: manifestOthers,
            finalCost,
        });
    }

    return {
        tenantName,
        executiveSummary: {
            totalManifests: manifests.length,
            totalDistance,
            totalFuel: expenseBreakdown["Fuel"] || 0,
            totalTolls: expenseBreakdown["Tolls"] || 0,
            grandTotalCost,
        },
        transactionTable,
        expenseBreakdown,
    };
}
