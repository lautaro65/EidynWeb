import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is our tenantId

  if (!shop || !code || !state) {
    return NextResponse.json({ error: "Missing required callback parameters" }, { status: 400 });
  }

  const tenantId = state;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing Shopify App credentials in environment" }, { status: 500 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Shopify token exchange failed:", tokenData);
      return NextResponse.json({ error: "Failed to exchange access token" }, { status: tokenResponse.status });
    }

    const accessToken = tokenData.access_token;

    // Save integration to DB
    await db.integration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: "shopify",
        },
      },
      update: {
        storeUrl: shop,
        accessToken: accessToken,
        status: "connected",
        lastSyncAt: new Date(),
      },
      create: {
        tenantId,
        provider: "shopify",
        storeUrl: shop,
        accessToken: accessToken,
        status: "connected",
        lastSyncAt: new Date(),
      },
    });

    // Redirect user back to the dashboard with a success parameter
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/es/dashboard/connections?shopify=success`);

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json({ error: "Internal Server Error during callback" }, { status: 500 });
  }
}
