"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";
import { revalidatePath } from "next/cache";

export async function updateBrandSettings(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name") as string | undefined;
  const websiteUrl = formData.get("websiteUrl") as string | undefined;
  const socialUrl = formData.get("socialUrl") as string | undefined;
  const logoFile = formData.get("logoFile") as File | null;

  // Verify the user owns this tenant
  const membership = await db.membership.findFirst({
    where: { user: { clerkId: userId } },
    include: { tenant: true },
  });

  if (!membership || membership.tenant.type !== "brand") {
    throw new Error("Unauthorized or not a brand");
  }

  let finalLogoUrl = membership.tenant.logoUrl;

  if (logoFile && logoFile.size > 0) {
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const key = `brands/${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    finalLogoUrl = await uploadToR2(buffer, key, logoFile.type);
  }

  await db.tenant.update({
    where: { id: membership.tenant.id },
    data: {
      name: name || membership.tenant.name,
      websiteUrl: websiteUrl || null,
      socialUrl: socialUrl || null,
      logoUrl: finalLogoUrl,
    },
  });

  revalidatePath("/[locale]/dashboard/brand/settings", "page");
  return { success: true };
}
