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
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

// ── Types ──────────────────────────────────────────
type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration: number;
    createdAt: number;
}

interface NotificationContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ── Hook ───────────────────────────────────────────
export function useNotification() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
    return ctx;
}

// ── Config ─────────────────────────────────────────
const ICON_MAP: Record<NotificationType, typeof CheckCircle> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const ACCENT_MAP: Record<NotificationType, string> = {
    success: "#10b981", // emerald
    error: "#ef4444",   // red
    warning: "#f59e0b", // amber
    info: "#0074c5",    // brand-600
};

const ICON_BG_MAP: Record<NotificationType, string> = {
    success: "bg-emerald-50",
    error: "bg-red-50",
    warning: "bg-amber-50",
    info: "bg-blue-50",
};

const ICON_COLOR_MAP: Record<NotificationType, string> = {
    success: "text-emerald-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600",
};

const DEFAULT_DURATION = 4000;

// ── Single Toast Component ─────────────────────────
function Toast({
    notification,
    onDismiss,
}: {
    notification: Notification;
    onDismiss: (id: string) => void;
}) {
    const Icon = ICON_MAP[notification.type];
    const elapsed = Date.now() - notification.createdAt;
    const remaining = Math.max(0, notification.duration - elapsed);

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(notification.id), remaining);
        return () => clearTimeout(timer);
    }, [notification.id, remaining, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="pointer-events-auto w-[360px] max-w-[calc(100vw-32px)] bg-white rounded-xl shadow-lg shadow-slate-900/10 border border-slate-200/80 overflow-hidden"
            role="alert"
        >
            {/* Left accent border */}
            <div className="flex items-start gap-3 px-4 py-3.5 relative">
                <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                    style={{ backgroundColor: ACCENT_MAP[notification.type] }}
                />

                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg ${ICON_BG_MAP[notification.type]} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${ICON_COLOR_MAP[notification.type]}`} strokeWidth={2.5} />
                </div>

                {/* Message */}
                <p className="flex-1 text-sm font-medium text-slate-800 leading-snug pt-1 pr-1">
                    {notification.message}
                </p>

                {/* Close */}
                <button
                    onClick={() => onDismiss(notification.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 mt-0.5"
                    aria-label="Tutup notifikasi"
                >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-[2px] bg-slate-100 w-full">
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: notification.duration / 1000, ease: "linear" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: ACCENT_MAP[notification.type] }}
                />
            </div>
        </motion.div>
    );
}

// ── Provider ───────────────────────────────────────
export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const dismiss = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const push = useCallback((type: NotificationType, message: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setNotifications((prev) => [...prev, { id, type, message, duration: DEFAULT_DURATION, createdAt: Date.now() }]);
    }, []);

    const value: NotificationContextValue = {
        success: useCallback((m: string) => push("success", m), [push]),
        error: useCallback((m: string) => push("error", m), [push]),
        warning: useCallback((m: string) => push("warning", m), [push]),
        info: useCallback((m: string) => push("info", m), [push]),
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            {mounted &&
                createPortal(
                    <div
                        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 items-end max-sm:left-4 max-sm:right-4 max-sm:items-stretch"
                        aria-live="polite"
                    >
                        <AnimatePresence mode="popLayout">
                            {notifications.map((n) => (
                                <Toast key={n.id} notification={n} onDismiss={dismiss} />
                            ))}
                        </AnimatePresence>
                    </div>,
                    document.body
                )}
        </NotificationContext.Provider>
    );
}
