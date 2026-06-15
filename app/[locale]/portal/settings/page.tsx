import { Settings, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PreferencesForm } from "./preferences-form";
import { UserProfile } from "@clerk/nextjs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await getTranslations({ locale, namespace: "PortalSettings" });
  return {
    title: `Configuración - Eidyn`,
  };
}

export default async function PortalSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
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
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-semibold mb-4 border border-blue-500/20">
          <Settings className="w-4 h-4" />
          Ajustes
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Configuración de Cuenta
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Administra tus preferencias de visualización, notificaciones y la seguridad de tu inicio de sesión.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Preferencias de la Aplicación */}
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            Preferencias de Aplicación
          </h2>
          <PreferencesForm 
            initialTheme={user.preferredTheme || "system"} 
            initialLocale={user.preferredLocale || "en"} 
          />
        </div>

        {/* Seguridad y Contraseñas (Clerk) */}
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2 relative z-10">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            Seguridad y Perfil
          </h2>
          
          <div className="relative z-10 w-full overflow-hidden rounded-2xl [&_.cl-rootBox]:w-full [&_.cl-card]:w-full [&_.cl-card]:shadow-none [&_.cl-card]:bg-transparent [&_.cl-card]:border-0 [&_.cl-navbar]:hidden [&_.cl-header]:hidden [&_.cl-pageScrollBox]:p-0">
            <UserProfile 
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "w-full shadow-none bg-transparent m-0 p-0",
                  navbar: "hidden",
                  pageScrollBox: "p-0",
                  profileSection__profile: "hidden",
                  profileSection__emailAddresses: "hidden", // We already know the email
                  headerTitle: "hidden",
                  headerSubtitle: "hidden"
                }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
