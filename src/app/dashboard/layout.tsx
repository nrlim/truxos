"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    Truck,
    LogOut,
    LayoutDashboard,
    Users,
    Menu,
    X,
    Settings,
    ChevronRight,
    FileText,
} from "lucide-react";
import clsx from "clsx";
import { PageProgressBar } from "@/components/page-progress-bar";

interface UserData {
    id: string;
    username: string;
    fullName: string;
    role: string;
}

interface TenantData {
    id: string;
    name: string;
    slug: string;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<UserData | null>(null);
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("truxos_token");
            const userData = localStorage.getItem("truxos_user");
            const tenantData = localStorage.getItem("truxos_tenant");

            if (!token || !userData || !tenantData) {
                router.push("/login");
                return;
            }

            setUser(JSON.parse(userData));
            setTenant(JSON.parse(tenantData));
            setIsLoading(false);
        };

        checkAuth();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("truxos_token");
        localStorage.removeItem("truxos_user");
        localStorage.removeItem("truxos_tenant");
        router.push("/login");
    };

    if (isLoading || !user || !tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const navigation = [
        ...(user.role === "DRIVER" ? [
            { name: "Tugas Aktif", href: "/dashboard/driver", icon: Truck, current: pathname === "/dashboard/driver" },
        ] : [
            { name: "Dasbor", href: "/dashboard", icon: LayoutDashboard, current: pathname === "/dashboard" },
            { name: "Surat Jalan", href: "/dashboard/surat-jalan", icon: FileText, current: pathname.startsWith("/dashboard/surat-jalan") },
            ...(user.role === "OWNER" || user.role === "ADMIN" ? [
                { name: "Data Master", href: "/dashboard/master-data/armada", icon: Truck, current: pathname.startsWith("/dashboard/master-data") },
                { name: "Pengguna", href: "/dashboard/users", icon: Users, current: pathname === "/dashboard/users" }
            ] : []),
        ])
    ];

    return (
        <div className="h-screen w-full bg-slate-50 flex flex-col sm:flex-row font-sans text-slate-900 overflow-hidden">
            {/* Mobile Top Bar */}
            <div className="sm:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 h-16 shrink-0 z-30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                        <Truck className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-slate-900 text-lg">
                        trux<span className="text-blue-600">OS</span>
                    </span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                            <Truck className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[17px] font-bold text-slate-900 leading-none">
                                trux<span className="text-blue-600">OS</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-1">
                                {tenant.name}
                            </span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Menu Utama</p>
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                prefetch={true}
                                onClick={() => setIsSidebarOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group active:scale-[0.98]",
                                    item.current
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                                )}
                            >
                                <item.icon className={clsx(
                                    "w-5 h-5 shrink-0 transition-colors",
                                    item.current ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                )} />
                                {item.name}
                                {item.current && <ChevronRight className="w-4 h-4 ml-auto text-blue-600" />}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* User Profile / Footer */}
                <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-slate-600 font-bold border border-slate-200 shadow-sm">
                            {user.fullName.charAt(0)}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold text-slate-900 truncate">
                                {user.fullName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                                {user.role}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Keluar"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">
                <PageProgressBar />
                {/* Desktop Top Header (Breadcrumb) */}
                <header className="hidden md:flex items-center h-16 px-8 border-b border-slate-200 bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <span>Workspace</span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-900 capitalize font-semibold">
                            {pathname === "/dashboard" ? "Dasbor" : pathname.split('/')[2] || "Dasbor"}
                        </span>
                    </div>
                </header>

                <div className="flex-1 flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}
