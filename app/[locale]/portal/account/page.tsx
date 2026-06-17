import { UserProfile } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await getTranslations({ locale, namespace: "PortalAccount" });
  return {
    title: `Información de Cuenta - Eidyn`,
  };
}

export default async function PortalAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect(`/${locale}/sign-in`);
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 min-h-[calc(100vh-6rem)] animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground">
          Información de Cuenta
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu correo electrónico, métodos de inicio de sesión y seguridad.
        </p>
      </div>

      <div className="bg-background/50 backdrop-blur-2xl border border-border/50 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40" />
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
