"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    User,
    Lock,
    ArrowRight,
    LogIn,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error === "Invalid credentials." ? "Kredensial tidak valid." : data.error || "Gagal masuk. Silakan coba lagi.");
                return;
            }

            // Store token
            localStorage.setItem("truxos_token", data.token);
            localStorage.setItem("truxos_user", JSON.stringify(data.user));
            localStorage.setItem("truxos_tenant", JSON.stringify(data.tenant));

            // Redirect to workspace
            router.push(`/dashboard`);
        } catch {
            setError("Tidak dapat terhubung. Periksa koneksi Anda.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <LogIn className="w-6 h-6 text-brand-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">
                    Selamat Datang Kembali
                </h1>
                <p className="text-sm text-surface-600 mt-2">
                    Masuk ke ruang kerja truxOS Anda
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-5 bg-white">
                {error && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Username */}
                <div>
                    <label htmlFor="login-username" className="input-label">
                        Nama Pengguna
                    </label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            id="login-username"
                            type="text"
                            placeholder="Masukkan nama pengguna Anda"
                            className="input-field pl-10"
                            value={form.username}
                            onChange={(e) =>
                                setForm({ ...form, username: e.target.value })
                            }
                            required
                            autoComplete="username"
                            autoCapitalize="none"
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="login-password" className="input-label">
                        Kata Sandi
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan kata sandi Anda"
                            className="input-field pl-10 pr-11"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                            required
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors p-0.5"
                            tabIndex={-1}
                            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full text-base mt-2 shadow-sm"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Masuk...
                        </>
                    ) : (
                        <>
                            Masuk
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Footer */}
            <p className="text-sm text-surface-600 text-center mt-6">
                Baru di truxOS?{" "}
                <Link
                    href="/register"
                    className="text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                >
                    Buat organisasi baru
                </Link>
            </p>
        </div>
    );
}
