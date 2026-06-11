"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

async function getTenantId() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
  if (!tenantId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    if (!mem) throw new Error("No tenant");
    tenantId = mem.tenantId;
  }
  return tenantId;
}

export async function getBrandsAction() {
  try {
    const brands = await db.garmentBrand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });
    return { brands };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function validateGarmentSkuAction(sku: string) {
  try {
    if (!sku || sku.trim() === "") {
      return { error: "El SKU no puede estar vacío." };
    }

    const existingGarment = await db.garmentTemplate.findUnique({
      where: { sku: sku.trim() }
    });

    if (existingGarment) {
      return { inUse: true };
    }

    return { inUse: false };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createGarmentTemplateAction(data: {
  name: string;
  brandName: string;
  sku: string;
  category: string;
}) {
  try {
    const tenantId = await getTenantId();

    // Validar SKU de nuevo por seguridad
    const existingSku = await db.garmentTemplate.findUnique({
      where: { sku: data.sku.trim() }
    });
    if (existingSku) {
      throw new Error("El SKU ya está en uso.");
    }

    // Gestionar la marca (buscar o crear)
    let brandId = null;
    if (data.brandName && data.brandName.trim() !== "") {
      // Capitalizar primera letra:
      const formattedBrandName = data.brandName.trim().charAt(0).toUpperCase() + data.brandName.trim().slice(1).toLowerCase();
      
      let brand = await db.garmentBrand.findUnique({
        where: { name: formattedBrandName }
      });

      if (!brand) {
        brand = await db.garmentBrand.create({
          data: { name: formattedBrandName }
        });
      }
      brandId = brand.id;
    }

    // Por ahora apuntamos al modelo local base. Luego esto se subirá a Cloudflare R2
    const baseModelUrl = data.category.toLowerCase() === "remera" ? "/models/remera.glb" : null;

    const garment = await db.garmentTemplate.create({
      data: {
        ownerId: tenantId,
        brandId: brandId,
        sku: data.sku.trim(),
        name: data.name.trim(),
        category: data.category.toLowerCase(),
        baseModelUrl: baseModelUrl,
        status: "complete", // Lo marcamos completo porque ya tiene un GLB base local
      }
    });

    return { success: true, garmentId: garment.id };
  } catch (error: any) {
    return { error: error.message || "Error al guardar la prenda" };
  }
}
