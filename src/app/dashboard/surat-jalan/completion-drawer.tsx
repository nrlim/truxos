"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    PackageCheck,
    Navigation,
    Loader2,
    Truck,
    CreditCard,
    Plus,
    Camera,
    ExternalLink
} from "lucide-react";
import { useNotification } from "@/components/ui/notification-provider";
import { resizeImage } from "@/lib/image-utils";
import { uploadExpenseAttachment, deleteExpenseAttachment } from "@/actions/upload";
import { getGoogleMapsUrl } from "@/lib/maps";

interface CompletionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    manifest: any | null;
    onComplete: (id: string, newOdometer: number, expenses: any[]) => void;
    isCompleting: boolean;
}

export function CompletionDrawer({
    isOpen,
    onClose,
    manifest,
    onComplete,
    isCompleting
}: CompletionDrawerProps) {
    const notify = useNotification();
    const [actualOdometer, setActualOdometer] = useState<number>(0);
    const [expenses, setExpenses] = useState<any[]>([]);

    // Form Expense
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
    const [expCategory, setExpCategory] = useState("LAIN_LAIN");
    const [expAmount, setExpAmount] = useState("");
    const [expNotes, setExpNotes] = useState("");
    const [expLiters, setExpLiters] = useState("");
    const [expAttachment, setExpAttachment] = useState<File | null>(null);

    const handleAddExpense = async () => {
        if (!expAmount || isNaN(Number(expAmount))) {
            notify.error("Jumlah harga tidak valid");
            return;
        }

        if (expCategory === "BAHAN_BAKAR" && (!expLiters || isNaN(Number(expLiters)))) {
            notify.error("Jumlah liter tidak valid");
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
            liters: expCategory === "BAHAN_BAKAR" ? Number(expLiters) : null,
            attachmentFileName,
            attachmentUrl
        }]);
        setExpCategory("LAIN_LAIN");
        setExpAmount("");
        setExpNotes("");
        setExpLiters("");
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

    useEffect(() => {
        if (manifest && isOpen) {
            const currentOdo = manifest.truck?.currentOdometer || 0;
            const baseDist = manifest.route?.baseDistanceKm || 0;
            const extraDist = manifest.additionalDistanceKm || 0;
            setActualOdometer(currentOdo + baseDist + extraDist);
            setExpenses([]);
            setIsAddingExpense(false);
            setExpCategory("LAIN_LAIN");
            setExpAmount("");
            setExpNotes("");
            setExpLiters("");
            setExpAttachment(null);
        }
    }, [manifest, isOpen]);

    // Cleanup scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    if (!manifest) return null;

    const baseDist = manifest.route?.baseDistanceKm || 0;
    const extraDist = manifest.additionalDistanceKm || 0;
    const totalDist = baseDist + extraDist;
    const initialOdo = manifest.truck?.currentOdometer || 0;

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
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                    {manifest.manifestNumber}
                                    <span className="px-2.5 py-0.5 text-[11px] font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-full tracking-wide">
                                        Penyelesaian
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Konfirmasi penyelesaian perjalanan
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-6">
                            {/* Route Summary */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <Navigation className="w-4 h-4 text-slate-400" />
                                        Ringkasan Rute
                                    </h4>
                                    {getGoogleMapsUrl(manifest.route.originCoords, manifest.route.destinationCoords) && (
                                        <a
                                            href={getGoogleMapsUrl(manifest.route.originCoords, manifest.route.destinationCoords)!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded text-[11px] font-bold transition-colors flex items-center gap-1.5"
                                        >
                                            <Navigation className="w-3 h-3" />
                                            Maps
                                            <ExternalLink className="w-2 h-2 opacity-50" />
                                        </a>
                                    )}
                                </div>
                                <div className="bg-white border text-sm border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex gap-4 items-start">
                                        <div className="flex flex-col items-center mt-1 w-5">
                                            <div className="w-2 h-2 rounded-full border-2 border-blue-500" />
                                            <div className="w-px h-8 bg-slate-200 my-1" />
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <p className="font-bold text-slate-900">{manifest.route.origin}</p>
                                                <p className="text-xs text-slate-500 font-medium">Titik Keberangkatan</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{manifest.route.destination}</p>
                                                <p className="text-xs text-slate-500 font-medium">Tujuan Akhir</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">Total Estimasi Kas Akhir</span>
                                        <span className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            Rp {Number(manifest.totalEstimatedCost).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Odometer Input */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-slate-400" />
                                    Update Odometer
                                </h4>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium tracking-wide text-xs">Odometer Awal</span>
                                        <span className="font-bold text-slate-900">{initialOdo.toLocaleString('id-ID')} KM</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium tracking-wide text-xs">Total Jarak Tempuh</span>
                                        <span className="font-bold text-blue-600">+{totalDist.toLocaleString('id-ID')} KM</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200">
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                            Odometer Aktual Akhir
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={actualOdometer}
                                                onChange={(e) => setActualOdometer(Number(e.target.value))}
                                                min={initialOdo}
                                                className="w-full pl-4 pr-12 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-bold"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                                KM
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Post-Trip Expenses */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-slate-400" />
                                        Biaya Tambahan (Opsional)
                                    </h4>
                                    {!isAddingExpense && (
                                        <button
                                            onClick={() => setIsAddingExpense(true)}
                                            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Added Expenses List */}
                                {expenses.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        {expenses.map((exp) => (
                                            <div key={exp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 text-xs uppercase">{exp.category}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="font-extrabold text-blue-600 text-sm">Rp {exp.amount.toLocaleString('id-ID')}</p>
                                                        {exp.liters && exp.category === "BAHAN_BAKAR" && (
                                                            <span className="font-medium text-amber-600 text-xs bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{exp.liters} Liter</span>
                                                        )}
                                                    </div>
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
                                                    className="w-8 h-8 rounded-full text-slate-400 bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Expense Form */}
                                {isAddingExpense && (
                                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4 pt-4 mt-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Kategori</label>
                                            <select
                                                value={expCategory}
                                                onChange={(e) => setExpCategory(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                            >
                                                <option value="PERBAIKAN">Perbaikan / Sparepart</option>
                                                <option value="PARKIR">Parkir / Mel) / Timbangan</option>
                                                <option value="DARURAT">Darurat (Ban Bocor, dll)</option>
                                                <option value="PUNGLI">Pungli / Koordinasi</option>
                                                <option value="LAIN_LAIN">Lain-lain</option>
                                                <option value="BAHAN_BAKAR">BBM (Bahan Bakar)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Jumlah (Rp)</label>
                                            <input
                                                type="number"
                                                value={expAmount}
                                                onChange={(e) => setExpAmount(e.target.value)}
                                                placeholder="Contoh: 50000"
                                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                                            />
                                        </div>
                                        {expCategory === "BAHAN_BAKAR" && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Jumlah (Liter)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={expLiters}
                                                    onChange={(e) => setExpLiters(e.target.value)}
                                                    placeholder="Contoh: 15.5"
                                                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-bold text-sm"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Catatan</label>
                                            <input
                                                type="text"
                                                value={expNotes}
                                                onChange={(e) => setExpNotes(e.target.value)}
                                                placeholder="Penjelasan singkat..."
                                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
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
                                                <div className="w-full px-3 py-2.5 bg-white border border-slate-300 border-dashed rounded-lg flex items-center justify-center gap-2 text-slate-600 font-medium text-sm transition-colors hover:bg-slate-50">
                                                    <Camera className="w-4 h-4" />
                                                    <span className="truncate">{expAttachment ? expAttachment.name : "Ambil Foto Kwitansi"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => setIsAddingExpense(false)}
                                                disabled={isSubmittingExpense}
                                                className="flex-[1] py-2 font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors text-sm disabled:opacity-50"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleAddExpense}
                                                disabled={isSubmittingExpense}
                                                className="flex-[2] py-2 flex justify-center items-center gap-2 font-bold text-white bg-slate-900 rounded-lg active:scale-[0.98] transition-all text-sm disabled:opacity-50"
                                            >
                                                {isSubmittingExpense && <Loader2 className="w-4 h-4 animate-spin" />}
                                                Simpan Biaya
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:p-5 flex gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                            <button
                                onClick={() => onComplete(manifest.id, actualOdometer, expenses)}
                                disabled={isCompleting || actualOdometer < initialOdo}
                                className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold translate-y-0 active:translate-y-0.5 active:bg-blue-800 transition-all shadow-sm focus:ring-4 focus:ring-blue-100 disabled:opacity-50 min-h-[48px]"
                            >
                                {isCompleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackageCheck className="w-5 h-5" />}
                                Konfirmasi Selesai
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
