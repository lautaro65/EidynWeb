import { Ruler, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { SizeGuidesToolbar } from "@/components/dashboard/size-guides-toolbar";
import { SizeGuideCard } from "@/components/dashboard/size-guide-card";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type Props = {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>;
};

export default async function SizeGuidesPage({ searchParams }: Props) {
  const t = await getTranslations("SizeGuides");
  const params = await searchParams;

  const normalizeCategory = (category: string) => {
    const value = category.toLowerCase();

    if (["remeras", "remera", "t-shirts", "tshirt", "shirt"].includes(value)) return "remeras";
    if (["pantalones", "pantalon", "pants", "trousers"].includes(value)) return "pantalones";
    if (["abrigos", "abrigo", "coats", "coat"].includes(value)) return "abrigos";

    return value;
  };

  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  let tenantId = (sessionClaims?.metadata as any)?.tenantId as string;
  if (!tenantId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    tenantId = mem?.tenantId as string;
  }

  if (!tenantId) return null;

  const dbGuides = await db.sizeGuide.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const allSizeGuides = dbGuides.map(g => {
    const matrix = g.matrix as any;
    return {
      id: g.id,
      name: g.name,
      category: normalizeCategory(g.category),
      sizes: (matrix?.sizes || []).map((s: any) => s.name || s),
      rawSizes: matrix?.sizes || [],
      matrixValues: matrix?.values || {},
      linkedCount: g._count.products,
      status: g.status,
      lastUpdated: new Date(g.updatedAt).toLocaleDateString()
    };
  });

  // Filtrado
  const sizeGuides = allSizeGuides.filter(guide => {
    if (params.status && params.status !== "all" && guide.status !== params.status) return false;
    if (params.category && params.category !== "all" && guide.category !== params.category) return false;
    if (params.search && !guide.name.toLowerCase().includes(params.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Ruler className="w-8 h-8 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        </div>
        
        <Link 
          href="/dashboard/size-guides/new"
          className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] transition-all duration-300"
        >
          <Plus className="w-5 h-5" /> {t("newGuide")}
        </Link>
      </div>

      {/* Toolbar */}
      <SizeGuidesToolbar />

      {/* Grid de Guías */}
      {sizeGuides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/5 border-dashed rounded-[2rem] bg-background/30 backdrop-blur-md text-center shadow-sm">
          <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/10">
            <Ruler className="h-10 w-10 text-muted-foreground opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{t("noResults.title")}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-light">
            {t("noResults.desc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sizeGuides.map((guide) => (
            <SizeGuideCard 
              key={guide.id} 
              guide={guide}
            />
          ))}
        </div>
      )}

    </div>
  );
}
