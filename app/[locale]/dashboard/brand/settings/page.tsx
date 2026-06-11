import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BrandSettingsForm } from "./settings-form";

export const metadata = {
  title: "Configuración de Marca - Eidyn",
};

export default async function BrandSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await currentUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const membership = await db.membership.findFirst({
    where: { user: { clerkId: user.id } },
    include: { tenant: true },
  });

  if (!membership || membership.tenant.type !== "brand") {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 min-h-[calc(100vh-6rem)] animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground">
          Configuración de Marca
        </h1>
        <p className="text-muted-foreground mt-2">
          Actualiza el nombre, página web, redes sociales y logo público de tu marca.
        </p>
      </div>

      <BrandSettingsForm tenant={membership.tenant} />
    </div>
  );
}
