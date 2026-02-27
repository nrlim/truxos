"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Truck,
    LogOut,
    User as UserIcon,
    DollarSign,
    MapPin,
    Fuel,
    Route as RouteIcon,
    TrendingUp,
    TrendingDown,
    Users
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

const chartDataBulanan = [
    { name: 'Jan', value: 140 },
    { name: 'Feb', value: 110 },
    { name: 'Mar', value: 150 },
    { name: 'Apr', value: 130 },
    { name: 'Mei', value: 170 },
    { name: 'Jun', value: 200 },
    { name: 'Jul', value: 160 },
    { name: 'Agt', value: 190 },
    { name: 'Sep', value: 180 },
    { name: 'Okt', value: 210 },
    { name: 'Nov', value: 170 },
    { name: 'Des', value: 250 },
];

const chartDataKuartalan = [
    { name: 'Q1', value: 400 },
    { name: 'Q2', value: 500 },
    { name: 'Q3', value: 530 },
    { name: 'Q4', value: 630 },
];

const kpiDataBulanan = {
    totalCost: { value: "Rp 2,15 M", trend: "+12.4%", isUp: true },
    costPerKm: { value: "Rp 18.500", trend: "-3.2%", isUp: false },
    fuelEfficiency: { value: "87%", trend: "+5.1%", isUp: true },
    activeRoutes: { value: "34", trend: "-2", isUp: false },
    avgCost: "Rp 179 Jt",
    dateRange: "Jan 2026 - Des 2026"
};

const kpiDataKuartalan = {
    totalCost: { value: "Rp 20,4 M", trend: "+8.1%", isUp: true },
    costPerKm: { value: "Rp 17.800", trend: "-1.5%", isUp: false },
    fuelEfficiency: { value: "89%", trend: "+2.3%", isUp: true },
    activeRoutes: { value: "36", trend: "+2", isUp: true },
    avgCost: "Rp 5,1 M",
    dateRange: "Q1 2026 - Q4 2026"
};

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [viewMode, setViewMode] = useState<"Bulanan" | "Kuartalan">("Bulanan");

    const currentChartData = viewMode === "Bulanan" ? chartDataBulanan : chartDataKuartalan;
    const currentKpi = viewMode === "Bulanan" ? kpiDataBulanan : kpiDataKuartalan;

    useEffect(() => {
        const token = localStorage.getItem("truxos_token");
        const userData = localStorage.getItem("truxos_user");
        const tenantData = localStorage.getItem("truxos_tenant");

        if (!token || !userData || !tenantData) {
            router.push("/login");
            return;
        }

        setUser(JSON.parse(userData));
        setTenant(JSON.parse(tenantData));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("truxos_token");
        localStorage.removeItem("truxos_user");
        localStorage.removeItem("truxos_tenant");
        router.push("/login");
    };

    if (!user || !tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="px-4 sm:px-8 max-w-7xl w-full mx-auto py-8 font-sans text-slate-900">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Ringkasan Analisis Biaya
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        {currentKpi.dateRange}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
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
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${currentKpi.totalCost.isUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>
                            {currentKpi.totalCost.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {currentKpi.totalCost.trend}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{currentKpi.totalCost.value}</h2>
                        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                            TOTAL BIAYA ARMADA
                        </p>
                    </div>
                </div>

                {/* Card 2: Cost/KM */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${currentKpi.costPerKm.isUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>
                            {currentKpi.costPerKm.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {currentKpi.costPerKm.trend}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{currentKpi.costPerKm.value}</h2>
                        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                            BIAYA PER KM
                        </p>
                    </div>
                </div>

                {/* Card 3: Fuel Efficiency */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Fuel className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${currentKpi.fuelEfficiency.isUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>
                            {currentKpi.fuelEfficiency.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {currentKpi.fuelEfficiency.trend}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{currentKpi.fuelEfficiency.value}</h2>
                        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                            EFISIENSI BBM
                        </p>
                    </div>
                </div>

                {/* Card 4: Active Routes */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <RouteIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${currentKpi.activeRoutes.isUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>
                            {currentKpi.activeRoutes.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {currentKpi.activeRoutes.trend}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{currentKpi.activeRoutes.value}</h2>
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
                            Rata-rata: {currentKpi.avgCost}
                        </div>
                    </div>
                    <div className="h-72 w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={currentChartData}
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
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                    {currentChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={(viewMode === "Bulanan" && (index === 5 || index === 11)) || (viewMode === "Kuartalan" && index === 3) ? '#3b82f6' : '#cbd5e1'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">
                        Rincian Biaya
                    </h3>
                    <div className="flex-1 flex flex-col justify-between gap-5">
                        {/* Item 1 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-700">Bahan Bakar</span>
                                <span className="text-sm font-bold text-slate-900">Rp 813 Jt</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                            </div>
                        </div>

                        {/* Item 2 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-700">Perawatan</span>
                                <span className="text-sm font-bold text-slate-900">Rp 426 Jt</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
                            </div>
                        </div>

                        {/* Item 3 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-700">Asuransi</span>
                                <span className="text-sm font-bold text-slate-900">Rp 283 Jt</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '30%' }} />
                            </div>
                        </div>

                        {/* Item 4 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-700">Tol & Retribusi</span>
                                <span className="text-sm font-bold text-slate-900">Rp 181 Jt</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-700 rounded-full" style={{ width: '20%' }} />
                            </div>
                        </div>

                        {/* Item 5 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-700">Penyusutan</span>
                                <span className="text-sm font-bold text-slate-900">Rp 438 Jt</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-lime-500 rounded-full" style={{ width: '48%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
