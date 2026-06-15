import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarSwitcher } from "@/components/sidebar-switcher";
import { ThemeSyncer } from "@/components/account/theme-syncer";
import { db } from "@/lib/db";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Verificamos si completó el onboarding
  if (user.publicMetadata.onboardingComplete !== true) {
    redirect(`/${locale}/onboarding`);
  }

  // Verificamos si el usuario tiene una membresía (es dueño/empleado de tienda)
  const membership = await db.membership.findFirst({
    where: { user: { clerkId: user.id } },
    include: { tenant: true, user: true }
  });

  // Si no tiene membresía, es un comprador final. Lo mandamos al portal B2C.
  if (!membership) {
    redirect(`/${locale}/portal`);
  }

  return (
    <>
      <ThemeSyncer dbTheme={membership.user.preferredTheme || "system"} />
      <div className="flex min-h-screen pt-24 bg-background px-4 md:px-8 max-w-[1600px] mx-auto gap-8">
        <SidebarSwitcher tenantType={membership.tenant.type} />
      <div className="flex-1 pb-12">
        <main id="main-content" className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </main>
      </div>
      </div>
    </>
  );
}
