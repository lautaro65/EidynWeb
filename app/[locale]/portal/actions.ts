"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadToR2 } from "@/lib/r2";

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

export async function updatePhysicalProfile(data: {
  name: string;
  gender: string;
  height: number;
  age: number;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  if (!user || !user.activeAvatarId) throw new Error("User or avatar not found");

  // Actualizar usuario
  await db.user.update({
    where: { id: user.id },
    data: { username: data.name }
  });

  // Actualizar avatar
  await db.avatar.update({
    where: { id: user.activeAvatarId },
    data: {
      gender: data.gender,
      height: data.height,
      measurements: { age: data.age }
    }
  });

  revalidatePath("/[locale]/portal", "layout");
  return { success: true };
}

export async function startAvatarGeneration(formData: FormData) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  if (!user || !user.activeAvatarId) throw new Error("User or avatar not found");

  const gender = formData.get("gender") as string;
  const height = formData.get("height") as string;
  const weight = formData.get("weight") as string;
  const frontImage = formData.get("frontImage") as File;
  const sideImage = formData.get("sideImage") as File;

  if (!frontImage || !sideImage) throw new Error("Images required");

  // Upload to R2
  const frontBuffer = Buffer.from(await frontImage.arrayBuffer());
  const sideBuffer = Buffer.from(await sideImage.arrayBuffer());

  const frontKey = `avatars/${user.id}/front-${Date.now()}.jpg`;
  const sideKey = `avatars/${user.id}/side-${Date.now()}.jpg`;

  await uploadToR2(frontBuffer, frontKey, frontImage.type);
  await uploadToR2(sideBuffer, sideKey, sideImage.type);

  // Update Avatar status to processing
  await db.avatar.update({
    where: { id: user.activeAvatarId },
    data: {
      gender,
      height: Number(height),
      weight: Number(weight),
      status: "processing",
    }
  });

  revalidatePath("/[locale]/portal", "layout");
  return { success: true };
}

