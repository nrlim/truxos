"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Truck, Map, User, Calculator, ArrowLeft, Send, Fuel, Ticket, WalletIcon, Info, Loader2 } from "lucide-react";
import { useNotification } from "@/components/ui/notification-provider";

import { manifestSchema } from "@/lib/validations/manifest";
import { createManifest } from "@/actions/manifest";
import { getAllTrucks, getAllRoutes, getAllDrivers } from "@/actions/master-data";
import { calculateEstimatedCost } from "@/lib/estimation";


export default function CreateManifestPage() {
    const router = useRouter();
    const notify = useNotification();
    const [loadingData, setLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Master data
    const [trucks, setTrucks] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);

    const form = useForm<z.infer<typeof manifestSchema>>({
        resolver: zodResolver(manifestSchema) as any,
        defaultValues: {
            truckId: "",
            driverId: "",
            routeId: "",
            additionalDistanceKm: 0,
            departureDate: new Date().toISOString().split("T")[0],
            tenantId: "",
        },
    });

    const watchTruckId = form.watch("truckId");
    const watchRouteId = form.watch("routeId");
    const watchDriverId = form.watch("driverId");
    const watchAdditionalDistance = form.watch("additionalDistanceKm");

    useEffect(() => {
        async function fetchMasterData() {
            try {
                const tenantStr = localStorage.getItem("truxos_tenant");
                if (!tenantStr) {
                    router.push("/login");
                    return;
                }
                const tenant = JSON.parse(tenantStr);
                form.setValue("tenantId", tenant.id);

                const [resTrucks, resRoutes, resDrivers] = await Promise.all([
                    getAllTrucks(tenant.id),
                    getAllRoutes(tenant.id),
                    getAllDrivers(tenant.id)
                ]);

                setTrucks(resTrucks);
                setRoutes(resRoutes);
                setDrivers(resDrivers);
            } catch (error) {
                notify.error("Gagal memuat data master");
            } finally {
                setLoadingData(false);
            }
        }
        fetchMasterData();
    }, [router, form]);

    const estimation = useMemo(() => {
        if (!watchTruckId || !watchRouteId || !watchDriverId) return null;

        const truck = trucks.find(t => t.id === watchTruckId);
        const route = routes.find(r => r.id === watchRouteId);
        const driver = drivers.find(d => d.id === watchDriverId);
        const additionalDistance = watchAdditionalDistance || 0;

        if (!truck || !route || !driver) return null;

        return calculateEstimatedCost({
            route,
            truck,
            driver,
            additionalDistanceKm: additionalDistance
        });
    }, [watchTruckId, watchRouteId, watchDriverId, watchAdditionalDistance, trucks, routes, drivers]);

    async function onSubmit(values: z.infer<typeof manifestSchema>) {
        if (!estimation) {
            notify.error("Silakan lengkapi data untuk kalkulasi estimasi");
            return;
        }

        setIsSubmitting(true);
        const res = await createManifest(values, estimation.total);
        setIsSubmitting(false);

        if (res.error) {
            notify.error(res.error);
        } else {
            notify.success("Surat Jalan berhasil dibuat");
            router.push("/dashboard/surat-jalan");
        }
    }

    if (loadingData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="mt-4 text-sm font-medium text-slate-500">Memuat data master...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600 bg-white shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Buat Surat Jalan Baru</h2>
                    <p className="text-sm text-slate-500 mt-1">Isi formulir untuk membuat manifest dan menghitung estimasi biaya jalan secara real-time.</p>
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    {/* Basic Data */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Info className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-900">Data Operasional</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Tanggal Keberangkatan</label>
                                <input
                                    type="date"
                                    {...form.register("departureDate")}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                />
                                {form.formState.errors.departureDate && <p className="text-xs text-red-500">{form.formState.errors.departureDate.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Pilih Armada</label>
                                <div className="relative">
                                    <Truck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <select
                                        {...form.register("truckId")}
                                        className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none bg-white"
                                    >
                                        <option value="">-- Pilih Armada Truk --</option>
                                        {trucks.map(truck => (
                                            <option key={truck.id} value={truck.id}>{truck.licensePlate} ({truck.type})</option>
                                        ))}
                                    </select>
                                </div>
                                {form.formState.errors.truckId && <p className="text-xs text-red-500">{form.formState.errors.truckId.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Pilih Supir</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <select
                                        {...form.register("driverId")}
                                        className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none bg-white"
                                    >
                                        <option value="">-- Pilih Supir (Available) --</option>
                                        {drivers.map(driver => (
                                            <option key={driver.id} value={driver.id}>{driver.fullName} - {driver.phoneNumber}</option>
                                        ))}
                                    </select>
                                </div>
                                {form.formState.errors.driverId && <p className="text-xs text-red-500">{form.formState.errors.driverId.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Pilih Rute Perjalanan</label>
                                <div className="relative">
                                    <Map className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <select
                                        {...form.register("routeId")}
                                        className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none bg-white"
                                    >
                                        <option value="">-- Pilih Rute --</option>
                                        {routes.map(route => (
                                            <option key={route.id} value={route.id}>{route.origin} → {route.destination} ({Number(route.baseDistanceKm)} KM)</option>
                                        ))}
                                    </select>
                                </div>
                                {form.formState.errors.routeId && <p className="text-xs text-red-500">{form.formState.errors.routeId.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Tambahan Jarak (KM)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        {...form.register("additionalDistanceKm")}
                                        className="w-full border border-slate-300 rounded-xl pr-4 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug">Berikan jarak tambahan jika ada detour, mampir, atau lokasi pengiriman berada di luar titik rute standar.</p>
                                {form.formState.errors.additionalDistanceKm && <p className="text-xs text-red-500">{form.formState.errors.additionalDistanceKm.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Estimation Preview */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden sticky top-24">
                    <div className="bg-blue-600 px-5 py-4 flex items-center gap-3 border-b border-blue-700">
                        <Calculator className="w-6 h-6 text-blue-100" />
                        <h3 className="font-bold text-white text-lg">Estimasi Biaya</h3>
                    </div>

                    <div className="p-6">
                        {!estimation ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                    <Calculator className="w-6 h-6 text-slate-500" />
                                </div>
                                <p className="text-slate-400 text-sm">Pilih Armada, Supir, dan Rute untuk melihat rincian biaya estimasi.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Map className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-300 text-sm">Total Jarak</span>
                                    </div>
                                    <span className="font-bold text-white tracking-wide">{estimation.totalDistance} KM</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Fuel className="w-4 h-4 text-slate-400" />
                                            <span className="text-slate-300 text-sm">BBM ({estimation.estimatedLiters.toFixed(1)}L)</span>
                                        </div>
                                        <span className="font-semibold text-white">Rp {estimation.fuelCost.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Ticket className="w-4 h-4 text-slate-400" />
                                            <span className="text-slate-300 text-sm">Tarif Tol</span>
                                        </div>
                                        <span className="font-semibold text-white">Rp {estimation.tollCost.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <WalletIcon className="w-4 h-4 text-slate-400" />
                                            <span className="text-slate-300 text-sm">Uang Saku Supir</span>
                                        </div>
                                        <span className="font-semibold text-white">Rp {estimation.allowance.toLocaleString("id-ID")}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Total Estimasi Keseluruhan</span>
                                        <span className="text-3xl font-extrabold text-blue-400">
                                            Rp {estimation.total.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                    Terbitkan Surat Jalan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
