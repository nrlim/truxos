"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ShieldCheck,
    Ban,
    MapPin,
    Navigation,
    Truck,
    Fuel,
    Wallet,
    Route as RouteIcon,
    Loader2,
    ExternalLink
} from "lucide-react";
import { calculateEstimatedCost } from "@/lib/estimation";
import { getGoogleMapsUrl } from "@/lib/maps";

interface ApprovalDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    manifest: any | null;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isApproving: boolean;
    isRejecting: boolean;
}

export function ApprovalDrawer({
    isOpen,
    onClose,
    manifest,
    onApprove,
    onReject,
    isApproving,
    isRejecting
}: ApprovalDrawerProps) {
    const [costData, setCostData] = useState<any>(null);

    useEffect(() => {
        if (manifest && isOpen) {
            // Recalculate cost breakdown using the imported lib
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
                                    <span className="px-2.5 py-0.5 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full tracking-wide">
                                        Tertunda
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Verifikasi sebelum diterbitkan
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
                                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Jarak Dasar</p>
                                            <p className="text-sm font-bold text-slate-900">{manifest.route.baseDistanceKm} km</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tambahan</p>
                                            <p className="text-sm font-bold text-slate-900">{manifest.additionalDistanceKm} km</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 bg-slate-50 px-3 py-2 rounded-lg flex justify-between items-center border border-slate-100">
                                        <span className="text-xs font-bold text-slate-700">Total Jarak Tempuh</span>
                                        <span className="text-sm font-bold text-blue-600">
                                            {Number(manifest.route.baseDistanceKm) + Number(manifest.additionalDistanceKm)} km
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Fleet & Driver */}
                            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <Truck className="w-4 h-4 text-slate-400 mb-2" />
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Armada</p>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">{manifest.truck.licensePlate}</p>
                                    <p className="text-xs text-slate-600 mt-1">{manifest.truck.type}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <ShieldCheck className="w-4 h-4 text-slate-400 mb-2" />
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Supir</p>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{manifest.driver.fullName}</p>
                                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{manifest.driver.phoneNumber}</p>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-slate-400" />
                                    Rincian Biaya Ops
                                </h4>
                                {costData ? (
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <ul className="space-y-3">
                                            <li className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600 font-medium flex items-center gap-2">
                                                    <Fuel className="w-4 h-4 text-slate-400" />
                                                    Bahan Bakar ({costData.estimatedLiters.toFixed(1)}L)
                                                </span>
                                                <span className="font-bold text-slate-900">Rp {costData.fuelCost.toLocaleString('id-ID')}</span>
                                            </li>
                                            <li className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600 font-medium flex items-center gap-2">
                                                    <RouteIcon className="w-4 h-4 text-slate-400" />
                                                    Tolls ({manifest.route.tolls?.length || 0} Grb)
                                                </span>
                                                <span className="font-bold text-slate-900">Rp {costData.tollCost.toLocaleString('id-ID')}</span>
                                            </li>
                                            <li className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600 font-medium flex items-center gap-2">
                                                    <Wallet className="w-4 h-4 text-slate-400" />
                                                    Uang Makan
                                                </span>
                                                <span className="font-bold text-slate-900">Rp {costData.allowance.toLocaleString('id-ID')}</span>
                                            </li>
                                        </ul>
                                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-900">Total Estimasi Kas</span>
                                            <span className="text-lg font-bold text-blue-600">Rp {costData.total.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-32 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:p-5 flex gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                            <button
                                onClick={() => onReject(manifest.id)}
                                disabled={isRejecting || isApproving}
                                className="flex-1 flex justify-center items-center gap-2 px-4 py-3 border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-200 rounded-xl font-bold transition-colors disabled:opacity-50 min-h-[48px]"
                            >
                                {isRejecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ban className="w-5 h-5" />}
                                Tolak
                            </button>
                            <button
                                onClick={() => onApprove(manifest.id)}
                                disabled={isRejecting || isApproving}
                                className="flex-[2] flex justify-center items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold translate-y-0 active:translate-y-0.5 active:bg-blue-800 transition-all shadow-sm focus:ring-4 focus:ring-blue-100 disabled:opacity-50 min-h-[48px]"
                            >
                                {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                Setujui & Terbitkan
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
