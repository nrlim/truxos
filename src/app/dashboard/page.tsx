"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    DollarSign,
    MapPin,
    Fuel,
    Route as RouteIcon,
    TrendingUp,
    TrendingDown,
    RefreshCw
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { getDashboardData } from "@/actions/dashboard";

interface UserData {
    id: string;
    username: string;
    fullName: string;
    role: string;
}

interface TenantData {
    id: string;
    name: string;
    slug: string;
}

interface DashboardMetrics {
    totalCost: number;
    costPerKm: number;
    fuelEfficiency: number;
    activeRoutes: number;
    chartData: { name: string; value: number }[];
    rincianBiaya: { name: string; value: number; type: "ESTIMASI" | "AKTUAL" }[];
}

const formatRupiah = (amount: number) => {
    if (amount === 0) return "Rp 0";
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(2).replace('.00', '')} M`;
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(0)} Jt`;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [viewMode, setViewMode] = useState<"Bulanan" | "Kuartalan">("Bulanan");
    const [rincianTab, setRincianTab] = useState<"SEMUA" | "ESTIMASI" | "AKTUAL">("SEMUA");
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("truxos_token");
        const userData = localStorage.getItem("truxos_user");
        const tenantData = localStorage.getItem("truxos_tenant");

        if (!token || !userData || !tenantData) {
            router.push("/login");
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === "DRIVER") {
            router.push("/dashboard/driver");
            return;
        }

        setUser(parsedUser);
        const parsedTenant = JSON.parse(tenantData);
        setTenant(parsedTenant);
    }, [router]);

    const fetchDashboardData = useCallback(async () => {
        if (!tenant) return;
        setIsLoading(true);
        try {
            const data = await getDashboardData(tenant.id, viewMode);
            setMetrics(data as any);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [tenant, viewMode]);

    useEffect(() => {
        if (tenant) {
            fetchDashboardData();
        }
    }, [tenant, viewMode, fetchDashboardData]);

    const handleRefresh = () => {
        fetchDashboardData();
    };

    // Example of useMemo for a complex calculation (finding average from chart data and highest value for Rincian colors)
    const avgCost = useMemo(() => {
        if (!metrics?.chartData || metrics.chartData.length === 0) return 0;
        const total = metrics.chartData.reduce((sum, item) => sum + item.value, 0);
        return total / metrics.chartData.length;
    }, [metrics?.chartData]);

    const filteredRincian = useMemo(() => {
        if (!metrics?.rincianBiaya) return [];
        return metrics.rincianBiaya.filter(item => rincianTab === "SEMUA" || item.type === rincianTab);
    }, [metrics?.rincianBiaya, rincianTab]);

    const maxRincianCost = useMemo(() => {
        if (filteredRincian.length === 0) return 1;
        return Math.max(...filteredRincian.map(item => item.value));
    }, [filteredRincian]);

    // Format date range text dynamically
    const dateRangeText = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        if (viewMode === "Bulanan") {
            return `Jan ${currentYear} - Des ${currentYear}`;
        }
        return `Q1 ${currentYear} - Q4 ${currentYear}`;
    }, [viewMode]);

    if (!user || !tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const rincianColors = ["#3b82f6", "#f59e0b", "#10b981", "#334155", "#84cc16"];

    return (
        <main className="px-4 sm:px-8 max-w-7xl w-full mx-auto py-8 font-sans text-slate-900">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Ringkasan Analisis Biaya
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        {dateRangeText}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-sm"
                        aria-label="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh Data</span>
                    </button>
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setViewMode("Bulanan")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md shadow-sm transition-all ${viewMode === "Bulanan" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Bulanan
                        </button>
                        <button
                            onClick={() => setViewMode("Kuartalan")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md shadow-sm transition-all ${viewMode === "Kuartalan" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Kuartalan
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card 1: Total Cost */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        {isLoading ? (
                            <div className="w-32 h-8 bg-slate-200 animate-pulse rounded mb-1" />
                        ) : (
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">{formatRupiah(metrics?.totalCost || 0)}</h2>
                        )}
                        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                            TOTAL BIAYA ARMADA
                        </p>
                    </div>
                </div>

                {/* Card 2: Cost/KM */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        {isLoading ? (
                            <div className="w-32 h-8 bg-slate-200 animate-pulse rounded mb-1" />
                        ) : (
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">{formatRupiah(metrics?.costPerKm || 0)}</h2>
                        )}
                        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                            BIAYA PER KM
                        </p>
                    </div>
                </div>

                {/* Card 3: Fuel Efficiency */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Fuel className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        {isLoading ? (
                            <div className="w-32 h-8 bg-slate-200 animate-pulse rounded mb-1" />
                        ) : (
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">{metrics?.fuelEfficiency ? `${metrics.fuelEfficiency.toFixed(1)}%` : "0%"}</h2>
                        )}
                        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                            EFISIENSI BBM
                        </p>
                    </div>
                </div>

                {/* Card 4: Active Routes */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <RouteIcon className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        {isLoading ? (
                            <div className="w-24 h-8 bg-slate-200 animate-pulse rounded mb-1" />
                        ) : (
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">{metrics?.activeRoutes || 0}</h2>
                        )}
                        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                            RUTE AKTIF
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <h3 className="text-lg font-bold text-slate-900">
                            Tren Biaya Bulanan
                        </h3>
                        <div className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                            Rata-rata: {isLoading ? "..." : formatRupiah(avgCost)}
                        </div>
                    </div>
                    <div className="h-72 w-full mt-auto">
                        {isLoading ? (
                            <div className="w-full h-full flex items-end justify-between px-4 pb-0 pt-10">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                    <div key={i} className="w-[6%] bg-slate-200 rounded-t-md animate-pulse" style={{ height: `${Math.max(20, Math.random() * 80)}%` }} />
                                ))}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={metrics?.chartData || []}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 13 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 13 }}
                                        tickFormatter={(value) => {
                                            if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                            return value;
                                        }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [formatRupiah(Number(value || 0)), "Biaya"]}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {metrics?.chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={(viewMode === "Bulanan" && index === new Date().getMonth()) || (viewMode === "Kuartalan" && index === Math.floor(new Date().getMonth() / 3)) ? '#1e3a8a' : '#94a3b8'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <h3 className="text-lg font-bold text-slate-900">
                            Rincian Biaya
                        </h3>
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setRincianTab("SEMUA")}
                                className={`px-3 py-1.5 text-xs font-medium rounded shadow-sm transition-all focus:outline-none ${rincianTab === "SEMUA" ? "bg-white text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setRincianTab("ESTIMASI")}
                                className={`px-3 py-1.5 text-xs font-medium rounded shadow-sm transition-all focus:outline-none ${rincianTab === "ESTIMASI" ? "bg-white text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Estimasi Awal
                            </button>
                            <button
                                onClick={() => setRincianTab("AKTUAL")}
                                className={`px-3 py-1.5 text-xs font-medium rounded shadow-sm transition-all focus:outline-none ${rincianTab === "AKTUAL" ? "bg-white text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Pengeluaran Tambahan
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex-1 flex flex-col justify-start gap-5">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="w-24 h-4 bg-slate-200 animate-pulse rounded" />
                                        <div className="w-20 h-4 bg-slate-200 animate-pulse rounded" />
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-200 animate-pulse rounded-full w-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredRincian && filteredRincian.length > 0 ? (
                        <div className="flex-1 flex flex-col justify-start gap-5 overflow-y-auto pr-2">
                            {filteredRincian.map((item, index) => {
                                const percentage = maxRincianCost > 0 ? (item.value / maxRincianCost) * 100 : 0;
                                const color = rincianColors[index % rincianColors.length];

                                return (
                                    <div key={`${item.name}-${index}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-slate-700 capitalize flex items-center gap-2">
                                                {item.name.toLowerCase()}
                                                {item.type === "AKTUAL" && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-sm font-bold border border-red-100 uppercase">Aktual</span>}
                                                {item.type === "ESTIMASI" && <span className="text-[10px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded-sm font-bold border border-sky-100 uppercase">Estimasi</span>}
                                            </span>
                                            <span className="text-sm font-bold text-slate-900">
                                                {formatRupiah(item.value)}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.max(percentage, 1)}%`, backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                            <DollarSign className="w-8 h-8 opacity-20" />
                            <p className="text-sm font-medium">Belum ada rincian biaya</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
