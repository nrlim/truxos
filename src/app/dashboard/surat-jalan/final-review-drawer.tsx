"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ShieldCheck,
    RefreshCw,
    MapPin,
    Navigation,
    Truck,
    Fuel,
    Wallet,
    Route as RouteIcon,
    Loader2,
    ExternalLink,
    Receipt,
    Image as ImageIcon
} from "lucide-react";
import { calculateEstimatedCost } from "@/lib/estimation";
import { getGoogleMapsUrl } from "@/lib/maps";
import Image from "next/image";

function formatIDR(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

interface FinalReviewDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    manifest: any | null;
    onVerify: (id: string) => void;
    onRevise: (id: string, note: string) => void;
    isVerifying: boolean;
    isRevising: boolean;
    isReadOnly?: boolean;
}

export function FinalReviewDrawer({
    isOpen,
    onClose,
    manifest,
    onVerify,
    onRevise,
    isVerifying,
    isRevising,
    isReadOnly = false
}: FinalReviewDrawerProps) {
    const [costData, setCostData] = useState<any>(null);
    const [revisionNote, setRevisionNote] = useState("");
    const [showRevisionInput, setShowRevisionInput] = useState(false);

    useEffect(() => {
        if (manifest && isOpen) {
            try {
                const calculated = calculateEstimatedCost({
                    route: manifest.route,
                    truck: manifest.truck,
                    driver: manifest.driver,
                    additionalDistanceKm: manifest.additionalDistanceKm
                });
                setCostData(calculated);
            } catch (err) {
                console.error("Failed to calculate cost", err);
            }
        } else {
            setCostData(null);
            setShowRevisionInput(false);
            setRevisionNote("");
        }
    }, [manifest, isOpen]);

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

    const totalExpenses = manifest.expenses ? manifest.expenses.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) : 0;
    const finalOdometer = manifest.truck?.currentOdometer || 0;

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
                        className="fixed inset-y-0 right-0 w-full md:w-[720px] bg-slate-50 z-50 shadow-2xl flex flex-col border-l border-slate-200"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                    {manifest.manifestNumber}
                                    {isReadOnly ? (
                                        <span className="px-2.5 py-0.5 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full tracking-wide">
                                            Selesai
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full tracking-wide">
                                            Butuh Verifikasi
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    {isReadOnly ? "Detail Manifest & Pengeluaran" : "Final Review & Verifikasi Pengeluaran"}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 pb-40 space-y-6">

                            {/* Comparison Side-by-Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* Estimated View */}
                                <div className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm p-5 h-max flex flex-col">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                        <Wallet className="w-4 h-4" />
                                        Estimasi Awal (Master)
                                    </h4>

                                    {costData ? (
                                        <div className="flex-1 flex flex-col">
                                            <ul className="space-y-3 flex-1 mb-4">
                                                <li className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-600 font-medium">Bahan Bakar</span>
                                                    <span className="font-bold text-slate-900 text-right">Rp {formatIDR(costData.fuelCost)}</span>
                                                </li>
                                                <li className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-600 font-medium">Biaya Tol</span>
                                                    <span className="font-bold text-slate-900 text-right">Rp {formatIDR(costData.tollCost)}</span>
                                                </li>
                                                <li className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-600 font-medium">Uang Saku</span>
                                                    <span className="font-bold text-slate-900 text-right">Rp {formatIDR(costData.allowance)}</span>
                                                </li>
                                            </ul>
                                            <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-auto">
                                                <span className="text-sm font-bold text-slate-600">Total Estimasi</span>
                                                <span className="text-base font-bold text-slate-900 text-right">Rp {formatIDR(costData.total)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>
                                    )}
                                </div>

                                {/* Actual View */}
                                <div className="bg-white border text-sm border-blue-100 rounded-xl shadow-sm p-5 h-max flex flex-col">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-4 pb-3 border-b border-blue-50">
                                        <Receipt className="w-4 h-4" />
                                        Data Aktual (Driver)
                                    </h4>

                                    <div className="mb-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-blue-800">
                                            <Truck className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Odometer Akhir</span>
                                        </div>
                                        <span className="font-black text-blue-900 text-base">{formatIDR(finalOdometer)} KM</span>
                                    </div>

                                    {manifest.expenses && manifest.expenses.length > 0 ? (
                                        <div className="flex-1 flex flex-col">
                                            <ul className="space-y-4 flex-1 mb-4">
                                                {manifest.expenses.map((exp: any, idx: number) => (
                                                    <li key={idx} className="flex flex-col gap-1.5 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                        <div className="flex justify-between items-start text-sm">
                                                            <span className="font-bold text-slate-800 uppercase text-xs">{exp.category}</span>
                                                            <span className="font-bold text-slate-900 text-right">Rp {formatIDR(Number(exp.amount))}</span>
                                                        </div>
                                                        {exp.notes && <p className="text-xs text-slate-500 italic mt-0.5">{exp.notes}</p>}
                                                        {exp.attachment && (
                                                            <a href={exp.attachment} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-700 font-bold py-1 uppercase tracking-wider mt-1 w-fit bg-blue-50 px-2 rounded">
                                                                <ImageIcon className="w-3 h-3" /> Lihat Bukti
                                                            </a>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-auto">
                                                <span className="text-sm font-bold text-slate-600">Total Tambahan</span>
                                                <span className="text-base font-bold text-blue-700 text-right">Rp {formatIDR(totalExpenses)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 flex flex-col items-center justify-center text-center flex-1">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                <Receipt className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-500">Tidak ada pengeluaran tambahan.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Grand Total Section */}
                            {costData && (
                                <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Grand Total Pengeluaran</p>
                                        <p className="text-sm font-medium text-slate-600 mt-0.5">Estimasi Awal + Total Tambahan (Post-Trip)</p>
                                    </div>
                                    <div className="text-left sm:text-right w-full sm:w-auto bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-slate-200">
                                        <span className="text-sm font-bold text-slate-500 mr-2">IDR</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                                            Rp {formatIDR(costData.total + totalExpenses)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        {!isReadOnly && (
                            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:p-5 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">

                                {showRevisionInput ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col gap-3"
                                    >
                                        <textarea
                                            value={revisionNote}
                                            onChange={(e) => setRevisionNote(e.target.value)}
                                            placeholder="Tulis catatan revisi untuk driver..."
                                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            rows={3}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowRevisionInput(false)}
                                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-bold text-sm transition-colors"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={() => onRevise(manifest.id, revisionNote)}
                                                disabled={isRevising || !revisionNote.trim()}
                                                className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                                            >
                                                {isRevising ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                Kirim Revisi
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowRevisionInput(true)}
                                            disabled={isRevising || isVerifying}
                                            className="flex-1 flex justify-center items-center gap-2 px-4 py-3 border-2 border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-200 rounded-xl font-bold transition-colors disabled:opacity-50 min-h-[48px]"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            Revisi Driver
                                        </button>
                                        <button
                                            onClick={() => onVerify(manifest.id)}
                                            disabled={isRevising || isVerifying}
                                            className="flex-[2] flex justify-center items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm focus:ring-4 focus:ring-blue-100 disabled:opacity-50 min-h-[48px]"
                                        >
                                            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                            Setujui & Selesaikan
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
