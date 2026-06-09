import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyApiRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  // 1. Verify the incoming API Key
  const authResult = await verifyApiRequest(request);

  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { tenantId } = authResult;

  try {
    // 2. Fetch the garments for this tenant
    // We only return garments that are fully active/generated.
    const garments = await db.garmentTemplate.findMany({
      where: {
        ownerId: tenantId,
      },
      include: {
        brand: true,
        variants: {
          include: {
            sizes: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // 3. Format the response to be clean and developer-friendly
    const formattedGarments = garments.map(garment => ({
      id: garment.id,
      name: garment.name,
      sku: garment.sku,
      brand: garment.brand?.name || null,
      category: garment.category,
      isPublic: garment.isPublic,
      assets: {
        frontImage: garment.sourceImageUrl,
        backImage: garment.sourceImageBackUrl,
        baseMeshUrl: garment.baseModelUrl,
      },
      status: garment.status,
      variants: garment.variants.map((variant: { id: string; name: string | null; colorHex: string | null; textureUrl: string | null; backTextureUrl: string | null; sizes: unknown }) => ({
        id: variant.id,
        name: variant.name,
        colorHex: variant.colorHex,
        textureUrl: variant.textureUrl,
        backTextureUrl: variant.backTextureUrl,
        sizes: variant.sizes
      })),
      createdAt: garment.createdAt,
      updatedAt: garment.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      count: formattedGarments.length,
      data: formattedGarments
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching garments API V1:", error);
    return NextResponse.json({ error: "Failed to fetch garments" }, { status: 500 });
  }
}
