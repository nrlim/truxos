"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

// ── Types ──────────────────────────────────────────
type ModalVariant = "danger" | "warning" | "info";

interface ModalConfig {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ModalVariant;
    onConfirm: () => void | Promise<void>;
}

interface ModalContextValue {
    confirm: (config: ModalConfig) => void;
}

interface ModalState extends ModalConfig {
    isOpen: boolean;
    isLoading: boolean;
}

const ModalContext = createContext<ModalContextValue | null>(null);

// ── Hook ───────────────────────────────────────────
export function useModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used within ModalProvider");
    return ctx;
}

// ── Variant Styles ─────────────────────────────────
const VARIANT_STYLES: Record<ModalVariant, {
    iconBg: string;
    iconColor: string;
    btnBg: string;
    btnHover: string;
    btnRing: string;
}> = {
    danger: {
        iconBg: "bg-red-50",
        iconColor: "text-red-600",
        btnBg: "bg-red-600",
        btnHover: "hover:bg-red-700",
        btnRing: "focus:ring-red-500/30",
    },
    warning: {
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
        btnBg: "bg-amber-600",
        btnHover: "hover:bg-amber-700",
        btnRing: "focus:ring-amber-500/30",
    },
    info: {
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        btnBg: "bg-blue-600",
        btnHover: "hover:bg-blue-700",
        btnRing: "focus:ring-blue-500/30",
    },
};

// ── Provider ───────────────────────────────────────
export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        isLoading: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });
    const [mounted, setMounted] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => setMounted(true), []);

    // Focus trap: focus cancel button when modal opens
    useEffect(() => {
        if (modal.isOpen) {
            requestAnimationFrame(() => cancelRef.current?.focus());
        }
    }, [modal.isOpen]);

    // Escape key
    useEffect(() => {
        if (!modal.isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !modal.isLoading) close();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [modal.isOpen, modal.isLoading]);

    const close = useCallback(() => {
        setModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    }, []);

    const confirm = useCallback((config: ModalConfig) => {
        setModal({
            isOpen: true,
            isLoading: false,
            title: config.title,
            message: config.message,
            confirmLabel: config.confirmLabel || "Konfirmasi",
            cancelLabel: config.cancelLabel || "Batal",
            variant: config.variant || "danger",
            onConfirm: config.onConfirm,
        });
    }, []);

    const handleConfirm = useCallback(async () => {
        setModal((prev) => ({ ...prev, isLoading: true }));
        try {
            await modal.onConfirm();
        } finally {
            close();
        }
    }, [modal.onConfirm, close]);

    const variant = modal.variant || "danger";
    const styles = VARIANT_STYLES[variant];

    return (
        <ModalContext.Provider value={{ confirm }}>
            {children}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {modal.isOpen && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[10000]"
                                    onClick={() => !modal.isLoading && close()}
                                    aria-hidden
                                />

                                {/* Modal */}
                                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                                        className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 w-full max-w-[420px] overflow-hidden"
                                        role="alertdialog"
                                        aria-modal="true"
                                        aria-labelledby="modal-title"
                                        aria-describedby="modal-desc"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Header */}
                                        <div className="px-6 pt-6 pb-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                                                    <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3
                                                        id="modal-title"
                                                        className="text-base font-bold text-slate-900 leading-tight"
                                                    >
                                                        {modal.title}
                                                    </h3>
                                                    <p
                                                        id="modal-desc"
                                                        className="text-sm text-slate-500 mt-1.5 leading-relaxed"
                                                    >
                                                        {modal.message}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => !modal.isLoading && close()}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors -mt-1 -mr-1"
                                                    aria-label="Tutup"
                                                    disabled={modal.isLoading}
                                                >
                                                    <X className="w-4 h-4" strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">
                                            <button
                                                ref={cancelRef}
                                                onClick={close}
                                                disabled={modal.isLoading}
                                                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                            >
                                                {modal.cancelLabel}
                                            </button>
                                            <button
                                                onClick={handleConfirm}
                                                disabled={modal.isLoading}
                                                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all ${styles.btnBg} ${styles.btnHover} disabled:opacity-60 focus:outline-none focus:ring-2 ${styles.btnRing} focus:ring-offset-2 flex items-center gap-2 min-w-[100px] justify-center`}
                                            >
                                                {modal.isLoading ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    modal.confirmLabel
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </ModalContext.Provider>
    );
}
