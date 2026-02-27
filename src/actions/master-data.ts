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
export async function getTolls(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.toll.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.toll.count({ where: { tenantId } })
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
        return { error: error.message || "Failed to delete" };
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
