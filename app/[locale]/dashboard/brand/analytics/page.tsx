import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AnalyticsDashboard } from "./analytics-dashboard";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BrandAnalytics" });
  return {
    title: `${t("title") || "Analytics"} - Eidyn`,
  };
}

export default async function BrandAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("BrandAnalytics");
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect(`/${locale}/sign-in`);
  }

  const membership = await db.membership.findFirst({
    where: { user: { clerkId: clerkUser.id } },
    include: { tenant: true },
  });

  if (!membership || membership.tenant.type !== "brand") {
    redirect(`/${locale}/dashboard`);
  }

  // 1. Fetch Real KPI Data
  const totalModels = await db.garmentTemplate.count({
    where: { ownerId: membership.tenantId },
  });

  // Unique stores using this brand's models
  const uniqueStoresRaw = await db.garmentListing.groupBy({
    by: ['storeId'],
    where: { garment: { ownerId: membership.tenantId } },
  });
  const totalStores = uniqueStoresRaw.length;

  const totalProductsLinked = await db.garmentListing.count({
    where: { garment: { ownerId: membership.tenantId } },
  });

  // 2. We will generate Mock Data for the Charts because the DB is likely empty for TryOnSessions.
  // Mock: Monthly Try-On Sessions
  const monthlyTryOns = [
    { name: "Ene", value: 1200 },
    { name: "Feb", value: 2100 },
    { name: "Mar", value: 1800 },
    { name: "Abr", value: 2400 },
    { name: "May", value: 3100 },
    { name: "Jun", value: 4200 },
  ];

  // Mock: Top Sizes Tried On
  const topSizes = [
    { name: "M", value: 1200 },
    { name: "L", value: 800 },
    { name: "S", value: 400 },
    { name: "XL", value: 300 },
    { name: "XS", value: 150 },
  ];

  // Mock: Top Garments
  const topGarments = [
    { id: "1", name: "Oversized T-Shirt V2", sku: "TSH-OVR-02", tryOns: 1450, conversion: 12.5 },
    { id: "2", name: "Heavyweight Hoodie", sku: "HOD-HVY-01", tryOns: 980, conversion: 8.2 },
    { id: "3", name: "Classic Denim Jacket", sku: "JCK-DNM-04", tryOns: 850, conversion: 15.1 },
    { id: "4", name: "Cargo Pants Utility", sku: "PNT-CRG-09", tryOns: 620, conversion: 9.4 },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground">
            {t("title") || "Analytics"}
          </h1>
          <p className="text-muted-foreground mt-2">{t("subtitle") || "Rendimiento y adopción global de tus modelos 3D"}</p>
        </div>
      </div>

      <AnalyticsDashboard 
        kpis={{
          totalModels,
          totalStores,
          totalProductsLinked,
        }}
        mockData={{
          monthlyTryOns,
          topSizes,
          topGarments
        }}
      />
    </div>
  );
}
