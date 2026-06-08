import { Shirt, Plus, Bell } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { GarmentsToolbar } from "@/components/dashboard/garments-toolbar";
import { GarmentCard } from "@/components/dashboard/garment-card";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { GarmentsTabsWrapper } from "@/components/dashboard/garments-tabs-wrapper";
import { GarmentsPagination } from "@/components/dashboard/garments-pagination";

type Props = {
  searchParams: Promise<{ category?: string; search?: string; tab?: string; minePage?: string; globalPage?: string }>;
};

type SessionMetadata = { tenantId?: string };

const ITEMS_PER_PAGE = 9;

export default async function GarmentsPage({ searchParams }: Props) {
  const t = await getTranslations("Garments");
  const params = await searchParams;

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
            <Shirt className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No tenant assigned</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-light">
            You need to complete onboarding to view your garments.
          </p>
          <Link href="/dashboard/onboarding" className="mt-6 rounded-xl bg-foreground text-background px-5 py-2.5 font-semibold">
            Completar onboarding
          </Link>
        </div>
      </div>
    );
  }

  const activeTab = params.tab || "mine";
  const minePage = parseInt(params.minePage || "1") || 1;
  const globalPage = parseInt(params.globalPage || "1") || 1;

  // Build Filters
  const whereFilters: Prisma.GarmentTemplateWhereInput = {};
  if (params.category && params.category !== "all") {
    whereFilters.category = { equals: params.category, mode: "insensitive" };
  }
  if (params.search) {
    whereFilters.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { sku: { contains: params.search, mode: "insensitive" } }
    ];
  }

  // Common Include
  const queryInclude = {
    _count: { select: { variants: true } },
    variants: {
      include: { sizes: true }
    },
    sizes: true,
    likes: { where: { tenantId } },
    changeRequests: {
      where: { status: "pending" },
      include: { requestingTenant: true }
    }
  };

  // Queries for "Mine"
  const mineWhere: Prisma.GarmentTemplateWhereInput = {
    ...whereFilters,
    ownerId: tenantId
  };
  
  const mineCount = await db.garmentTemplate.count({ where: mineWhere });
  const mineGarmentsDb = await db.garmentTemplate.findMany({
    where: mineWhere,
    include: queryInclude,
    orderBy: { updatedAt: "desc" },
    skip: (minePage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE
  }).catch(() => null);

  // Queries for "Global" (Community)
  const globalWhere: Prisma.GarmentTemplateWhereInput = {
    ...whereFilters,
    isPublic: true,
    ownerId: { not: tenantId } // don't show my own garments in community
  };

  const globalCount = await db.garmentTemplate.count({ where: globalWhere });
  const globalGarmentsDb = await db.garmentTemplate.findMany({
    where: globalWhere,
    include: queryInclude,
    orderBy: { updatedAt: "desc" },
    skip: (globalPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE
  }).catch(() => null);

  if (!mineGarmentsDb || !globalGarmentsDb) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center justify-center py-20 border border-destructive/30 border-dashed rounded-[2rem] bg-background/40 backdrop-blur-md text-center shadow-sm">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 ring-1 ring-destructive/30">
            <Shirt className="h-10 w-10 text-destructive/70" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Error loading garments</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-light">
            Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const mapGarment = (g: {
    id: string;
    name: string | null;
    sku: string;
    category: string | null;
    isPublic: boolean;
    status: string;
    ownerId: string | null;
    baseModelUrl: string | null;
    sourceImageUrl: string | null;
    _count: { variants: number };
    variants: { id: string; name: string | null; type: string | null; colorHex: string | null; previewImageUrl: string | null; textureUrl: string | null; backTextureUrl: string | null; status: string | null }[];
    sizes: { id: string; label: string; scaleX: number | null; scaleY: number | null; scaleZ: number | null }[];
    likes: { id: string }[];
    changeRequests?: { id: string; type: string; message: string; requestingTenant?: { name: string | null } }[];
  }, isOwner: boolean) => {
    const previewVariant = g.variants?.[0];
    const previewUrl = previewVariant?.previewImageUrl || previewVariant?.textureUrl || g.sourceImageUrl || undefined;
    return {
      id: g.id,
      name: g.name || "",
      sku: g.sku,
      category: g.category || "General",
      isPublic: g.isPublic,
      status: g.status,
      isOwner,
      previewUrl,
      baseModelUrl: g.baseModelUrl,
      variantsCount: g._count.variants,
      isLiked: g.likes.length > 0,
      pendingRequests: isOwner ? g.changeRequests : undefined,
      variants: g.variants.map(v => ({ ...v, backTextureUrl: v.backTextureUrl || null, status: v.status || null })) || [],
      sizes: g.sizes || [],
    };
  };

  const myGarments = mineGarmentsDb.map(g => mapGarment(g, true));
  const communityGarments = globalGarmentsDb.map(g => mapGarment(g, false));

  const totalMinePages = Math.ceil(mineCount / ITEMS_PER_PAGE);
  const totalGlobalPages = Math.ceil(globalCount / ITEMS_PER_PAGE);

  const MineContent = (
    <>
      {myGarments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-border/40 border-dashed rounded-[2rem] bg-background/30 backdrop-blur-md text-center shadow-sm">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6 shadow-inner ring-1 ring-border/50">
            <Shirt className="h-10 w-10 text-muted-foreground opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{t("empty.title")}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-light">
            {t("empty.desc")}
          </p>
          <Link href="/dashboard/garments/new" className="mt-6 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
            {t("addBtn")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myGarments.map((garment) => (
            <GarmentCard key={garment.id} garment={garment} />
          ))}
        </div>
      )}
      <GarmentsPagination currentPage={minePage} totalPages={totalMinePages} tabKey="minePage" />
    </>
  );

  const GlobalContent = (
    <>
      {communityGarments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-border/40 border-dashed rounded-[2rem] bg-background/30 backdrop-blur-md text-center shadow-sm">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6 shadow-inner ring-1 ring-border/50">
            <Shirt className="h-10 w-10 text-muted-foreground opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{t("emptyGlobal.title")}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-light">
            {t("emptyGlobal.desc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {communityGarments.map((garment) => (
            <GarmentCard key={garment.id} garment={garment} isCommunityView />
          ))}
        </div>
      )}
      <GarmentsPagination currentPage={globalPage} totalPages={totalGlobalPages} tabKey="globalPage" />
    </>
  );

  const totalPendingRequests = await db.garmentChangeRequest.count({
    where: {
      status: "pending",
      garment: { ownerId: tenantId }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Shirt className="w-8 h-8 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/garments/requests"
            title="Bandeja de Solicitudes"
            className="relative flex items-center justify-center p-3 rounded-xl bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/50"
          >
            <Bell className="w-5 h-5" />
            {totalPendingRequests > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                  {totalPendingRequests}
                </span>
              </span>
            )}
          </Link>
          <Link 
            href="/dashboard/garments/new"
            className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] transition-all duration-300"
          >
            <Plus className="w-5 h-5" /> {t("addBtn")}
          </Link>
        </div>
      </div>

      <GarmentsTabsWrapper 
        defaultTab={activeTab}
        mineTabLabel={t("tabs.mine")}
        globalTabLabel={t("tabs.global")}
        toolbar={<GarmentsToolbar />}
        mineContent={MineContent}
        globalContent={GlobalContent}
      />
      
    </div>
  );
}
