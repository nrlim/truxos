"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { syncExpensesToAccuwrite } from "@/lib/integration";

export async function getActiveDriverManifest(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { driverId: true, role: true, tenantId: true }
    });

    if (!user || user.role !== "DRIVER" || !user.driverId) {
        return { error: "Driver profile not associated with this user" };
    }

    const activeManifests = await prisma.manifest.findMany({
        where: {
            tenantId: user.tenantId,
            driverId: user.driverId,
            status: { in: ["EN_ROUTE", "REVISION_REQUIRED"] }
        },
        include: {
            truck: true,
            route: {
                include: { tolls: true }
            },
            expenses: true,
            comments: true
        },
        orderBy: { createdAt: "desc" }
    });

    const enRouteManifest = activeManifests.find(m => m.status === "EN_ROUTE");
    const revisionManifests = activeManifests.filter(m => m.status === "REVISION_REQUIRED");

    const formatManifest = (manifest: any) => ({
        ...manifest,
        totalEstimatedCost: manifest.totalEstimatedCost.toString(),
        route: manifest.route ? {
            ...manifest.route,
            tolls: manifest.route.tolls?.map((t: any) => ({
                ...t,
                fee: t.fee.toString()
            }))
        } : null,
        expenses: manifest.expenses?.map((e: any) => ({
            ...e,
            amount: e.amount.toString()
        })) || [],
        comments: manifest.comments || []
    });

    return {
        data: enRouteManifest ? formatManifest(enRouteManifest) : null,
        revisions: revisionManifests.map(formatManifest),
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
        if (manifest.status !== "EN_ROUTE" && manifest.status !== "REVISION_REQUIRED") return { error: "Manifest is not active" };
        if (manifest.driverId !== driverId) return { error: "Unauthorized" };

        const expensesData = expenses.map(e => ({
            category: e.category,
            amount: Number(e.amount),
            notes: e.notes,
            attachment: e.attachmentUrl || null,
            tenantId
        }));

        // Integration removed here: sync to Accuwrite will happen during verifyManifest by admin.

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
