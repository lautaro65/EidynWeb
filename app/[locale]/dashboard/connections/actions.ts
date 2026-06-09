"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────
// INTEGRATIONS (Shopify, WooCommerce, etc.)
// ─────────────────────────────────────────────

export async function createIntegrationAction(formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const provider = formData.get("provider") as string;
    const storeUrl = formData.get("storeUrl") as string;
    const accessToken = formData.get("accessToken") as string;

    if (!provider || !storeUrl || !accessToken) {
      return { error: "Missing required fields" };
    }

    await db.integration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider
        }
      },
      update: {
        storeUrl,
        accessToken,
        status: "connected",
        lastSyncAt: new Date()
      },
      create: {
        tenantId,
        provider,
        storeUrl,
        accessToken,
        status: "connected",
        lastSyncAt: new Date()
      }
    });

    revalidatePath("/[locale]/dashboard/connections", "page");
    return { success: true };
  } catch (error) {
    console.error("Error creating integration:", error);
    return { error: "Failed to save integration" };
  }
}

export async function deleteIntegrationAction(integrationId: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const integration = await db.integration.findUnique({ where: { id: integrationId } });
    if (!integration || integration.tenantId !== tenantId) {
      return { error: "Not found or unauthorized" };
    }

    await db.integration.delete({ where: { id: integrationId } });

    revalidatePath("/[locale]/dashboard/connections", "page");
    return { success: true };
  } catch (error) {
    console.error("Error deleting integration:", error);
    return { error: "Failed to delete integration" };
  }
}

// ─────────────────────────────────────────────
// API KEYS
// ─────────────────────────────────────────────

export async function createApiKeyAction(formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const name = formData.get("name") as string;
    if (!name) return { error: "Name is required" };

    // In a real scenario, this would be a secure random string and we would only store the hash.
    // For this MVP, we generate a UUID. We will return it so the user can copy it ONCE.
    const secretKey = `edyn_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

    const newKey = await db.apiKey.create({
      data: {
        tenantId,
        name,
        publicKey: secretKey, // Storing directly for MVP.
        isActive: true,
      }
    });

    revalidatePath("/[locale]/dashboard/connections", "page");
    return { success: true, secretKey };
  } catch (error) {
    console.error("Error creating API key:", error);
    return { error: "Failed to create API key" };
  }
}

export async function revokeApiKeyAction(keyId: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const apiKey = await db.apiKey.findUnique({ where: { id: keyId } });
    if (!apiKey || apiKey.tenantId !== tenantId) {
      return { error: "Not found or unauthorized" };
    }

    await db.apiKey.delete({ where: { id: keyId } });

    revalidatePath("/[locale]/dashboard/connections", "page");
    return { success: true };
  } catch (error) {
    console.error("Error revoking API key:", error);
    return { error: "Failed to revoke API key" };
  }
}
