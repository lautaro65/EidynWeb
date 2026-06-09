import { getOrganizationConfigAction } from "./actions";
import { OrganizationClient, ConfigData } from "./organization-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardSidebar" });
  return {
    title: `${t("widgetConfig")} - Eidyn`,
  };
}

export default async function OrganizationPage() {
  const res = await getOrganizationConfigAction();

  if (res.error || !res.data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Error Loading Configuration</h1>
        <p className="text-muted-foreground mt-2">{res.error || "Unknown error"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 lg:px-8 min-h-[calc(100vh-6rem)]">
      <OrganizationClient initialData={res.data as unknown as ConfigData} />
    </div>
  );
}
