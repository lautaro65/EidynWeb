import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AvatarWizard } from "./avatar-wizard";

export const metadata = {
  title: "Crear Avatar 3D - Eidyn",
};

export const maxDuration = 60; // Allow up to 60 seconds for Bodygram API on Vercel

export default async function AvatarNewPage({
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
    where: { clerkId: clerkUser.id },
    include: { activeAvatar: true }
  });

  if (!user || !user.activeAvatar) {
    redirect(`/${locale}/portal`);
  }

  // Si ya tiene un modelo 3D (completed) o está en proceso (processing), lo devolvemos al portal
  if (user.activeAvatar.status === "completed" || user.activeAvatar.status === "processing") {
    redirect(`/${locale}/portal`);
  }

  const measurements = (user.activeAvatar.measurements || {}) as Record<string, unknown>;
  
  const initialData = {
    gender: user.activeAvatar.gender || "unisex",
    height: user.activeAvatar.height ? Number(user.activeAvatar.height) : 170,
    weight: user.activeAvatar.weight ? Number(user.activeAvatar.weight) : 70,
    age: typeof measurements?.age === "number" ? measurements.age : 30,
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <AvatarWizard initialData={initialData} />
    </div>
  );
}
