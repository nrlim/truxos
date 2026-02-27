"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Trash2, Route as RouteIcon, MapPin, Ticket, Calculator, Edit2, Navigation, ExternalLink } from "lucide-react";
import { getGoogleMapsUrl } from "@/lib/maps";
import { useNotification } from "@/components/ui/notification-provider";
import { useModal } from "@/components/ui/modal-provider";
import { routeSchema } from "@/lib/validations/master-data";
import {
    getRoutes,
    createRoute,
    deleteRoute,
    getAllTolls,
    updateRoute,
} from "@/actions/master-data";

import MapPicker from "@/components/MapPicker";
import LocationSearchInput from "@/components/LocationSearchInput";

// Simulasi Form Component (Enhanced Route Form)
function EstimationSimulator({ route, onClose }: { route: any; onClose: () => void }) {
    const [additional, setAdditional] = useState<number>(0);
    const total = Number(route.baseDistanceKm) + Number(additional || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8">
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2 font-bold">
                        <Calculator className="w-5 h-5" />
                        <span>Simulasi Operasional Rute</span>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-white transition">X</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asal - Tujuan</span>
                        </div>
                        <p className="font-bold text-slate-900 text-lg">
                            {route.origin} <span className="text-blue-500 mx-2">→</span> {route.destination}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-slate-600">Jarak Dasar (Master)</span>
                            <span className="font-bold text-slate-900">{route.baseDistanceKm} KM</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Jarak Tambahan (Detour)</span>
                            <input
                                type="number"
                                value={additional}
                                onChange={(e) => setAdditional(Number(e.target.value))}
                                className="w-24 text-right border border-slate-300 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-end text-xs text-slate-400 -mt-2">KM</div>

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                            <span className="text-sm font-semibold text-blue-900">Total Jarak Operasional</span>
                            <span className="font-black text-blue-700 text-lg">{total} KM</span>
                        </div>

                        {route.tolls && route.tolls.length > 0 ? (
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-4 text-sm">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-200">
                                    <span className="text-xs font-semibold text-emerald-800 uppercase flex items-center gap-1">
                                        <Ticket className="w-3.5 h-3.5" /> Tol Terhubung ({route.tolls.length})
                                    </span>
                                    <span className="font-black text-emerald-700">
                                        Total: Rp {route.tolls.reduce((acc: number, t: any) => acc + Number(t.fee), 0).toLocaleString("id-ID")}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {route.tolls.map((t: any) => (
                                        <div key={t.id} className="flex justify-between items-center">
                                            <span className="font-medium text-emerald-900 line-clamp-1 text-xs">{t.name}</span>
                                            <span className="font-semibold text-emerald-700 text-xs">Rp {Number(t.fee).toLocaleString("id-ID")}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center mt-4">
                                <span className="text-sm text-slate-500 font-medium">Tidak ada Tol terhubung</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-900 transition">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RutePage() {
    const notify = useNotification();
    const modal = useModal();
    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [tolls, setTolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [simulatingRoute, setSimulatingRoute] = useState<any | null>(null);

    const form = useForm<z.infer<typeof routeSchema>>({
        resolver: zodResolver(routeSchema) as any,
        defaultValues: {
            origin: "",
            destination: "",
            baseDistanceKm: 0,
            tollIds: [],
            tenantId: "",
            originCoords: "",
            destinationCoords: "",
        },
    });

    const selectedTollIds: string[] = useWatch({
        control: form.control,
        name: "tollIds",
    }) || [];

    const watchOriginCoords = useWatch({
        control: form.control,
        name: "originCoords",
    });

    const watchDestinationCoords = useWatch({
        control: form.control,
        name: "destinationCoords",
    });

    useEffect(() => {
        fetchData(meta.page);
    }, [meta.page]);

    async function fetchData(page: number = 1) {
        try {
            setLoading(true);
            const tenantStr = localStorage.getItem("truxos_tenant");
            if (!tenantStr) return;
            const tenant = JSON.parse(tenantStr);

            form.setValue("tenantId", tenant.id);

            const [resRoutes, resTolls] = await Promise.all([
                getRoutes(tenant.id, page, 10),
                getAllTolls(tenant.id)
            ]);

            if (resRoutes && Array.isArray(resRoutes.data)) {
                setData(resRoutes.data);
                setMeta(resRoutes.meta);
            }
            if (Array.isArray(resTolls)) {
                setTolls(resTolls);
            }
        } catch (e) {
            notify.error("Gagal memuat data rute");
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(values: z.infer<typeof routeSchema>) {
        setIsSubmitting(true);
        setIsFormOpen(false);
        setEditingId(null);

        const payload = { ...values };
        const optimisticId = editingId || `temp-${Date.now()}`;
        const previousData = [...data];
        const mockTolls = (payload.tollIds || []).map(id => tolls.find(t => t.id === id)).filter(Boolean);

        if (editingId) {
            setData(data.map(item => item.id === editingId ? { ...item, ...payload, tolls: mockTolls } : item));
        } else {
            setData([{ id: optimisticId, ...payload, tolls: mockTolls }, ...data]);
        }

        const res = editingId
            ? await updateRoute(editingId, payload)
            : await createRoute(payload);

        setIsSubmitting(false);

        if (res.error) {
            notify.error(res.error);
            setData(previousData);
            setIsFormOpen(true);
        } else {
            notify.success(editingId ? "Rute berhasil diperbarui" : "Rute berhasil ditambahkan");
            form.reset({
                ...values,
                origin: "",
                destination: "",
                baseDistanceKm: 0,
                tollIds: []
            });
            fetchData(meta.page);
        }
    }

    function handleEdit(item: any) {
        setEditingId(item.id);
        form.reset({
            origin: item.origin,
            destination: item.destination,
            baseDistanceKm: Number(item.baseDistanceKm),
            tollIds: item.tolls ? item.tolls.map((t: any) => t.id) : [],
            tenantId: item.tenantId,
            originCoords: item.originCoords || "",
            destinationCoords: item.destinationCoords || "",
        });
        setIsFormOpen(true);
    }

    function handleDelete(id: string) {
        modal.confirm({
            title: "Konfirmasi Penghapusan",
            message: "Data rute yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?",
            confirmLabel: "Hapus",
            variant: "danger",
            onConfirm: async () => {
                const previousData = [...data];
                setData(data.filter(item => item.id !== id));

                const res = await deleteRoute(id);
                if (res.error) {
                    notify.error(res.error);
                    setData(previousData);
                } else {
                    notify.success("Rute berhasil dihapus");
                    if (data.length === 1 && meta.page > 1) {
                        setMeta(prev => ({ ...prev, page: prev.page - 1 }));
                    } else {
                        fetchData(meta.page);
                    }
                }
            },
        });
    }

    const activeTollFee = selectedTollIds.reduce((acc: number, id: string) => {
        const t = tolls.find(x => x.id === id);
        return acc + (t ? Number(t.fee) : 0);
    }, 0);

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Daftar Rute Operasional</h2>
                <button
                    onClick={() => {
                        setIsFormOpen(!isFormOpen);
                        if (isFormOpen) {
                            setEditingId(null);
                            form.reset({ origin: "", destination: "", baseDistanceKm: 0, tollIds: [], tenantId: form.getValues("tenantId") });
                        }
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Tambah Rute</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-4">

                            <LocationSearchInput
                                label="Asal"
                                value={form.watch("origin")}
                                onChange={(val) => form.setValue("origin", val, { shouldValidate: true })}
                                onSelectLocation={(loc) => {
                                    form.setValue("origin", loc.name, { shouldValidate: true });
                                    form.setValue("originCoords", JSON.stringify({ lat: loc.lat, lng: loc.lng }), { shouldValidate: true });
                                }}
                                placeholder="Cari kota asal..."
                                error={form.formState.errors.origin?.message}
                            />

                            <LocationSearchInput
                                label="Tujuan"
                                value={form.watch("destination")}
                                onChange={(val) => form.setValue("destination", val, { shouldValidate: true })}
                                onSelectLocation={(loc) => {
                                    form.setValue("destination", loc.name, { shouldValidate: true });
                                    form.setValue("destinationCoords", JSON.stringify({ lat: loc.lat, lng: loc.lng }), { shouldValidate: true });
                                }}
                                placeholder="Cari kota tujuan..."
                                error={form.formState.errors.destination?.message}
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Jarak Dasar (KM)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    {...form.register("baseDistanceKm")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 750"
                                />
                                {form.formState.errors.baseDistanceKm && <p className="text-xs text-red-500">{form.formState.errors.baseDistanceKm.message}</p>}
                            </div>

                        </div>

                        <div className="py-4 border-b border-slate-100">
                            <label className="text-sm font-medium text-slate-700 block mb-2">Pilih Koordinat Rute (Peta)</label>
                            <MapPicker
                                originCoords={watchOriginCoords}
                                destinationCoords={watchDestinationCoords}
                                onChangeOrigin={(val: string) => form.setValue("originCoords", val, { shouldValidate: true })}
                                onChangeDestination={(val: string) => form.setValue("destinationCoords", val, { shouldValidate: true })}
                                onDistanceCalculated={(dist: number) => {
                                    if (!form.getValues("baseDistanceKm")) {
                                        form.setValue("baseDistanceKm", dist, { shouldValidate: true });
                                    }
                                }}
                            />
                        </div>

                        <div className="pt-2">
                            <label className="text-sm font-medium text-slate-700 block mb-2">Link Tol (Bisa Pilih Banyak)</label>
                            <div className="border border-slate-300 rounded-lg p-2 max-h-[200px] overflow-y-auto bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {tolls.map((t) => (
                                    <label key={t.id} className={`flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer group border transition ${selectedTollIds.includes(t.id)
                                        ? "border-blue-200 bg-blue-50/50"
                                        : "border-transparent hover:border-slate-200"
                                        }`}>
                                        <input
                                            type="checkbox"
                                            value={t.id}
                                            {...form.register("tollIds")}
                                            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="flex flex-col flex-1">
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 line-clamp-1">
                                                {t.name}
                                            </span>
                                            <span className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                    {t.category.replace("_", " ")}
                                                </span>
                                                <span className="text-xs font-semibold text-emerald-600">
                                                    Rp {Number(t.fee).toLocaleString("id-ID")}
                                                </span>
                                            </span>
                                        </span>
                                    </label>
                                ))}
                                {tolls.length === 0 && (
                                    <div className="col-span-full text-center p-4 text-sm text-slate-400">Tidak ada gerbang tol</div>
                                )}
                            </div>
                            {activeTollFee > 0 && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mt-3 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                                        <Ticket className="w-4 h-4" /> Total Estimasi Biaya Tol
                                    </span>
                                    <span className="text-lg font-black text-emerald-700">Rp {Number(activeTollFee).toLocaleString("id-ID")}</span>
                                </div>
                            )}
                            {form.formState.errors.tollIds && <p className="text-xs text-red-500 mt-1">{form.formState.errors.tollIds.message}</p>}
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFormOpen(false);
                                    setEditingId(null);
                                    form.reset({ origin: "", destination: "", baseDistanceKm: 0, tollIds: [], tenantId: form.getValues("tenantId") });
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition mr-2"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm h-[220px]">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="flex flex-col items-center opacity-50">
                                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                                <div className="w-0.5 h-6 bg-slate-200 my-1"></div>
                                                <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>
                                            </div>
                                            <div className="flex flex-col gap-5 w-full">
                                                <div className="w-32 h-5 bg-slate-200 rounded animate-pulse" />
                                                <div className="w-40 h-5 bg-slate-200 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
                                        <div className="space-y-2">
                                            <div className="w-20 h-3 bg-slate-100 rounded animate-pulse" />
                                            <div className="w-24 h-5 bg-slate-200 rounded animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="w-24 h-3 bg-slate-100 rounded animate-pulse" />
                                            <div className="w-28 h-4 bg-slate-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full h-10 bg-slate-50 border-t border-slate-100 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-500">Belum ada data Rute.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {data.map((item) => (
                            <div key={item.id} className="relative bg-gradient-to-br from-white to-slate-100 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-blue-200 transition-all duration-300">
                                {/* Background Watermark */}
                                <MapPin className="absolute -top-4 -right-4 w-48 h-48 text-blue-600 opacity-5 z-0 transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-700 pointer-events-none" />

                                <div className="p-5 relative z-10 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <div className="w-0.5 h-6 bg-slate-200 my-1"></div>
                                                <div className="w-3 h-3 rounded-full border-2 border-emerald-500"></div>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <span className="font-extrabold text-slate-800 uppercase leading-none">{item.origin}</span>
                                                <span className="font-extrabold text-slate-800 uppercase leading-none">{item.destination}</span>
                                            </div>
                                        </div>

                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                title="Ubah"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-400 uppercase">Jarak Dasar</span>
                                            <span className="font-black text-slate-800 text-lg">{item.baseDistanceKm} <span className="text-sm font-medium text-slate-500">KM</span></span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-400 uppercase">Tol Terhubung</span>
                                            {item.tolls && item.tolls.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-emerald-600 text-sm flex items-center gap-1.5">
                                                        <Ticket className="w-4 h-4" />
                                                        {item.tolls.length} Gerbang Tol
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-500 truncate" title={item.tolls.map((t: any) => t.name).join(", ")}>
                                                        {item.tolls.map((t: any) => t.name).join(", ")}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="font-medium text-slate-400 text-sm">Tidak Ada</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 flex border-t border-slate-100">
                                    <button
                                        onClick={() => setSimulatingRoute(item)}
                                        className="flex-1 bg-slate-50/80 backdrop-blur-sm hover:bg-blue-50 text-blue-600 font-bold py-3 text-sm flex justify-center items-center gap-2 transition-colors"
                                    >
                                        <Calculator className="w-4 h-4" />
                                        Simulasi
                                    </button>
                                    {getGoogleMapsUrl(item.originCoords, item.destinationCoords) && (
                                        <a
                                            href={getGoogleMapsUrl(item.originCoords, item.destinationCoords)!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 bg-slate-50/80 backdrop-blur-sm hover:bg-emerald-50 text-emerald-600 font-bold py-3 text-sm flex justify-center items-center gap-2 border-l border-slate-100 transition-colors"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Google Maps
                                            <ExternalLink className="w-3 h-3 opacity-50" />
                                        </a>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>

                    {meta.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-4">
                            <button
                                onClick={() => setMeta((prev) => ({ ...prev, page: prev.page - 1 }))}
                                disabled={meta.page === 1}
                                className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
                            >
                                Prev
                            </button>
                            <span className="text-sm font-medium text-slate-600">
                                Page {meta.page} of {meta.totalPages}
                            </span>
                            <button
                                onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                                disabled={meta.page === meta.totalPages}
                                className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {simulatingRoute && (
                <EstimationSimulator
                    route={simulatingRoute}
                    onClose={() => setSimulatingRoute(null)}
                />
            )}
        </div>
    );
}
