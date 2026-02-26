import Link from "next/link";
import {
    ArrowRight,
    BarChart3,
    Shield,
    Zap,
} from "lucide-react";

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32">
            {/* Background Effects */}
            <div className="absolute inset-0">
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 animate-grid-pulse opacity-50"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />
                {/* Radial gradient */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-400/10 rounded-full blur-[100px]" />
            </div>

            <div className="section-container relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Headline */}
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.1] mb-5 sm:mb-6 animate-slide-up">
                        <span className="text-surface-900">Ketahui Tepat</span>
                        <br />
                        <span className="text-gradient">Biaya Operasional Anda</span>
                    </h1>

                    {/* Sub-headline */}
                    <p className="text-base sm:text-lg lg:text-xl text-surface-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-slide-up animate-delay-100">
                        Berhenti menebak. Mulai cetak untung. truxOS mengubah data operasional mentah
                        menjadi intelijen biaya yang dapat ditindaklanjuti—memberikan presisi yang dibutuhkan
                        oleh operator armada untuk memaksimalkan setiap rute.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up animate-delay-200">
                        <Link href="/register" className="btn-primary w-full sm:w-auto text-base px-8 py-4 shadow-md shadow-brand-500/20">
                            Coba Gratis
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="#preview" className="btn-secondary w-full sm:w-auto text-base px-8 py-4">
                            Lihat Aksinya
                        </a>
                    </div>

                    {/* Trust indicators */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-10 sm:mt-14 animate-fade-in animate-delay-300">
                        <div className="flex items-center gap-2 text-surface-600">
                            <Shield className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs sm:text-sm font-medium">Keamanan Perusahaan</span>
                        </div>
                        <div className="flex items-center gap-2 text-surface-600">
                            <BarChart3 className="w-4 h-4 text-brand-600" />
                            <span className="text-xs sm:text-sm font-medium">Analitik Real-time</span>
                        </div>
                        <div className="flex items-center gap-2 text-surface-600">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-xs sm:text-sm font-medium">Mudah Digunakan</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
