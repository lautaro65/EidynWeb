"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function checkSkuUnique(sku: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const existing = await db.garmentTemplate.findFirst({
      where: {
        sku: sku,
        ownerId: tenantId
      }
    });

    return { isUnique: !existing };
  } catch (error) {
    console.error("Error checking SKU:", error);
    return { error: "Failed to validate SKU" };
  }
}

import { uploadToR2 } from "@/lib/r2";
import { inngest } from "@/inngest/client";

export async function createGarmentTemplateAction(formData: FormData) {
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
    const sku = formData.get("sku") as string;
    const frontImage = formData.get("frontImage") as File;
    const backImage = formData.get("backImage") as File;

    if (!name || !sku || !frontImage || !backImage) {
      return { error: "Missing required fields" };
    }

    // Convert files to Buffer and upload to R2
    const frontBuffer = Buffer.from(await frontImage.arrayBuffer());
    const backBuffer = Buffer.from(await backImage.arrayBuffer());

    const timestamp = Date.now();
    const frontKey = `garments/uploads/${tenantId}/${timestamp}_front_${frontImage.name}`;
    const backKey = `garments/uploads/${tenantId}/${timestamp}_back_${backImage.name}`;

    const frontUrl = await uploadToR2(frontBuffer, frontKey, frontImage.type);
    const backUrl = await uploadToR2(backBuffer, backKey, backImage.type);

    // Create GarmentTemplate with status processing
    const template = await db.garmentTemplate.create({
      data: {
        ownerId: tenantId,
        name,
        sku,
        status: "processing",
        sourceImageUrl: frontUrl,
        sourceImageBackUrl: backUrl
      }
    });

    // Create AiJob
    const aiJob = await db.aiJob.create({
      data: {
        tenantId,
        type: "garment_model",
        status: "pending",
        inputData: { sourceImageUrl: frontUrl, sourceImageBackUrl: backUrl }
      }
    });

    // Trigger Inngest
    await inngest.send({
      name: "garment.process",
      data: {
        aiJobId: aiJob.id,
        templateId: template.id,
        sourceImageUrl: frontUrl
      }
    });

    return { success: true, templateId: template.id };
  } catch (error) {
    console.error("Error creating GarmentTemplate:", error);
    return { error: "Failed to create garment template" };
  }
}

export async function createGarmentVariantsAction(templateId: string, formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const template = await db.garmentTemplate.findUnique({ where: { id: templateId } });
    if (!template || template.ownerId !== tenantId) {
      return { error: "Template not found or unauthorized" };
    }

    const variantsCount = Number(formData.get("variantsCount"));
    const createdVariants = [];

    for (let i = 0; i < variantsCount; i++) {
      const name = formData.get(`variant_${i}_name`) as string;
      const type = formData.get(`variant_${i}_type`) as string; // 'solid' or 'texture'
      const colorHex = formData.get(`variant_${i}_colorHex`) as string | null;
      const file = formData.get(`variant_${i}_file`) as File | null;

      let textureUrl = null;

      if (type === 'texture' && file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const key = `garments/${templateId}/textures/${timestamp}_${file.name}`;
        textureUrl = await uploadToR2(buffer, key, file.type);
      }

      const variant = await db.garmentVariant.create({
        data: {
          garmentId: templateId,
          name,
          colorHex: type === 'solid' ? colorHex : null,
          textureUrl: textureUrl,
          status: "completed",
        }
      });
      createdVariants.push(variant.id);
    }

    return { success: true, count: createdVariants.length };
  } catch (error) {
    console.error("Error creating variants:", error);
    return { error: "Failed to create variants" };
  }
}

export async function createGarmentSizesAction(templateId: string, sizesData: { label: string; system: string; chest: number; shoulders: number; length: number }[]) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const template = await db.garmentTemplate.findUnique({
      where: { id: templateId },
      include: { variants: true }
    });
    
    if (!template || template.ownerId !== tenantId) {
      return { error: "Template not found or unauthorized" };
    }

    if (!sizesData || sizesData.length === 0) {
      return { error: "No sizes provided" };
    }

    // Find the middle size index for scale reference
    const middleIndex = Math.floor(sizesData.length / 2);
    const refSize = sizesData[middleIndex];
    const refChest = refSize.chest;
    const refLength = refSize.length;

    const createdSizes = [];

    for (const s of sizesData) {
      // Calculate scales
      // X and Z scale proportionally to Chest
      // Y scales proportionally to Length
      const scaleX = s.chest / refChest;
      const scaleZ = s.chest / refChest; // Usually chest depth scales with width
      const scaleY = s.length / refLength;

      const size = await db.garmentSize.create({
        data: {
          garmentId: templateId,
          label: s.label,
          system: s.system,
          chest: s.chest,
          shoulders: s.shoulders,
          length: s.length,
          scaleX,
          scaleY,
          scaleZ,
        }
      });
      createdSizes.push(size);
    }

    // We do NOT create GarmentVariantSize here anymore. That happens in Step 5.

    return { success: true, createdSizes, variants: template.variants, sku: template.sku };
  } catch (error) {
    console.error("Error creating sizes:", error);
    return { error: "Failed to create sizes" };
  }
}

export async function createGarmentVariantSizesAction(templateId: string, cartesianData: { variantId: string; sizeId: string; active: boolean }[]) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const template = await db.garmentTemplate.findUnique({
      where: { id: templateId }
    });
    
    if (!template || template.ownerId !== tenantId) {
      return { error: "Template not found or unauthorized" };
    }

    if (cartesianData.length > 0) {
      await db.garmentVariantSize.createMany({
        data: cartesianData.map(d => ({
          variantId: d.variantId,
          sizeId: d.sizeId,
          active: d.active
        }))
      });
    }

    // Mark template as fully configured
    await db.garmentTemplate.update({
      where: { id: templateId },
      data: { status: "complete" }
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating sizes:", error);
    return { error: "Failed to create sizes" };
  }
}

export async function getSizeGuidesAction() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const sizeGuides = await db.sizeGuide.findMany({
      where: { tenantId }
    });

    return { success: true, data: sizeGuides };
  } catch (error) {
    console.error("Error fetching size guides:", error);
    return { error: "Failed to fetch size guides" };
  }
}
