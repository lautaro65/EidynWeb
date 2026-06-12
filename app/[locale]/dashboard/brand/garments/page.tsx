import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { Plus, Shirt, Search } from "lucide-react";
import { GarmentsToolbar } from "./garments-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { Prisma } from "@prisma/client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BrandGarments" });
  return {
    title: `${t("title")} - Eidyn`,
  };
}

export default async function BrandGarmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
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

  // --- Search & Pagination Logic ---
  const currentTab = (resolvedSearchParams.tab as string) || "my-garments";
  const searchQuery = (resolvedSearchParams.q as string) || "";
  const page = Number(resolvedSearchParams.page) || 1;
  const take = 12; // Items per page
  const skip = (page - 1) * take;

  // Build the Prisma Where clause dynamically
  const whereClause: Prisma.GarmentTemplateWhereInput = {
    // Determine which dataset to query based on tab
    ...(currentTab === "my-garments" 
      ? { ownerId: membership.tenantId } 
      : { isPublic: true }
    ),
    // Apply search filter if present
    ...(searchQuery && {
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { sku: { contains: searchQuery, mode: "insensitive" } },
      ],
    }),
  };

  // Fetch count and items simultaneously
  const [totalCount, garments] = await Promise.all([
    db.garmentTemplate.count({ where: whereClause }),
    db.garmentTemplate.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / take);
  const startItem = totalCount === 0 ? 0 : skip + 1;
  const endItem = Math.min(skip + take, totalCount);

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
      <div className="bg-background/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden min-h-[60vh] flex flex-col">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40" />

        <GarmentsToolbar />

        <div className="flex-1 relative z-10 flex flex-col">
          {currentTab === "my-garments" && garments.length === 0 && !searchQuery ? (
            // Pure Empty State (no items, no search)
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
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
          ) : garments.length === 0 && searchQuery ? (
            // Empty Search Results
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">{t("noResultsFound")}</h3>
              <p className="text-muted-foreground">
                Prueba con otro término o borra los filtros.
              </p>
            </div>
          ) : (
            // Results List
            <div className="flex flex-col flex-1">
              <div className="flex justify-between items-center mb-6 text-sm text-muted-foreground">
                <span>
                  {t("showingResults", { start: startItem, end: endItem, total: totalCount })}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {garments.map((garment) => (
                  <div key={garment.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 text-muted-foreground aspect-square group hover:bg-white/10 transition-all duration-300 cursor-pointer hover:border-primary/50 relative overflow-hidden">
                    <Shirt className="w-12 h-12 opacity-50 group-hover:scale-110 group-hover:opacity-100 group-hover:text-primary transition-all duration-300" />
                    <div className="text-center">
                      <span className="block text-sm font-medium text-foreground">{garment.name || "Sin nombre"}</span>
                      <span className="block text-xs mt-1 font-mono bg-black/20 px-2 py-0.5 rounded-md">{garment.sku}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              <div className="mt-auto">
                <Pagination totalPages={totalPages} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
