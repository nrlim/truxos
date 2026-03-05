import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// This endpoint acts as a proxy to fetch accounts from Accuwrite
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

        // Use URL Object to cleanly obtain the origin/host
        let baseUrlStr = config.baseUrl;
        if (!baseUrlStr.startsWith("http")) {
            baseUrlStr = "https://" + baseUrlStr;
        }

        const urlObj = new URL(baseUrlStr);
        const origin = urlObj.origin; // ex: https://accuwrite.vercel.app

        // Meneruskan query string dari frontend (misalnya ?type=ASSET,EXPENSE)
        const incomingUrl = new URL(request.url);
        const searchParams = incomingUrl.search; // akan berisi '?type=ASSET,EXPENSE' atau kosong

        const endpoint = `${origin}/api/v1/accounts${searchParams}`;

        // As per the provided working cURL, they expect a Content-Type for urlencoded
        // Note: fetch() does not allow body in GET. Usually --data-urlencode in GET is appended to URL by curl -G, 
        // but if the curl was EXACTLY `--request GET --data-urlencode`, curl sends a GET with body.
        // We will pass it as URL query params which is the standard way a server processes GET urlencoded.
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "X-Accuwrite-Api-Key": config.apiKey,
                "X-Accuwrite-Api-Secret": config.apiSecret || "",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Accuwrite API responded with ${response.status}: ${errBody}`);
        }

        const data = await response.json();

        // Return standard array format for frontend
        // If the Accuwrite API returns { status: 'success', accounts: [...] }
        const formattedAccounts = data.accounts ? data.accounts : [];

        return NextResponse.json({ accounts: formattedAccounts });

    } catch (error: any) {
        console.error("Failed to fetch accounts from Accuwrite:", error);
        return NextResponse.json({ error: `Gagal memuat akun dari Accuwrite: ${error.message}` }, { status: 500 });
    }
}
