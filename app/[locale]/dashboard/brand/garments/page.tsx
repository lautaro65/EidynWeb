import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { Plus, Shirt } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BrandGarments" });
  return {
    title: `${t("title")} - Eidyn`,
  };
}

export default async function BrandGarmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("BrandGarments");
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

  // Fetch garments for this brand
  const garments = await db.garmentTemplate.findMany({
    where: { ownerId: membership.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8 space-y-8 min-h-[calc(100vh-6rem)] animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
        <Link
          href="/dashboard/brand/garments/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          {t("newGarment")}
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="bg-background/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden min-h-[60vh]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40" />

        <Tabs defaultValue="my-garments" className="w-full relative z-10">
          <TabsList className="mb-8 p-1 bg-white/5 border border-white/10 rounded-xl">
            <TabsTrigger 
              value="my-garments"
              className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all duration-300"
            >
              {t("tabMyGarments")}
            </TabsTrigger>
            <TabsTrigger 
              value="community"
              className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all duration-300"
            >
              {t("tabCommunity")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-garments" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            {garments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <Shirt className="w-12 h-12 text-primary relative z-10" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">{t("emptyStateTitle")}</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  {t("emptyStateDesc")}
                </p>
                <Link
                  href="/dashboard/brand/garments/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-foreground font-medium rounded-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  {t("uploadFirstBtn")}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Garment Cards will go here later */}
                {garments.map((garment) => (
                  <div key={garment.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Shirt className="w-8 h-8 opacity-50" />
                    <span className="text-sm font-medium">{garment.name || garment.sku}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="inline-flex px-3 py-1 bg-white/10 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 text-muted-foreground">
                {t("comingSoon")}
              </div>
              <h3 className="text-xl font-medium text-muted-foreground max-w-md mx-auto">
                Explora y utiliza modelos creados por la comunidad de Eidyn.
              </h3>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
