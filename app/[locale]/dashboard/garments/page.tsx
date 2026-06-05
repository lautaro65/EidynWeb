import { Shirt, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { GarmentsToolbar } from "@/components/dashboard/garments-toolbar";
import { GarmentCard } from "@/components/dashboard/garment-card";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Props = {
  searchParams: Promise<{ category?: string; search?: string }>;
};

type SessionMetadata = { tenantId?: string };

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

  // Fetch all garments (mine + public)
  const dbGarments = await db.garmentTemplate.findMany({
    where: {
      OR: [
        { ownerId: tenantId },
        { isPublic: true }
      ]
    },
    include: {
      _count: {
        select: { variants: true }
      },
      variants: {
        take: 1
      },
      likes: {
        where: { tenantId }
      }
    },
    orderBy: { updatedAt: "desc" }
  }).catch(() => null);

  if (!dbGarments) {
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

  // Map to unified shape
  const allGarments = dbGarments.map(g => {
    const previewVariant = g.variants?.[0];
    const previewUrl = previewVariant?.previewImageUrl || previewVariant?.textureUrl || g.sourceImageUrl || undefined;
    
    return {
      id: g.id,
      name: g.name || "",
      sku: g.sku,
      category: g.category || "General",
      isPublic: g.isPublic,
      status: g.status,
      isOwner: g.ownerId === tenantId,
      previewUrl,
      variantsCount: g._count.variants,
      isLiked: g.likes.length > 0
    };
  });

  // Apply filters
  const filteredGarments = allGarments.filter(guide => {
    if (params.category && params.category !== "all" && guide.category.toLowerCase() !== params.category.toLowerCase()) return false;
    if (params.search && !guide.name.toLowerCase().includes(params.search.toLowerCase()) && !guide.sku.toLowerCase().includes(params.search.toLowerCase())) return false;
    return true;
  });

  const myGarments = filteredGarments.filter(g => g.isOwner);
  const communityGarments = filteredGarments.filter(g => !g.isOwner && g.isPublic);

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
        
        <Link 
          href="/dashboard/garments/new"
          className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] transition-all duration-300"
        >
          <Plus className="w-5 h-5" /> {t("addBtn")}
        </Link>
      </div>

      <Tabs defaultValue="mine" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 relative z-30">
          <TabsList className="bg-muted/50 p-1 rounded-xl shadow-inner border border-border/50">
            <TabsTrigger value="mine" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">
              {t("tabs.mine")}
            </TabsTrigger>
            <TabsTrigger value="global" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">
              {t("tabs.global")}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 sm:ml-auto flex justify-end">
             <GarmentsToolbar />
          </div>
        </div>

        <TabsContent value="mine" className="mt-0 focus-visible:outline-none focus-visible:ring-0 relative z-10">
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
        </TabsContent>

        <TabsContent value="global" className="mt-0 focus-visible:outline-none focus-visible:ring-0 relative z-10">
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
        </TabsContent>
      </Tabs>
      
    </div>
  );
}
