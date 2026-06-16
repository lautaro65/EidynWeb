"use client";

import { Store, Shield, ShieldOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { connectShop, toggleShopConsent } from "../actions";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export interface NormalizedShop {
  tenantId: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  granted: boolean;
  grantedAt?: Date;
  consentId?: string; // Solo existe si ya hay un registro de ShopConsent
}

export function ShopsList({ shops, isDiscover }: { shops: NormalizedShop[], isDiscover?: boolean }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (shop: NormalizedShop) => {
    setLoadingId(shop.tenantId);
    try {
      if (shop.consentId) {
        // Toggle existing consent
        const res = await toggleShopConsent(shop.consentId, !shop.granted);
        if (res.success) {
          toast.success(shop.granted ? "Acceso revocado" : "Acceso restaurado");
        }
      } else {
        // Connect new shop
        const res = await connectShop(shop.tenantId);
        if (res.success) {
          toast.success("Tienda conectada exitosamente");
        }
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar permisos");
    } finally {
      setLoadingId(null);
    }
  };

  if (shops.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground">
          {isDiscover ? "No hay tiendas nuevas" : "Sin conexiones"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          {isDiscover 
            ? "No se encontraron tiendas adicionales para conectar con tu búsqueda."
            : "Todavía no le has dado permiso a ninguna tienda para acceder a tu probador virtual."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shops.map((shop) => (
        <div 
          key={shop.tenantId}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
              {shop.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logoUrl} alt={shop.name || "Tienda"} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6 text-emerald-500/70" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-lg">{shop.name || "Tienda Desconocida"}</h4>
              
              {shop.websiteUrl && (
                <a 
                  href={shop.websiteUrl.startsWith('http') ? shop.websiteUrl : `https://${shop.websiteUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline block mt-0.5 transition-colors flex items-center gap-1 w-fit"
                >
                  Visitar sitio web
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              )}

              {!isDiscover && shop.grantedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Conectado desde: {new Date(shop.grantedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex items-center justify-end">
              {!isDiscover && (
                shop.granted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
                    <Shield className="w-3 h-3" /> Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
                    <ShieldOff className="w-3 h-3" /> Revocado
                  </span>
                )
              )}
            </div>
            
            <button
              onClick={() => handleToggle(shop)}
              disabled={loadingId === shop.tenantId}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 w-full sm:w-auto shrink-0 ${
                shop.granted 
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20" 
                  : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
              }`}
            >
              {loadingId === shop.tenantId ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                shop.granted ? "Revocar" : (isDiscover ? "Conectar" : "Restaurar")
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
