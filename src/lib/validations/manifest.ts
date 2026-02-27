import { z } from "zod";

export const manifestSchema = z.object({
    truckId: z.string().min(1, "Armada wajib dipilih"),
    driverId: z.string().min(1, "Supir wajib dipilih"),
    routeId: z.string().min(1, "Rute wajib dipilih"),
    additionalDistanceKm: z.coerce.number().min(0, "Jarak tambahan tidak boleh negatif"),
    departureDate: z.string().min(1, "Tanggal keberangkatan wajib diisi"),
    tenantId: z.string().min(1, "Tenant ID wajib ada"),
});
