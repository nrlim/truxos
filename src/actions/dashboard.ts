"use server";

import { prisma } from "@/lib/prisma";
import { calculateEstimatedCost } from "@/lib/estimation";

export async function getDashboardData(tenantId: string, period: "Bulanan" | "Kuartalan") {
    // Determine date range: Get all data for the current year
    const now = new Date();
    const currentYear = now.getFullYear();
    const startDate = new Date(currentYear, 0, 1);

    // Fetch all completed manifests in the current year
    const completedManifests = await prisma.manifest.findMany({
        where: {
            status: "COMPLETED",
            tenantId,
            departureDate: { gte: startDate }
        },
        include: {
            route: {
                include: { tolls: true }
            },
            truck: true,
            driver: true,
            expenses: true,
        }
    });

    let trueTotalCost = 0;
    let totalBaseDistance = 0;
    let totalActualDistance = 0;

    // Cost breakdown items
    let totalFuelCost = 0;
    let totalTollCost = 0;
    let totalAllowance = 0;

    const actualExpenseGroups: Record<string, number> = {};
    const groupedChartData: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

    completedManifests.forEach((m) => {
        // 1. Calculate the exact components of the totalEstimatedCost
        const est = calculateEstimatedCost({
            route: m.route as any,
            truck: m.truck,
            driver: m.driver,
            additionalDistanceKm: m.additionalDistanceKm,
        });

        totalFuelCost += est.fuelCost;
        totalTollCost += est.tollCost;
        totalAllowance += est.allowance;

        // 2. Tally Distances for Cost per KM & Fuel Efficiency
        totalBaseDistance += m.route.baseDistanceKm;
        totalActualDistance += (m.route.baseDistanceKm + m.additionalDistanceKm);

        // 3. Tally Actual Additional Expenses
        let actualFuelCost = 0;
        let actualFuelLiters = 0;
        let actualExpensesSum = 0;
        for (const exp of m.expenses) {
            const amount = Number(exp.amount || 0);
            actualExpensesSum += amount;

            if (exp.category === "BAHAN_BAKAR") {
                actualFuelCost += amount;
                actualFuelLiters += Number(exp.liters || 0);
            }

            // Group by category for Rincian Biaya
            const categoryName = exp.category.replace("_", " ");
            actualExpenseGroups[categoryName] = (actualExpenseGroups[categoryName] || 0) + amount;
        }

        // 4. Sum up total cost (Estimated + Actual)
        const manifestTotalCost = Number(m.totalEstimatedCost || 0) + actualExpensesSum;
        trueTotalCost += manifestTotalCost;

        // 5. Group for charts
        const d = new Date(m.departureDate);
        const monthName = months[d.getMonth()];
        const key = period === "Bulanan" ? monthName : `Q${Math.floor(d.getMonth() / 3) + 1}`;
        groupedChartData[key] = (groupedChartData[key] || 0) + manifestTotalCost;
    });

    // 6. Cost Per KM
    const costPerKm = totalActualDistance > 0 ? trueTotalCost / totalActualDistance : 0;

    // 7. Fuel Efficiency (Comparing Estimated vs Actual Fuel Cost)
    // If we have actual BAHAN_BAKAR recorded, we measure how much they spent vs estimate.
    // > 100% means they spent MORE than estimated (poor efficiency / higher cost)
    // < 100% means they spent LESS (good efficiency)
    // Here we'll show (Estimated Cost / Actual Cost * 100). E.g. Est 100k, Actual 80k -> 125% efficient!
    const actualFuelTotal = actualExpenseGroups["BAHAN BAKAR"] || 0;

    // Fallback back to routing efficiency if no actual fuel receipts were uploaded across the fleet yet
    let fuelEfficiency = 0;
    if (actualFuelTotal > 0 && totalFuelCost > 0) {
        fuelEfficiency = (totalFuelCost / actualFuelTotal) * 100;
    } else if (totalActualDistance > 0) {
        fuelEfficiency = (totalBaseDistance / totalActualDistance) * 100;
    }

    // 8. Rute Aktif
    const activeRoutesQuery = await prisma.manifest.findMany({
        where: {
            status: "EN_ROUTE",
            tenantId,
        },
        select: {
            routeId: true,
        },
        distinct: ["routeId"]
    });
    const activeRoutesCount = activeRoutesQuery.length;

    // 9. Formatting Rincian Biaya
    const rincianBiaya = [
        { name: "Bahan Bakar", value: totalFuelCost, type: "ESTIMASI" },
        { name: "Uang Saku Supir", value: totalAllowance, type: "ESTIMASI" },
        { name: "Tol & Retribusi", value: totalTollCost, type: "ESTIMASI" },
    ];
    // Add additional post-trip actual expenses
    Object.entries(actualExpenseGroups).forEach(([name, value]) => {
        rincianBiaya.push({ name, value, type: "AKTUAL" });
    });
    // Sort descending by cost
    rincianBiaya.sort((a, b) => b.value - a.value);

    // 10. Chart Formatting
    const sortedChartData = period === "Bulanan"
        ? months.map(m => ({ name: m, value: groupedChartData[m] || 0 }))
        : ["Q1", "Q2", "Q3", "Q4"].map(q => ({ name: q, value: groupedChartData[q] || 0 }));

    return {
        totalCost: trueTotalCost,
        costPerKm,
        fuelEfficiency, // e.g. 85.5%
        activeRoutes: activeRoutesCount,
        chartData: sortedChartData,
        rincianBiaya,
    };
}
