import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { Shirt, Users, TrendingUp, Star, ArrowRight, Activity, Plus, LayoutDashboard } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function BrandDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("BrandDashboard");

  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect(`/${locale}/sign-in`);
  }

  const membership = await db.membership.findFirst({
    where: { user: { clerkId: clerkUser.id } },
    include: { tenant: true },
  });

  if (!membership || membership.tenant.type !== "brand") {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch real data
  const totalGarments = await db.garmentTemplate.count({
    where: { ownerId: membership.tenantId },
  });

  const uniqueStoresRaw = await db.garmentListing.groupBy({
    by: ['storeId'],
    where: { garment: { ownerId: membership.tenantId } },
  });
  const connectedStores = uniqueStoresRaw.length;

  const recentGarments = await db.garmentTemplate.findMany({
    where: { ownerId: membership.tenantId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { variants: true }
  });
  // Fetch stats from the database here
  const stats = [
    {
      label: t("totalGarments") || "Prendas Totales",
      value: totalGarments.toString(),
      icon: Shirt,
      description: t("activeInCatalog") || "En tu catálogo 3D",
    },
    {
      label: t("connectedStores") || "Tiendas Conectadas",
      value: connectedStores.toString(),
      icon: Users,
      description: t("usingYourGarments") || "Usando tus modelos",
    },
    {
      label: t("totalTryOns") || "Try-Ons Mensuales",
      value: "12.4k", // Mock data for now
      icon: TrendingUp,
      description: t("fromAllStores") || "+18% vs mes anterior",
    },
    {
      label: t("communityRating") || "Interacción",
      value: "Alto",
      icon: Activity,
      description: t("basedOnReviews") || "Top 5% de marcas",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground">
          {t("welcome") || "Bienvenido a tu Marca"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("subtitle") || "Gestiona tus prendas 3D y distribúyelas a cientos de tiendas."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm hover:bg-white/10 transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[30px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500" />
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.label}
              </p>
              <h3 className="text-3xl font-semibold text-foreground tracking-tight">
                {stat.value}
              </h3>
              <p className="text-xs text-muted-foreground/80 mt-2 font-light">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Garments Section */}
        <div className="p-8 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium">{t("recentGarments") || "Prendas Recientes"}</h3>
            <Link href="/dashboard/brand/garments" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentGarments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Shirt className="w-8 h-8" />
              </div>
              <p className="text-muted-foreground text-sm max-w-[250px] mb-4">
                {t("noGarmentsYet") || "Aún no has subido ninguna prenda 3D. ¡Empieza a crear tu catálogo!"}
              </p>
              <Link 
                href="/dashboard/brand/garments/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Crear Prenda
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentGarments.map((garment) => (
                <Link key={garment.id} href={`/dashboard/brand/garments/new?id=${garment.id}`} className="group flex items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Shirt className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{garment.name || "Borrador sin nombre"}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{garment.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 bg-white/10 rounded-md text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {garment.status === "draft" ? "Borrador" : "Terminada"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action Required / Alerts Section */}
        <div className="p-8 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
          <h3 className="text-xl font-medium mb-6">Alertas y Sugerencias</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-500 mb-1">Completa tu perfil de marca</h4>
                <p className="text-xs text-muted-foreground">Sube el logo y los colores de tu marca para que el probador virtual se integre perfectamente con la identidad de tus tiendas.</p>
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-1">Nuevas tiendas te están buscando</h4>
                <p className="text-xs text-muted-foreground">Mantén tu catálogo actualizado. Las tiendas que venden prendas similares a las tuyas están explorando modelos 3D esta semana.</p>
              </div>
            </div>

            <Link href="/dashboard/shop" className="block mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/40 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 group">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    Gestionar Mi Tienda <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-xs text-muted-foreground">Vincula tus prendas a productos de Shopify y gestiona tus ventas.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
