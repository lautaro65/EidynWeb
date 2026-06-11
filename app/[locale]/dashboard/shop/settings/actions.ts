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

export async function updateStoreTimezoneAction(timezone: string) {
  try {
    const tenantId = await getTenantId();

    const store = await db.store.findFirst({ where: { tenantId } });
    if (!store) throw new Error("Store not found");

    await db.store.update({
      where: { id: store.id },
      data: { timezone }
    });

    revalidatePath("/[locale]/dashboard/shop/settings", "page");
    return { success: true };
  } catch (error) {
    console.error("Error updating timezone:", error);
    return { error: (error as Error).message };
  }
}
