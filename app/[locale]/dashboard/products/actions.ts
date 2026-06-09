"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncCatalogAction() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    // 1. Get all active integrations
    const integrations = await db.integration.findMany({
      where: { tenantId, status: "connected" }
    });

    if (integrations.length === 0) {
      return { error: "No hay integraciones activas para sincronizar." };
    }

    // 2. Iterate and sync based on provider
    let totalSynced = 0;
    for (const integration of integrations) {
      if (integration.provider === "shopify") {
        const count = await syncShopifyProducts(tenantId, integration);
        totalSynced += count;
      } else {
        console.warn(`Provider ${integration.provider} no tiene lógica de sincronización aún.`);
      }
    }

    revalidatePath("/[locale]/dashboard/products", "page");
    return { success: true, count: totalSynced };

  } catch (error) {
    console.error("Error in syncCatalogAction:", error);
    return { error: (error as Error).message || "Error al sincronizar el catálogo" };
  }
}

async function syncShopifyProducts(tenantId: string, integration: { storeUrl: string | null, accessToken: string | null, id: string }) {
  if (!integration.storeUrl || !integration.accessToken) {
    throw new Error("Credenciales de Shopify incompletas.");
  }

  const cleanUrl = integration.storeUrl.replace(/\/$/, "");
  const endpoint = `https://${cleanUrl}/admin/api/2024-04/products.json?limit=50`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": integration.accessToken,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Shopify sync error:", errorText);
    throw new Error(`Error de Shopify: ${response.statusText}`);
  }

  const data = await response.json();
  const products = data.products || [];

  // Ensure a Store exists for this tenant
  let store = await db.store.findFirst({
    where: { tenantId }
  });

  if (!store) {
    store = await db.store.create({
      data: {
        tenantId,
        name: `Tienda ${cleanUrl}`,
        status: "active"
      }
    });
  }

  let syncedCount = 0;

  // Iterate over products and save to local DB
  for (const sp of products) {
    const mainImage = sp.images?.[0]?.src || null;
    const spSlug = sp.handle || sp.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    let product = await db.product.findFirst({
      where: { slug: spSlug, storeId: store.id }
    });

    if (product) {
      product = await db.product.update({
        where: { id: product.id },
        data: {
          name: sp.title,
          status: sp.status === "active" ? "active" : "draft",
          description: sp.body_html || null,
        }
      });
    } else {
      product = await db.product.create({
        data: {
          tenantId,
          storeId: store.id,
          name: sp.title,
          slug: spSlug,
          status: sp.status === "active" ? "active" : "draft",
          description: sp.body_html || null,
        }
      });
    }

    // Handle Asset (Image)
    if (mainImage) {
      const existingAsset = await db.productAsset.findFirst({
        where: { productId: product.id }
      });
      if (!existingAsset) {
        await db.productAsset.create({
          data: {
            productId: product.id,
            url: mainImage,
            type: "image"
          }
        });
      } else {
        await db.productAsset.update({
          where: { id: existingAsset.id },
          data: { url: mainImage }
        });
      }
    }

    // Handle Variants
    for (const v of sp.variants || []) {
      const variantSku = v.sku || v.id.toString();
      await db.productVariant.upsert({
        where: { sku: variantSku },
        create: {
          productId: product.id,
          sku: variantSku,
          price: v.price ? parseFloat(v.price) : 0,
          barcode: v.barcode || null,
          status: "active"
        },
        update: {
          price: v.price ? parseFloat(v.price) : 0,
          barcode: v.barcode || null,
        }
      });
    }
    
    syncedCount++;
  }

  // Update integration sync timestamp
  await db.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() }
  });
  
  return syncedCount;
}

