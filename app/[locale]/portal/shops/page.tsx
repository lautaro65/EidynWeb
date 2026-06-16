import { Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ShopsList, NormalizedShop } from "./shops-list";
import { redirect } from "next/navigation";
import { ShopsTabs } from "./shops-tabs";
import { ShopsSearch } from "./shops-search";
import { Pagination } from "@/components/ui/pagination";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await getTranslations({ locale, namespace: "PortalShops" });
  return {
    title: `Privacidad y Tiendas - Eidyn`,
  };
}

export default async function PortalShopsPage(props: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; page?: string; q?: string }>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) {
    redirect(`/${locale}/portal`);
  }

  const currentTab = searchParams.tab || "connected";
  const currentPage = Math.max(1, parseInt(searchParams.page || "1"));
  const query = searchParams.q || "";
  const take = 10;
  const skip = (currentPage - 1) * take;

  let shops: NormalizedShop[] = [];
  let totalCount = 0;

  if (currentTab === "connected") {
    const [consents, count] = await Promise.all([
      db.shopConsent.findMany({
        where: {
          userId: user.id,
          tenant: { name: { contains: query, mode: "insensitive" } },
          granted: true,
        },
        include: { tenant: true },
        orderBy: { grantedAt: "desc" },
        skip,
        take,
      }),
      db.shopConsent.count({
        where: {
          userId: user.id,
          tenant: { name: { contains: query, mode: "insensitive" } },
          granted: true,
        }
      })
    ]);

    totalCount = count;
    shops = consents.map(c => ({
      tenantId: c.tenant.id,
      name: c.tenant.name || "Tienda Desconocida",
      logoUrl: c.tenant.logoUrl,
      websiteUrl: c.tenant.websiteUrl,
      granted: c.granted,
      grantedAt: c.grantedAt,
      consentId: c.id
    }));
  } else {
    // Discover: Stores that the user hasn't granted access to
    const [tenants, count] = await Promise.all([
      db.tenant.findMany({
        where: {
          type: "store",
          name: { contains: query, mode: "insensitive" },
          OR: [
            { shopConsents: { none: { userId: user.id } } },
            { shopConsents: { some: { userId: user.id, granted: false } } }
          ]
        },
        skip,
        take,
        orderBy: { createdAt: "desc" }
      }),
      db.tenant.count({
        where: {
          type: "store",
          name: { contains: query, mode: "insensitive" },
          OR: [
            { shopConsents: { none: { userId: user.id } } },
            { shopConsents: { some: { userId: user.id, granted: false } } }
          ]
        }
      })
    ]);

    totalCount = count;
    shops = tenants.map(t => ({
      tenantId: t.id,
      name: t.name || "Tienda Desconocida",
      logoUrl: t.logoUrl,
      websiteUrl: t.websiteUrl,
      granted: false
    }));
  }

  const totalPages = Math.ceil(totalCount / take);

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-semibold mb-4 border border-emerald-500/20">
          <Store className="w-4 h-4" />
          Conexiones B2C
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Privacidad y Tiendas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Administra qué marcas de ropa tienen permiso para cargar tu avatar 3D en sus probadores virtuales. Puedes revocar el acceso en cualquier momento.
        </p>
      </div>

      {/* Controles de Vista */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md relative z-10">
        <ShopsTabs />
        <ShopsSearch />
      </div>

      {/* Lista de Conexiones */}
      <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex-1">
          <ShopsList shops={shops} isDiscover={currentTab === "discover"} />
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 relative z-10 border-t border-white/10 pt-6">
            <Pagination totalPages={totalPages} />
          </div>
        )}
      </div>

    </div>
  );
}
