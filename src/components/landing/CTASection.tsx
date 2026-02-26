import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
    return (
        <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden bg-brand-900">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-800 to-brand-950" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-500/20 rounded-full blur-[150px]" />

            <div className="section-container relative z-10">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
                        Siap Memantau Biaya Armada Anda Sesungguhnya?
                    </h2>
                    <p className="text-brand-100 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
                        Bergabunglah dengan operator armada yang telah meningkatkan margin keuntungan hingga 18%
                        dengan pelacakan biaya yang presisi. Setup memakan waktu kurang dari dua menit.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/register"
                            className="btn-primary w-full sm:w-auto text-base px-8 py-4 bg-white text-brand-700 hover:bg-surface-50 shadow-lg"
                        >
                            Buat Organisasi Anda
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/login" className="btn-ghost w-full sm:w-auto text-base text-brand-100 hover:bg-brand-800 hover:text-white">
                            Sudah punya akun?
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
