import { getTranslations } from "next-intl/server";
import { Shirt, Users, TrendingUp, Star } from "lucide-react";

export default async function BrandDashboardPage() {
  const t = await getTranslations("BrandDashboard");

  // In the future, fetch stats from the database here
  const stats = [
    {
      label: t("totalGarments") || "Prendas Totales",
      value: "0",
      icon: Shirt,
      description: t("activeInCatalog") || "Activas en el catálogo",
    },
    {
      label: t("connectedStores") || "Tiendas Conectadas",
      value: "0",
      icon: Users,
      description: t("usingYourGarments") || "Usando tus prendas",
    },
    {
      label: t("totalTryOns") || "Try-Ons Mensuales",
      value: "0",
      icon: TrendingUp,
      description: t("fromAllStores") || "En todas las tiendas",
    },
    {
      label: t("communityRating") || "Valoración",
      value: "5.0",
      icon: Star,
      description: t("basedOnReviews") || "Basado en reseñas",
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
            className="p-6 rounded-[2rem] border border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300"
          >
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
        <div className="p-8 rounded-[2rem] border border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
          <h3 className="text-xl font-medium mb-4">{t("recentGarments") || "Prendas Recientes"}</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Shirt className="w-8 h-8" />
            </div>
            <p className="text-muted-foreground text-sm max-w-[250px]">
              {t("noGarmentsYet") || "Aún no has subido ninguna prenda 3D. ¡Empieza a crear tu catálogo!"}
            </p>
          </div>
        </div>

        <div className="p-8 rounded-[2rem] border border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
          <h3 className="text-xl font-medium mb-4">{t("topStores") || "Tiendas Principales"}</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-muted-foreground text-sm max-w-[250px]">
              {t("noStoresYet") || "Las tiendas que usen tus prendas aparecerán aquí."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
