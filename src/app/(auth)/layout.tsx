import Link from "next/link";
import { Truck } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-surface-50">
            {/* Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                    }}
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 p-4 sm:p-6">
                <Link href="/" className="inline-flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-sm">
                        <Truck className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-surface-900 tracking-tight leading-none">
                            trux<span className="text-brand-600">OS</span>
                        </span>
                        <span className="text-[10px] font-medium text-surface-500 uppercase tracking-[0.15em] leading-none mt-0.5">
                            Biaya Armada
                        </span>
                    </div>
                </Link>
            </header>

            {/* Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                {children}
            </main>

            {/* Footer */}
            <footer className="relative z-10 p-4 sm:p-6 text-center">
                <p className="text-xs text-surface-500 font-medium">
                    2026 truxOS. Hak cipta dilindungi undang-undang.
                </p>
            </footer>
        </div>
    );
}
