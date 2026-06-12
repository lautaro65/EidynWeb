import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GarmentEditor } from "./garment-editor";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "GarmentsNew" });
  return {
    title: `${t("title")} - Eidyn`,
    description: t("description"),
    openGraph: {
      title: `${t("title")} - Eidyn`,
      description: t("description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("title")} - Eidyn`,
      description: t("description"),
    },
  };
}

export default async function NewGarmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("GarmentsNew");
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

  return (
    <main className="max-w-[1600px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="flex items-center gap-4">
        <Link 
          href="/dashboard/brand/garments"
          aria-label="Back to Garments"
          className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </header>

      <GarmentEditor />
    </main>
  );
}
