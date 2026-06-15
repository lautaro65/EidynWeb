"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateUserPreferences(data: {
  preferredTheme?: string;
  preferredLocale?: string;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  if (!user) throw new Error("User not found");

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      preferredTheme: data.preferredTheme !== undefined ? data.preferredTheme : undefined,
      preferredLocale: data.preferredLocale !== undefined ? data.preferredLocale : undefined,
    }
  });

  revalidatePath("/[locale]/portal/settings", "page");
  return { success: true, user: updatedUser };
}
