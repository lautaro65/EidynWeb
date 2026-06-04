"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type SessionMetadata = { tenantId?: string };

export async function createSizeGuide(data: {
  name: string;
  category: string;
  sizes: { id: string, name: string }[];
  matrixValues: Record<string, string>;
  status?: string;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const tenantId = (sessionClaims?.metadata as SessionMetadata | undefined)?.tenantId;

  if (!tenantId) {
    // Si no está en claims por alguna razón, lo buscamos
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        memberships: true
      }
    });

    if (!user || user.memberships.length === 0) {
      return { success: false, error: "Tenant not found for user" };
    }
  }

  const finalTenantId = tenantId || (await db.membership.findFirst({
    where: { user: { clerkId: userId } }
  }))?.tenantId;

  if (!finalTenantId) {
    return { success: false, error: "Could not resolve tenant" };
  }

  // Guardar en Prisma
  try {
    const sizeGuide = await db.sizeGuide.create({
      data: {
        tenantId: finalTenantId,
        name: data.name,
        category: data.category,
        status: data.status || "Active",
        matrix: {
          sizes: data.sizes,
          values: data.matrixValues
        }
      }
    });

    // Revalidar caché de Next.js
    revalidatePath("/[locale]/dashboard/size-guides", "page");

    return { success: true, id: sizeGuide.id };
  } catch (error) {
    console.error("Error creating size guide:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function deleteSizeGuide(id: string) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const tenantId = (sessionClaims?.metadata as SessionMetadata | undefined)?.tenantId;
  const finalTenantId = tenantId || (await db.membership.findFirst({
    where: { user: { clerkId: userId } }
  }))?.tenantId;

  if (!finalTenantId) {
    return { success: false, error: "Could not resolve tenant" };
  }

  try {
    // Verificar que la guía pertenece al tenant y borrarla
    await db.sizeGuide.delete({
      where: {
        id,
        tenantId: finalTenantId
      }
    });

    revalidatePath("/[locale]/dashboard/size-guides", "page");
    return { success: true };
  } catch (error) {
    console.error("Error deleting size guide:", error);
    return { success: false, error: "No se pudo eliminar la guía. Verifica si está siendo usada por productos." };
  }
}

export async function updateSizeGuide(id: string, data: {
  name: string;
  category: string;
  sizes: { id: string, name: string }[];
  matrixValues: Record<string, string>;
  status?: string;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const tenantId = (sessionClaims?.metadata as SessionMetadata | undefined)?.tenantId;
  const finalTenantId = tenantId || (await db.membership.findFirst({
    where: { user: { clerkId: userId } }
  }))?.tenantId;

  if (!finalTenantId) {
    return { success: false, error: "Could not resolve tenant" };
  }

  try {
    const sizeGuide = await db.sizeGuide.update({
      where: {
        id,
        tenantId: finalTenantId
      },
      data: {
        name: data.name,
        category: data.category,
        status: data.status,
        matrix: {
          sizes: data.sizes,
          values: data.matrixValues
        }
      }
    });

    revalidatePath("/[locale]/dashboard/size-guides", "page");

    return { success: true, id: sizeGuide.id };
  } catch (error) {
    console.error("Error updating size guide:", error);
    return { success: false, error: "Error al actualizar la guía" };
  }
}
