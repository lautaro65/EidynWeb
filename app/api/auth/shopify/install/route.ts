import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tenantId = (sessionClaims?.metadata as { tenantId?: string })?.tenantId;
  if (!tenantId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    if (!mem) return NextResponse.json({ error: "No tenant" }, { status: 400 });
    tenantId = mem.tenantId;
  }

  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }

  // Ensure shop ends with myshopify.com
  const formattedShop = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/shopify/callback`;
  const scopes = "read_products"; // Comma separated if multiple

  if (!clientId) {
    return NextResponse.json({ error: "Missing SHOPIFY_CLIENT_ID" }, { status: 500 });
  }

  // We pass the tenantId in the "state" parameter to recover it in the callback
  const state = tenantId;

  const installUrl = `https://${formattedShop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(installUrl);
}
