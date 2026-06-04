"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function submitOnboarding(data: {
  role: "shopper" | "store_owner";
  storeName?: string;
  plan?: "free" | "pro";
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User not found in Clerk");

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  // 1. Ensure User exists in Prisma
  let dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        clerkId: userId,
        email: email,
        username: clerkUser.username || clerkUser.firstName || "User",
        imageUrl: clerkUser.imageUrl,
        emailVerified: clerkUser.emailAddresses[0]?.verification?.status === "verified",
      },
    });
  }

  let tenantIdToReturn: string | null = null;

  // 2. Handle Store Owner logic
  if (data.role === "store_owner" && data.storeName) {
    // Generate a simple slug
    const slug = data.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Check if slug is taken (basic check, in prod we'd append random numbers if taken)
    let finalSlug = slug;
    const existingTenant = await db.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      finalSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // Create Tenant
    const tenant = await db.tenant.create({
      data: {
        name: data.storeName,
        slug: finalSlug,
        plan: data.plan || "free",
        status: "active",
      },
    });

    tenantIdToReturn = tenant.id;

    // Create Admin Role for this Tenant
    const adminRole = await db.role.create({
      data: {
        tenantId: tenant.id,
        name: "Admin",
      },
    });

    // Create a Default Store for this Tenant
    await db.store.create({
      data: {
        tenantId: tenant.id,
        name: data.storeName, // Default to the same name
        slug: finalSlug,
        currency: "USD",      // Default currency
        country: "US",        // Default country
        status: "active",
      }
    });

    // Link User to Tenant via Membership
    await db.membership.create({
      data: {
        tenantId: tenant.id,
        userId: dbUser.id,
        roleId: adminRole.id,
      },
    });
  }

  // 3. Update Clerk publicMetadata
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
      role: data.role,
      ...(tenantIdToReturn && { tenantId: tenantIdToReturn }),
    },
  });

  return { success: true };
}
