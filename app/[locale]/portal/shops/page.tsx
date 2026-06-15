import { Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ShopsList } from "./shops-list";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await getTranslations({ locale, namespace: "PortalShops" });
  return {
    title: `Privacidad y Tiendas - Eidyn`,
  };
}

export default async function PortalShopsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      shopConsents: {
        include: { tenant: true },
        orderBy: { grantedAt: "desc" }
      }
    }
  });

  if (!user) {
    redirect(`/${locale}/portal`);
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-semibold mb-4 border border-emerald-500/20">
          <Store className="w-4 h-4" />
          Conexiones B2C
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Privacidad y Tiendas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Administra qué marcas de ropa tienen permiso para cargar tu avatar 3D en sus probadores virtuales. Puedes revocar el acceso en cualquier momento.
        </p>
      </div>

      {/* Lista de Conexiones */}
      <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[400px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10">
          <ShopsList consents={user.shopConsents} />
        </div>
      </div>

    </div>
  );
}
