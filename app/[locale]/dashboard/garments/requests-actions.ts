"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createChangeRequestAction(garmentId: string, type: string, message: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const garment = await db.garmentTemplate.findUnique({
      where: { id: garmentId }
    });

    if (!garment) return { error: "Garment not found" };

    await db.garmentChangeRequest.create({
      data: {
        garmentId,
        requestingTenantId: tenantId,
        type,
        message
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating change request:", error);
    return { error: "Failed to create request" };
  }
}

export async function updateChangeRequestStatusAction(requestId: string, status: "resolved" | "rejected") {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const request = await db.garmentChangeRequest.findUnique({
      where: { id: requestId },
      include: { garment: true }
    });

    if (!request || request.garment.ownerId !== tenantId) {
      return { error: "Unauthorized to update this request" };
    }

    await db.garmentChangeRequest.update({
      where: { id: requestId },
      data: { status }
    });

    revalidatePath("/[locale]/dashboard/garments", "page");
    return { success: true };
  } catch (error) {
    console.error("Error updating change request:", error);
    return { error: "Failed to update request" };
  }
}
