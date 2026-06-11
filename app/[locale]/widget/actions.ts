"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function checkWidgetAuthAction(apiKey: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { status: "unauthenticated" };
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        activeAvatar: true
      }
    });

    if (!user) {
      return { status: "unauthenticated" };
    }

    const dbKey = await db.apiKey.findUnique({
      where: { publicKey: apiKey },
    });

    if (!dbKey) {
      return { status: "error", error: "Invalid API Key" };
    }

    const tenantId = dbKey.tenantId;

    const consent = await db.shopConsent.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenantId,
        }
      }
    });

    if (!consent || consent.granted === false) {
      return { 
        status: "needs_consent",
        tenantId
      };
    }

    return { 
      status: "authorized",
      avatarUrl: user.activeAvatar?.modelUrl || null 
    };

  } catch (error) {
    console.error("Error checking widget auth:", error);
    return { status: "error", error: "Internal error" };
  }
}

export async function grantConsentAction(apiKey: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error("User not found");

    const dbKey = await db.apiKey.findUnique({
      where: { publicKey: apiKey },
    });

    if (!dbKey) throw new Error("Invalid API Key");

    await db.shopConsent.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: dbKey.tenantId,
        }
      },
      create: {
        userId: user.id,
        tenantId: dbKey.tenantId,
        granted: true,
      },
      update: {
        granted: true,
        revokedAt: null,
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error granting consent:", error);
    return { error: (error as Error).message };
  }
}
