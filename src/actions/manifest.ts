"use server";

import { prisma } from "@/lib/prisma";
import { manifestSchema } from "@/lib/validations/manifest";
import { revalidatePath } from "next/cache";

export async function getManifests(tenantId: string, page: number = 1, limit: number = 10, search?: string, status?: string) {
    const skip = (page - 1) * limit;

    const whereClause: any = { tenantId };

    if (search) {
        whereClause.OR = [
            { manifestNumber: { contains: search, mode: 'insensitive' } },
            { truck: { licensePlate: { contains: search, mode: 'insensitive' } } },
            { driver: { fullName: { contains: search, mode: 'insensitive' } } }
        ];
    }

    if (status && status !== 'ALL') {
        whereClause.status = status;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        data,
        total,
        activeCount,
        enRouteCount,
        pendingCount,
        completedTodayCount
    ] = await Promise.all([
        prisma.manifest.findMany({
            where: whereClause,
            include: {
                truck: true,
                driver: true,
                route: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.manifest.count({ where: whereClause }),
        prisma.manifest.count({ where: { tenantId, status: { in: ['PENDING', 'EN_ROUTE'] } } }),
        prisma.manifest.count({ where: { tenantId, status: 'EN_ROUTE' } }),
        prisma.manifest.count({ where: { tenantId, status: 'PENDING' } }),
        prisma.manifest.count({
            where: {
                tenantId,
                status: 'COMPLETED',
                updatedAt: { gte: today }
            }
        })
    ]);

    return JSON.parse(JSON.stringify({
        data,
        summary: {
            activeCount,
            enRouteCount,
            pendingCount,
            completedTodayCount
        },
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }));
}

export async function createManifest(data: any, totalEstimatedCost: number) {
    const result = manifestSchema.safeParse(data);
    if (!result.success) return { error: result.error.issues[0].message };

    try {
        // Generate Manifest Number
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await prisma.manifest.count({
            where: { tenantId: result.data.tenantId, createdAt: { gte: new Date(`${currentYear}-01-01`) } }
        });
        const manifestNumber = `MF-${currentYear}${currentMonth}-${String(count + 1).padStart(4, '0')}`;

        await prisma.manifest.create({
            data: {
                manifestNumber,
                truckId: result.data.truckId,
                driverId: result.data.driverId,
                routeId: result.data.routeId,
                additionalDistanceKm: result.data.additionalDistanceKm,
                departureDate: new Date(result.data.departureDate),
                totalEstimatedCost,
                tenantId: result.data.tenantId,
            }
        });

        revalidatePath("/dashboard/surat-jalan");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to create manifest" };
    }
}
