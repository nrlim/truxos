"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Truck, Navigation, CheckCircle2, ChevronRight, MapPin, Map, Loader2, AlertCircle, Calendar } from "lucide-react";
import { useNotification } from "@/components/ui/notification-provider";
import { getManifests } from "@/actions/manifest";
import clsx from "clsx";


export default function SuratJalanPage() {
    const notify = useNotification();
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState({ activeCount: 0, enRouteCount: 0, pendingCount: 0, completedTodayCount: 0 });
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        fetchData(1);
    }, [debouncedSearch, statusFilter]);

    async function fetchData(page: number = 1) {
        try {
            setLoading(true);
            const tenantStr = localStorage.getItem("truxos_tenant");
            if (!tenantStr) return;
            const tenant = JSON.parse(tenantStr);

            const res = await getManifests(tenant.id, page, 10, debouncedSearch, statusFilter);
            if (res && res.data) {
                setData(res.data);
                setMeta(res.meta);
                if (res.summary) {
                    setSummary(res.summary);
                }
            }
        } catch (e) {
            notify.error("Gagal memuat data Surat Jalan");
        } finally {
            setLoading(false);
        }
    }

    const TABS = [
        { label: "Semua", value: "ALL" },
        { label: "Berjalan", value: "EN_ROUTE" },
        { label: "Tertunda", value: "PENDING" },
        { label: "Selesai", value: "COMPLETED" },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full tracking-wide">Tertunda</span>;
            case "EN_ROUTE":
                return <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full tracking-wide">Berjalan</span>;
            case "COMPLETED":
                return <span className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full tracking-wide">Selesai</span>;
            default:
                return <span className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 rounded-full uppercase">{status}</span>;
        }
    };

    const getProgressBar = (status: string) => {
        if (status === 'COMPLETED') {
            return (
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 w-full rounded-full transition-all" />
                </div>
            );
        }
        if (status === 'EN_ROUTE') {
            return (
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden relative">
                    <div className="bg-blue-500 h-1.5 w-3/5 rounded-full transition-all relative overflow-hidden">
                        <div className="absolute top-0 bottom-0 left-0 right-0 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </div>
                </div>
            );
        }
        return (
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden relative">
                <div className="bg-amber-400 h-1.5 w-[15%] rounded-full transition-all" />
            </div>
        );
    };

    return (
        <div className="w-full flex-1 flex flex-col p-4 md:p-6 space-y-5 overflow-hidden">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Operasional Surat Jalan</h2>
                    <p className="text-sm text-slate-500 mt-1.5 font-medium">{summary.activeCount} Perjalanan Aktif</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari manifest, supir atau plat..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow bg-white"
                        />
                    </div>
                    <Link
                        href="/dashboard/surat-jalan/create"
                        prefetch={true}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold shadow-sm text-sm"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Buat Surat Jalan
                    </Link>
                </div>
            </div>

            {/* Top Operational Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sedang Berjalan</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.enRouteCount}</h3>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Navigation className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Menunggu Persetujuan</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.pendingCount}</h3>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Selesai Hari Ini</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.completedTodayCount}</h3>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 py-1 overflow-x-auto no-scrollbar shrink-0">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                            statusFilter === tab.value
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Manifest List */}
            {loading ? (
                <div className="flex flex-col justify-center items-center py-24 bg-white rounded-xl border border-slate-200 flex-1">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                    <p className="text-sm font-medium text-slate-500">Memuat data...</p>
                </div>
            ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-center flex-1">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Tidak ada data</h3>
                    <p className="text-slate-500 text-sm">Tidak ditemukan manifest yang sesuai dengan filter.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0">
                        <div className="overflow-x-auto flex-1">
                            <table className="min-w-full text-left font-sans border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">ManifestID / Status</th>
                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Rute</th>
                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Armada / Supir</th>
                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Estimasi Biaya</th>
                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="font-bold text-slate-900 tracking-tight">{item.manifestNumber}</span>
                                                    {getStatusBadge(item.status)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-col gap-1 text-sm text-slate-700 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                        <span className="truncate max-w-[200px]">{item.route.origin}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                        <span className="truncate max-w-[200px]">{item.route.destination}</span>
                                                    </div>
                                                    <div className="mt-1 max-w-[200px]">
                                                        {getProgressBar(item.status)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                        <Truck className="w-3.5 h-3.5 text-slate-600" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">{item.truck.licensePlate}</span>
                                                        <span className="text-xs text-slate-500 font-medium truncate">{item.driver.fullName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className="text-sm font-bold text-slate-900 tracking-tight">
                                                    Rp {Number(item.totalEstimatedCost).toLocaleString("id-ID")}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right whitespace-nowrap">
                                                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-white border border-slate-200 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors ml-auto shadow-sm">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {data.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative active:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="font-bold text-slate-900 text-base">{item.manifestNumber}</span>
                                        <div className="mt-1">{getStatusBadge(item.status)}</div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                        Rp {(Number(item.totalEstimatedCost) / 1000).toFixed(0)}k
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex gap-3 text-sm">
                                        <div className="flex flex-col items-center mt-1 w-5">
                                            <div className="w-2 h-2 rounded-full border-2 border-blue-500" />
                                            <div className="w-px h-6 bg-slate-200 my-0.5" />
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        </div>
                                        <div className="flex-1 space-y-2 py-0.5 font-medium text-slate-700">
                                            <p className="line-clamp-1">{item.route.origin}</p>
                                            <p className="line-clamp-1">{item.route.destination}</p>
                                        </div>
                                    </div>
                                    {getProgressBar(item.status)}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <Truck className="w-3.5 h-3.5 text-slate-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest leading-none">{item.truck.licensePlate}</p>
                                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{item.driver.fullName}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Pagination Condensed */}
            {!loading && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-1 mt-auto shrink-0 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-500 hidden sm:block">
                        Menampilkan <span className="text-slate-900 font-bold">{data.length}</span> dari <span className="text-slate-900 font-bold">{meta.total}</span> manifest
                    </p>
                    <div className="flex items-center gap-2 ml-auto pt-2">
                        <button
                            onClick={() => setMeta(p => ({ ...p, page: p.page - 1 }))}
                            disabled={meta.page === 1}
                            className="px-3 py-1.5 border border-slate-200 title rounded-lg text-sm font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition bg-white"
                        >
                            Prev
                        </button>
                        <span className="text-sm font-semibold text-slate-700 px-2">
                            {meta.page} / {meta.totalPages}
                        </span>
                        <button
                            onClick={() => setMeta(p => ({ ...p, page: p.page + 1 }))}
                            disabled={meta.page === meta.totalPages}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition bg-white"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
