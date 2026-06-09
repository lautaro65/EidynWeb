"use server";

import { db } from "@/lib/db";
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
        storeName: store?.name || "",
        currency: store?.currency || "USD",
        timezone: store?.timezone || "UTC",
        country: store?.country || "US",
      }
    };
  } catch (error: any) {
    console.error("Error fetching org config:", error);
    return { error: error.message || "Failed to fetch organization config" };
  }
}

export async function updateOrganizationConfigAction(data: {
  tenantName: string;
  tenantSlug: string;
  logoUrl: string;
  brandColor: string;
  currency: string;
  timezone: string;
  country: string;
}) {
  try {
    const tenantId = await getTenantId();

    // Update Tenant
    const updatedTenant = await db.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.tenantName,
        slug: data.tenantSlug,
        logoUrl: data.logoUrl,
        brandColor: data.brandColor,
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
  } catch (error: any) {
    console.error("Error updating org config:", error);
    return { error: error.message || "Failed to update organization config" };
  }
}
