"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Truck, Navigation, CheckCircle2, ChevronRight, MapPin, Map, Loader2, AlertCircle, Calendar, ExternalLink } from "lucide-react";
import { getGoogleMapsUrl } from "@/lib/maps";
import { useNotification } from "@/components/ui/notification-provider";
import { getManifests, approveManifest, rejectManifest, completeManifest, verifyManifest, reviseManifest } from "@/actions/manifest";
import clsx from "clsx";
import { ApprovalDrawer } from "./approval-drawer";
import { CompletionDrawer } from "./completion-drawer";
import { FinalReviewDrawer } from "./final-review-drawer";


export default function SuratJalanPage() {
    const notify = useNotification();
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState({ activeCount: 0, enRouteCount: 0, pendingCount: 0, reviewCount: 0, completedTodayCount: 0 });
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>("STAFF");

    const [selectedManifest, setSelectedManifest] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const [isCompletionDrawerOpen, setIsCompletionDrawerOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const [isFinalReviewDrawerOpen, setIsFinalReviewDrawerOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isRevising, setIsRevising] = useState(false);

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

        const userDataStr = localStorage.getItem("truxos_user");
        if (userDataStr) {
            try {
                setUserRole(JSON.parse(userDataStr).role);
            } catch (e) { }
        }
    }, [debouncedSearch, statusFilter]);

    const canApprove = userRole === "ADMIN" || userRole === "OWNER";

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

    const handleRowClick = (item: any) => {
        if (canApprove && item.status === "PENDING") {
            setSelectedManifest(item);
            setIsDrawerOpen(true);
        } else if (item.status === "EN_ROUTE") {
            setSelectedManifest(item);
            setIsCompletionDrawerOpen(true);
        } else if (canApprove && item.status === "NEEDS_FINAL_REVIEW") {
            setSelectedManifest(item);
            setIsFinalReviewDrawerOpen(true);
        } else if (item.status === "COMPLETED") {
            setSelectedManifest(item);
            setIsFinalReviewDrawerOpen(true);
        }
    };

    const handleComplete = async (manifestId: string, newOdometer: number, expenses: any[] = []) => {
        try {
            setIsCompleting(true);
            const tenantStr = localStorage.getItem("truxos_tenant");
            if (!tenantStr) return;
            const tenant = JSON.parse(tenantStr);
            const res = await completeManifest(manifestId, tenant.id, newOdometer, expenses);

            if (res.error) {
                notify.error(res.error);
            } else {
                notify.success("Perjalanan Selesai: Driver & Armada Kembali Tersedia");
                setIsCompletionDrawerOpen(false);
                fetchData(meta.page);
            }
        } catch (e) {
            notify.error("Terjadi kesalahan sistem");
        } finally {
            setIsCompleting(false);
        }
    };

    const handleApprove = async (manifestId: string) => {
        try {
            setIsApproving(true);
            const tenantStr = localStorage.getItem("truxos_tenant");
            if (!tenantStr) return;
            const tenant = JSON.parse(tenantStr);
            const res = await approveManifest(manifestId, tenant.id);

            if (res.error) {
                notify.error(res.error);
            } else {
                notify.success("Surat Jalan Berhasil Diterbitkan");
                setIsDrawerOpen(false);
                fetchData(meta.page);
            }
        } catch (e) {
            notify.error("Terjadi kesalahan sistem");
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async (manifestId: string) => {
        try {
            setIsRejecting(true);
            const tenantStr = localStorage.getItem("truxos_tenant");
            if (!tenantStr) return;
            const tenant = JSON.parse(tenantStr);
            const res = await rejectManifest(manifestId, tenant.id);

            if (res.error) {
                notify.error(res.error);
            } else {
                notify.success("Surat Jalan Berhasil Ditolak");
                setIsDrawerOpen(false);
                fetchData(meta.page);
            }
        } catch (e) {
            notify.error("Terjadi kesalahan sistem");
        } finally {
            setIsRejecting(false);
        }
    };

    const handleVerify = async (manifestId: string) => {
        try {
            setIsVerifying(true);
            const tenantStr = localStorage.getItem("truxos_tenant");
            if (!tenantStr) return;
            const tenant = JSON.parse(tenantStr);
            const res = await verifyManifest(manifestId, tenant.id);

            if (res.error) {
                notify.error(res.error);
            } else {
                notify.success("Final Review Selesai: Manifest ditutup.");
                setIsFinalReviewDrawerOpen(false);
                fetchData(meta.page);
            }
        } catch (e) {
            notify.error("Terjadi kesalahan sistem");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRevise = async (manifestId: string, note: string) => {
        try {
            setIsRevising(true);
            const tenantStr = localStorage.getItem("truxos_tenant");
            if (!tenantStr) return;
            const tenant = JSON.parse(tenantStr);
            const res = await reviseManifest(manifestId, tenant.id, note);

            if (res.error) {
                notify.error(res.error);
            } else {
                notify.success("Dikembalikan ke Driver untuk direvisi.");
                setIsFinalReviewDrawerOpen(false);
                fetchData(meta.page);
            }
        } catch (e) {
            notify.error("Terjadi kesalahan sistem");
        } finally {
            setIsRevising(false);
        }
    };

    const TABS = [
        { label: "Semua", value: "ALL" },
        { label: "Butuh Verifikasi", value: "NEEDS_FINAL_REVIEW" },
        { label: "Berjalan", value: "EN_ROUTE" },
        { label: "Tertunda", value: "PENDING" },
        { label: "Selesai", value: "COMPLETED" },
        { label: "Ditolak", value: "REJECTED" },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full tracking-wide">Tertunda</span>;
            case "EN_ROUTE":
                return <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full tracking-wide">Berjalan</span>;
            case "NEEDS_FINAL_REVIEW":
                return <span className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-200 border border-amber-300 rounded-full tracking-wide">Butuh Verifikasi</span>;
            case "COMPLETED":
                return <span className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full tracking-wide">Selesai</span>;
            case "REJECTED":
                return <span className="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 rounded-full tracking-wide">Ditolak</span>;
            default:
                return <span className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 rounded-full uppercase">{status}</span>;
        }
    };

    const getProgressBar = (status: string) => {
        if (status === 'COMPLETED') {
            return null; // Don't show progress bar to keep layout clean for completed tasks
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
        if (status === 'REJECTED') {
            return null;
        }
        if (status === 'NEEDS_FINAL_REVIEW') {
            return (
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-amber-400 h-1.5 w-11/12 rounded-full transition-all relative overflow-hidden">
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
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Butuh Verifikasi</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.reviewCount}</h3>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
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
                statusFilter === "NEEDS_FINAL_REVIEW" ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 text-center flex-1 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50/50 rounded-full flex items-center justify-center mb-5 ring-4 ring-blue-50">
                            <CheckCircle2 className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Semua tugas telah terverifikasi</h3>
                        <p className="text-slate-500 text-sm max-w-sm">
                            Tidak ada manifest yang menunggu validasi pengeluaran.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-center flex-1 shadow-sm">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Tidak ada data</h3>
                        <p className="text-slate-500 text-sm">Tidak ditemukan manifest yang sesuai dengan filter.</p>
                    </div>
                )
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
                                        <tr
                                            key={item.id}
                                            onClick={() => handleRowClick(item)}
                                            className={clsx(
                                                "transition-colors group",
                                                (canApprove && (item.status === "PENDING" || item.status === "NEEDS_FINAL_REVIEW")) || item.status === "EN_ROUTE" || item.status === "COMPLETED" ? "cursor-pointer hover:bg-slate-50/80" : ""
                                            )}
                                        >
                                            <td className="px-5 py-4 align-middle whitespace-nowrap">
                                                <div className="flex flex-col gap-1 items-start justify-center h-full">
                                                    <span className="font-bold text-slate-900 tracking-tight">{item.manifestNumber}</span>
                                                    {getStatusBadge(item.status)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 align-middle">
                                                <div className="flex flex-col gap-1 text-sm text-slate-700 font-medium justify-center h-full">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                        <span className="truncate max-w-[200px]">{item.route.origin}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                        <span className="truncate max-w-[200px]">{item.route.destination}</span>
                                                    </div>
                                                    {getProgressBar(item.status) && (
                                                        <div className="mt-1 max-w-[200px]">
                                                            {getProgressBar(item.status)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 align-middle whitespace-nowrap">
                                                <div className="flex items-center gap-3 h-full">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                        <Truck className="w-3.5 h-3.5 text-slate-600" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 justify-center">
                                                        <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">{item.truck.licensePlate}</span>
                                                        <span className="text-xs text-slate-500 font-medium truncate">{item.driver.fullName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 align-middle whitespace-nowrap">
                                                <div className="flex align-center h-full py-1">
                                                    <span className="text-sm font-bold text-slate-900 tracking-tight">
                                                        Rp {Number(item.totalEstimatedCost).toLocaleString("id-ID")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 align-middle text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {getGoogleMapsUrl(item.route.originCoords, item.route.destinationCoords) && (
                                                        <a
                                                            href={getGoogleMapsUrl(item.route.originCoords, item.route.destinationCoords)!}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                                                            title="Buka di Google Maps"
                                                        >
                                                            <Navigation className="w-3 h-3" />
                                                            Maps
                                                            <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                                                        </a>
                                                    )}
                                                    {item.status === "PENDING" && canApprove ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm focus:ring-2 focus:ring-blue-200"
                                                        >
                                                            Setujui
                                                        </button>
                                                    ) : item.status === "NEEDS_FINAL_REVIEW" && canApprove ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm focus:ring-2 focus:ring-amber-200"
                                                        >
                                                            Review Final
                                                        </button>
                                                    ) : item.status === "EN_ROUTE" ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm focus:ring-2 focus:ring-blue-200"
                                                        >
                                                            Selesaikan
                                                        </button>
                                                    ) : item.status === "COMPLETED" ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                        >
                                                            Lihat Detail
                                                        </button>
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-md flex items-center justify-center bg-white border border-slate-200 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors ml-auto shadow-sm">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </div>
                                                    )}
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
                            <div
                                key={item.id}
                                onClick={() => handleRowClick(item)}
                                className={clsx(
                                    "bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative transition-colors",
                                    (canApprove && (item.status === "PENDING" || item.status === "NEEDS_FINAL_REVIEW")) || item.status === "EN_ROUTE" || item.status === "COMPLETED" ? "cursor-pointer active:bg-slate-50" : ""
                                )}
                            >
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

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-7 h-7 rounded border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <Truck className="w-3.5 h-3.5 text-slate-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest leading-none">{item.truck.licensePlate}</p>
                                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{item.driver.fullName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getGoogleMapsUrl(item.route.originCoords, item.route.destinationCoords) && (
                                            <a
                                                href={getGoogleMapsUrl(item.route.originCoords, item.route.destinationCoords)!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                title="Buka di Google Maps"
                                            >
                                                <Navigation className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        {item.status === "PENDING" && canApprove ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                                            >
                                                Setujui
                                            </button>
                                        ) : item.status === "NEEDS_FINAL_REVIEW" && canApprove ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                                            >
                                                Review
                                            </button>
                                        ) : item.status === "EN_ROUTE" ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                                            >
                                                Selesaikan
                                            </button>
                                        ) : item.status === "COMPLETED" ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                className="px-4 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                            >
                                                Detail
                                            </button>
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        )}
                                    </div>
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

            <ApprovalDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                manifest={selectedManifest}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={isApproving}
                isRejecting={isRejecting}
            />

            <CompletionDrawer
                isOpen={isCompletionDrawerOpen}
                onClose={() => setIsCompletionDrawerOpen(false)}
                manifest={selectedManifest}
                onComplete={handleComplete}
                isCompleting={isCompleting}
            />

            <FinalReviewDrawer
                isOpen={isFinalReviewDrawerOpen}
                onClose={() => setIsFinalReviewDrawerOpen(false)}
                manifest={selectedManifest}
                onVerify={handleVerify}
                onRevise={handleRevise}
                isVerifying={isVerifying}
                isRevising={isRevising}
                isReadOnly={selectedManifest?.status === "COMPLETED"}
            />
        </div>
    );
}
