import { z } from "zod";
import { TruckType, FuelType, DriverStatus, TollCategory } from "@prisma/client";

export const tollSchema = z.object({
    name: z.string().min(1, "Nama gerbang/ruas wajib diisi"),
    category: z.nativeEnum(TollCategory, {
        message: "Kategori tol tidak valid",
    }),
    fee: z.coerce.number().min(0, "Tarif tol tidak boleh negatif"),
    tenantId: z.string().min(1, "Tenant ID wajib ada"),
});

export const truckSchema = z.object({
    licensePlate: z.string().min(1, "Plat nomor wajib diisi"),
    type: z.nativeEnum(TruckType, {
        message: "Tipe truk tidak valid",
    }),
    fuelType: z.nativeEnum(FuelType, {
        message: "Tipe BBM tidak valid",
    }),
    fuelRatio: z.coerce.number().min(0.1, "Rasio BBM harus lebih dari 0"),
    currentOdometer: z.coerce.number().min(0, "Odometer tidak boleh negatif"),
    tenantId: z.string().min(1, "Tenant ID wajib ada"),
});

export const routeSchema = z.object({
    origin: z.string().min(1, "Asal wajib diisi"),
    destination: z.string().min(1, "Tujuan wajib diisi"),
    originCoords: z.string().optional().nullable(),
    destinationCoords: z.string().optional().nullable(),
    baseDistanceKm: z.coerce.number().min(0.1, "Jarak harus lebih dari 0"),
    tollIds: z.array(z.string()).optional(),
    tenantId: z.string().min(1, "Tenant ID wajib ada"),
});

// Since the user asked for additionalDistanceKm to calculate total distance,
// I should include it in UI state but it's not saved to master data, OR
// if it's saved in operational schema, it's not in Route master.
// The user says "Enhanced Route Form: Field for baseDistanceKm (Fetched from Master). Input for additionalDistanceKm (User adjustable for detours). Real-time display: Total Distance = Base + Additional."
// This sounds like it happens in an *estimation* form (e.g. creating a Trip), not changing the Master Data itself. Wait! The objective is "OPERATIONAL ESTIMATION LOGIC (UI/UX Implementation): Enhanced Route Form..." If this Route Form is for estimating an operation, maybe we need to build that form too? "Responsive Next.js pages for managing all 4 master data sub-modules." 
// I will build the Estimation Form combined in the master data tab maybe? No, "managing all 4 master data sub-modules." I will build a 5th tab for "Estimasi"? Or maybe the route tab has checking. Let's make an Estimator Tab or put it under Route.
// For now, these are the schema for saving Master Data.

export const driverSchema = z.object({
    fullName: z.string().min(1, "Nama lengkap wajib diisi"),
    phoneNumber: z.string().min(1, "Nomor telepon wajib diisi"),
    licenseNumber: z.string().min(1, "Nomor SIM wajib diisi"),
    status: z.nativeEnum(DriverStatus, {
        message: "Status tidak valid",
    }),
    dailyAllowance: z.coerce.number().min(0, "Uang saku tidak boleh negatif"),
    tenantId: z.string().min(1, "Tenant ID wajib ada"),
});
