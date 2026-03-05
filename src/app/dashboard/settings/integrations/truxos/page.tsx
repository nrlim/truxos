"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCircle2, AlertCircle, Save, ExternalLink, Activity, RefreshCw, Link2, Key, Lock, Settings2, Filter } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Remove hardcoded accounts, it will be fetched dynamically from our new API endpoint.

const OPERATIONAL_CATEGORIES = [
    { id: "BAHAN_BAKAR", label: "Bahan Bakar (BBM)" },
    { id: "TOL_PARKIR", label: "Tol & Parkir" },
    { id: "PERBAIKAN", label: "Perbaikan Kendaraan" },
    { id: "UANG_JALAN", label: "Uang Jalan / Sangu" },
];

export default function TruxosIntegrationSettings() {
    const router = useRouter();
    const [isEnabled, setIsEnabled] = useState(false);
    const [baseUrl, setBaseUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [apiSecret, setApiSecret] = useState("");
    const [queryType, setQueryType] = useState("ASSET,EXPENSE");
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [logs, setLogs] = useState<any[]>([]);

    // New states for the multi-step experience
    const [accounts, setAccounts] = useState<{ id: string, name: string }[]>([]);
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isRefreshingAccounts, setIsRefreshingAccounts] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const tenant = JSON.parse(localStorage.getItem("truxos_tenant") || "{}");
            if (!tenant.id) {
                router.push("/login");
                return;
            }

            const res = await fetch("/api/settings/integrations/truxos", {
                headers: { "x-tenant-id": tenant.id },
            });
            const data = await res.json();

            if (data.config) {
                setIsEnabled(data.config.isEnabled);
                setBaseUrl(data.config.baseUrl || "");
                setApiKey(data.config.apiKey || "");
                setApiSecret(data.config.apiSecret || "");

                const initialMappings = data.config.mappingJson ? JSON.parse(data.config.mappingJson) : {};
                setMappings(initialMappings);
                if (initialMappings._queryType) {
                    setQueryType(initialMappings._queryType);
                }

                // If we have credentials, immediately try to fetch accounts in background
                if (data.config.isEnabled && data.config.baseUrl && data.config.apiKey) {
                    fetchAccounts(tenant.id, initialMappings._queryType || "ASSET,EXPENSE");
                }
            }

            if (data.logs) {
                setLogs(data.logs);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAccounts = async (tenantId: string, query: string = queryType) => {
        try {
            const accRes = await fetch(`/api/settings/integrations/truxos/accounts?type=${query}`, {
                headers: { "x-tenant-id": tenantId },
            });
            const accData = await accRes.json();

            if (accRes.ok && accData.accounts) {
                setAccounts(accData.accounts);
                setIsVerified(true);
            }
        } catch (e) {
            console.error(e);
        }
    }

    const handleToggleEnabled = async () => {
        const newState = !isEnabled;
        setIsEnabled(newState);

        try {
            const tenant = JSON.parse(localStorage.getItem("truxos_tenant") || "{}");
            await fetch("/api/settings/integrations/truxos", {
                method: "POST",
                headers: {
                    "x-tenant-id": tenant.id,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isEnabled: newState,
                    baseUrl,
                    apiKey,
                    apiSecret,
                    mappingJson: { ...mappings, _queryType: queryType },
                }),
            });
            if (!newState) {
                // Remove accounts state when turned off to clean UI
                setIsVerified(false);
                setAccounts([]);
            }
        } catch (e) {
            console.error("Gagal sinkronisasi status toggle:", e);
        }
    };

    const handleRefreshAccounts = async () => {
        setIsRefreshingAccounts(true);
        try {
            const tenant = JSON.parse(localStorage.getItem("truxos_tenant") || "{}");
            const accRes = await fetch(`/api/settings/integrations/truxos/accounts?type=${queryType}`, {
                headers: { "x-tenant-id": tenant.id },
            });
            const accData = await accRes.json();

            if (accRes.ok && accData.accounts) {
                setAccounts(accData.accounts);
                setMessage({ text: "Daftar akun berhasil diperbarui.", type: "success" });
            } else {
                setMessage({ text: accData.error || "Gagal memperbarui akun.", type: "error" });
            }
        } catch (e) {
            setMessage({ text: "Terjadi kesalahan saat memperbarui akun.", type: "error" });
        } finally {
            setIsRefreshingAccounts(false);
        }
    };

    const handleConnect = async () => {
        setIsVerifying(true);
        setMessage({ text: "", type: "" });

        try {
            const tenant = JSON.parse(localStorage.getItem("truxos_tenant") || "{}");
            const res = await fetch("/api/settings/integrations/truxos", {
                method: "POST",
                headers: {
                    "x-tenant-id": tenant.id,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isEnabled,
                    baseUrl,
                    apiKey,
                    apiSecret,
                    mappingJson: { ...mappings, _queryType: queryType },
                }),
            });

            if (!res.ok) {
                setMessage({ text: "Gagal menyimpan kredensial pengaturan", type: "error" });
                setIsVerifying(false);
                return;
            }

            // After saving config, we verify using the new /verify endpoint
            const verifyRes = await fetch("/api/settings/integrations/truxos/verify", {
                headers: { "x-tenant-id": tenant.id },
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
                setIsVerified(true);
                setMessage({ text: "Koneksi berhasil! Silakan atur pemetaan akun di bawah.", type: "success" });
                // Automatically fetch accounts so they appear in dropdowns right away
                fetchAccounts(tenant.id, queryType);
            } else {
                setMessage({ text: verifyData.error || "Gagal memverifikasi API. Cek kredensial Anda.", type: "error" });
                setIsVerified(false);
            }
        } catch (err) {
            setMessage({ text: "Koneksi ke server gagal", type: "error" });
        } finally {
            setIsVerifying(false);
            setIsSaving(false);
        }
    };

    const handleSaveMappings = async () => {
        setIsSaving(true);
        setMessage({ text: "", type: "" });

        try {
            const tenant = JSON.parse(localStorage.getItem("truxos_tenant") || "{}");
            const res = await fetch("/api/settings/integrations/truxos", {
                method: "POST",
                headers: {
                    "x-tenant-id": tenant.id,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isEnabled,
                    baseUrl,
                    apiKey,
                    apiSecret,
                    mappingJson: { ...mappings, _queryType: queryType },
                }),
            });

            if (res.ok) {
                setMessage({ text: "Pemetaan akun dan konfigurasi berhasil disimpan", type: "success" });
            } else {
                setMessage({ text: "Gagal menyimpan pemetaan", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Terjadi kesalahan", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const copyCredential = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center p-8 bg-slate-50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="px-4 sm:px-8 max-w-7xl w-full mx-auto py-8 font-sans text-slate-900">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Integrasi TruXos <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">v1.2</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium max-w-2xl leading-relaxed">
                        Hubungkan TruXos dengan sistem pencatatan Anda untuk sinkronisasi biaya operasional secara otomatis.
                        Dengan mengaktifkan integrasi ini, seluruh manifest dan biaya perjalanan akan diproses secara real-time.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <a
                        href="https://accuwrite.vercel.app/api-docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-colors bg-slate-900 border border-transparent text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 shadow-sm"
                    >
                        Panduan Teknis API
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    </a>
                </div>
            </div>

            <div className="space-y-6">

                {/* Configuration Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">

                    {/* Master Switch */}
                    <div className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-slate-900">Aktifkan Integrasi TruXos</h2>
                            <p className="text-sm text-slate-500">
                                Jika OFF, semua request API dari TruXos ke Accuwrite akan ditolak dengan error 403.
                            </p>
                        </div>
                        <button
                            onClick={handleToggleEnabled}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${isEnabled ? 'bg-blue-600' : 'bg-slate-200'
                                }`}
                        >
                            <span className="sr-only">Toggle Integrasi</span>
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Credentials Section */}
                    <div className={`p-6 transition-all duration-300 ${!isEnabled ? "opacity-40 grayscale pointer-events-none" : ""}`}>
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold font-mono">1</span>
                            <h2 className="text-base font-semibold text-slate-900">Kredensial API Accuwrite</h2>
                        </div>
                        <div className="space-y-4 ml-0 sm:ml-9">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Base URL Integrasi</label>
                                <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                                    <div className="flex items-center justify-center pl-3">
                                        <Link2 className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="https://accuwrite.vercel.app"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrl(e.target.value)}
                                        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none w-full"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Contoh: https://accuwrite.vercel.app</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">API Key</label>
                                    <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                                        <div className="flex items-center justify-center pl-3">
                                            <Key className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="sk_test_..."
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none w-full"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">API Secret</label>
                                    <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                                        <div className="flex items-center justify-center pl-3">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="••••••••••••••••"
                                            value={apiSecret}
                                            onChange={(e) => setApiSecret(e.target.value)}
                                            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={handleConnect}
                                    disabled={isVerifying}
                                    className="inline-flex flex-1 md:flex-none w-full md:w-auto items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold transition-colors bg-slate-900 border border-transparent text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isVerifying ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Activity className="w-4 h-4" />
                                    )}
                                    Verifikasi & Hubungkan API
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mapping Configuration (Rendered conditionally) */}
                    <div className={`transition-all duration-500 overflow-hidden ${isVerified ? "opacity-100 max-h-[1000px]" : "opacity-30 max-h-[100px] pointer-events-none grayscale"}`}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold font-mono">2</span>
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900 mt-0.5">Pemetaan Chart of Accounts</h2>
                                        <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">Sesuaikan kategori operasional TruXos dengan akun Bank / Kas yang terdeteksi dari integrasi real-time.</p>
                                    </div>
                                </div>
                                {isVerified && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleRefreshAccounts}
                                            disabled={isRefreshingAccounts}
                                            className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
                                            title="Refresh Akun"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isRefreshingAccounts ? "animate-spin" : ""}`} />
                                        </button>
                                        <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Connected
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 ml-0 sm:ml-9 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1 w-full sm:w-1/2">
                                        <label className="text-sm font-medium text-slate-800">Tipe Akun & Query Builder</label>
                                        <p className="text-xs text-slate-500 leading-relaxed">Tentukan tipe akun yang akan ditarik dari sistem pusat untuk dipetakan ke kotak dropdown di bawah. Setelah mengubah ini, Anda dapat menyimpannya untuk keperluan mendatang.</p>
                                    </div>
                                    <div className="w-full sm:w-1/2">
                                        <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm">
                                            <div className="flex items-center justify-center pl-3">
                                                <Filter className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <select
                                                value={queryType}
                                                onChange={(e) => {
                                                    setQueryType(e.target.value);
                                                    if (isVerified) {
                                                        const tenant = JSON.parse(localStorage.getItem("truxos_tenant") || "{}");
                                                        fetchAccounts(tenant.id, e.target.value);
                                                    }
                                                }}
                                                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none w-full cursor-pointer"
                                            >
                                                <option value="ASSET,EXPENSE">Hanya Asset & Expense (Rekomendasi)</option>
                                                <option value="ASSET">Hanya Asset (Kas / Bank)</option>
                                                <option value="EXPENSE">Hanya Expense (Biaya)</option>
                                                <option value="ALL">Semua Tipe Akun</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 ml-0 sm:ml-9">
                                {OPERATIONAL_CATEGORIES.map((category) => (
                                    <div key={category.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-3 w-1/3">
                                            <div className="p-2 bg-white rounded shadow-sm border border-slate-100">
                                                <Settings2 className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">
                                                {category.label}
                                            </span>
                                        </div>
                                        <div className="w-full sm:w-2/3">
                                            <select
                                                value={mappings[category.id] || ""}
                                                onChange={(e) => setMappings({ ...mappings, [category.id]: e.target.value })}
                                                className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all shadow-sm"
                                            >
                                                <option value="">-- Pilih Akun (COA) --</option>
                                                {accounts.map((acc) => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-4 bg-slate-50 rounded-b-xl flex items-center justify-between border-t border-slate-100">
                            {message.text ? (
                                <div className={`flex items-center gap-2 text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {message.text}
                                </div>
                            ) : <div />}
                            <button
                                onClick={handleSaveMappings}
                                disabled={isSaving || !isVerified || !isEnabled}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors bg-blue-600 border border-transparent text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Simpan Pemetaan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logging & Monitoring Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-slate-500" />
                        <h2 className="text-base font-semibold text-slate-900">Riwayat Transaksi TruXos Terbaru</h2>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Waktu</th>
                                    <th scope="col" className="px-4 py-3">Endpoint</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Payload Preview</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{log.endpoint}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${log.status === 200 || log.status === 201
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 w-1/2">
                                                <div className="truncate max-w-xs font-mono text-[11px] text-slate-400">
                                                    {log.payload || "-"}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                            Belum ada riwayat transaksi.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
