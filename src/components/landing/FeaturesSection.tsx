import {
    BarChart3,
    ShieldCheck,
    Zap,
    Users,
    Calculator,
    LineChart,
} from "lucide-react";

const features = [
    {
        icon: Calculator,
        title: "Perhitungan Presisi",
        description:
            "Hitung biaya sebenarnya per kilometer termasuk BBM, tol, tenaga kerja, perawatan, dan penyusutan. Tidak ada detail yang terlewat.",
    },
    {
        icon: BarChart3,
        title: "Analitik Real-time",
        description:
            "Pantau performa armada dengan dasbor langsung. Identifikasi anomali biaya dan peluang penghematan secara instan.",
    },
    {
        icon: LineChart,
        title: "Wawasan Prediktif",
        description:
            "Gunakan data historis untuk memproyeksi biaya masa depan, merencanakan jadwal perawatan, dan mengoptimalkan keuntungan rute.",
    },
    {
        icon: Users,
        title: "Akses Multi-pengguna",
        description:
            "Atur tim dalam sistem yang sama. Pemilik, Admin, dan Staf masing-masing mendapatkan tampilan dan kontrol yang sesuai dengan perannya.",
    },
    {
        icon: ShieldCheck,
        title: "Keamanan Perusahaan",
        description:
            "Enkripsi setingkat bank, keamanan tingkat baris data, dan jejak audit. Data operasional Anda senantiasa terlindungi.",
    },
    {
        icon: Zap,
        title: "Setup Instan",
        description:
            "Buat organisasi Anda dan mulai pelacakan dalam waktu kurang dari dua menit. Tidak diperlukan instalasi sistem yang rumit.",
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" className="relative py-16 sm:py-24 lg:py-32">
            {/* Subtle background accent */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[300px] h-[500px] bg-brand-400/10 rounded-full blur-[120px]" />

            <div className="section-container relative z-10">
                {/* Section Header */}
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-surface-900 tracking-tight mb-4">
                        Dibuat untuk Operator Armada yang Mengutamakan Akurasi
                    </h2>
                    <p className="text-surface-600 text-sm sm:text-base max-w-xl mx-auto">
                        Setiap fitur dirancang untuk memberikan kejelasan ke mana uang Anda pergi
                        dan bagaimana cara mempertahankannya.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {features.map((feature, i) => (
                        <div
                            key={feature.title}
                            className="glass-card-hover bg-white p-5 sm:p-6 group"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4 transition-colors group-hover:bg-brand-100 shadow-sm">
                                <feature.icon className="w-5 h-5 text-brand-600" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-surface-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-surface-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
