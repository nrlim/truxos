"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Trash2, Edit2, Ticket } from "lucide-react";
import { useNotification } from "@/components/ui/notification-provider";
import { useModal } from "@/components/ui/modal-provider";
import { tollSchema } from "@/lib/validations/master-data";
import {
    getTolls,
    createToll,
    deleteToll,
    updateToll,
} from "@/actions/master-data";
import { TollCategory } from "@prisma/client";

export default function TarifTolPage() {
    const notify = useNotification();
    const modal = useModal();
    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState("ALL");

    const form = useForm<z.infer<typeof tollSchema>>({
        resolver: zodResolver(tollSchema) as any,
        defaultValues: {
            name: "",
            category: "GOL_1",
            fee: 0,
            tenantId: "",
        },
    });

    useEffect(() => {
        fetchData(meta.page);
    }, [meta.page, categoryFilter]);

    async function fetchData(page: number = 1) {
        try {
            setLoading(true);
            const tenantStr = localStorage.getItem("truxos_tenant");
            if (!tenantStr) return;
            const tenant = JSON.parse(tenantStr);

            form.setValue("tenantId", tenant.id);
            const res = await getTolls(tenant.id, page, 10, categoryFilter);
            if (res && Array.isArray(res.data)) {
                setData(res.data);
                setMeta(res.meta);
            }
        } catch (e) {
            notify.error("Gagal memuat data tol");
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(values: z.infer<typeof tollSchema>) {
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
            ? await updateToll(editingId, values)
            : await createToll(values);

        setIsSubmitting(false);

        if (res.error) {
            notify.error(res.error);
            setData(previousData); // Revert on error
            setIsFormOpen(true);
        } else {
            notify.success(editingId ? "Tarif tol berhasil diperbarui" : "Tarif tol berhasil ditambahkan");
            form.reset({ ...values, name: "", fee: 0 });
            fetchData(meta.page);
        }
    }

    function handleEdit(item: any) {
        setEditingId(item.id);
        form.reset({
            name: item.name,
            category: item.category,
            fee: Number(item.fee),
            tenantId: item.tenantId,
        });
        setIsFormOpen(true);
    }

    function handleDelete(id: string) {
        modal.confirm({
            title: "Konfirmasi Penghapusan",
            message: "Data tarif tol yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?",
            confirmLabel: "Hapus",
            variant: "danger",
            onConfirm: async () => {
                const previousData = [...data];
                setData(data.filter(item => item.id !== id));

                const res = await deleteToll(id);
                if (res.error) {
                    notify.error(res.error);
                    setData(previousData);
                } else {
                    notify.success("Tarif tol berhasil dihapus");
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">Daftar Tarif Tol</h2>
                <button
                    onClick={() => {
                        setIsFormOpen(!isFormOpen);
                        if (isFormOpen) {
                            setEditingId(null);
                            form.reset({ name: "", category: "GOL_1", fee: 0, tenantId: form.getValues("tenantId") });
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Nama Gerbang/Ruas</label>
                                <input
                                    {...form.register("name")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Tol Cipali"
                                />
                                {form.formState.errors.name && (
                                    <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Kategori Golongan</label>
                                <select
                                    {...form.register("category")}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {Object.values(TollCategory).map((cat) => (
                                        <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
                                    ))}
                                </select>
                                {form.formState.errors.category && (
                                    <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tarif (Rp)</label>
                                <input
                                    type="text"
                                    value={form.watch("fee") ? Number(form.watch("fee")).toLocaleString("id-ID") : (form.watch("fee") === 0 ? "0" : "")}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        form.setValue("fee", val ? Number(val) : "" as any, { shouldValidate: true });
                                    }}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                                {form.formState.errors.fee && (
                                    <p className="text-xs text-red-500">{form.formState.errors.fee.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFormOpen(false);
                                    setEditingId(null);
                                    form.reset({ name: "", category: "GOL_1", fee: 0, tenantId: form.getValues("tenantId") });
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-[140px] p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="w-32 h-6 bg-slate-200 rounded animate-pulse" />
                                        <div className="w-16 h-5 bg-slate-100 rounded animate-pulse" />
                                    </div>
                                    <div className="w-24 h-7 bg-slate-200 rounded animate-pulse mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
                        {["ALL", ...Object.values(TollCategory)].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setCategoryFilter(cat);
                                    setMeta(prev => ({ ...prev, page: 1 }));
                                }}
                                className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${categoryFilter === cat
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                                    }`}
                            >
                                {cat === "ALL" ? "Semua Golongan" : cat.replace("_", " ")}
                            </button>
                        ))}
                    </div>

                    {data.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                            <p className="text-slate-500">Belum ada data Tarif Tol.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <ul className="divide-y divide-slate-100">
                                    {data.map((item: any) => (
                                        <li key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group relative before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-blue-500 before:opacity-0 hover:before:opacity-100 before:transition-opacity overflow-hidden">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                    <Ticket className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-[15px]">{item.name}</h4>
                                                    <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                                                        Kategori Kendaraan {item.category.replace("_", " ")}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full mt-2 sm:mt-0">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tarif Dasar</p>
                                                    <p className="font-bold text-slate-900 text-[15px]">Rp {Number(item.fee).toLocaleString("id-ID")}</p>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                                                        title="Ubah"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
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
                </>
            )}
        </div>
    );
}
