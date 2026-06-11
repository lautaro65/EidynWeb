
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Bell, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { RequestsList } from "@/components/dashboard/requests-list";

type SessionMetadata = { tenantId?: string };

export default async function GarmentRequestsPage() {
  const t = await getTranslations("Garments");
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  let tenantId = (sessionClaims?.metadata as SessionMetadata | undefined)?.tenantId;
  if (!tenantId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    if (!mem) redirect("/dashboard/onboarding");
    tenantId = mem.tenantId as string;
  }

  // Fetch requests for my garments
  const requests = await db.garmentChangeRequest.findMany({
    where: {
      garment: {
        ownerId: tenantId
      }
    },
    include: {
      garment: {
        select: {
          name: true,
          sourceImageUrl: true,
          variants: {
            select: {
              previewImageUrl: true,
              textureUrl: true
            },
            take: 1
          }
        }
      },
      requestingTenant: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      { status: "asc" }, // 'pending' comes first
      { createdAt: "desc" }
    ]
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/dashboard/garments" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />{t("requests.backToModels")} </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Bandeja de Solicitudes
            {pendingCount > 0 && (
              <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-sm px-3 py-1 rounded-full font-bold">
                {pendingCount} Pendientes
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("requests.desc")}</p>
        </div>
      </div>

      <div className="bg-background/40 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
        <RequestsList requests={requests} />
      </div>
      
    </div>
  );
}
