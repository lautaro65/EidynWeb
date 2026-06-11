import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("apiKey");
    const sku = searchParams.get("sku");

    if (!apiKey || !sku) {
      return NextResponse.json({ hasModel: false, error: "Missing parameters" }, { headers: corsHeaders });
    }

    // 1. Validate API Key
    const dbKey = await db.apiKey.findUnique({
      where: { publicKey: apiKey },
      include: {
        tenant: {
          include: {
            integrations: true,
          }
        }
      }
    });

    if (!dbKey || !dbKey.isActive) {
      return NextResponse.json({ hasModel: false, error: "Invalid API Key" }, { headers: corsHeaders });
    }

    const tenant = dbKey.tenant;

    // 2. Domain Security Verification
    let isAuthorized = false;
    let originHost = "";
    
    try {
      // Intenta parsear el origen si es una URL completa
      if (origin) {
        originHost = new URL(origin).hostname.replace(/^www\./, "");
      }
    } catch (e) {
      // Si el origin es directamente un dominio (ej: tienda.com)
      originHost = origin.replace(/^www\./, "");
    }

    // 2.a Revisa contra URLs de integraciones (Ej: Shopify)
    for (const integration of tenant.integrations) {
      if (integration.storeUrl) {
        try {
          const storeHost = new URL(integration.storeUrl).hostname.replace(/^www\./, "");
          if (storeHost === originHost || originHost.includes(storeHost)) {
            isAuthorized = true;
            break;
          }
        } catch (e) {
          // ignorar URLs mal formateadas
        }
      }
    }

    // 2.b Revisa contra Dominios Autorizados explícitos en widgetConfig
    if (!isAuthorized && tenant.widgetConfig) {
      const config = tenant.widgetConfig as { authorizedDomains?: string[] };
      if (config.authorizedDomains && Array.isArray(config.authorizedDomains)) {
        for (const domain of config.authorizedDomains) {
          try {
             const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
             if (originHost === cleanDomain || originHost.endsWith("." + cleanDomain)) {
                 isAuthorized = true;
                 break;
             }
          } catch(e) {}
        }
      }
    }

    // Permitir localhost SIEMPRE para desarrollo y testing local
    if (originHost === "localhost" || originHost === "127.0.0.1" || originHost === "") {
      isAuthorized = true; // Nota: en producción estricta, originHost "" podría bloquearse
    }

    if (!isAuthorized) {
      console.warn(`[WIDGET SECURITY] Acceso denegado: Origen "${originHost}" no autorizado para Tenant ${tenant.id}`);
      return NextResponse.json({ hasModel: false, error: "Domain not authorized" }, { headers: corsHeaders });
    }

    // 3. Buscar Producto por SKU
    // Buscamos tanto en el slug base como en las variantes
    const product = await db.product.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { slug: sku }, 
          { variants: { some: { sku: sku } } }
        ]
      }
    });

    if (!product) {
      return NextResponse.json({ hasModel: false, error: "Product not found" }, { headers: corsHeaders });
    }

    // 4. Verificar si tiene Mapeo 3D
    const listing = await db.garmentListing.findFirst({
      where: { storeProductId: product.id }
    });

    if (!listing || !listing.isActive) {
      return NextResponse.json({ hasModel: false }, { headers: corsHeaders });
    }

    // 5. ¡Éxito! Devolver ID del modelo y configuración
    return NextResponse.json({
      hasModel: true,
      garmentId: listing.garmentId,
      config: tenant.widgetConfig || { theme: "system", brandColor: "#000000" }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Widget Init Error:", error);
    return NextResponse.json({ hasModel: false, error: "Internal Error" }, { headers: corsHeaders, status: 500 });
  }
}
