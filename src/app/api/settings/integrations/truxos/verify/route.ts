import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const tenantId = request.headers.get("x-tenant-id");

        if (!tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const config = await prisma.integrationConfig.findUnique({
            where: {
                tenantId_serviceName: {
                    tenantId,
                    serviceName: "TRUXOS",
                },
            },
        });

        if (!config || !config.baseUrl || !config.apiKey) {
            return NextResponse.json({ error: "Kredensial integrasi belum lengkap" }, { status: 400 });
        }

        if (!config.isEnabled) {
            return NextResponse.json({ error: "Integrasi TruXos saat ini dinonaktifkan" }, { status: 403 });
        }

        let baseUrlStr = config.baseUrl;
        if (!baseUrlStr.startsWith("http")) {
            baseUrlStr = "https://" + baseUrlStr;
        }

        const urlObj = new URL(baseUrlStr);
        const origin = urlObj.origin;
        const endpoint = `${origin}/api/v1/verify`;

        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "X-Accuwrite-Api-Key": config.apiKey,
                "X-Accuwrite-Api-Secret": config.apiSecret || "",
            }
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Verify API Error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Failed to verify API with Accuwrite:", error);
        return NextResponse.json({ error: `Gagal verifikasi dengan Accuwrite: ${error.message}` }, { status: 500 });
    }
}
