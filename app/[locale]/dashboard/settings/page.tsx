import { SettingsClient } from "./settings-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardSidebar" });
  return {
    title: `${t("settings")} - Eidyn`,
  };
}

export default async function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-6 lg:px-8 min-h-[calc(100vh-6rem)]">
      <SettingsClient />
    </div>
  );
}
