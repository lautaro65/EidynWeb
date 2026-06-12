"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
  });

  return { available: !existing };
}

export async function createGarmentTemplate(data: {
  sku: string;
  name: string;
  category: string;
  gender: string;
  description?: string;
  baseColor?: string;
  frontImage?: string;
  backImage?: string;
}) {
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
      sku: data.sku,
      ownerId: membership.tenantId
    },
  });

  if (existingSku) {
    throw new Error(`El SKU '${data.sku}' ya está en uso.`);
  }

  const garment = await db.garmentTemplate.create({
    data: {
      ownerId: membership.tenantId,
      sku: data.sku,
      name: data.name,
      category: data.category,
      gender: data.gender,
      description: data.description || null,
      sourceImageUrl: data.frontImage || null,
      sourceImageBackUrl: data.backImage || null,
      status: "pending", // Default status for new models
    },
  });

  revalidatePath("/dashboard/brand/garments");
  
  return { success: true, garmentId: garment.id };
}
