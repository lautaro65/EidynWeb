import { BillingClient } from "./billing-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardSidebar" });
  return {
    title: `${t("billing")} - Eidyn`,
  };
}

export default async function BillingPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8 min-h-[calc(100vh-6rem)]">
      <BillingClient />
    </div>
  );
}
