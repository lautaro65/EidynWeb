"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { uploadToR2 } from "@/lib/r2";
import { removeBackground } from "@/lib/image-processing";
import { revalidatePath } from "next/cache";

export async function updateGarmentAction(templateId: string, formData: FormData) {
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
      include: { variants: true, sizes: true }
    });

    if (!template || template.ownerId !== tenantId) {
      return { error: "Template not found or unauthorized" };
    }

    // 1. Update basic info
    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const category = formData.get("category") as string;

    await db.garmentTemplate.update({
      where: { id: templateId },
      data: { name, sku, category }
    });

    // 2. Process Variants
    const variantsCount = Number(formData.get("variantsCount"));
    const incomingVariantIds = new Set<string>();

    for (let i = 0; i < variantsCount; i++) {
      const id = formData.get(`variant_${i}_id`) as string;
      const vName = formData.get(`variant_${i}_name`) as string;
      const type = formData.get(`variant_${i}_type`) as string;
      const colorHex = formData.get(`variant_${i}_colorHex`) as string | null;
      const file = formData.get(`variant_${i}_file`) as File | null;
      let textureUrl = formData.get(`variant_${i}_textureUrl`) as string | null;

      // Handle file upload if new file provided
      if (type === 'texture' && file && file.size > 0) {
        const originalBuffer = Buffer.from(await file.arrayBuffer());
        const { buffer, mimeType } = await removeBackground(originalBuffer, file.type);
        
        const timestamp = Date.now();
        const ext = mimeType === "image/png" ? "png" : file.name.split('.').pop();
        const key = `garments/${templateId}/textures/${timestamp}_${ext}`;
        textureUrl = await uploadToR2(buffer, key, mimeType);
      }

      const variantData = {
        name: vName,
        type,
        colorHex: type === 'solid' ? colorHex : null,
        textureUrl: type === 'texture' ? textureUrl : null,
      };

      if (id && !id.startsWith('new_')) {
        incomingVariantIds.add(id);
        await db.garmentVariant.update({
          where: { id },
          data: variantData
        });
      } else {
        const newVar = await db.garmentVariant.create({
          data: {
            ...variantData,
            garmentId: templateId,
            status: "completed"
          }
        });
        incomingVariantIds.add(newVar.id);
        
        // Map old fake ID to new ID for combinations processing later
        formData.append(`idMap_${id}`, newVar.id);
      }
    }

    // Delete removed variants
    const variantsToDelete = template.variants.filter(v => !incomingVariantIds.has(v.id));
    for (const v of variantsToDelete) {
      await db.garmentVariantSize.deleteMany({ where: { variantId: v.id } });
      await db.garmentVariant.delete({ where: { id: v.id } });
    }

    // 3. Process Sizes
    const sizesCount = Number(formData.get("sizesCount"));
    const incomingSizeIds = new Set<string>();

    // Calculate scale reference
    let refWidth = 1;
    let refLength = 1;
    if (sizesCount > 0) {
      const middleIndex = Math.floor(sizesCount / 2);
      refWidth = parseFloat(formData.get(`size_${middleIndex}_chest`) as string || formData.get(`size_${middleIndex}_waist`) as string || "1");
      refLength = parseFloat(formData.get(`size_${middleIndex}_length`) as string || formData.get(`size_${middleIndex}_inseam`) as string || "1");
    }

    for (let i = 0; i < sizesCount; i++) {
      const id = formData.get(`size_${i}_id`) as string;
      const label = formData.get(`size_${i}_label`) as string;
      const system = formData.get(`size_${i}_system`) as string;
      
      const chest = parseFloat(formData.get(`size_${i}_chest`) as string) || null;
      const shoulders = parseFloat(formData.get(`size_${i}_shoulders`) as string) || null;
      const length = parseFloat(formData.get(`size_${i}_length`) as string) || null;
      const waist = parseFloat(formData.get(`size_${i}_waist`) as string) || null;
      const hips = parseFloat(formData.get(`size_${i}_hips`) as string) || null;
      const inseam = parseFloat(formData.get(`size_${i}_inseam`) as string) || null;
      const sleeve = parseFloat(formData.get(`size_${i}_sleeve`) as string) || null;

      const currentWidth = chest || waist || 1;
      const currentLength = length || inseam || 1;
      const scaleX = currentWidth / refWidth;
      const scaleZ = currentWidth / refWidth;
      const scaleY = currentLength / refLength;

      const sizeData = {
        label, system, chest, shoulders, length, waist, hips, inseam, sleeve, scaleX, scaleY, scaleZ
      };

      if (id && !id.startsWith('new_')) {
        incomingSizeIds.add(id);
        await db.garmentSize.update({
          where: { id },
          data: sizeData
        });
      } else {
        const newSize = await db.garmentSize.create({
          data: {
            ...sizeData,
            garmentId: templateId
          }
        });
        incomingSizeIds.add(newSize.id);
        formData.append(`idMap_${id}`, newSize.id);
      }
    }

    // Delete removed sizes
    const sizesToDelete = template.sizes.filter(s => !incomingSizeIds.has(s.id));
    for (const s of sizesToDelete) {
      await db.garmentVariantSize.deleteMany({ where: { sizeId: s.id } });
      await db.garmentSize.delete({ where: { id: s.id } });
    }

    // 4. Process Combinations
    const combinationsCount = Number(formData.get("combinationsCount"));
    for (let i = 0; i < combinationsCount; i++) {
      let vId = formData.get(`comb_${i}_variantId`) as string;
      let sId = formData.get(`comb_${i}_sizeId`) as string;
      const active = formData.get(`comb_${i}_active`) === 'true';

      // Map pseudo IDs to real IDs if they were newly created
      if (vId.startsWith('new_')) vId = formData.get(`idMap_${vId}`) as string;
      if (sId.startsWith('new_')) sId = formData.get(`idMap_${sId}`) as string;

      if (vId && sId) {
        await db.garmentVariantSize.upsert({
          where: { variantId_sizeId: { variantId: vId, sizeId: sId } },
          create: { variantId: vId, sizeId: sId, active },
          update: { active }
        });
      }
    }

    revalidatePath("/[locale]/dashboard/garments", "page");
    return { success: true };
  } catch (error) {
    console.error("Error updating Garment:", error);
    return { error: "Failed to update garment template" };
  }
}
