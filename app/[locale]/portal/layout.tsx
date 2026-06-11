import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalSidebar } from "@/components/portal-sidebar";
import { db } from "@/lib/db";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal de Usuario - Eidyn",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Verificamos si el usuario tiene una membresía (es dueño/empleado de tienda)
  const membership = await db.membership.findFirst({
    where: { user: { clerkId: user.id } }
  });

  // Si tiene membresía, es una cuenta de tienda. Lo mandamos de vuelta al dashboard B2B.
  // IMPORTANTE: Si queremos que el dueño de tienda también pueda ver su avatar, podríamos
  // quitar este redirect o crear un "modo switch". Por ahora, mantenemos la estricta separación.
  if (membership) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-screen pt-24 bg-background px-4 md:px-8 max-w-[1600px] mx-auto gap-8">
      <PortalSidebar />
      <div className="flex-1 pb-12">
        <main id="main-content" className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </main>
      </div>
    </div>
  );
}
