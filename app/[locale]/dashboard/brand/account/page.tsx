import { UserProfile } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardSidebar" });
  return {
    title: `${t("accountInfo")} - Eidyn`,
  };
}

export default async function AccountPage() {
  const t = await getTranslations("Account");

  const clerkUser = await currentUser();
  if (!clerkUser) return null;


  return (
    <div className="max-w-5xl mx-auto py-8 px-6 lg:px-8 space-y-8 min-h-[calc(100vh-6rem)]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title") || "Configuración de Cuenta"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("description") || "Gestioná tu cuenta personal, preferencias de sesión y seguridad."}
        </p>
      </div>

      <div className="bg-background/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40" />
        <div className="relative flex justify-center">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full max-w-none shadow-none",
                card: "w-full max-w-none shadow-none bg-transparent border-none",
                navbar: "hidden",
                pageScrollBox: "w-full",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
