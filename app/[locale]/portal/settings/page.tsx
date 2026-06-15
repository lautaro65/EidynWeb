import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PreferencesForm } from "@/components/account/preferences-form";
import { DangerZone } from "@/components/account/danger-zone";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await getTranslations({ locale, namespace: "PortalSettings" });
  return {
    title: `Ajustes - Eidyn`,
  };
}

export default async function PortalSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  if (!user) {
    redirect(`/${locale}/portal`);
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 min-h-[calc(100vh-6rem)] animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground">
          Ajustes
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra tus preferencias de visualización y notificaciones.
        </p>
      </div>

      <div className="space-y-8">
        <PreferencesForm 
          initialTheme={user.preferredTheme || "system"} 
          initialLocale={user.preferredLocale || "es"} 
        />
        <DangerZone />
      </div>
    </div>
  );
}
