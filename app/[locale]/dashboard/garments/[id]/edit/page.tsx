import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GarmentEditForm } from "@/components/dashboard/garment-edit-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

type SessionMetadata = { tenantId?: string };

export default async function EditGarmentPage({ params }: Props) {
  const { id } = await params;
  
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  let tenantId = (sessionClaims?.metadata as SessionMetadata | undefined)?.tenantId;
  if (!tenantId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    tenantId = mem?.tenantId as string;
  }

  if (!tenantId) redirect("/dashboard/onboarding");

  const garment = await db.garmentTemplate.findUnique({
    where: { id },
    include: {
      brand: true,
      variants: {
        include: {
          sizes: true
        }
      },
      sizes: true
    }
  });

  if (!garment || garment.ownerId !== tenantId) {
    redirect("/dashboard/garments");
  }

  // Format initial data
  const variantSizes: { variantId: string, sizeId: string, active: boolean }[] = [];
  garment.variants.forEach(v => {
    v.sizes.forEach(vs => {
      variantSizes.push({
        variantId: vs.variantId,
        sizeId: vs.sizeId,
        active: vs.active
      });
    });
  });

  const initialData = {
    id: garment.id,
    name: garment.name || "",
    brand: garment.brand?.name || "",
    sku: garment.sku,
    category: garment.category || "remeras",
    variants: garment.variants.map(v => ({
      id: v.id,
      name: v.name,
      type: v.type,
      colorHex: v.colorHex,
      textureUrl: v.textureUrl,
    })),
    sizes: garment.sizes.map(s => ({
      id: s.id,
      label: s.label,
      system: s.system || "alpha",
      chest: s.chest ? Number(s.chest) : null,
      shoulders: s.shoulders ? Number(s.shoulders) : null,
      length: s.length ? Number(s.length) : null,
      waist: s.waist ? Number(s.waist) : null,
      hips: s.hips ? Number(s.hips) : null,
      inseam: s.inseam ? Number(s.inseam) : null,
      sleeve: s.sleeve ? Number(s.sleeve) : null,
    })),
    variantSizes
  };

  return <GarmentEditForm initialData={initialData} />;
}
