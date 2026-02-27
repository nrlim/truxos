"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Truck, Map, UserSquare2, Ticket } from "lucide-react";
import clsx from "clsx";

export default function MasterDataLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const tabs = [
        { name: "Armada", href: "/dashboard/master-data/armada", icon: Truck },
        { name: "Rute", href: "/dashboard/master-data/rute", icon: Map },
        { name: "Supir", href: "/dashboard/master-data/supir", icon: UserSquare2 },
        { name: "Tarif Tol", href: "/dashboard/master-data/tarif-tol", icon: Ticket },
    ];

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                    Data Master
                </h1>
                <p className="text-sm text-slate-500">
                    Kelola data utama operasional truxOS untuk akurasi estimasi dan pelaporan.
                </p>
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto overflow-y-hidden" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = pathname.startsWith(tab.href);
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={clsx(
                                    isActive
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
                                    "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap transition-colors"
                                )}
                                aria-current={isActive ? "page" : undefined}
                            >
                                <tab.icon
                                    className={clsx(
                                        isActive ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500",
                                        "-ml-0.5 mr-2 h-5 w-5"
                                    )}
                                    aria-hidden="true"
                                />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-6">
                {children}
            </div>
        </div>
    );
}
