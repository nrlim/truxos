"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getActiveDriverManifest(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { driverId: true, role: true, tenantId: true }
    });

    if (!user || user.role !== "DRIVER" || !user.driverId) {
        return { error: "Driver profile not associated with this user" };
    }

    const activeManifest = await prisma.manifest.findFirst({
        where: {
            tenantId: user.tenantId,
            driverId: user.driverId,
            status: "EN_ROUTE"
        },
        include: {
            truck: true,
            route: {
                include: { tolls: true }
            },
            expenses: true
        }
    });

    return {
        data: activeManifest ? {
            ...activeManifest,
            totalEstimatedCost: activeManifest.totalEstimatedCost.toString(),
            route: activeManifest.route ? {
                ...activeManifest.route,
                tolls: activeManifest.route.tolls?.map(t => ({
                    ...t,
                    fee: t.fee.toString()
                }))
            } : null,
            expenses: activeManifest.expenses?.map(e => ({
                ...e,
                amount: e.amount.toString()
            })) || []
        } : null,
        driverId: user.driverId
    };
}

export async function completeDriverManifest(manifestId: string, tenantId: string, newOdometer: number, driverId: string, expenses: any[]) {
    try {
        const manifest = await prisma.manifest.findUnique({
            where: { id: manifestId, tenantId },
            include: { truck: true }
        });

        if (!manifest) return { error: "Manifest not found" };
        if (manifest.status !== "EN_ROUTE") return { error: "Manifest is not active" };
        if (manifest.driverId !== driverId) return { error: "Unauthorized" };

        const expensesData = expenses.map(e => ({
            category: e.category,
            amount: Number(e.amount),
            notes: e.notes,
            attachment: e.attachmentUrl || null,
            tenantId
        }));

        await prisma.$transaction([
            prisma.postTripExpense.deleteMany({
                where: { manifestId }
            }),
            prisma.manifest.update({
                where: { id: manifestId },
                data: {
                    status: "NEEDS_FINAL_REVIEW", // as specified in the instructions for post-trip
                    expenses: {
                        create: expensesData
                    }
                }
            }),
            prisma.truck.update({
                where: { id: manifest.truckId },
                data: { currentOdometer: newOdometer }
            })
        ]);

        revalidatePath("/dashboard/driver");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to complete manifest" };
    }
}
