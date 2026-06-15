"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { removeBackground } from "@/lib/image-processing";

export async function checkSkuAvailability(sku: string) {
  if (!sku) return { available: true };
  
  const clerkUser = await currentUser();
  if (!clerkUser) return { available: true };

  const membership = await db.membership.findFirst({
    where: { user: { clerkId: clerkUser.id } },
    include: { tenant: true },
  });

  if (!membership || membership.tenant.type !== "brand") {
    return { available: true };
  }

  const existing = await db.garmentTemplate.findFirst({
    where: { 
      sku: sku,
      ownerId: membership.tenantId 
    },
    select: { id: true },
  });

  return { available: !existing };
}

export async function processImageWithRemoveBg(formData: FormData): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  try {
    const file = formData.get("image") as File;
    if (!file) return { success: false, error: "No image provided" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const { buffer: processedBuffer, mimeType } = await removeBackground(buffer, file.type);
    
    // Convert back to base64 DataURL for frontend
    const base64 = processedBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    return { success: true, dataUrl };
  } catch (err: unknown) {
    console.error("processImageWithRemoveBg Error:", err);
    return { success: false, error: "Error processing image" };
  }
}

export type SaveGarmentPayload = {
  garmentId?: string;
  status?: "draft" | "pending" | "completed";
  sku: string;
  name: string;
  category: string;
  gender: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: Record<string, any>;
  sizing: {
    baseSizeName: string;
    system: string;
    chart: Record<string, {
      measureChest: number;
      measureLength: number;
      measureSleeve: number;
      measureShoulder: number;
      measureCollar: number;
      measureHem: number;
      measureWaist: number;
      measureFrontLength: number;
      measureBackLength: number;
      measureBicep: number;
      measureWrist: number;
      measureArmhole: number;
    }>;
  };
  variants: Array<{
    name: string;
    color: string;
    frontImageUrl?: string;
    backImageUrl?: string;
    generatedTextureUrl?: string;
    generatedBackTextureUrl?: string;
  }>;
};

export async function saveGarmentAction(payload: SaveGarmentPayload) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const membership = await db.membership.findFirst({
    where: { user: { clerkId: clerkUser.id } },
    include: { tenant: true },
  });

  if (!membership || membership.tenant.type !== "brand") {
    throw new Error("Unauthorized");
  }

  // Check SKU uniqueness per tenant
  const existingSku = await db.garmentTemplate.findFirst({
    where: { 
      sku: payload.sku,
      ownerId: membership.tenantId
    },
    select: { id: true },
  });

  if (existingSku && existingSku.id !== payload.garmentId) {
    throw new Error(`El SKU '${payload.sku}' ya está en uso.`);
  }

  // We use a transaction to ensure all related data is created successfully or none at all.
  const result = await db.$transaction(async (tx) => {
    let garment;

    // 1. Create or Update the GarmentTemplate
    if (payload.garmentId) {
      garment = await tx.garmentTemplate.update({
        where: { id: payload.garmentId },
        data: {
          sku: payload.sku,
          name: payload.name,
          category: payload.category,
          gender: payload.gender,
          description: payload.description || null,
          componentsData: payload.components,
          status: payload.status || "draft", 
        },
      });

      // Clear existing relations to replace them
      await tx.garmentSize.deleteMany({ where: { garmentId: payload.garmentId } });
      await tx.garmentVariant.deleteMany({ where: { garmentId: payload.garmentId } });
    } else {
      garment = await tx.garmentTemplate.create({
        data: {
          ownerId: membership.tenantId,
          sku: payload.sku,
          name: payload.name,
          category: payload.category,
          gender: payload.gender,
          description: payload.description || null,
          componentsData: payload.components,
          status: payload.status || "draft", 
        },
      });
    }

    const parseMeasure = (val: unknown) => {
      if (val === "" || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    // 2. Create the Sizes
    const sizesToCreate = Object.entries(payload.sizing.chart).map(([sizeLabel, measurements]) => ({
      garmentId: garment.id,
      label: sizeLabel,
      system: payload.sizing.system,
      isBase: sizeLabel === payload.sizing.baseSizeName,
      chest: parseMeasure(measurements.measureChest),
      length: parseMeasure(measurements.measureLength),
      sleeve: parseMeasure(measurements.measureSleeve),
      shoulders: parseMeasure(measurements.measureShoulder),
      collar: parseMeasure(measurements.measureCollar),
      hem: parseMeasure(measurements.measureHem),
      waist: parseMeasure(measurements.measureWaist),
      frontLength: parseMeasure(measurements.measureFrontLength),
      backLength: parseMeasure(measurements.measureBackLength),
      bicep: parseMeasure(measurements.measureBicep),
      wrist: parseMeasure(measurements.measureWrist),
      armhole: parseMeasure(measurements.measureArmhole),
    }));

    await tx.garmentSize.createMany({
      data: sizesToCreate
    });

    // 3. Create the Variants
    const variantsToCreate = payload.variants.map((v) => ({
      garmentId: garment.id,
      name: v.name,
      type: "color",
      colorHex: v.color,
      frontImageUrl: v.frontImageUrl || null,
      backImageUrl: v.backImageUrl || null,
      textureUrl: v.generatedTextureUrl || null,
      backTextureUrl: v.generatedBackTextureUrl || null,
      status: "completed" // Can be changed to pending if background jobs will process textures
    }));

    await tx.garmentVariant.createMany({
      data: variantsToCreate
    });

    return garment;
  });

  revalidatePath("/[locale]/dashboard/brand/garments", "page");
  return { success: true, garmentId: result.id };
}
