"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Trash2, Fuel, Gauge, Hash, Truck, Edit2 } from "lucide-react";
import { useNotification } from "@/components/ui/notification-provider";
import { useModal } from "@/components/ui/modal-provider";
import { truckSchema } from "@/lib/validations/master-data";
import {
    getTrucks,
    createTruck,
    deleteTruck,
    updateTruck,
} from "@/actions/master-data";
import { TruckType, FuelType } from "@prisma/client";

export default function ArmadaPage() {
    const notify = useNotification();
    const modal = useModal();
    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const form = useForm<z.infer<typeof truckSchema>>({
        resolver: zodResolver(truckSchema) as any,
        defaultValues: {
            licensePlate: "",
            type: "CDE",
            fuelType: "BIOSOLAR",
            fuelRatio: 0,
            currentOdometer: 0,
            tenantId: "",
        },
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
            const res = await getTrucks(tenant.id, page, 10);
            if (res && Array.isArray(res.data)) {
                setData(res.data);
                setMeta(res.meta);
            }
        } catch (e) {
            notify.error("Gagal memuat data armada");
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(values: z.infer<typeof truckSchema>) {
        setIsSubmitting(true);
        setIsFormOpen(false);
        setEditingId(null);

        // Optimistic UI for Add/Update
        const optimisticId = editingId || `temp-${Date.now()}`;
        const previousData = [...data];
        if (editingId) {
            setData(data.map(item => item.id === editingId ? { ...item, ...values } : item));
        } else {
            setData([{ id: optimisticId, ...values }, ...data]);
        }

        const res = editingId
            ? await updateTruck(editingId, values)
            : await createTruck(values);

        setIsSubmitting(false);

        if (res.error) {
            notify.error(res.error);
            setData(previousData); // Revert on error
            setIsFormOpen(true);
        } else {
            notify.success(editingId ? "Armada berhasil diperbarui" : "Armada berhasil ditambahkan");
            form.reset({
                ...values,
                licensePlate: "",
                fuelRatio: 0,
                currentOdometer: 0
            });
            fetchData(meta.page);
        }
    }

    function handleEdit(item: any) {
        setEditingId(item.id);
        form.reset({
            licensePlate: item.licensePlate,
            type: item.type,
            fuelType: item.fuelType,
            fuelRatio: Number(item.fuelRatio),
            currentOdometer: Number(item.currentOdometer),
            tenantId: item.tenantId,
        });
        setIsFormOpen(true);
    }

    function handleDelete(id: string) {
        modal.confirm({
            title: "Konfirmasi Penghapusan",
            message: "Data armada yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?",
            confirmLabel: "Hapus",
            variant: "danger",
            onConfirm: async () => {
                const previousData = [...data];
                setData(data.filter(item => item.id !== id));

                const res = await deleteTruck(id);
                if (res.error) {
                    notify.error(res.error);
                    setData(previousData);
                } else {
                    notify.success("Armada berhasil dihapus");
                    if (data.length === 1 && meta.page > 1) {
                        setMeta(prev => ({ ...prev, page: prev.page - 1 }));
                    } else {
                        fetchData(meta.page);
                    }
                }
            },
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Daftar Armada</h2>
                <button
                    onClick={() => {
                        setIsFormOpen(!isFormOpen);
                        if (isFormOpen) {
                            setEditingId(null);
                            form.reset({ licensePlate: "", type: "CDE", fuelType: "BIOSOLAR", fuelRatio: 0, currentOdometer: 0, tenantId: form.getValues("tenantId") });
                        }
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Tambah Data</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-slate-100 pb-4">

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Plat Nomor</label>
                                <input
                                    {...form.register("licensePlate")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="B 1234 CD"
                                />
                                {form.formState.errors.licensePlate && (
                                    <p className="text-xs text-red-500">{form.formState.errors.licensePlate.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tipe Truk</label>
                                <select
                                    {...form.register("type")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {Object.values(TruckType).map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                {form.formState.errors.type && (
                                    <p className="text-xs text-red-500">{form.formState.errors.type.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Jenis BBM</label>
                                <select
                                    {...form.register("fuelType")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {Object.values(FuelType).map((ft) => (
                                        <option key={ft} value={ft}>{ft.replace("_", " ")}</option>
                                    ))}
                                </select>
                                {form.formState.errors.fuelType && (
                                    <p className="text-xs text-red-500">{form.formState.errors.fuelType.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 mt-2">Rasio BBM (KM/Liter)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    {...form.register("fuelRatio")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 5.5"
                                />
                                {form.formState.errors.fuelRatio && (
                                    <p className="text-xs text-red-500">{form.formState.errors.fuelRatio.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 mt-2">Odometer Awal (KM)</label>
                                <input
                                    type="number"
                                    {...form.register("currentOdometer")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 150000"
                                />
                                {form.formState.errors.currentOdometer && (
                                    <p className="text-xs text-red-500">{form.formState.errors.currentOdometer.message}</p>
                                )}
                            </div>

                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFormOpen(false);
                                    setEditingId(null);
                                    form.reset({ licensePlate: "", type: "CDE", fuelType: "BIOSOLAR", fuelRatio: 0, currentOdometer: 0, tenantId: form.getValues("tenantId") });
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
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : data.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-500">Belum ada data Armada.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {data.map((item) => (
                            <div key={item.id} className="relative bg-gradient-to-br from-white to-slate-50/80 rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all duration-300">
                                {/* Background Watermark */}
                                <Truck className="absolute -bottom-6 -right-6 w-40 h-40 text-blue-600 opacity-5 z-0 transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700 pointer-events-none" />

                                {/* Header Box */}
                                <div className="relative z-10 bg-slate-50/80 border-b border-slate-200 p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-wider">{item.licensePlate}</h3>
                                            <span className="text-xs font-semibold text-slate-500">{item.type}</span>
                                        </div>
                                    </div>

                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                            title="Ubah"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Data Content */}
                                <div className="relative z-10 p-4 grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 flex items-center gap-1.5 text-xs"><Fuel className="w-3.5 h-3.5" /> BBM (Rasio)</span>
                                        <span className="font-semibold text-slate-800">{item.fuelType} ({item.fuelRatio} KM/L)</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 flex items-center gap-1.5 text-xs"><Gauge className="w-3.5 h-3.5" /> Odometer</span>
                                        <span className="font-semibold text-slate-800">{Number(item.currentOdometer).toLocaleString()} KM</span>
                                    </div>
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
        </div>
    );
}
