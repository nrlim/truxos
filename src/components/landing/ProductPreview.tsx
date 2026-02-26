import {
    TrendingUp,
    TrendingDown,
    Fuel,
    Route,
    DollarSign,
    Gauge,
} from "lucide-react";

function StatCard({
    icon: Icon,
    label,
    value,
    change,
    positive,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    change: string;
    positive: boolean;
}) {
    return (
        <div className="glass-card p-4 sm:p-5 flex flex-col gap-2 bg-white">
            <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-brand-600" />
                </div>
                <div
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                >
                    {positive ? (
                        <TrendingUp className="w-3 h-3" />
                    ) : (
                        <TrendingDown className="w-3 h-3" />
                    )}
                    {change}
                </div>
            </div>
            <div className="mt-1">
                <p className="stat-value">{value}</p>
                <p className="stat-label mt-1">{label}</p>
            </div>
        </div>
    );
}

function MiniBarChart() {
    const data = [65, 45, 78, 52, 90, 68, 85, 72, 95, 60, 82, 74];
    const max = Math.max(...data);

    return (
        <div className="flex items-end gap-1.5 h-24 sm:h-32 w-full">
            {data.map((value, i) => (
                <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all duration-500 hover:opacity-80"
                    style={{
                        height: `${(value / max) * 100}%`,
                        background:
                            value > 70
                                ? "linear-gradient(to top, #36adf6, #0ea5e9)"
                                : "linear-gradient(to top, #cbd5e1, #94a3b8)",
                    }}
                />
            ))}
        </div>
    );
}

function CostBreakdownRow({
    label,
    amount,
    percentage,
    color,
}: {
    label: string;
    amount: string;
    percentage: number;
    color: string;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="text-surface-600 font-medium">{label}</span>
                <span className="font-mono font-semibold text-surface-900">{amount}</span>
            </div>
            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%`, background: color }}
                />
            </div>
        </div>
    );
}

export default function ProductPreview() {
    return (
        <section id="preview" className="relative py-16 sm:py-24 lg:py-32 bg-surface-50/50">
            <div className="section-container">
                {/* Section Header */}
                <div className="text-center mb-10 sm:mb-16">
                    <div className="badge-brand mb-4">
                        <Gauge className="w-3 h-3" />
                        Live Dashboard
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-surface-900 tracking-tight mb-4">
                        Intelijen Biaya dalam Sekilas
                    </h2>
                    <p className="text-surface-600 text-sm sm:text-base max-w-xl mx-auto">
                        Pantau pengeluaran armada secara real-time. Identifikasi anomali biaya sebelum
                        berdampak pada keuntungan akhir Anda.
                    </p>
                </div>

                {/* Dashboard Mockup */}
                <div className="max-w-5xl mx-auto">
                    <div className="glass-card p-3 sm:p-4 lg:p-6 border border-surface-200/80 shadow-2xl shadow-surface-300/30">
                        {/* Dashboard Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-surface-900">
                                    Ringkasan Analisis Biaya
                                </h3>
                                <p className="text-xs text-surface-500 mt-0.5 font-medium">
                                    Jan 2026 - Des 2026
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-200">
                                    Bulanan
                                </span>
                                <span className="px-3 py-1.5 bg-white text-surface-600 text-xs font-semibold rounded-lg border border-surface-200 shadow-sm">
                                    Kuartalan
                                </span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 sm:mb-6">
                            <StatCard
                                icon={DollarSign}
                                label="Total Biaya Armada"
                                value="Rp 2,15 M"
                                change="+12.4%"
                                positive={false}
                            />
                            <StatCard
                                icon={Route}
                                label="Biaya Per KM"
                                value="Rp 18.500"
                                change="-3.2%"
                                positive={true}
                            />
                            <StatCard
                                icon={Fuel}
                                label="Efisiensi BBM"
                                value="87%"
                                change="+5.1%"
                                positive={true}
                            />
                            <StatCard
                                icon={Gauge}
                                label="Rute Aktif"
                                value="34"
                                change="-2"
                                positive={false}
                            />
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
                            {/* Bar Chart */}
                            <div className="lg:col-span-3 glass-card p-4 sm:p-5 bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-surface-800">
                                        Tren Biaya Bulanan
                                    </h4>
                                    <span className="text-xs text-surface-500 font-mono bg-surface-50 px-2 py-1 rounded-md border border-surface-200">
                                        Rata-rata: Rp 179 Jt
                                    </span>
                                </div>
                                <MiniBarChart />
                                <div className="flex justify-between mt-2">
                                    <span className="text-[10px] sm:text-xs text-surface-500 font-mono font-medium">Jan</span>
                                    <span className="text-[10px] sm:text-xs text-surface-500 font-mono font-medium">Jun</span>
                                    <span className="text-[10px] sm:text-xs text-surface-500 font-mono font-medium">Des</span>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="lg:col-span-2 glass-card p-4 sm:p-5 bg-white">
                                <h4 className="text-sm font-bold text-surface-800 mb-4">
                                    Rincian Biaya
                                </h4>
                                <div className="space-y-4">
                                    <CostBreakdownRow
                                        label="Bahan Bakar"
                                        amount="Rp 813 Jt"
                                        percentage={72}
                                        color="#0ea5e9"
                                    />
                                    <CostBreakdownRow
                                        label="Perawatan"
                                        amount="Rp 426 Jt"
                                        percentage={48}
                                        color="#f59e0b"
                                    />
                                    <CostBreakdownRow
                                        label="Asuransi"
                                        amount="Rp 283 Jt"
                                        percentage={34}
                                        color="#10b981"
                                    />
                                    <CostBreakdownRow
                                        label="Tol & Retribusi"
                                        amount="Rp 181 Jt"
                                        percentage={22}
                                        color="#64748b"
                                    />
                                    <CostBreakdownRow
                                        label="Penyusutan"
                                        amount="Rp 438 Jt"
                                        percentage={52}
                                        color="#84cc16"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reflection / Glow effect */}
                    <div className="mt-4 h-16 sm:h-24 bg-gradient-to-b from-surface-200/50 to-transparent rounded-b-3xl blur-md" />
                </div>
            </div>
        </section>
    );
}
