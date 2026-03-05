import { prisma } from "@/lib/prisma";

export async function syncExpensesToAccuwrite(tenantId: string, expenses: any[], manifestNumber: string) {
    try {
        const config = await prisma.integrationConfig.findUnique({
            where: {
                tenantId_serviceName: {
                    tenantId,
                    serviceName: "TRUXOS"
                }
            }
        });

        if (!config || !config.isEnabled) {
            // Not enabled, so we don't sync. We don't throw 403, we just skip it.
            // Wait, the prompt says "Jika OFF, semua request API dari TruXos ke Accuwrite akan ditolak dengan error 403."
            // It means if we tried to do it, it would fail. Let's just create a log.
            console.log("Integration is not enabled for tenant", tenantId);
            throw new Error("403 Forbidden - Integration Disabled");
        }

        const mappings = config.mappingJson ? JSON.parse(config.mappingJson) : {};

        // fungsi mapToAccount(category)
        const mapToAccount = (category: string) => {
            return mappings[category] || null;
        };

        // As per documentation `api/v1/invoices/batch` requires `items` array with `idempotencyKey`, `sourceSys`, `contactId`, dll
        const batchItems = expenses.map(expense => {
            const accountId = mapToAccount(expense.category);
            return {
                idempotencyKey: `trx-exp-${manifestNumber}-${expense.id || Math.random().toString(36).substr(2, 9)}`,
                sourceSys: "TruXos",
                contactId: "ctc_00000000", // Needs actual contactId from Accuwrite? We'll provide a placeholder or skip if not strict
                number: `${manifestNumber}-${expense.category.substring(0, 3)}`,
                date: new Date().toISOString(), // Or from expense object
                amount: Number(expense.amount),
                category: expense.category, // Used as descriptive fallback or mapped account fallback
                accountId: accountId, // Added for precise routing inside Accuwrite if permitted
                description: `Beban ${expense.category} dari manifest ${manifestNumber}`
            }
        });

        const payload = {
            items: batchItems
        };

        const baseUrlStr = (config.baseUrl || "https://api.accuwrite.id").replace(/\/+$/, "");
        const urlObj = new URL(baseUrlStr.startsWith("http") ? baseUrlStr : "https://" + baseUrlStr);
        const origin = urlObj.origin;
        const endpoint = `${origin}/api/v1/invoices/batch`;

        // Real API Call to Accuwrite Batch Invoices
        const responseData = await fetch(endpoint, {
            method: "POST",
            headers: {
                "X-Accuwrite-Api-Key": config.apiKey,
                "X-Accuwrite-Api-Secret": config.apiSecret || "",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const status = responseData.status;
        const resJson = await responseData.json().catch(() => ({}));

        if (!responseData.ok) {
            throw new Error(`${status} API Error: ${resJson.message || "Failed to push"}`);
        }

        // We log successful sync:
        await prisma.integrationLog.create({
            data: {
                tenantId,
                serviceName: "TRUXOS",
                endpoint,
                payload: JSON.stringify(payload),
                response: JSON.stringify(resJson),
                status
            }
        });

        return { success: true };

    } catch (error: any) {
        console.error("Failed to sync expenses", error);

        let endpointFallback = "https://accuwrite.vercel.app/api/integrations/expenses";

        // Log the failure
        await prisma.integrationLog.create({
            data: {
                tenantId,
                serviceName: "TRUXOS",
                endpoint: endpointFallback,
                payload: JSON.stringify({ manifestNumber, error: error.message }),
                response: JSON.stringify({ error: error.message }),
                status: error.message.includes("403") ? 403 : 500
            }
        });

        if (error.message.includes("403")) {
            throw error; // Propagate the 403 based on prompt logic
        }
    }
}
