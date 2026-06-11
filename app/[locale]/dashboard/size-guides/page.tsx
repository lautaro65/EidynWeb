import { Ruler, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { SizeGuidesToolbar } from "@/components/dashboard/size-guides-toolbar";
import { SizeGuideCard } from "@/components/dashboard/size-guide-card";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>;
};

type SessionMetadata = { tenantId?: string };
type MatrixSize = { id?: string; name?: string };
type SizeGuideMatrix = {
  sizes?: MatrixSize[];
  values?: Record<string, string>;
};

type SizeGuideRow = {
  id: string;
  name: string;
  category: string;
  matrix: unknown;
  _count: { products: number };
  status: string;
  updatedAt: Date;
};

type NormalizedSizeGuide = {
  id: string;
  name: string;
  category: string;
  sizes: string[];
  rawSizes: { id: string; name: string }[];
  matrixValues: Record<string, string>;
  linkedCount: number;
  status: string;
  lastUpdated: string;
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
  if (!userId) redirect("/sign-in");

  let tenantId = (sessionClaims?.metadata as SessionMetadata | undefined)?.tenantId;
  if (!tenantId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    tenantId = mem?.tenantId as string;
  }

  if (!tenantId) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center justify-center py-20 border border-border/40 border-dashed rounded-[2rem] bg-background/30 backdrop-blur-md text-center shadow-sm">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6 shadow-inner ring-1 ring-border/50">
            <Ruler className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{t("noTenant")}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-light">
            {t("noTenantDesc")}
          </p>
          <Link href="/dashboard/onboarding" className="mt-6 rounded-xl bg-foreground text-background px-5 py-2.5 font-semibold">
            Completar onboarding
          </Link>
        </div>
      </div>
    );
  }

  const dbGuides = await db.sizeGuide
    .findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    })
    .catch(() => null);

  if (!dbGuides) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center justify-center py-20 border border-destructive/30 border-dashed rounded-[2rem] bg-background/40 backdrop-blur-md text-center shadow-sm">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 ring-1 ring-destructive/30">
            <Ruler className="h-10 w-10 text-destructive/70" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{t("errorLoading", { fallback: "No pudimos cargar las guias" })}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-light">
            {t("errorLoadingDesc", { fallback: "Reintenta en unos segundos. Si el problema persiste, revisa la conexion a la base de datos." })}
          </p>
          <Link href="/dashboard/size-guides" className="mt-6 rounded-xl bg-foreground text-background px-5 py-2.5 font-semibold">
            {t("retry", { fallback: "Reintentar" })}
          </Link>
        </div>
      </div>
    );
  }

  const allSizeGuides: NormalizedSizeGuide[] = dbGuides.map((g: SizeGuideRow) => {
    const matrix = (g.matrix ?? {}) as SizeGuideMatrix;
    const normalizedRawSizes = (matrix.sizes || []).map((size, index) => ({
      id: size.id || `size-${index}`,
      name: size.name || "-",
    }));

    return {
      id: g.id,
      name: g.name,
      category: normalizeCategory(g.category),
      sizes: normalizedRawSizes.map((size) => size.name),
      rawSizes: normalizedRawSizes,
      matrixValues: matrix?.values || {},
      linkedCount: g._count.products,
      status: g.status,
      lastUpdated: new Date(g.updatedAt).toLocaleDateString()
    };
  });

  // Filtrado
  const sizeGuides = allSizeGuides.filter((guide: NormalizedSizeGuide) => {
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
        <div className="flex flex-col items-center justify-center py-20 border border-border/40 border-dashed rounded-[2rem] bg-background/30 backdrop-blur-md text-center shadow-sm">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6 shadow-inner ring-1 ring-border/50">
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
