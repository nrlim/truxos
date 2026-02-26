"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Menu,
    X,
    Truck,
    ArrowRight,
} from "lucide-react";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200">
            <div className="section-container">
                <div className="flex items-center justify-between h-16 sm:h-18">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-sm">
                            <Truck className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-surface-900 tracking-tight leading-none">
                                trux<span className="text-brand-600">OS</span>
                            </span>
                            <span className="text-[10px] font-medium text-surface-500 uppercase tracking-[0.15em] leading-none mt-0.5 hidden sm:block">
                                Biaya Armada
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        <a href="#features" className="btn-ghost text-sm">Fitur</a>
                        <a href="#preview" className="btn-ghost text-sm">Pratinjau</a>
                        <a href="#pricing" className="btn-ghost text-sm">Harga</a>
                    </div>

                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login" className="btn-ghost text-sm">
                            Masuk
                        </Link>
                        <Link href="/register" className="btn-primary text-sm !py-2.5 !px-5 !min-h-0">
                            Mulai Sekarang
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? (
                            <X className="w-5 h-5 text-surface-600" />
                        ) : (
                            <Menu className="w-5 h-5 text-surface-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 bg-white ${mobileOpen ? "max-h-80 opacity-100 border-b border-surface-200" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="section-container pb-6 pt-2 space-y-1">
                    <a
                        href="#features"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-3 text-surface-600 hover:text-surface-900 hover:bg-surface-50 rounded-xl transition-colors text-sm font-medium"
                    >
                        Fitur
                    </a>
                    <a
                        href="#preview"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-3 text-surface-600 hover:text-surface-900 hover:bg-surface-50 rounded-xl transition-colors text-sm font-medium"
                    >
                        Pratinjau
                    </a>
                    <a
                        href="#pricing"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-3 text-surface-600 hover:text-surface-900 hover:bg-surface-50 rounded-xl transition-colors text-sm font-medium"
                    >
                        Harga
                    </a>
                    <div className="pt-3 space-y-2">
                        <Link
                            href="/login"
                            className="btn-secondary w-full text-sm"
                            onClick={() => setMobileOpen(false)}
                        >
                            Masuk
                        </Link>
                        <Link
                            href="/register"
                            className="btn-primary w-full text-sm"
                            onClick={() => setMobileOpen(false)}
                        >
                            Mulai Sekarang
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
