"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadToR2, bucketName } from "@/lib/r2";

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

export async function connectShop(tenantId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  if (!user) throw new Error("User not found");

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) throw new Error("Tenant not found");

  // Upsert the ShopConsent
  await db.shopConsent.upsert({
    where: {
      userId_tenantId: {
        userId: user.id,
        tenantId: tenant.id,
      }
    },
    create: {
      userId: user.id,
      tenantId: tenant.id,
      granted: true,
      grantedAt: new Date(),
    },
    update: {
      granted: true,
      grantedAt: new Date(),
      revokedAt: null,
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

  let user = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  if (!user || !user.activeAvatarId) throw new Error("User or avatar not found");
  const activeAvatarId = user.activeAvatarId;

  // --- QUOTA & RATE LIMIT LOGIC ---
  const now = new Date();
  let currentCount = user.avatarMonthlyCount;
  let resetAt = user.avatarCountResetAt;

  // Si la fecha actual superó la fecha de reseteo, le devolvemos sus escaneos (cada 2 meses)
  if (now > resetAt) {
    currentCount = 0;
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 2);
    resetAt = nextReset;
    
    user = await db.user.update({
      where: { id: user.id },
      data: {
        avatarMonthlyCount: currentCount,
        avatarCountResetAt: resetAt,
      }
    });
  }

  // Verificar si ya gastó todos sus escaneos
  if (currentCount >= user.avatarMonthlyLimit) {
    return { 
      success: false, 
      error: "RATE_LIMIT", 
      nextReset: resetAt.toISOString() 
    };
  }
  // --------------------------------

  const avatar = await db.avatar.findUnique({
    where: { id: activeAvatarId }
  });
  
  if (!avatar) throw new Error("Avatar not found");

  const gender = formData.get("gender") as string;
  const height = formData.get("height") as string;
  const weight = formData.get("weight") as string;
  const ageStr = formData.get("age") as string;
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

  // Use provided age or fallback
  const avatarMeasurements = (avatar.measurements || {}) as Record<string, unknown>;
  const age = ageStr ? Number(ageStr) : (typeof avatarMeasurements?.age === "number" ? avatarMeasurements.age : 30);
  
  // Make sure we save the age back to measurements
  avatarMeasurements.age = age;

  // Bodygram API expects height in mm (cm * 10) and weight in grams (kg * 1000)
  const heightMm = Math.round(Number(height) * 10);
  const weightG = Math.round(Number(weight) * 1000);

  // Convert image buffers to base64 for the API
  const frontBase64 = frontBuffer.toString("base64");
  const sideBase64 = sideBuffer.toString("base64");

  // Bodygram expects biological sex (male/female) for accurate ML estimation
  const mappedGender = gender.toLowerCase() === "male" ? "male" : "female";

  const BODYGRAM_ORG_ID = process.env.BODYGRAM_ORG_ID;
  const BODYGRAM_API_KEY = process.env.BODYGRAM_API_KEY;

  if (!BODYGRAM_ORG_ID || !BODYGRAM_API_KEY) {
    console.error("Missing Bodygram API credentials in .env");
    throw new Error("Missing Bodygram API credentials");
  }

  // Call Bodygram API
  const response = await fetch(`https://platform.bodygram.com/api/orgs/${BODYGRAM_ORG_ID}/scans`, {
    method: 'POST',
    headers: {
      'Authorization': BODYGRAM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      photoScan: {
        age: age,
        gender: mappedGender,
        height: heightMm,
        weight: weightG,
        frontPhoto: frontBase64,
        rightPhoto: sideBase64,
      },
    }),
  });

  if (!response.ok) {
    console.error("Bodygram API HTTP error:", response.status, await response.text());
    await db.avatar.update({
      where: { id: activeAvatarId },
      data: { status: "failed" }
    });
    return { success: false, error: "BODYGRAM_ERROR" };
  }

  const result = await response.json();
  const entry = result.entry;

  if (!entry || entry.status === "failure") {
    console.error("Bodygram scan failure:", entry);
    await db.avatar.update({
      where: { id: activeAvatarId },
      data: { status: "failed" }
    });
    throw new Error("Bodygram API scan failed");
  }

  // Success! Extract the .obj base64
  if (!entry.avatar || !entry.avatar.data) {
    throw new Error("Bodygram response missing avatar data");
  }

  const objBuffer = Buffer.from(entry.avatar.data, "base64");
  const objKey = `avatars/${user.id}/model-${Date.now()}.obj`;
  
  // Upload .obj to Cloudflare R2
  await uploadToR2(objBuffer, objKey, "model/obj");

  // Use our local R2 proxy API to securely load the R2 object
  const modelUrl = `/api/r2?url=r2://${bucketName}/${objKey}`;

  // Bodygram measurements is an array of {name, unit, value}. We convert it to a key-value dictionary.
  const parsedMeasurements: Record<string, unknown> = {};
  if (Array.isArray(entry.measurements)) {
    entry.measurements.forEach((m: { name: string; value: unknown }) => {
      parsedMeasurements[m.name] = m.value;
    });
  }

  // Compile full measurements JSON
  const finalMeasurements = {
    ...avatarMeasurements,
    ...parsedMeasurements, 
  };

  const bodygramData = {
    rawMeasurements: entry.measurements,
    bodyComposition: entry.bodyComposition,
    posture: entry.posture,
  };

  // Update Avatar status to completed, increment user quota, and create scan log
  await db.$transaction([
    db.avatar.update({
      where: { id: activeAvatarId },
      data: {
        gender,
        height: Number(height),
        weight: Number(weight),
        status: "completed",
        modelUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        measurements: finalMeasurements as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bodygramData: bodygramData as any,
        previewUrl: `/api/r2?url=r2://${bucketName}/${frontKey}`, // using front photo as preview
      }
    }),
    db.user.update({
      where: { id: user.id },
      data: { avatarMonthlyCount: { increment: 1 } }
    }),
    db.avatarScanLog.create({
      data: { userId: user.id }
    })
  ]);

  revalidatePath("/[locale]/portal", "layout");
  return { success: true };
}

