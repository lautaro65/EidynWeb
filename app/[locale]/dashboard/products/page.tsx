import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import dynamic from "next/dynamic";
const ProductsClient = dynamic(() => import("./products-client").then(mod => mod.ProductsClient));
import { PlugZap, Store } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardSidebar" });
  return {
    title: `${t("products")} - Eidyn`,
  };
}

export default async function ProductsPage({ params }: Props) {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");
  const { locale } = await params;

  // Retrieve tenant ID
  let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
  if (!tenantId) {
    const mem = await db.membership.findFirst({
      where: { user: { clerkId: userId } },
    });
    if (!mem) redirect("/sign-in");
    tenantId = mem.tenantId;
  }

  // Check if tenant has any active connection (Integration or ApiKey)
  const [integrationsCount, apiKeysCount] = await Promise.all([
    db.integration.count({ where: { tenantId, status: "connected" } }),
    db.apiKey.count({ where: { tenantId, isActive: true } })
  ]);

  const hasConnections = integrationsCount > 0 || apiKeysCount > 0;

  if (!hasConnections) {
    return (
      <div className="flex-1 space-y-8 p-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative bg-background/50 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl">
              <Store className="w-16 h-16 text-muted-foreground mb-4" />
              <PlugZap className="w-8 h-8 text-destructive absolute -bottom-2 -right-2 bg-background rounded-full p-1 border border-white/10" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-heading">Sin Conexión a Tienda</h2>
            <p className="text-muted-foreground text-lg">
              Aún no has conectado ninguna tienda e-commerce o generado una API Key. Necesitamos una fuente de datos para poder sincronizar y mapear tu catálogo en 3D.
            </p>
          </div>

          <Link href={`/${locale}/dashboard/connections`} className="w-full mt-8 block">
            <Button className="w-full h-14 text-lg rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform">
              Ir a Conectar mi Tienda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch real synchronized products
  const dbProducts = await db.product.findMany({
    where: { tenantId },
    include: {
      assets: true,
      garmentListings: true,
      category: true,
    },
    orderBy: { createdAt: "desc" }
  });

  const formattedProducts = dbProducts.map(p => ({
    id: p.id,
    sku: p.slug || p.id.split("-")[0], // Fallback sku for ui
    name: p.name || "Sin Nombre",
    category: p.category?.name || "General",
    image: p.assets[0]?.url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60",
    status: p.garmentListings.length > 0 ? "mapped" as const : "unmapped" as const,
    mappedGarmentId: p.garmentListings[0]?.garmentId
  }));

  return (
    <div className="flex-1 space-y-8 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-heading">
          Catálogo y Mapeo 3D
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Sincroniza el inventario de tus plataformas conectadas y mapea cada producto a un modelo 3D dinámico.
        </p>
      </div>

      <ProductsClient initialProducts={formattedProducts} />
    </div>
  );
}
