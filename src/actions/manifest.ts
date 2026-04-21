"use server";

import { prisma } from "@/lib/prisma";
import { manifestSchema } from "@/lib/validations/manifest";
import { revalidatePath } from "next/cache";
import { syncExpensesToAccuwrite } from "@/lib/integration";
import { calculateEstimatedCost } from "@/lib/estimation";

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
        reviewCount,
        completedTodayCount
    ] = await Promise.all([
        prisma.manifest.findMany({
            where: whereClause,
            include: {
                truck: true,
                driver: true,
                route: {
                    include: { tolls: true }
                },
                expenses: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.manifest.count({ where: whereClause }),
        prisma.manifest.count({ where: { tenantId, status: { in: ['PENDING', 'EN_ROUTE', 'NEEDS_FINAL_REVIEW'] } } }),
        prisma.manifest.count({ where: { tenantId, status: 'EN_ROUTE' } }),
        prisma.manifest.count({ where: { tenantId, status: 'PENDING' } }),
        prisma.manifest.count({ where: { tenantId, status: 'NEEDS_FINAL_REVIEW' } }),
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
            reviewCount,
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

export async function approveManifest(manifestId: string, tenantId: string) {
    try {
        const manifest = await prisma.manifest.findUnique({
            where: { id: manifestId, tenantId }
        });

        if (!manifest) return { error: "Manifest not found" };
        if (manifest.status !== "PENDING") return { error: "Manifest is not pending" };

        await prisma.$transaction([
            prisma.manifest.update({
                where: { id: manifestId },
                data: { status: "EN_ROUTE" }
            }),
            prisma.driver.update({
                where: { id: manifest.driverId },
                data: { status: "ON_TRIP" }
            })
        ]);

        revalidatePath("/dashboard/surat-jalan");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to approve manifest" };
    }
}

export async function rejectManifest(manifestId: string, tenantId: string) {
    try {
        const manifest = await prisma.manifest.findUnique({
            where: { id: manifestId, tenantId }
        });

        if (!manifest) return { error: "Manifest not found" };

        await prisma.manifest.update({
            where: { id: manifestId },
            data: { status: "REJECTED" }
        });

        revalidatePath("/dashboard/surat-jalan");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to reject manifest" };
    }
}

export async function completeManifest(manifestId: string, tenantId: string, newOdometer: number, expenses: any[] = []) {
    try {
        const manifest = await prisma.manifest.findUnique({
            where: { id: manifestId, tenantId },
            include: { truck: true, route: { include: { tolls: true } }, driver: true }
        });

        if (!manifest) return { error: "Manifest not found" };
        if (manifest.status !== "EN_ROUTE") return { error: "Manifest is not en route" };

        const expensesData = expenses.map(e => ({
            category: e.category,
            amount: Number(e.amount),
            notes: e.notes,
            attachment: e.attachmentUrl || null,
            liters: e.liters ? Number(e.liters) : null,
            tenantId
        }));

        // Base operational costs
        const estimation = calculateEstimatedCost({
            route: manifest.route,
            truck: manifest.truck,
            driver: manifest.driver,
            additionalDistanceKm: manifest.additionalDistanceKm
        });

        const allExpensesToSync = [
            { id: "base-bbm", category: "BAHAN_BAKAR", amount: estimation.fuelCost, notes: `Estimasi BBM ${estimation.estimatedLiters.toFixed(1)}L`, tenantId },
            { id: "base-tol", category: "TOL_PARKIR", amount: estimation.tollCost, notes: `Tol Rute ${manifest.route.origin} - ${manifest.route.destination}`, tenantId },
            { id: "base-uang-jalan", category: "UANG_JALAN", amount: estimation.allowance, notes: `Uang Saku Supir (${manifest.driver.fullName})`, tenantId },
            ...expensesData.map(e => ({ ...e, id: Date.now().toString() + Math.random().toString() }))
        ];

        // Integrasi Accuwrite: Synchronize Expenses
        try {
            await syncExpensesToAccuwrite(tenantId, allExpensesToSync, manifest.manifestNumber);
        } catch (integrationError: any) {
            console.error("Accuwrite Integration failed", integrationError);
            return { error: `Gagal sinkronisasi data ke Accuwrite: ${integrationError.message}. Transaksi dibatalkan.` };
        }

        await prisma.$transaction([
            prisma.manifest.update({
                where: { id: manifestId },
                data: {
                    status: "COMPLETED",
                    expenses: {
                        create: expensesData
                    }
                }
            }),
            prisma.driver.update({
                where: { id: manifest.driverId },
                data: { status: "AVAILABLE" }
            }),
            prisma.truck.update({
                where: { id: manifest.truckId },
                data: { currentOdometer: newOdometer }
            })
        ]);

        revalidatePath("/dashboard/surat-jalan");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to complete manifest" };
    }
}

export async function verifyManifest(manifestId: string, tenantId: string) {
    try {
        const manifest = await prisma.manifest.findUnique({
            where: { id: manifestId, tenantId },
            include: { truck: true, route: { include: { tolls: true } }, driver: true, expenses: true }
        });

        if (!manifest) return { error: "Manifest not found" };
        if (manifest.status !== "NEEDS_FINAL_REVIEW") return { error: "Manifest is not pending review" };

        const estimation = calculateEstimatedCost({
            route: manifest.route,
            truck: manifest.truck,
            driver: manifest.driver,
            additionalDistanceKm: manifest.additionalDistanceKm
        });

        const expensesData: any[] = [
            { id: "base-bbm", category: "BAHAN_BAKAR", amount: estimation.fuelCost, notes: `Estimasi BBM ${estimation.estimatedLiters.toFixed(1)}L`, tenantId },
            { id: "base-tol", category: "TOL_PARKIR", amount: estimation.tollCost, notes: `Tol Rute ${manifest.route.origin} - ${manifest.route.destination}`, tenantId },
            { id: "base-uang-jalan", category: "UANG_JALAN", amount: estimation.allowance, notes: `Uang Saku Supir (${manifest.driver.fullName})`, tenantId }
        ];

        manifest.expenses.forEach(e => {
            expensesData.push({
                id: e.id,
                category: e.category,
                amount: Number(e.amount),
                notes: e.notes,
                attachment: e.attachment,
                tenantId
            });
        });

        try {
            await syncExpensesToAccuwrite(tenantId, expensesData, manifest.manifestNumber);
        } catch (integrationError: any) {
            console.error("Accuwrite Integration failed", integrationError);
            return { error: `Gagal sinkronisasi data ke Accuwrite: ${integrationError.message}. Transaksi dibatalkan.` };
        }

        await prisma.$transaction([
            prisma.manifest.update({
                where: { id: manifestId },
                data: {
                    status: "COMPLETED",
                }
            }),
            prisma.driver.update({
                where: { id: manifest.driverId },
                data: { status: "AVAILABLE" }
            })
            // truck odometer was already updated by driver, so no need to update truck here
        ]);

        revalidatePath("/dashboard/surat-jalan");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to verify manifest" };
    }
}

export async function reviseManifest(manifestId: string, tenantId: string, generalNote: string, specificComments: { expenseId: string, note: string }[] = []) {
    try {
        const manifest = await prisma.manifest.findUnique({
            where: { id: manifestId, tenantId }
        });

        if (!manifest) return { error: "Manifest not found" };
        if (manifest.status !== "NEEDS_FINAL_REVIEW") return { error: "Manifest is not pending review" };

        const commentsData: any[] = [];
        if (generalNote && generalNote.trim() !== "") {
            commentsData.push({ type: "GENERAL", content: generalNote });
        }
        for (const c of specificComments) {
            if (c.note && c.note.trim() !== "") {
                commentsData.push({ type: "EXPENSE_SPECIFIC", content: c.note, expenseId: c.expenseId });
            }
        }

        await prisma.$transaction([
            prisma.manifestComment.deleteMany({ where: { manifestId } }),
            prisma.manifest.update({
                where: { id: manifestId },
                data: {
                    status: "REVISION_REQUIRED",
                    comments: {
                        create: commentsData
                    }
                }
            })
        ]);

        revalidatePath("/dashboard/surat-jalan");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to revise manifest" };
    }
}

