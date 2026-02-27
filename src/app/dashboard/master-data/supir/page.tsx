"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Trash2, Phone, Indent, BadgeDollarSign, Edit2, Users } from "lucide-react";
import { useNotification } from "@/components/ui/notification-provider";
import { useModal } from "@/components/ui/modal-provider";
import { driverSchema } from "@/lib/validations/master-data";
import {
    getDrivers,
    createDriver,
    deleteDriver,
    updateDriver,
} from "@/actions/master-data";
import { DriverStatus } from "@prisma/client";
import clsx from "clsx";

export default function SupirPage() {
    const notify = useNotification();
    const modal = useModal();
    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const form = useForm<z.infer<typeof driverSchema>>({
        resolver: zodResolver(driverSchema) as any,
        defaultValues: {
            fullName: "",
            phoneNumber: "",
            licenseNumber: "",
            status: "AVAILABLE",
            dailyAllowance: 0,
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
            const res = await getDrivers(tenant.id, page, 10);
            if (res && Array.isArray(res.data)) {
                setData(res.data);
                setMeta(res.meta);
            }
        } catch (e) {
            notify.error("Gagal memuat data supir");
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(values: z.infer<typeof driverSchema>) {
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
            ? await updateDriver(editingId, values)
            : await createDriver(values);

        setIsSubmitting(false);

        if (res.error) {
            notify.error(res.error);
            setData(previousData); // Revert on error
            setIsFormOpen(true);
        } else {
            notify.success(editingId ? "Supir berhasil diperbarui" : "Supir berhasil ditambahkan");
            form.reset({
                ...values,
                fullName: "",
                phoneNumber: "",
                licenseNumber: "",
                dailyAllowance: 0
            });
            fetchData(meta.page);
        }
    }

    function handleEdit(item: any) {
        setEditingId(item.id);
        form.reset({
            fullName: item.fullName,
            phoneNumber: item.phoneNumber,
            licenseNumber: item.licenseNumber,
            status: item.status,
            dailyAllowance: Number(item.dailyAllowance),
            tenantId: item.tenantId,
        });
        setIsFormOpen(true);
    }

    function handleDelete(id: string) {
        modal.confirm({
            title: "Konfirmasi Penghapusan",
            message: "Data supir yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?",
            confirmLabel: "Hapus",
            variant: "danger",
            onConfirm: async () => {
                const previousData = [...data];
                setData(data.filter(item => item.id !== id));

                const res = await deleteDriver(id);
                if (res.error) {
                    notify.error(res.error);
                    setData(previousData);
                } else {
                    notify.success("Supir berhasil dihapus");
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
                <h2 className="text-xl font-bold text-slate-900">Daftar Supir</h2>
                <button
                    onClick={() => {
                        setIsFormOpen(!isFormOpen);
                        if (isFormOpen) {
                            setEditingId(null);
                            form.reset({ fullName: "", phoneNumber: "", licenseNumber: "", status: "AVAILABLE", dailyAllowance: 0, tenantId: form.getValues("tenantId") });
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
                                <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                                <input
                                    {...form.register("fullName")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Budi Santoso"
                                />
                                {form.formState.errors.fullName && (
                                    <p className="text-xs text-red-500">{form.formState.errors.fullName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">No. HP</label>
                                <input
                                    type="tel"
                                    {...form.register("phoneNumber")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0812xxx"
                                />
                                {form.formState.errors.phoneNumber && (
                                    <p className="text-xs text-red-500">{form.formState.errors.phoneNumber.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">No. SIM</label>
                                <input
                                    {...form.register("licenseNumber")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="xxxx-xxxx-xxxx"
                                />
                                {form.formState.errors.licenseNumber && (
                                    <p className="text-xs text-red-500">{form.formState.errors.licenseNumber.message}</p>
                                )}
                            </div>

                            <div className="space-y-2 mt-2">
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <select
                                    {...form.register("status")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {Object.values(DriverStatus).map((st) => (
                                        <option key={st} value={st}>{st.replace("_", " ")}</option>
                                    ))}
                                </select>
                                {form.formState.errors.status && (
                                    <p className="text-xs text-red-500">{form.formState.errors.status.message}</p>
                                )}
                            </div>

                            <div className="space-y-2 mt-2">
                                <label className="text-sm font-medium text-slate-700">Uang Saku Standar (Rp)</label>
                                <input
                                    type="text"
                                    value={form.watch("dailyAllowance") ? Number(form.watch("dailyAllowance")).toLocaleString("id-ID") : (form.watch("dailyAllowance") === 0 ? "0" : "")}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        form.setValue("dailyAllowance", val ? Number(val) : "" as any, { shouldValidate: true });
                                    }}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                                {form.formState.errors.dailyAllowance && (
                                    <p className="text-xs text-red-500">{form.formState.errors.dailyAllowance.message}</p>
                                )}
                            </div>

                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFormOpen(false);
                                    setEditingId(null);
                                    form.reset({ fullName: "", phoneNumber: "", licenseNumber: "", status: "AVAILABLE", dailyAllowance: 0, tenantId: form.getValues("tenantId") });
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-[180px]">
                                <div className="p-5 flex flex-col justify-between h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse" />
                                            <div className="space-y-2">
                                                <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
                                                <div className="w-20 h-4 bg-slate-100 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                        <div className="w-40 h-3 bg-slate-100 rounded animate-pulse" />
                                        <div className="w-32 h-3 bg-slate-100 rounded animate-pulse" />
                                        <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-500">Belum ada data Supir.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {data.map((item) => (
                            <div key={item.id} className="relative bg-gradient-to-br from-white to-slate-100 rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all duration-300">
                                {/* Background Watermark */}
                                <Users className="absolute -bottom-4 -right-4 w-40 h-40 text-blue-600 opacity-5 z-0 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700 pointer-events-none" />

                                <div className="relative z-10 p-5 flex flex-col justify-between h-full">

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-600">
                                                {item.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base">{item.fullName}</h3>
                                                <span className={clsx(
                                                    "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-1 inline-block",
                                                    item.status === "AVAILABLE" && "bg-emerald-100 text-emerald-700",
                                                    item.status === "ON_TRIP" && "bg-blue-100 text-blue-700",
                                                    item.status === "MAINTENANCE" && "bg-amber-100 text-amber-700"
                                                )}>
                                                    {item.status.replace("_", " ")}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                title="Ubah"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-3 border-t border-slate-100 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span>{item.phoneNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Indent className="w-4 h-4 text-slate-400" />
                                            <span>SIM {item.licenseNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <BadgeDollarSign className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold">Rp {Number(item.dailyAllowance).toLocaleString("id-ID")}</span>
                                        </div>
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
