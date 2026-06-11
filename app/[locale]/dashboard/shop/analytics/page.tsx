import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

const AnalyticsClient = dynamic(() => import("./analytics-client").then(mod => mod.AnalyticsClient));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardSidebar" });
  return {
    title: `${t("analytics")} - Eidyn`,
  };
}

export default async function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8 min-h-[calc(100vh-6rem)]">
      <AnalyticsClient />
    </div>
  );
}
