import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Plug, Key, Webhook as WebhookIcon, ShoppingBag, ShieldCheck, Activity } from "lucide-react";
import { ConnectionsClient } from "./connections-client";

type SessionMetadata = { tenantId?: string };

export default async function ConnectionsPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  let tenantId = (sessionClaims?.metadata as SessionMetadata | undefined)?.tenantId;
  if (!tenantId) {
    const mem = await db.membership.findFirst({ where: { user: { clerkId: userId } } });
    tenantId = mem?.tenantId as string;
  }

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-border/40 border-dashed rounded-[2rem] bg-background/30 backdrop-blur-md text-center shadow-sm">
        <h3 className="text-xl font-bold text-foreground">No tenant assigned</h3>
      </div>
    );
  }

  // Fetch Data
  const integrations = await db.integration.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  const apiKeys = await db.apiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Plug className="w-8 h-8 text-primary" />
            Conexiones (Integraciones)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            Centro de Estado de infraestructura agnóstica. Integra el motor de prueba virtual con tu stack tecnológico mediante conectores nativos o nuestra API unificada.
          </p>
        </div>
      </div>

      <ConnectionsClient 
        integrations={integrations} 
        apiKeys={apiKeys} 
      />

    </div>
  );
}
