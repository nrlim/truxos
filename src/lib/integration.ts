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
            console.log("Integration is not enabled for tenant", tenantId);
            return { success: true, skipped: true };
        }

        if (expenses.length === 0) {
            console.log(`No expenses to sync for manifest ${manifestNumber}. Skipping integration.`);
            return { success: true, skipped: true };
        }

        const mappings = config.mappingJson ? JSON.parse(config.mappingJson) : {};

        // Group by category to send final cost per category
        const categoryTotals: Record<string, number> = {};
        for (const exp of expenses) {
            if (!categoryTotals[exp.category]) {
                categoryTotals[exp.category] = 0;
            }
            categoryTotals[exp.category] += Number(exp.amount);
        }

        const categories = Object.keys(categoryTotals);

        const baseUrlVal = (config.baseUrl || "https://api.accuwrite.id").replace(/\/+$/, "");
        // Use the bulk expense creation endpoint
        const endpoint = baseUrlVal.includes("/api") 
            ? `${baseUrlVal.replace(/\/integrations.*/, "")}/integrations/expenses/bulk` 
            : `${baseUrlVal}/api/integrations/expenses/bulk`;

        const vendorEndpoint = baseUrlVal.includes("/api")
            ? `${baseUrlVal.replace(/\/integrations.*/, "")}/integrations/vendors?search=truxos`
            : `${baseUrlVal}/api/integrations/vendors?search=truxos`;

        let vendorId = "vnd_truxos_default";
        try {
            const vendorRes = await fetch(vendorEndpoint, {
                headers: {
                    "X-Accuwrite-Api-Key": config.apiKey,
                    "X-Accuwrite-Api-Secret": config.apiSecret || ""
                }
            });
            if (vendorRes.ok) {
                const vendorJson = await vendorRes.json();
                if (vendorJson.status === "success" && vendorJson.data && vendorJson.data.length > 0) {
                    vendorId = vendorJson.data[0].id;
                }
            }
        } catch (err) {
            console.error("Failed to fetch vendor", err);
        }

        console.log(`Syncing to Accuwrite: ${endpoint} for manifest ${manifestNumber}`);

        // Prepare bulk payload
        const payload = categories.map((category) => {
            const amount = categoryTotals[category];
            const accountId = mappings[category] || null;

            return {
                sourceSys: "TruXos",
                vendorId: vendorId,
                number: `${manifestNumber}-${category.substring(0, 3)}`,
                date: new Date().toISOString(),
                category: category,
                amount: amount,
                accountId: accountId,
                description: `Biaya Operasional ${category} - ${manifestNumber}`,
                idempotencyKey: `trx-exp-${manifestNumber}-${category}`
            };
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        let responseData;
        let resJson = {};
        let status = 500;

        try {
            responseData = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "X-Accuwrite-Api-Key": config.apiKey,
                    "X-Accuwrite-Api-Secret": config.apiSecret || "",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            status = responseData.status;
            resJson = await responseData.json().catch(() => ({}));

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

            // If 207 (partial success), we might have failed items
            if (status === 207) {
                const failedItems = (resJson as any).failed || [];
                if (failedItems.length > 0) {
                    throw new Error(`Integration failed for some items: ${failedItems[0].error}`);
                }
            } else if (!responseData.ok) {
                throw new Error(`${status} API Error: ${(resJson as any).message || (resJson as any).error || "Failed to push"}`);
            }
        } catch (error: any) {
            // Only log if it wasn't already logged (i.e. network error or timeout)
            if (!responseData) {
                await prisma.integrationLog.create({
                    data: {
                        tenantId,
                        serviceName: "TRUXOS",
                        endpoint,
                        payload: JSON.stringify(payload),
                        response: JSON.stringify({ error: error.message }),
                        status: 500
                    }
                });
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }

        return { success: true };

    } catch (error: any) {
        console.error("Failed to sync expenses", error);
        throw error;
    }
}
