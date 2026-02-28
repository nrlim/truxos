"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "@/lib/auth";
import ReportViewClient from "./ReportViewClient";

export default function ReportsPage() {
    const router = useRouter();
    const [payload, setPayload] = useState<JwtPayload | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("truxos_token");
        const user = localStorage.getItem("truxos_user");

        if (!token || !user) {
            router.push("/login");
            return;
        }

        try {
            const decoded = jwtDecode<JwtPayload>(token);
            const userObj = JSON.parse(user);
            // Patch username into payload if not in token properly
            setPayload({ ...decoded, username: userObj.username || userObj.fullName });
        } catch (error) {
            router.push("/login");
        }
    }, [router]);

    if (!payload) return <div className="p-8">Loading authorization...</div>;

    return (
        <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Reporting Module</h1>
                <p className="text-sm text-neutral-500">Generate and export professional reports</p>
            </header>
            <ReportViewClient tenantId={payload.tenantId} username={payload.username} />
        </div>
    );
}
