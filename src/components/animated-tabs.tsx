"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export interface TabItem {
    id: string; // href
    label: string;
    icon: React.ElementType;
}

interface AnimatedTabsProps {
    tabs: TabItem[];
}

export function AnimatedTabs({ tabs }: AnimatedTabsProps) {
    const pathname = usePathname();

    return (
        <div className="flex space-x-2 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.id);

                return (
                    <Link
                        key={tab.id}
                        href={tab.id}
                        prefetch={true}
                        className={clsx(
                            "relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap active:scale-[0.98]",
                            isActive ? "text-blue-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 active:bg-slate-200/80"
                        )}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/50"
                                initial={false}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <tab.icon className={clsx("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")} />
                            {tab.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