export async function getGarmentsForMappingAction(params: {
  tab: "own" | "community";
  search: string;
  page: number;
  limit: number;
  likedOnly: boolean;
}) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const { tab, search, page, limit, likedOnly } = params;
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {
      status: "complete"
    };

    if (tab === "own") {
      whereClause.ownerId = tenantId;
    } else {
      whereClause.isPublic = true;
      whereClause.ownerId = { not: tenantId };
      
      if (likedOnly) {
        // Find garment ids that this tenant liked
        const likes = await db.garmentLike.findMany({
          where: { tenantId },
          select: { garmentId: true }
        });
        const likedGarmentIds = likes.map(l => l.garmentId);
        whereClause.id = { in: likedGarmentIds };
      }
    }

    if (search && search.trim() !== "") {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } }
      ];
    }

    const [total, data] = await Promise.all([
      db.garmentTemplate.count({ where: whereClause }),
      db.garmentTemplate.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          sku: true,
          baseModelUrl: true,
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    return {
      success: true,
      data,
      total,
      hasMore: skip + data.length < total
    };
  } catch (error) {
    console.error("Error fetching garments for mapping:", error);
    return { error: "Failed to fetch garments" };
  }
}

export async function mapProductToGarmentAction(productId: string, garmentId: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const product = await db.product.findUnique({
      where: { id: productId, tenantId }
    });

    if (!product) return { error: "Product not found" };

    // Check if listing already exists for this product
    const existingListing = await db.garmentListing.findFirst({
      where: { storeProductId: productId }
    });

    if (existingListing) {
      await db.garmentListing.update({
        where: { id: existingListing.id },
        data: { garmentId }
      });
    } else {
      // Check if the garmentId + storeId combo already exists (due to unique constraint)
      const existingCombo = await db.garmentListing.findUnique({
        where: {
          storeId_garmentId: {
            storeId: product.storeId,
            garmentId
          }
        }
      });

      if (existingCombo) {
        // If it exists, just update it to point to this product.
        // NOTE: This means one GarmentTemplate per store can only be linked to ONE Product right now.
        await db.garmentListing.update({
          where: { id: existingCombo.id },
          data: { storeProductId: productId }
        });
      } else {
        await db.garmentListing.create({
          data: {
            storeId: product.storeId,
            garmentId,
            storeProductId: productId,
            customName: product.name
          }
        });
      }
    }

    revalidatePath("/[locale]/dashboard/products", "page");
    return { success: true };
  } catch (error) {
    console.error("Error mapping product:", error);
    return { error: "Error al mapear el producto" };
  }
}

export async function unmapProductFromGarmentAction(productId: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { error: "Unauthorized" };

    let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
      if (!mem) return { error: "No tenant" };
      tenantId = mem.tenantId;
    }

    const product = await db.product.findUnique({
      where: { id: productId, tenantId }
    });

    if (!product) return { error: "Product not found" };

    await db.garmentListing.deleteMany({
      where: { storeProductId: productId }
    });

    revalidatePath("/[locale]/dashboard/products", "page");
    return { success: true };
  } catch (error) {
    console.error("Error unmapping product:", error);
    return { error: "Error al desvincular el producto" };
  }
}

export async function getGarmentPreviewAction(garmentId: string) {
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
      where: { id: garmentId },
      include: {
        brand: true,
        variants: true,
        sizes: true
      }
    });

    if (!garment) return { error: "Modelo 3D no encontrado" };

    const formattedData = {
      id: garment.id,
      name: garment.name || "",
      sku: garment.sku,
      category: garment.category || "",
      isPublic: garment.isPublic,
      status: garment.status,
      isOwner: garment.ownerId === tenantId,
      previewUrl: garment.sourceImageUrl,
      baseModelUrl: garment.baseModelUrl,
      variantsCount: garment.variants.length,
      brand: garment.brand?.name || null,
      isLiked: false,
      variants: garment.variants.map(v => ({
        id: v.id,
        name: v.name,
        type: v.type,
        colorHex: v.colorHex,
        previewImageUrl: v.previewImageUrl,
        textureUrl: v.textureUrl,
        backTextureUrl: v.backTextureUrl,
        status: v.status
      })),
      sizes: garment.sizes.map(s => ({
        id: s.id,
        label: s.label,
        scaleX: s.scaleX,
        scaleY: s.scaleY,
        scaleZ: s.scaleZ
      }))
    };

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Error fetching garment preview:", error);
    return { error: "Error al cargar la previsualización" };
  }
}
