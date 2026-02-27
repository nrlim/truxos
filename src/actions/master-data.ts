"use server";

import { prisma } from "@/lib/prisma";
import {
    tollSchema,
    truckSchema,
    routeSchema,
    driverSchema,
} from "@/lib/validations/master-data";
import { revalidatePath } from "next/cache";

// ========================
// TOLL MASTER
// ========================
export async function getTolls(tenantId: string, page: number = 1, limit: number = 10, categoryFilter?: string) {
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (categoryFilter && categoryFilter !== "ALL") {
        where.category = categoryFilter;
    }

    const [data, total] = await Promise.all([
        prisma.toll.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.toll.count({ where })
    ]);

    return JSON.parse(JSON.stringify({
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }));
}

export async function getAllTolls(tenantId: string) {
    const data = await prisma.toll.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
    });
    return JSON.parse(JSON.stringify(data));
}

export async function createToll(data: any) {
    const result = tollSchema.safeParse(data);
    if (!result.success) return { error: result.error.issues[0].message };

    try {
        await prisma.toll.create({ data: result.data });
        revalidatePath("/dashboard/master-data/tarif-tol");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to create toll master" };
    }
}

export async function updateToll(id: string, data: any) {
    const result = tollSchema.safeParse(data);
    if (!result.success) return { error: result.error.issues[0].message };

    try {
        await prisma.toll.update({ where: { id }, data: result.data });
        revalidatePath("/dashboard/master-data/tarif-tol");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to update toll master" };
    }
}

export async function deleteToll(id: string) {
    try {
        await prisma.toll.delete({ where: { id } });
        revalidatePath("/dashboard/master-data/tarif-tol");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to delete" };
    }
}

// Detected toll from Overpass API
interface DetectedToll {
    name: string;
    fee: number; // will be 0 from detection
    category: string; // default GOL_1
}

/**
 * Sync detected toll gates from route detection.
 * - Finds existing tolls by name (case-insensitive)
 * - Returns existing + creates new ones
 * - Caller decides which to override via overrideIds
 */
export async function syncDetectedTolls(
    tenantId: string,
    detectedTolls: DetectedToll[],
    overrideIds?: string[] // IDs of existing tolls to override (reset fee etc)
) {
    try {
        const results: {
            newTolls: any[];
            existingTolls: any[];
            allTollIds: string[];
        } = {
            newTolls: [],
            existingTolls: [],
            allTollIds: [],
        };

        // Get all existing tolls for this tenant
        const existingAll = await prisma.toll.findMany({
            where: { tenantId },
        });

        for (const detected of detectedTolls) {
            // Case-insensitive name match
            const existing = existingAll.find(
                (t) => t.name.toLowerCase() === detected.name.toLowerCase()
            );

            if (existing) {
                // Toll already exists
                if (overrideIds && overrideIds.includes(existing.id)) {
                    // Override: update the fee
                    await prisma.toll.update({
                        where: { id: existing.id },
                        data: { fee: detected.fee },
                    });
                }
                results.existingTolls.push(existing);
                results.allTollIds.push(existing.id);
            } else {
                // Create new toll
                const newToll = await prisma.toll.create({
                    data: {
                        name: detected.name,
                        category: (detected.category as any) || "GOL_1",
                        fee: detected.fee,
                        tenantId,
                    },
                });
                results.newTolls.push(newToll);
                results.allTollIds.push(newToll.id);
            }
        }

        revalidatePath("/dashboard/master-data/tarif-tol");
        return JSON.parse(JSON.stringify({ success: true, ...results }));
    } catch (error: any) {
        return { error: error.message || "Failed to sync detected tolls" };
    }
}

/**
 * Check which detected toll names already exist in master data
 */
export async function checkExistingTolls(tenantId: string, names: string[]) {
    try {
        const existing = await prisma.toll.findMany({
            where: {
                tenantId,
                name: { in: names, mode: "insensitive" },
            },
        });
        return JSON.parse(JSON.stringify(existing));
    } catch {
        return [];
    }
}

// ========================
// TRUCK (ARMADA)
// ========================
export async function getTrucks(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.truck.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.truck.count({ where: { tenantId } })
    ]);

    return JSON.parse(JSON.stringify({
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }));
}

export async function getAllTrucks(tenantId: string) {
    const data = await prisma.truck.findMany({
        where: { tenantId },
        orderBy: { licensePlate: "asc" },
    });
    return JSON.parse(JSON.stringify(data));
}

