"use client";

import { Store, Shield, ShieldOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toggleShopConsent } from "../actions";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ShopConsentData {
  id: string;
  granted: boolean;
  grantedAt: Date;
  revokedAt: Date | null;
  tenant: {
    name: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
  };
}

export function ShopsList({ consents }: { consents: ShopConsentData[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (id: string, currentGranted: boolean) => {
    setLoadingId(id);
    try {
      const res = await toggleShopConsent(id, !currentGranted);
      if (res.success) {
        toast.success(currentGranted ? "Acceso revocado" : "Acceso restaurado");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar permisos");
    } finally {
      setLoadingId(null);
    }
  };

  if (consents.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground">Sin conexiones</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          Todavía no le has dado permiso a ninguna tienda para acceder a tu probador virtual. 
          Cuando inicies sesión en tiendas asociadas, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {consents.map((consent) => (
        <div 
          key={consent.id}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
              {consent.tenant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={consent.tenant.logoUrl} alt={consent.tenant.name || "Tienda"} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6 text-emerald-500/70" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-lg">{consent.tenant.name || "Tienda Desconocida"}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conectado desde: {new Date(consent.grantedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex items-center justify-end">
              {consent.granted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
                  <Shield className="w-3 h-3" /> Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
                  <ShieldOff className="w-3 h-3" /> Revocado
                </span>
              )}
            </div>
            
            <button
              onClick={() => handleToggle(consent.id, consent.granted)}
              disabled={loadingId === consent.id}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 w-full sm:w-auto shrink-0 ${
                consent.granted 
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20" 
                  : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
              }`}
            >
              {loadingId === consent.id ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                consent.granted ? "Revocar" : "Restaurar"
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
