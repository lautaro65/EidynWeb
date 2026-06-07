"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Loader2, Check, X, Edit, MessageSquare, Clock, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type RequestType = {
  id: string;
  type: string;
  message: string;
  status: string;
  createdAt: Date;
  garmentId: string;
  garment: {
    name: string | null;
    variants: { previewImageUrl: string | null; textureUrl: string | null }[];
    sourceImageUrl: string | null;
  };
  requestingTenant: {
    name: string | null;
  };
};

type Props = {
  requests: RequestType[];
};

export function RequestsList({ requests }: Props) {
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);

  const handleResolveRequest = async (id: string, status: "resolved" | "rejected") => {
    setResolvingRequestId(id);
    try {
      const { updateChangeRequestStatusAction } = await import("@/app/[locale]/dashboard/garments/requests-actions");
      const res = await updateChangeRequestStatusAction(id, status);
      if (res.error) {
        alert(res.error);
      }
      // Revalidation happens on the server action, UI will refresh
    } catch (e) {
      console.error(e);
      alert("Error al actualizar la solicitud");
    } finally {
      setResolvingRequestId(null);
    }
  };

  const getPreviewUrl = (garment: RequestType["garment"]) => {
    const previewVariant = garment.variants?.[0];
    return previewVariant?.previewImageUrl || previewVariant?.textureUrl || garment.sourceImageUrl || undefined;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "new_variant": return "Nueva Variante";
      case "new_size": return "Nuevo Talle";
      case "fix_issue": return "Corregir Problema";
      default: return "Otro";
    }
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-border/40 border-dashed rounded-[2rem] bg-background/30 backdrop-blur-md text-center shadow-sm">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 shadow-inner ring-1 ring-emerald-500/30">
          <Check className="h-10 w-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Bandeja Vacía</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-light">
          No tienes solicitudes de cambio pendientes. ¡Todo está al día!
        </p>
        <Link href="/dashboard/garments" className="mt-6 flex items-center gap-2 rounded-xl bg-muted/50 hover:bg-muted px-5 py-2.5 font-semibold text-muted-foreground transition-colors border border-border/50">
          <ArrowLeft className="w-4 h-4" /> Volver a mis modelos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {requests.map((req) => {
        const previewUrl = getPreviewUrl(req.garment);
        const isPending = req.status === "pending";

        return (
          <div 
            key={req.id} 
            className={`flex flex-col sm:flex-row gap-6 p-6 rounded-[2rem] border transition-all duration-300 shadow-sm relative overflow-hidden group ${
              isPending 
                ? "bg-background/60 backdrop-blur-xl border-white/10 hover:border-primary/30" 
                : "bg-muted/30 border-transparent opacity-70"
            }`}
          >
            {isPending && (
              <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>
            )}

            {/* Thumbnail */}
            <div className="relative h-24 w-24 rounded-2xl bg-muted/50 dark:bg-white/5 flex items-center justify-center shadow-inner border border-border/50 dark:border-white/10 overflow-hidden shrink-0">
              {previewUrl ? (
                <Image src={previewUrl} alt={req.garment.name || "Garment"} fill className="object-cover" />
              ) : (
                <div className="text-xs text-muted-foreground">Sin Imagen</div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="text-[10px] font-black tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {getTypeLabel(req.type)}
                </span>
                <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                  isPending ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : 
                  req.status === "resolved" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : 
                  "text-red-500 bg-red-500/10 border-red-500/20"
                }`}>
                  {isPending ? "Pendiente" : req.status === "resolved" ? "Resuelto" : "Rechazado"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(req.createdAt, { addSuffix: true, locale: es })}
                </span>
              </div>
              
              <h4 className="text-lg font-bold text-foreground truncate">
                {req.garment.name || "Untitled Garment"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 mb-2">
                Solicitado por <strong className="text-foreground">{req.requestingTenant.name || "Tienda Anónima"}</strong>
              </p>
              
              <div className="bg-muted/50 rounded-xl p-3 border border-border/50 text-sm whitespace-pre-wrap flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>{req.message}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col items-center sm:items-end justify-center gap-3 shrink-0">
              {isPending && (
                <>
                  <Link 
                    href={`/dashboard/garments/${req.garmentId}/edit`}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2.5 rounded-xl font-bold transition-all border border-primary/20 hover:border-transparent shadow-sm"
                  >
                    <Edit className="w-4 h-4" /> Ir a Editar
                  </Link>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleResolveRequest(req.id, "resolved")}
                      disabled={resolvingRequestId === req.id}
                      title="Marcar como Resuelto"
                      className="flex-1 sm:flex-none flex items-center justify-center p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:scale-[1.05] transition-all disabled:opacity-50 border border-emerald-500/20"
                    >
                      {resolvingRequestId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => handleResolveRequest(req.id, "rejected")}
                      disabled={resolvingRequestId === req.id}
                      title="Rechazar"
                      className="flex-1 sm:flex-none flex items-center justify-center p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:scale-[1.05] transition-all disabled:opacity-50 border border-red-500/20"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
