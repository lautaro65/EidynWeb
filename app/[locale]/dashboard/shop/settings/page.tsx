import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

const SettingsClient = dynamic(() => import("./settings-client").then(mod => mod.SettingsClient));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardSidebar" });
  return {
    title: `${t("settings")} - Eidyn`,
  };
}

export default async function SettingsPage() {
  const { userId, sessionClaims } = await auth();
  let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
  
  if (!tenantId && userId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    if (mem) tenantId = mem.tenantId;
  }

  let timezone = "UTC";
  if (tenantId) {
    const store = await db.store.findFirst({ where: { tenantId } });
    if (store && store.timezone) {
      timezone = store.timezone;
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 lg:px-8 min-h-[calc(100vh-6rem)]">
      <SettingsClient initialTimezone={timezone} />
    </div>
  );
}
