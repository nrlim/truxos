import { Truck } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-surface-200 bg-white">
            <div className="section-container py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center">
                            <Truck className="w-4 h-4 text-surface-600" />
                        </div>
                        <span className="text-sm font-bold text-surface-900">
                            trux<span className="text-brand-600">OS</span>
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-xs text-surface-600 font-medium">
                        <a href="#" className="hover:text-brand-600 transition-colors">
                            Privasi
                        </a>
                        <a href="#" className="hover:text-brand-600 transition-colors">
                            Syarat & Ketentuan
                        </a>
                        <a href="#" className="hover:text-brand-600 transition-colors">
                            Kontak
                        </a>
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-surface-500 font-medium">
                        2026 truxOS. Hak cipta dilindungi undang-undang.
                    </p>
                </div>
            </div>
        </footer>
    );
}
