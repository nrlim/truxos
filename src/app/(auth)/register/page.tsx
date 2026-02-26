"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    User,
    Lock,
    Building2,
    UserCircle,
    ArrowRight,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        companyName: "",
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);

    const passwordChecks = {
        length: form.password.length >= 8,
        hasUpper: /[A-Z]/.test(form.password),
        hasNumber: /[0-9]/.test(form.password),
    };

    const isPasswordValid =
        passwordChecks.length && passwordChecks.hasUpper && passwordChecks.hasNumber;

    const isStep1Valid = form.companyName.trim() !== "" && form.fullName.trim() !== "";
    const isStep2Valid =
        form.username.trim().length >= 3 &&
        isPasswordValid &&
        form.password === form.confirmPassword;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            if (isStep1Valid) setStep(2);
            return;
        }

        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Kata sandi tidak cocok.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyName: form.companyName,
                    fullName: form.fullName,
                    username: form.username,
                    password: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error === "Username is already taken." ? "Nama pengguna sudah dipakai." : data.error || "Pendaftaran gagal. Silakan coba lagi.");
                return;
            }

            // Store token
            localStorage.setItem("truxos_token", data.token);
            localStorage.setItem("truxos_user", JSON.stringify(data.user));
            localStorage.setItem("truxos_tenant", JSON.stringify(data.tenant));

            // Redirect to dashboard
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
                    <Building2 className="w-6 h-6 text-brand-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">
                    Buat Organisasi Anda
                </h1>
                <p className="text-sm text-surface-600 mt-2">
                    Siapkan ruang kerja dan akun admin Anda
                </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-brand-600 transition-all duration-300" />
                    <p className="text-[11px] font-bold text-brand-700 mt-1.5 uppercase tracking-wide">
                        1. Organisasi
                    </p>
                </div>
                <div className="flex-1">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? "bg-brand-600" : "bg-surface-200"
                            }`}
                    />
                    <p
                        className={`text-[11px] font-bold mt-1.5 uppercase tracking-wide transition-colors ${step === 2 ? "text-brand-700" : "text-surface-400"
                            }`}
                    >
                        2. Kredensial
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-5 bg-white">
                {error && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {step === 1 && (
                    <>
                        {/* Company Name */}
                        <div>
                            <label htmlFor="reg-company" className="input-label">
                                Nama Organisasi
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input
                                    id="reg-company"
                                    type="text"
                                    placeholder="Contoh: Falcon Logistics Inc."
                                    className="input-field pl-10"
                                    value={form.companyName}
                                    onChange={(e) =>
                                        setForm({ ...form, companyName: e.target.value })
                                    }
                                    required
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-surface-500 mt-1.5 font-medium">
                                Ini akan menjadi nama ruang kerja tim Anda
                            </p>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label htmlFor="reg-fullname" className="input-label">
                                Nama Lengkap Anda
                            </label>
                            <div className="relative">
                                <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input
                                    id="reg-fullname"
                                    type="text"
                                    placeholder="Contoh: Budi Santoso"
                                    className="input-field pl-10"
                                    value={form.fullName}
                                    onChange={(e) =>
                                        setForm({ ...form, fullName: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        {/* Next Step */}
                        <button
                            type="submit"
                            disabled={!isStep1Valid}
                            className="btn-primary w-full text-base mt-2 shadow-sm"
                        >
                            Lanjutkan
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        {/* Username */}
                        <div>
                            <label htmlFor="reg-username" className="input-label">
                                Nama Pengguna
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input
                                    id="reg-username"
                                    type="text"
                                    placeholder="Pilih nama pengguna (min. 3 kar)"
                                    className="input-field pl-10"
                                    value={form.username}
                                    onChange={(e) =>
                                        setForm({ ...form, username: e.target.value })
                                    }
                                    required
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    autoFocus
                                />
                            </div>
                            {form.username.length > 0 && form.username.length < 3 && (
                                <p className="input-error font-medium">Minimal 3 karakter diperlukan</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="reg-password" className="input-label">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input
                                    id="reg-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Buat kata sandi yang kuat"
                                    className="input-field pl-10 pr-11"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors p-0.5"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Password Requirements */}
                            {form.password.length > 0 && (
                                <div className="mt-2.5 space-y-1.5 p-3 bg-surface-50 rounded-lg border border-surface-100">
                                    <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wide mb-1">Syarat Kata Sandi:</p>
                                    {[
                                        { check: passwordChecks.length, label: "Minimal 8 karakter" },
                                        { check: passwordChecks.hasUpper, label: "Satu huruf besar (kapital)" },
                                        { check: passwordChecks.hasNumber, label: "Satu angka" },
                                    ].map((req) => (
                                        <div
                                            key={req.label}
                                            className="flex items-center gap-2 text-xs font-medium"
                                        >
                                            <CheckCircle2
                                                className={`w-3.5 h-3.5 ${req.check ? "text-emerald-500" : "text-surface-300"
                                                    }`}
                                            />
                                            <span
                                                className={
                                                    req.check ? "text-surface-900" : "text-surface-500"
                                                }
                                            >
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="reg-confirm" className="input-label">
                                Konfirmasi Kata Sandi
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input
                                    id="reg-confirm"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Masukkan ulang kata sandi"
                                    className="input-field pl-10"
                                    value={form.confirmPassword}
                                    onChange={(e) =>
                                        setForm({ ...form, confirmPassword: e.target.value })
                                    }
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            {form.confirmPassword.length > 0 &&
                                form.password !== form.confirmPassword && (
                                    <p className="input-error font-medium">Kata sandi tidak cocok</p>
                                )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 mt-4">
                            <button
                                type="submit"
                                disabled={loading || !isStep2Valid}
                                className="btn-primary w-full text-base shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Menyiapkan ruang kerja...
                                    </>
                                ) : (
                                    <>
                                        Selesaikan Pendaftaran
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="btn-ghost w-full text-sm mt-1"
                            >
                                Kembali ke Organisasi
                            </button>
                        </div>
                    </>
                )}
            </form>

            {/* Footer */}
            <p className="text-sm text-surface-600 text-center mt-6">
                Sudah punya akun?{" "}
                <Link
                    href="/login"
                    className="text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                >
                    Masuk di sini
                </Link>
            </p>
        </div>
    );
}
