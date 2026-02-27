"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Truck, MapPin, Navigation, Map, PackageCheck, AlertCircle, Fuel, CreditCard, Camera, Loader2, Plus, X
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
    const [driverId, setDriverId] = useState<string>("");

    // Drawer state
    const [isCompletionDrawerOpen, setIsCompletionDrawerOpen] = useState(false);

    useEffect(() => {
        fetchActiveManifest(true);
        // Polling loop for new tasks
        const intervalId = setInterval(() => {
            fetchActiveManifest(false);
        }, 15000); // Check every 15s

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
            setDriverId(res.driverId || "");
        } catch (error) {
            if (isInitial) notify.error("Gagal memuat tugas driver");
        } finally {
            if (isInitial) setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!manifest) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 min-h-screen relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <div className="w-[30rem] h-[30rem] border border-blue-600 rounded-full" />
                    <div className="w-[40rem] h-[40rem] border border-blue-600 rounded-full absolute" />
                </div>

                <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center shadow-inner mb-6 relative z-10 border border-blue-200">
                    <Truck className="w-12 h-12 text-blue-600" />
                </div>

                <div className="text-center relative z-10 space-y-2 mb-10 max-w-sm">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Tidak ada tugas aktif</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">Saat ini Anda tidak memiliki Surat Jalan yang sedang berjalan. Tunggu instruksi pemuatan selanjutnya.</p>
                </div>

                <button
                    onClick={() => notify.success("Riwayat dalam pengembangan")}
                    className="relative z-10 px-6 py-3 bg-white border border-slate-200 shadow-sm text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors focus:ring-4 focus:ring-slate-100"
                >
                    Lihat Riwayat Perjalanan
                </button>
            </div>
        );
    }

    const currentBaseDist = manifest.route?.baseDistanceKm || 0;
    const additionalDist = manifest.additionalDistanceKm || 0;
    const initialOdo = manifest.truck?.currentOdometer || 0;

    const handleNavigation = () => {
        const url = getGoogleMapsUrl(manifest.route.originCoords, manifest.route.destinationCoords);
        if (url) {
            window.open(url, "_blank");
        } else {
            notify.error("Koordinat rute belum diset oleh admin secara lengkap");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 pb-24 font-sans max-w-2xl mx-auto w-full">
            {/* Header Mobile Only */}
            <div className="bg-slate-900 px-5 pt-8 pb-10 text-white rounded-b-3xl shadow-sm">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Tugas Aktif</p>
                <h1 className="text-2xl font-bold tracking-tight mb-4">{manifest.manifestNumber}</h1>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/20 w-fit backdrop-blur-sm">
                    <Truck className="w-4 h-4 text-slate-300" />
                    <span className="font-bold text-sm tracking-widest">{manifest.truck.licensePlate}</span>
                </div>
            </div>

            {/* Rute Section */}
            <div className="px-4 -mt-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-slate-700" />
                        Rute Perjalanan
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center w-6 shrink-0 pt-1">
                            <div className="w-3 h-3 rounded-full border-2 border-slate-700" />
                            <div className="w-px h-12 bg-slate-200 my-1 flex-1 relative flex items-center justify-center overflow-hidden">
                                <div className="absolute top-0 bottom-0 left-0 right-0 animate-[shimmer_2s_infinite] bg-gradient-to-b from-transparent via-slate-400/50 to-transparent" />
                            </div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <p className="font-extrabold text-slate-900 text-lg leading-tight">{manifest.route.origin}</p>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Berangkat</p>
                            </div>
                            <div>
                                <p className="font-extrabold text-slate-900 text-lg leading-tight">{manifest.route.destination}</p>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Tujuan</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <button
                            onClick={handleNavigation}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all"
                        >
                            <Navigation className="w-5 h-5" />
                            Mulai Navigasi
                        </button>
                    </div>
                </div>
            </div>

            {/* Total Distance Info */}
            <div className="px-4 mt-4">
                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                        <Map className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Jarak Estimasi</p>
                        <p className="text-3xl font-extrabold">{currentBaseDist + additionalDist} <span className="text-lg font-medium text-slate-500">KM</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 relative z-10">
                        <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Bottom floating button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center z-20 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)]">
                <div className="max-w-2xl w-full mx-auto">
                    <button
                        onClick={() => setIsCompletionDrawerOpen(true)}
                        className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                    >
                        <PackageCheck className="w-5 h-5" />
                        Selesaikan Tugas
                    </button>
                </div>
            </div>

            {/* Full Drawer / Modal form */}
            <CompletionExpenseDrawer
                isOpen={isCompletionDrawerOpen}
                onClose={() => setIsCompletionDrawerOpen(false)}
                manifestId={manifest.id}
                driverId={driverId}
                initialOdo={initialOdo}
                totalDist={currentBaseDist + additionalDist}
                onSuccess={() => {
                    setIsCompletionDrawerOpen(false);
                    fetchActiveManifest();
                }}
            />

            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
            `}</style>
        </div>
    );
}

function CompletionExpenseDrawer({ isOpen, onClose, manifestId, driverId, initialOdo, totalDist, onSuccess }: any) {
    const notify = useNotification();
    const [actualOdometer, setActualOdometer] = useState<number | string>(initialOdo + totalDist);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                // Ignore any error on delete to avoid blocking user flow
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
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 250, damping: 30 }}
                    className="fixed inset-0 z-50 bg-slate-50 flex flex-col font-sans overflow-hidden"
                >
                    <div className="bg-white border-b border-slate-200 px-4 h-16 flex justify-between items-center shrink-0">
                        <h2 className="font-bold text-slate-900 tracking-tight">Formulir Penyelesaian</h2>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 max-w-2xl mx-auto w-full">
                        {/* Odometer Section */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Update Odometer (KM)</h3>
                                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Wajib Diisi</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                    Odometer Akhir Perjalanan
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={actualOdometer}
                                        onChange={(e) => setActualOdometer(e.target.value)}
                                        className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-xl text-slate-900"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                        KM
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Post-Trip Expenses */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                        <CreditCard className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Biaya Tambahan</h3>
                                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Opsional</p>
                                    </div>
                                </div>
                                {!isAddingExpense && (
                                    <button
                                        onClick={() => setIsAddingExpense(true)}
                                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Added Expenses List */}
                            {expenses.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    {expenses.map((exp) => (
                                        <div key={exp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm uppercase">{exp.category}</p>
                                                <p className="font-extrabold text-blue-600 text-base mt-0.5">Rp {exp.amount.toLocaleString('id-ID')}</p>
                                                {exp.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{exp.notes}</p>}
                                                {exp.attachmentFileName && (
                                                    <div className="flex items-center gap-1 mt-1 text-blue-600 text-[10px] font-bold">
                                                        <Camera className="w-3 h-3" />
                                                        <span className="truncate max-w-[120px]">{exp.attachmentFileName}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveExpense(exp.id)}
                                                className="w-10 h-10 rounded-full text-slate-400 bg-white border border-slate-200 shadow-sm flex items-center justify-center active:scale-95"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Expense Form */}
                            {isAddingExpense && (
                                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4 pt-4 mt-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Kategori</label>
                                        <select
                                            value={expCategory}
                                            onChange={(e) => setExpCategory(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                        >
                                            <option value="PERBAIKAN">Perbaikan / Sparepart</option>
                                            <option value="PARKIR">Parkir / Mel) / Timbangan</option>
                                            <option value="DARURAT">Darurat (Ban Bocor, dll)</option>
                                            <option value="PUNGLI">Pungli / Koordinasi</option>
                                            <option value="LAIN_LAIN">Lain-lain</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Jumlah (Rp)</label>
                                        <input
                                            type="number"
                                            value={expAmount}
                                            onChange={(e) => setExpAmount(e.target.value)}
                                            placeholder="Contoh: 50000"
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Catatan</label>
                                        <input
                                            type="text"
                                            value={expNotes}
                                            onChange={(e) => setExpNotes(e.target.value)}
                                            placeholder="Penjelasan singkat..."
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Lampiran Kwitansi / Foto</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={(e) => setExpAttachment(e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="w-full px-4 py-3 bg-white border border-slate-300 border-dashed rounded-xl flex items-center justify-center gap-2 text-slate-600 font-medium text-sm transition-colors hover:bg-slate-50">
                                                <Camera className="w-4 h-4" />
                                                <span>{expAttachment ? expAttachment.name : "Ambil Foto Kwitansi"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setIsAddingExpense(false)}
                                            disabled={isSubmittingExpense}
                                            className="flex-[1] py-3 font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors text-sm disabled:opacity-50"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleAddExpense}
                                            disabled={isSubmittingExpense}
                                            className="flex-[2] py-3 flex justify-center items-center gap-2 font-bold text-white bg-slate-900 rounded-xl active:scale-[0.98] transition-all text-sm disabled:opacity-50"
                                        >
                                            {isSubmittingExpense && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Simpan Biaya
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-10 flex justify-center">
                        <div className="w-full max-w-2xl">
                            <button
                                onClick={handleComplete}
                                disabled={isSubmitting || Number(actualOdometer) < initialOdo}
                                className="w-full flex justify-center items-center gap-2 px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold translate-y-0 active:translate-y-0.5 transition-all shadow-lg focus:ring-4 focus:ring-blue-200 disabled:opacity-50 text-base"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackageCheck className="w-6 h-6" />}
                                Kirim Data Operasional
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

