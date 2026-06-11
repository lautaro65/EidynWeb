import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { WidgetViewerClient } from "@/components/widget-viewer-client";

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ garmentId?: string; apiKey?: string }>;
}) {
  const { garmentId, apiKey } = await searchParams;

  if (!garmentId || !apiKey) {
    notFound();
  }

  // Verify the API key and get tenant config
  const dbKey = await db.apiKey.findUnique({
    where: { publicKey: apiKey },
    include: { tenant: true },
  });

  if (!dbKey || !dbKey.isActive) {
    notFound();
  }

  const tenant = dbKey.tenant;
  const config = tenant.widgetConfig as { brandColor?: string; theme?: string; watermark?: boolean } | null;

  // Fetch Garment
  const garment = await db.garmentTemplate.findUnique({
    where: { id: garmentId },
    include: { variants: true },
  });

  if (!garment) {
    notFound();
  }

  // Map to format that WidgetViewerClient expects
  const mappedGarment = {
    id: garment.id,
    name: garment.name || "",
    baseModelUrl: garment.baseModelUrl,
    variants: garment.variants.map((v) => ({
      id: v.id,
      name: v.name,
      colorHex: v.colorHex,
      textureUrl: v.textureUrl,
      backTextureUrl: v.backTextureUrl,
    })),
  };

  return (
    <div className="w-full h-screen bg-background overflow-hidden m-0 p-0">
      <WidgetViewerClient
        apiKey={apiKey}
        tenantName={tenant?.name || "esta tienda"}
        garment={mappedGarment}
        brandColor={config?.brandColor || "#000000"}
        theme={config?.theme || "system"}
        showWatermark={config?.watermark !== false}
      />
    </div>
  );
}
