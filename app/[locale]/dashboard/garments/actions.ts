"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleGarmentLikeAction(garmentId: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const existingLike = await db.garmentLike.findUnique({
      where: {
        garmentId_tenantId: {
          garmentId,
          tenantId
        }
      }
    });

    if (existingLike) {
      await db.garmentLike.delete({
        where: { id: existingLike.id }
      });
      revalidatePath("/[locale]/dashboard/garments", "page");
      return { success: true, liked: false };
    } else {
      await db.garmentLike.create({
        data: {
          garmentId,
          tenantId
        }
      });
      revalidatePath("/[locale]/dashboard/garments", "page");
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return { error: "Failed to toggle like" };
  }
}

export async function deleteGarmentAction(garmentId: string) {
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

    if (!garment || garment.ownerId !== tenantId) {
      return { error: "Not authorized to delete this garment" };
    }

    // Prisma cascading deletes should handle variants, sizes, etc if set up correctly
    // If not, we might need to delete variants and sizes manually. Let's try direct delete first.
    // If it fails due to foreign keys, we delete relations first.
    // Actually, variants and sizes don't have onDelete: Cascade explicitly set in the snippet I saw.
    // Let's delete relations explicitly to be safe.
    
    // 1. GarmentVariantSizes
    await db.garmentVariantSize.deleteMany({
      where: { variant: { garmentId } }
    });

    // 2. GarmentVariant and GarmentSize
    await db.garmentVariant.deleteMany({ where: { garmentId } });
    await db.garmentSize.deleteMany({ where: { garmentId } });

    // 3. Likes
    await db.garmentLike.deleteMany({ where: { garmentId } });

    // 4. Finally the GarmentTemplate
    await db.garmentTemplate.delete({
      where: { id: garmentId }
    });

    revalidatePath("/[locale]/dashboard/garments", "page");
    return { success: true };
  } catch (error) {
    console.error("Error deleting garment:", error);
    return { error: "Failed to delete garment" };
  }
}
