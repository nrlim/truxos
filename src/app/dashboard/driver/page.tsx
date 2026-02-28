"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Truck, MapPin, Navigation, Map, PackageCheck, Fuel, CreditCard, Camera, Loader2, Plus, X, Circle, Banknote, Receipt, MessageSquare, AlertCircle, RotateCcw, RefreshCw
} from "lucide-react";
import { useNotification } from "@/components/ui/notification-provider";
import { getActiveDriverManifest, completeDriverManifest } from "@/actions/driver";
import { uploadExpenseAttachment, deleteExpenseAttachment } from "@/actions/upload";
import { resizeImage } from "@/lib/image-utils";
import { getGoogleMapsUrl } from "@/lib/maps";
import { motion, AnimatePresence } from "framer-motion";

export default function DriverDashboardPage() {
    const notify = useNotification();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [manifest, setManifest] = useState<any>(null);
    const [revisions, setRevisions] = useState<any[]>([]);
    const [driverId, setDriverId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"AKTIF" | "REVISI">("AKTIF");

    // Drawer state
    const [drawerManifest, setDrawerManifest] = useState<any>(null);

    useEffect(() => {
        fetchActiveManifest(true);
        // Polling loop for new tasks
        const intervalId = setInterval(() => {
            fetchActiveManifest(false);
        }, 60000); // Check every 60s

        return () => clearInterval(intervalId);
    }, []);

    async function fetchActiveManifest(isInitial = false) {
        try {
            const token = localStorage.getItem("truxos_token");
            const userDataStr = localStorage.getItem("truxos_user");

            if (!token || !userDataStr) {
                router.push("/login");
                return;
            }

            const userData = JSON.parse(userDataStr);

            if (userData.role !== "DRIVER" || !userData.driverId) {
                router.push("/dashboard");
                return;
            }

            const res = await getActiveDriverManifest(userData.id);
            if (res.error) {
                if (isInitial) notify.error(res.error);
                if (isInitial) setLoading(false);
                return;
            }

            // Detect new assignment
            if (!manifest && res.data) {
                if (!isInitial) {
                    notify.success("Tugas Baru Ditetapkan: Anda mendapatkan surat jalan baru untuk perjalanan.");
                }
            }

            setManifest(res.data);
            setRevisions(res.revisions || []);
            setDriverId(res.driverId || "");
        } catch (error) {
            if (isInitial) notify.error("Gagal memuat tugas driver");
        } finally {
            if (isInitial) setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-screen">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }



    const currentBaseDist = manifest?.route?.baseDistanceKm || 0;
    const additionalDist = manifest?.additionalDistanceKm || 0;
    const initialOdo = manifest?.truck?.currentOdometer || 0;

    const handleNavigation = () => {
        if (!manifest) return;
        const url = getGoogleMapsUrl(manifest.route.originCoords, manifest.route.destinationCoords);
        if (url) {
            window.open(url, "_blank");
        } else {
            notify.error("Koordinat rute belum diset oleh admin secara lengkap");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-100 pb-32 font-sans max-w-2xl mx-auto w-full relative">
            {/* TABS Navigation */}
            <div className="bg-white border-b border-slate-200 px-5 pt-4 sticky top-0 z-40 shadow-sm flex items-center justify-between">
                <div className="flex gap-4 flex-1">
                    <button
                        onClick={() => setActiveTab("AKTIF")}
                        className={`pb-4 font-bold text-sm tracking-wide border-b-[3px] transition-colors flex-[1.2] ${activeTab === "AKTIF" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Dalam Perjalanan
                    </button>
                    <button
                        onClick={() => setActiveTab("REVISI")}
                        className={`pb-4 font-bold text-sm tracking-wide border-b-[3px] transition-colors relative flex-1 ${activeTab === "REVISI" ? "border-amber-600 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Perlu Revisi {revisions.length > 0 && `(${revisions.length})`}
                        {revisions.length > 0 && (
                            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse ring-4 ring-amber-100" />
                        )}
                    </button>
                </div>
                <button
                    onClick={() => {
                        notify.success("Memperbarui data tugas...");
                        fetchActiveManifest(false);
                    }}
                    className="pb-4 text-slate-400 hover:text-blue-600 transition-colors ml-2 active:scale-95 flex items-center justify-center shrink-0"
                    aria-label="Refresh Tugas"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {activeTab === "REVISI" && (
                revisions.length > 0 ? (
                    <div className="px-5 pt-6 pb-2 relative z-20">
                        <div className="space-y-4">
                            {revisions.map((rev) => (
                                <div key={rev.id} className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-lg shadow-amber-100/50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{rev.route?.origin} &rarr; {rev.route?.destination}</p>
                                            <h3 className="text-xl font-black text-slate-900">{rev.manifestNumber}</h3>
                                        </div>
                                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase border border-amber-200">Revisi</span>
                                    </div>
                                    <button
                                        onClick={() => setDrawerManifest(rev)}
                                        className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-amber-500/20"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        PERBAIKI BIAYA SEKARANG
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 mt-12 relative font-sans">
                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-slate-200 mb-8 border border-slate-100">
                            <PackageCheck className="w-10 h-10 text-slate-400" />
                        </div>
                        <div className="text-center space-y-3 mb-12 max-w-sm">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">TIDAK ADA REVISI</h2>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Semua catatan pengeluaran Anda sudah tepat. Tidak ada surat jalan yang perlu diperbaiki.</p>
                        </div>
                    </div>
                )
            )}

            {activeTab === "AKTIF" && (
                manifest ? (
                    <>
                        {/* Header Section */}
                        <div className="bg-slate-900 px-6 pt-10 pb-12 text-white rounded-b-[2.5rem] shadow-md relative z-10 w-full">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Tugas Aktif</p>
                                    <h1 className="text-3xl font-black tracking-tight">{manifest.manifestNumber}</h1>
                                </div>
                                {/* Status Badge */}
                                {manifest.status === "REVISION_REQUIRED" ? (
                                    <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 rounded-full shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                                        <span className="text-amber-300 text-xs font-bold tracking-wider">BUTUH PERBAIKAN</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 rounded-full shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                                        <span className="text-blue-300 text-xs font-bold tracking-wider">DALAM PERJALANAN</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700">
                                    <Truck className="w-5 h-5 text-slate-300" />
                                    <span className="font-bold text-base tracking-widest">{manifest.truck.licensePlate}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700">
                                    <span className="font-bold text-base text-slate-300 uppercase">{manifest.truck?.type || "TRONTON"}</span>
                                </div>
                            </div>
                        </div>

                        {/* General Revision Message */}
                        {manifest.status === "REVISION_REQUIRED" && manifest.comments?.some((c: any) => c.type === "GENERAL") && (
                            <div className="px-5 -mt-4 relative z-20 mb-3">
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full opacity-50 pointer-events-none" />
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 shrink-0">
                                            <MessageSquare className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="w-full">
                                            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Catatan Revisi Admin</h4>
                                            <div className="space-y-3">
                                                {manifest.comments.filter((c: any) => c.type === "GENERAL").map((c: any, i: number) => (
                                                    <div key={i} className="text-sm font-medium text-amber-900 bg-white p-3 rounded-xl border border-amber-100 shadow-sm relative">
                                                        <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-amber-100 rotate-45" />
                                                        {c.content}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Task Card */}
                        <div className={`px-5 ${manifest.status === "REVISION_REQUIRED" ? "" : "-mt-8"} relative z-20`}>
                            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 mb-5">
                                {/* Timeline */}
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center w-8 shrink-0 py-1">
                                        <Circle className="w-6 h-6 text-slate-300 stroke-[3]" />
                                        <div className="w-1 bg-slate-100 my-2 flex-1 rounded-full relative overflow-hidden">
                                            <div className="absolute top-0 bottom-0 left-0 right-0 animate-[shimmer_2s_infinite] bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
                                        </div>
                                        <MapPin className="w-7 h-7 text-blue-600 fill-blue-50" />
                                    </div>
                                    <div className="flex-1 space-y-8 py-1">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Titik Muat</p>
                                            <p className="font-black text-slate-900 text-xl leading-tight">{manifest.route.origin}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tujuan Akhir</p>
                                            <p className="font-black text-slate-900 text-xl leading-tight">{manifest.route.destination}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Action */}
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <button
                                        onClick={handleNavigation}
                                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-5 px-6 rounded-2xl shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all"
                                    >
                                        <Map className="w-6 h-6" />
                                        MULAI NAVIGASI
                                    </button>
                                </div>
                            </div>

                            {/* Data Proportion Grid (2x2) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Navigation className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Jarak Tempuh</p>
                                        <p className="font-black text-xl text-slate-900 mt-0.5">{currentBaseDist + additionalDist} <span className="text-sm font-bold text-slate-500">KM</span></p>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Fuel className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Est. BBM</p>
                                        <p className="font-black text-xl text-slate-900 mt-0.5">{Math.round((currentBaseDist + additionalDist) / 3)} <span className="text-sm font-bold text-slate-500">L</span></p>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Receipt className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Gerbang Tol</p>
                                        <p className="font-black text-xl text-slate-900 mt-0.5">{manifest.route?.tolls?.length || 0} <span className="text-sm font-bold text-slate-500">GTS</span></p>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Banknote className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Uang Jalan</p>
                                        <p className="font-black text-lg text-slate-900 mt-0.5">{(manifest.uangJalan || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).replace('Rp', 'Rp ')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FAB / Bottom Dock */}
                        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-md border-t border-slate-200 z-30 pb-safe pointer-events-none">
                            <div className="max-w-2xl mx-auto flex items-center gap-4 pointer-events-auto">
                                {/* Floating Add Expense Button alongside completion */}
                                <button
                                    onClick={() => setDrawerManifest(manifest)}
                                    className="w-16 h-16 shrink-0 flex justify-center items-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 active:scale-[0.98] transition-all shadow-sm"
                                    aria-label="Tambah Pengeluaran"
                                >
                                    <Plus className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={() => setDrawerManifest(manifest)}
                                    className="flex-1 flex justify-center items-center gap-3 bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 text-white font-black text-lg h-16 px-6 rounded-2xl shadow-xl active:scale-[0.98] transition-all"
                                >
                                    <PackageCheck className="w-6 h-6" />
                                    SELESAIKAN TUGAS
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 mt-20 relative font-sans">
                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-slate-200 mb-8 border border-slate-100">
                            <Truck className="w-10 h-10 text-slate-400" />
                        </div>
                        <div className="text-center space-y-3 max-w-sm">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">TIDAK ADA TUGAS</h2>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Saat ini Anda tidak memiliki Surat Jalan yang aktif. Tunggu instruksi pemuatan selanjutnya dari admin.</p>
                        </div>
                        <button
                            onClick={() => notify.success("Riwayat perjalanan dalam pengembangan")}
                            className="mt-12 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                        >
                            LIHAT RIWAYAT
                        </button>
                    </div>
                )
            )}

            {/* Full Drawer / Modal form */}
            <CompletionExpenseDrawer
                isOpen={!!drawerManifest}
                onClose={() => setDrawerManifest(null)}
                manifestId={drawerManifest?.id}
                driverId={driverId}
                initialOdo={drawerManifest?.truck?.currentOdometer || 0}
                totalDist={(drawerManifest?.route?.baseDistanceKm || 0) + (drawerManifest?.additionalDistanceKm || 0)}
                existingExpenses={drawerManifest?.expenses || []}
                comments={drawerManifest?.comments || []}
                status={drawerManifest?.status}
                onSuccess={() => {
                    setDrawerManifest(null);
                    fetchActiveManifest();
                }}
            />

            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .pb-safe {
                    padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
                }
            `}</style>
        </div>
    );
}

function CompletionExpenseDrawer({ isOpen, onClose, manifestId, driverId, initialOdo, totalDist, existingExpenses = [], comments = [], status, onSuccess }: any) {
    const notify = useNotification();
    const [actualOdometer, setActualOdometer] = useState<number | string>(status === "REVISION_REQUIRED" ? initialOdo : initialOdo + totalDist);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (isOpen && !hasInitialized) {
            setExpenses(existingExpenses.map((e: any) => ({
                id: e.id || Date.now() + Math.random(),
                category: e.category,
                amount: Number(e.amount),
                notes: e.notes || "",
                attachmentUrl: e.attachment,
                attachmentFileName: e.attachment ? "Lampiran Sebelumnya" : null
            })));
            setActualOdometer(status === "REVISION_REQUIRED" ? initialOdo : initialOdo + totalDist);
            setHasInitialized(true);
        } else if (!isOpen) {
            // Optional reset when closing
            setActualOdometer(status === "REVISION_REQUIRED" ? initialOdo : initialOdo + totalDist);
            setHasInitialized(false);
        }
    }, [isOpen, hasInitialized, existingExpenses, initialOdo, totalDist, status]);

    // Form Expense
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
    const [expCategory, setExpCategory] = useState("LAIN_LAIN");
    const [expAmount, setExpAmount] = useState("");
    const [expNotes, setExpNotes] = useState("");
    const [expAttachment, setExpAttachment] = useState<File | null>(null);

    const handleAddExpense = async () => {
        if (!expAmount || isNaN(Number(expAmount))) {
            notify.error("Jumlah tidak valid");
            return;
        }

        let attachmentUrl = null;
        let attachmentFileName = null;

        if (expAttachment) {
            try {
                setIsSubmittingExpense(true);
                const compressedFile = await resizeImage(expAttachment, 0.5);
                const formData = new FormData();
                formData.append("file", compressedFile);

                const res = await uploadExpenseAttachment(formData);
                if (res.error) throw new Error(res.error);

                attachmentUrl = res.url;
                attachmentFileName = expAttachment.name;
            } catch (e: any) {
                notify.error(e.message || "Gagal mengunggah foto kwitansi");
                setIsSubmittingExpense(false);
                return;
            } finally {
                setIsSubmittingExpense(false);
            }
        }

        setExpenses([...expenses, {
            id: Date.now(),
            category: expCategory,
            amount: Number(expAmount),
            notes: expNotes,
            attachmentFileName,
            attachmentUrl
        }]);
        setExpCategory("LAIN_LAIN");
        setExpAmount("");
        setExpNotes("");
        setExpAttachment(null);
        setIsAddingExpense(false);
    };

    const handleRemoveExpense = async (id: number) => {
        const expenseToRemove = expenses.find(e => e.id === id);

        if (expenseToRemove && expenseToRemove.attachmentUrl) {
            try {
                await deleteExpenseAttachment(expenseToRemove.attachmentUrl);
            } catch (e) {
                console.error("Failed to delete attachment:", e);
            }
        }

        setExpenses(expenses.filter(e => e.id !== id));
    };

    const handleComplete = async () => {
        const odoValue = Number(actualOdometer);
        if (odoValue < initialOdo) {
            notify.error("Odometer tidak boleh lebih kecil dari sebelumnya");
            return;
        }

        try {
            setIsSubmitting(true);
            const tenantStr = localStorage.getItem("truxos_tenant");
            const tenant = JSON.parse(tenantStr || "{}");
            if (!tenant.id) throw new Error("Tenant Not Found");

            const res = await completeDriverManifest(manifestId, tenant.id, odoValue, driverId, expenses);
            if (res.error) {
                notify.error(res.error);
            } else {
                notify.success("Data Operasional Selesai Dikirim ke Kantor");
                onSuccess();
            }
        } catch (e) {
            notify.error("Gagal menyelsaikan perjalanan");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
                    />

                    {/* Bottom Sheet Drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-x-0 bottom-0 z-50 bg-slate-100 flex flex-col font-sans overflow-hidden rounded-t-[2.5rem] h-[90vh] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] max-w-2xl mx-auto"
                    >
                        {/* Drag Handle & Header */}
                        <div className="bg-white border-b border-slate-200 pt-3 pb-4 px-6 shrink-0 rounded-t-[2.5rem]">
                            <div className="w-14 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                                        {status === "REVISION_REQUIRED" ? (
                                            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1.5 w-max animate-pulse shadow-sm">
                                                <AlertCircle className="w-3 h-3" />
                                                REVISI DIPERLUKAN
                                            </span>
                                        ) : "Penyelesaian Tugas"}
                                    </p>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Post-Trip & Biaya</h2>
                                </div>
                                <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content Scroll */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-40">
                            {/* Odometer Section */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                                        <Truck className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base uppercase tracking-wider">Odometer Akhir</h3>
                                        <p className="text-sm font-semibold text-slate-500 mt-0.5">Wajib Diisi (Min: {initialOdo} KM)</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={actualOdometer}
                                        onChange={(e) => setActualOdometer(e.target.value)}
                                        className="w-full pl-6 pr-16 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-black text-2xl text-slate-900"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                                        KM
                                    </span>
                                </div>
                            </div>

                            {/* Additional Expenses */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                                            <CreditCard className="w-6 h-6 text-slate-700" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-base uppercase tracking-wider">Biaya Tambahan</h3>
                                            <p className="text-sm font-semibold text-slate-500 mt-0.5">Opsional (Opsional)</p>
                                        </div>
                                    </div>
                                    {!isAddingExpense && (
                                        <button
                                            onClick={() => setIsAddingExpense(true)}
                                            className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all shadow-md"
                                        >
                                            <Plus className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>

                                {/* Add Expense Form */}
                                {isAddingExpense && (
                                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-5 pt-5 mb-4 mt-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Kategori</label>
                                            <select
                                                value={expCategory}
                                                onChange={(e) => setExpCategory(e.target.value)}
                                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 text-base"
                                            >
                                                <option value="PERBAIKAN">Perbaikan / Sparepart</option>
                                                <option value="PARKIR">Parkir / Mel) / Timbangan</option>
                                                <option value="DARURAT">Darurat (Ban Bocor, dll)</option>
                                                <option value="PUNGLI">Pungli / Koordinasi</option>
                                                <option value="LAIN_LAIN">Lain-lain</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Jumlah (Rp)</label>
                                            <input
                                                type="number"
                                                value={expAmount}
                                                onChange={(e) => setExpAmount(e.target.value)}
                                                placeholder="Contoh: 50000"
                                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-black text-xl text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Catatan Singkat</label>
                                            <input
                                                type="text"
                                                value={expNotes}
                                                onChange={(e) => setExpNotes(e.target.value)}
                                                placeholder="Penjelasan..."
                                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-base text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Lampiran Kwitansi / Foto</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    onChange={(e) => setExpAttachment(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="w-full px-5 py-4 bg-white border-2 border-slate-200 border-dashed rounded-xl flex items-center justify-center gap-3 text-slate-500 font-bold text-base transition-colors hover:bg-slate-50">
                                                    <Camera className="w-5 h-5 text-slate-400" />
                                                    <span className="truncate">{expAttachment ? expAttachment.name : "Ambil Foto Kwitansi"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={() => setIsAddingExpense(false)}
                                                disabled={isSubmittingExpense}
                                                className="flex-1 py-4 font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors text-base disabled:opacity-50"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleAddExpense}
                                                disabled={isSubmittingExpense}
                                                className="flex-[2] py-4 flex justify-center items-center gap-2 font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl active:scale-[0.98] transition-all text-base disabled:opacity-50 shadow-lg shadow-blue-600/20"
                                            >
                                                {isSubmittingExpense && <Loader2 className="w-5 h-5 animate-spin" />}
                                                Simpan Biaya
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* List Expenses */}
                                {expenses.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        {expenses.map((exp) => {
                                            const expComment = comments.find((c: any) => c.type === "EXPENSE_SPECIFIC" && c.expenseId === exp.id);
                                            return (
                                                <div key={exp.id} className={`p-5 ${expComment ? 'bg-rose-50/20 border-rose-400 ring-4 ring-rose-100 shadow-md transform scale-[1.01]' : 'bg-slate-50 border-slate-200'} rounded-2xl border flex flex-col gap-3 group transition-all relative`}>
                                                    {expComment && (
                                                        <div className="absolute -top-3 -right-2 transform rotate-12 bg-rose-600 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-lg border-2 border-white animate-pulse">
                                                            DITOLAK
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-start">
                                                        <div className="min-w-0">
                                                            <p className={`font-bold ${expComment ? 'text-rose-800' : 'text-slate-900'} text-sm uppercase`}>{exp.category}</p>
                                                            <p className="font-black text-slate-900 text-xl mt-1">Rp {exp.amount.toLocaleString('id-ID')}</p>
                                                            {exp.notes && <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-1">{exp.notes}</p>}
                                                            {exp.attachmentFileName && (
                                                                exp.attachmentUrl ? (
                                                                    <a href={exp.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-2 text-blue-600 hover:text-blue-700 text-xs font-bold bg-blue-50 px-2 py-1 rounded w-fit hover:underline">
                                                                        <Camera className="w-3.5 h-3.5" />
                                                                        <span className="truncate max-w-[160px]">{exp.attachmentFileName}</span>
                                                                    </a>
                                                                ) : (
                                                                    <div className="flex items-center gap-1.5 mt-2 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded w-fit">
                                                                        <Camera className="w-3.5 h-3.5" />
                                                                        <span className="truncate max-w-[160px]">{exp.attachmentFileName}</span>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveExpense(exp.id)}
                                                            className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-sm ${expComment ? 'bg-rose-100 text-rose-600 border border-rose-300 animate-[pulse_2s_infinite]' : 'bg-white text-slate-400 border border-slate-200'}`}
                                                        >
                                                            <X className="w-6 h-6" />
                                                        </button>
                                                    </div>
                                                    {expComment && (
                                                        <div className="mt-2 flex flex-col gap-2 text-sm text-rose-900 bg-rose-100 p-4 rounded-xl border-2 border-rose-200">
                                                            <div className="flex items-start gap-2.5">
                                                                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-600" />
                                                                <p className="font-bold leading-snug">Pesan Admin: <span className="font-semibold text-rose-800">"{expComment.content}"</span></p>
                                                            </div>
                                                            <div className="mt-1 pt-3 border-t border-rose-200/60 bg-white/40 p-3 rounded-lg flex items-center gap-2">
                                                                <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                                                                <p className="text-xs font-bold text-rose-800">Tindakan wajib: <span className="font-medium text-rose-700">Hapus pengeluaran ini dengan menekan tombol (X) di atas, lalu tambahkan ulang bukti yang benar.</span></p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Action Dock */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-200 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] z-10 pb-safe">
                            <button
                                onClick={handleComplete}
                                disabled={isSubmitting || Number(actualOdometer) < initialOdo}
                                className="w-full flex justify-center items-center gap-3 px-6 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:active:scale-100 text-lg"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (status === "REVISION_REQUIRED" ? <RotateCcw className="w-6 h-6" /> : <PackageCheck className="w-6 h-6" />)}
                                {status === "REVISION_REQUIRED" ? "KIRIM ULANG VERIFIKASI" : "KIRIM LAPORAN AKHIR"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
