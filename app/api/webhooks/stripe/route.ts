import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2024-04-10" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
      if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        // Mock en caso de que no haya keys configuradas
        event = JSON.parse(body);
      }
    } catch (err: unknown) {
      console.error(`Webhook Error: ${err instanceof Error ? err.message : "Error"}`);
      return new NextResponse(`Webhook Error: ${err instanceof Error ? err.message : "Error"}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
      // Recuperamos el tenantId que enviamos en los metadatos o client_reference_id
      const tenantId = session.client_reference_id || session.metadata?.tenantId;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (tenantId) {
        await db.tenant.update({
          where: { id: tenantId },
          data: {
            plan: "pro", // Hardcodeado a pro para esta versión
            status: "active",
            stripeCustomerId,
            stripeSubscriptionId,
          },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      // El cliente canceló y se terminó su tiempo, lo bajamos a free
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;

      await db.tenant.update({
        where: { stripeCustomerId },
        data: {
          plan: "free",
          stripeSubscriptionId: null,
        },
      });
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;
      
      // Si la suscripción cambió a unpaid/canceled/past_due, podemos manejarlo
      if (subscription.status !== "active" && subscription.status !== "trialing") {
        await db.tenant.update({
          where: { stripeCustomerId },
          data: {
            plan: "free",
            status: subscription.status
          },
        });
      } else {
        await db.tenant.update({
          where: { stripeCustomerId },
          data: {
            plan: "pro", // O verificar los items para saber qué plan es
            status: "active"
          },
        });
      }
    }

    return new NextResponse("Webhook procesado exitosamente", { status: 200 });
  } catch (error) {
    console.error("Error procesando Webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
