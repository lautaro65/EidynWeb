"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

import { uploadToR2 } from "@/lib/r2";

export async function submitOnboarding(formData: FormData) {
  const role = formData.get("role") as "shopper" | "store_owner" | "brand_owner";
  const storeName = formData.get("storeName") as string | undefined;
  const plan = formData.get("plan") as "free" | "pro" | undefined;
  const websiteUrl = formData.get("websiteUrl") as string | undefined;
  const socialUrl = formData.get("socialUrl") as string | undefined;
  const logoFile = formData.get("logoFile") as File | null;
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

  // 2. Handle Store/Brand Owner logic
  if ((role === "store_owner" || role === "brand_owner") && storeName) {
    // 2.1 Brand Domain Validation (Blacklist)
    if (role === "brand_owner") {
      const RESERVED_BRANDS: Record<string, string> = {
        "nike": "nike.com",
        "adidas": "adidas.com",
        "zara": "zara.com",
        "puma": "puma.com",
        "gucci": "gucci.com",
        "prada": "prada.com",
        "balenciaga": "balenciaga.com",
        "h&m": "hm.com",
      };
      
      const normalizedName = storeName.toLowerCase().trim();
      if (RESERVED_BRANDS[normalizedName]) {
        const expectedDomain = RESERVED_BRANDS[normalizedName];
        const userDomain = email?.split("@")[1];
        if (userDomain !== expectedDomain) {
          throw new Error(`Para registrar la marca ${storeName}, debes usar un correo oficial @${expectedDomain}`);
        }
      }
    }

    // Generate a simple slug
    const slug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Check if slug is taken (basic check, in prod we'd append random numbers if taken)
    let finalSlug = slug;
    const existingTenant = await db.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      finalSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // Handle logo upload if present
    let finalLogoUrl: string | undefined = undefined;
    if (logoFile && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      // we use brand/ prefix for organization
      const key = `brands/${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      finalLogoUrl = await uploadToR2(buffer, key, logoFile.type);
    }

    // Create Tenant
    const tenant = await db.tenant.create({
      data: {
        name: storeName,
        slug: finalSlug,
        plan: plan || "free",
        status: "active",
        type: role === "brand_owner" ? "brand" : "store",
        websiteUrl: websiteUrl || null,
        socialUrl: socialUrl || null,
        logoUrl: finalLogoUrl || null,
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
        name: storeName, // Default to the same name
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
      role: role,
      ...(tenantIdToReturn && { tenantId: tenantIdToReturn }),
    },
  });

  return { success: true };
}
