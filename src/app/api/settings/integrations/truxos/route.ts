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

        const logs = await prisma.integrationLog.findMany({
            where: {
                tenantId,
                serviceName: "TRUXOS",
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
        });

        return NextResponse.json({
            config: config || null,
            logs,
        });
    } catch (error) {
        console.error("Failed to fetch integration config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const tenantId = request.headers.get("x-tenant-id");

        if (!tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { isEnabled, baseUrl, apiKey, apiSecret, mappingJson } = body;

        const config = await prisma.integrationConfig.upsert({
            where: {
                tenantId_serviceName: {
                    tenantId,
                    serviceName: "TRUXOS",
                },
            },
            update: {
                isEnabled,
                baseUrl,
                apiKey,
                apiSecret,
                mappingJson: JSON.stringify(mappingJson),
            },
            create: {
                tenantId,
                serviceName: "TRUXOS",
                isEnabled,
                baseUrl,
                apiKey,
                apiSecret,
                mappingJson: JSON.stringify(mappingJson),
            },
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error("Failed to save integration config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