export async function createTruck(data: any) {
    const result = truckSchema.safeParse(data);
    if (!result.success) return { error: result.error.issues[0].message };

    try {
        await prisma.truck.create({ data: result.data });
        revalidatePath("/dashboard/master-data/armada");
        return { success: true };
    } catch (error: any) {
        if (error?.code === "P2002") {
            return { error: "Plat nomor sudah terdaftar" };
        }
        return { error: error.message || "Failed to create truck" };
    }
}

export async function updateTruck(id: string, data: any) {
    const result = truckSchema.safeParse(data);
    if (!result.success) return { error: result.error.issues[0].message };

    try {
        await prisma.truck.update({ where: { id }, data: result.data });
        revalidatePath("/dashboard/master-data/armada");
        return { success: true };
    } catch (error: any) {
        if (error?.code === "P2002") {
            return { error: "Plat nomor sudah terdaftar" };
        }
        return { error: error.message || "Failed to update truck" };
    }
}

export async function deleteTruck(id: string) {
    try {
        await prisma.truck.delete({ where: { id } });
        revalidatePath("/dashboard/master-data/armada");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to delete" };
    }
}

// ========================
// ROUTE (RUTE)
// ========================
export async function getRoutes(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.route.findMany({
            where: { tenantId },
            include: { tolls: true },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.route.count({ where: { tenantId } })
    ]);

    return JSON.parse(JSON.stringify({
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }));
}

export async function getAllRoutes(tenantId: string) {
    const data = await prisma.route.findMany({
        where: { tenantId },
        include: { tolls: true },
        orderBy: { origin: "asc" },
    });
    return JSON.parse(JSON.stringify(data));
}

export async function createRoute(data: any) {
    const result = routeSchema.safeParse(data);
    if (!result.success) return { error: result.error.issues[0].message };

    try {
        const { tollIds, ...routeData } = result.data;
        await prisma.route.create({
            data: {
                ...routeData,
                ...(tollIds && tollIds.length > 0 ? { tolls: { connect: tollIds.map((id: string) => ({ id })) } } : {})
            }
        });
        revalidatePath("/dashboard/master-data/rute");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to create route" };
    }
}

export async function updateRoute(id: string, data: any) {
    const result = routeSchema.safeParse(data);
    if (!result.success) return { error: result.error.issues[0].message };

    try {
        const { tollIds, ...routeData } = result.data;
        await prisma.route.update({
            where: { id },
            data: {
                ...routeData,
                tolls: {
                    set: [],
                    ...(tollIds && tollIds.length > 0 ? { connect: tollIds.map((id: string) => ({ id })) } : {})
                }
            }
        });
        revalidatePath("/dashboard/master-data/rute");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to update route" };
    }
}

export async function deleteRoute(id: string) {
    try {
        await prisma.route.delete({ where: { id } });
        revalidatePath("/dashboard/master-data/rute");
        return { success: true };
    } catch (error: any) {
        if (error?.code === "P2003") {
            return { error: "Rute ini tidak dapat dihapus karena sedang digunakan dalam Surat Jalan / Manifest aktif." };
        }
        return { error: error.message || "Gagal menghapus rute" };
    }
}

// ========================
// DRIVER (SUPIR)
// ========================
export async function getDrivers(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.driver.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.driver.count({ where: { tenantId } })
    ]);

    return JSON.parse(JSON.stringify({
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }));
}

export async function getAllDrivers(tenantId: string) {
    const data = await prisma.driver.findMany({
        where: { tenantId, status: "AVAILABLE" },
        orderBy: { fullName: "asc" },
    });
    return JSON.parse(JSON.stringify(data));
}

export async function createDriver(data: any) {
    const result = driverSchema.safeParse(data);
    if (!result.success) return { error: result.error.issues[0].message };

    try {
        await prisma.driver.create({ data: result.data });
        revalidatePath("/dashboard/master-data/supir");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to create driver" };
    }
}

export async function updateDriver(id: string, data: any) {
    const result = driverSchema.safeParse(data);
    if (!result.success) return { error: result.error.issues[0].message };

    try {
        await prisma.driver.update({ where: { id }, data: result.data });
        revalidatePath("/dashboard/master-data/supir");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to update driver" };
    }
}

export async function deleteDriver(id: string) {
    try {
        await prisma.driver.delete({ where: { id } });
        revalidatePath("/dashboard/master-data/supir");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to delete" };
    }
}
