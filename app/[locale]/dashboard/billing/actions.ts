"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2024-04-10" as any,
});

async function getTenantId() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
  if (!tenantId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    if (!mem) throw new Error("No tenant");
    tenantId = mem.tenantId;
  }
  return tenantId;
}

export async function createCheckoutSessionAction(locale: string) {
  try {
    const tenantId = await getTenantId();
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Tenant not found");

    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("STRIPE_SECRET_KEY no está configurada, simulando checkout...");
      return { url: `/${locale}/dashboard/billing?mock_success=true` };
    }

    const { userId } = await auth();
    const user = await db.user.findUnique({ where: { clerkId: userId! } });

    // Determinar la URL base dinámicamente
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: tenant.stripeCustomerId || undefined,
      customer_email: tenant.stripeCustomerId ? undefined : user?.email,
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID || "price_mock_pro",
          quantity: 1,
        },
      ],
      client_reference_id: tenant.id, // Muy importante para el Webhook
      success_url: `${baseUrl}/${locale}/dashboard/billing?success=true`,
      cancel_url: `${baseUrl}/${locale}/dashboard/billing?canceled=true`,
      metadata: {
        tenantId: tenant.id,
      },
    });

    return { url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { error: (error as Error).message };
  }
}

export async function createCustomerPortalAction(locale: string) {
  try {
    const tenantId = await getTenantId();
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Tenant not found");

    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("STRIPE_SECRET_KEY no está configurada, simulando portal...");
      return { url: `/${locale}/dashboard/billing?mock_portal=true` };
    }

    if (!tenant.stripeCustomerId) {
      throw new Error("El tenant no tiene un Stripe Customer ID asociado");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${baseUrl}/${locale}/dashboard/billing`,
    });

    return { url: portalSession.url };
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return { error: (error as Error).message };
  }
}
