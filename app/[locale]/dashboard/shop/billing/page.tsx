import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

const BillingClient = dynamic(() => import("./billing-client").then(mod => mod.BillingClient));
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardSidebar" });
  return {
    title: `${t("billing")} - Eidyn`,
  };
}

export default async function BillingPage() {
  const { userId, sessionClaims } = await auth();
  let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
  
  if (!tenantId && userId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    if (mem) tenantId = mem.tenantId;
  }

  let currentPlan = "free";
  if (tenantId) {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (tenant && tenant.plan) {
      currentPlan = tenant.plan;
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8 min-h-[calc(100vh-6rem)]">
      <BillingClient currentPlan={currentPlan} />
    </div>
  );
}
