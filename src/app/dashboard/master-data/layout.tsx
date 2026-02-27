"use client";

import { usePathname } from "next/navigation";
import { Truck, Map, UserSquare2, Ticket } from "lucide-react";
import { AnimatedTabs } from "@/components/animated-tabs";

export default function MasterDataLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const tabs = [
        { id: "/dashboard/master-data/armada", label: "Armada", icon: Truck },
        { id: "/dashboard/master-data/rute", label: "Rute", icon: Map },
        { id: "/dashboard/master-data/supir", label: "Supir", icon: UserSquare2 },
        { id: "/dashboard/master-data/tarif-tol", label: "Tarif Tol", icon: Ticket },
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

            <AnimatedTabs tabs={tabs} />

            <div className="mt-6">
                <div
                    key={pathname}
                    className="animate-[fadeIn_150ms_ease-out]"
                    style={{ willChange: "opacity" }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

