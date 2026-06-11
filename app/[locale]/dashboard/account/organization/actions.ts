"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function getTenantId() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
  if (!tenantId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    if (!mem) throw new Error("No tenant");
    tenantId = mem.tenantId;
  }
  return tenantId;
}

export async function getOrganizationConfigAction() {
  try {
    const tenantId = await getTenantId();

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        stores: {
          take: 1, // Get the primary store
        }
      }
    });

    if (!tenant) return { error: "Tenant not found" };

    const store = tenant.stores[0];

    return {
      success: true,
      data: {
        tenantName: tenant.name || "",
        tenantSlug: tenant.slug || "",
        logoUrl: tenant.logoUrl || "",
        brandColor: tenant.brandColor || "#ffffff",
        plan: tenant.plan || "free",
        widgetConfig: (tenant.widgetConfig as Record<string, unknown>) || {
          theme: "system",
          watermark: true,
          allowZoom: true,
          sessionTtlMinutes: 30,
          consentText: "Al probar esta prenda con nuestro probador virtual, autorizas el procesamiento temporal de tus datos para generar el modelo 3D. Tus datos están protegidos y expiran automáticamente.",
          authorizedDomains: []
        },
        storeName: store?.name || "",
        currency: store?.currency || "USD",
        timezone: store?.timezone || "UTC",
        country: store?.country || "US",
      }
    };
  } catch (error) {
    console.error("Error fetching org config:", error);
    return { error: (error as Error).message || "Failed to fetch organization config" };
  }
}

export async function updateOrganizationConfigAction(data: {
  tenantName: string;
  tenantSlug: string;
  logoUrl: string;
  brandColor: string;
  widgetConfig: Record<string, unknown>;
  currency: string;
  timezone: string;
  country: string;
}) {
  try {
    const tenantId = await getTenantId();

    // Update Tenant
    await db.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.tenantName,
        slug: data.tenantSlug,
        logoUrl: data.logoUrl,
        brandColor: data.brandColor,
        widgetConfig: data.widgetConfig as Prisma.InputJsonObject,
      }
    });

    // Update first store if exists
    const firstStore = await db.store.findFirst({
      where: { tenantId }
    });

    if (firstStore) {
      await db.store.update({
        where: { id: firstStore.id },
        data: {
          currency: data.currency,
          timezone: data.timezone,
          country: data.country,
        }
      });
    } else {
      // Create store if it somehow doesn't exist
      await db.store.create({
        data: {
          tenantId,
          name: data.tenantName,
          currency: data.currency,
          timezone: data.timezone,
          country: data.country,
          status: "active"
        }
      });
    }

    revalidatePath("/[locale]/dashboard/account/organization", "page");
    return { success: true };
  } catch (error) {
    console.error("Error updating org config:", error);
    return { error: (error as Error).message || "Failed to update organization config" };
  }
}
