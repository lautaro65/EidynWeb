"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updatePreferences(theme: string, locale: string) {
  const user = await currentUser();
  if (!user) throw new Error("No estás autenticado");

  try {
    await db.user.update({
      where: { clerkId: user.id },
      data: {
        preferredTheme: theme,
        preferredLocale: locale,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000 });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating preferences:", error);
    throw new Error("Ocurrió un error al guardar tus preferencias");
  }
}

export async function deleteAccount() {
  const user = await currentUser();
  if (!user) throw new Error("No estás autenticado");

  try {
    // 1. Delete from our database
    // Assuming Prisma cascade deletes are configured, or we can just delete the User
    // If they are a tenant admin, we might need to delete the tenant as well.
    // For safety, let's first check if they own a tenant.
    
    const membership = await db.membership.findFirst({
      where: { user: { clerkId: user.id } },
      include: { tenant: true, role: true }
    });

    if (membership && membership.role?.name === "admin") {
      // Delete the tenant if they are the admin
      await db.tenant.delete({
        where: { id: membership.tenant.id }
      });
    }

    // Delete user from DB
    await db.user.delete({
      where: { clerkId: user.id }
    });

    // 2. Delete from Clerk
    const client = await clerkClient();
    await client.users.deleteUser(user.id);

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    throw new Error("Ocurrió un error al eliminar tu cuenta");
  }
}
