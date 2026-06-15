"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Ensures a User record exists and has an active avatar.
 * If not, it creates them.
 */
export async function getOrCreateActiveAvatar() {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  // First, ensure the User exists in our DB
  let user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { activeAvatar: true }
  });

  if (!user) {
    // Si por alguna razón no existe el User, lo creamos
    user = await db.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "unknown@email.com",
        username: clerkUser.username || clerkUser.firstName,
      },
      include: { activeAvatar: true }
    });
  }

  // Si no tiene un avatar activo, le creamos uno vacío
  if (!user.activeAvatarId) {
    const newAvatar = await db.avatar.create({
      data: {
        userId: user.id,
        status: "pending",
        measurements: {}
      }
    });

    await db.user.update({
      where: { id: user.id },
      data: { activeAvatarId: newAvatar.id }
    });

    return newAvatar;
  }

  return user.activeAvatar;
}

export async function updateAvatarMeasurements(data: {
  gender?: string;
  height?: number;
  weight?: number;
  measurements: Record<string, number | null>;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  if (!user || !user.activeAvatarId) {
    throw new Error("No active avatar found");
  }

  const updatedAvatar = await db.avatar.update({
    where: { id: user.activeAvatarId },
    data: {
      gender: data.gender,
      height: data.height,
      weight: data.weight,
      measurements: data.measurements,
    }
  });

  revalidatePath("/[locale]/portal", "layout");
  return { success: true, avatar: updatedAvatar };
}

export async function toggleShopConsent(consentId: string, granted: boolean) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  if (!user) throw new Error("User not found");

  const consent = await db.shopConsent.findUnique({
    where: { id: consentId }
  });

  if (!consent || consent.userId !== user.id) {
    throw new Error("Consent record not found or unauthorized");
  }

  await db.shopConsent.update({
    where: { id: consentId },
    data: {
      granted,
      revokedAt: granted ? null : new Date(),
    }
  });

  revalidatePath("/[locale]/portal/shops", "page");
  return { success: true };
}
