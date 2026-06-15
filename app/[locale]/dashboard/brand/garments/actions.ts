"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createTestGarmentAction() {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const membership = await db.membership.findFirst({
    where: { user: { clerkId: clerkUser.id } },
    include: { tenant: true },
  });

  if (!membership || membership.tenant.type !== "brand") {
    throw new Error("Unauthorized");
  }

  // Generate unique ID for SKU to avoid collisions
  const uniqueId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const sku = `TEST-HOODIE-${uniqueId}`;
  
  const payload = {
    sku,
    name: `Hoodie Prueba ${uniqueId}`,
    category: "hoodie",
    gender: "unisex",
    description: "Modelo de prueba generado automáticamente.",
    status: "completed",
    components: {
      hoodType: "hoodStandard",
      pocketType: "pocketKangaroo",
      cuffType: "cuffRibbed",
      hemType: "hemRibbed"
    },
    sizing: {
      baseSizeName: "M",
      system: "alpha",
      chart: {
        "M": {
          measureChest: 58,
          measureLength: 72,
          measureSleeve: 66,
          measureShoulder: 48,
        }
      }
    },
    variants: [
      {
        name: "Negro Clásico",
        color: "#000000",
        frontImageUrl: null,
        backImageUrl: null,
        textureUrl: null,
        backTextureUrl: null,
        status: "completed"
      }
    ]
  };

  const result = await db.$transaction(async (tx) => {
    // 1. Create the GarmentTemplate
    const garment = await tx.garmentTemplate.create({
      data: {
        ownerId: membership.tenantId,
        sku: payload.sku,
        name: payload.name,
        category: payload.category,
        gender: payload.gender,
        description: payload.description,
        componentsData: payload.components,
        status: payload.status, 
      },
    });

    // 2. Create the Sizes
    const sizesToCreate = Object.entries(payload.sizing.chart).map(([sizeLabel, measurements]) => ({
      garmentId: garment.id,
      label: sizeLabel,
      system: payload.sizing.system,
      isBase: sizeLabel === payload.sizing.baseSizeName,
      chest: measurements.measureChest,
      length: measurements.measureLength,
      sleeve: measurements.measureSleeve,
      shoulders: measurements.measureShoulder,
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
      frontImageUrl: v.frontImageUrl,
      backImageUrl: v.backImageUrl,
      textureUrl: v.textureUrl,
      backTextureUrl: v.backTextureUrl,
      status: v.status
    }));

    await tx.garmentVariant.createMany({
      data: variantsToCreate
    });

    return garment;
  });

  revalidatePath("/[locale]/dashboard/brand/garments", "page");
  return { success: true, garmentId: result.id };
}
