"use client";

import { useState } from "react";
import { Shirt, Heart, Edit, Loader2, Trash2, MessageSquarePlus, Bell, Check, X, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { GarmentViewer } from "@/components/3d/GarmentViewer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function getAssetUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('r2://')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/api/r2?url=${encodeURIComponent(url)}`;
  }
  return url;
}

type GarmentPreview = {
  id: string;
  name: string;
  sku: string;
  category: string;
  isPublic: boolean;
  status: string;
  isOwner: boolean;
  previewUrl?: string | null;
  baseModelUrl?: string | null;
  variantsCount: number;
  brand?: string | null;
  isLiked?: boolean; // We'll add this from the page
  pendingRequests?: {
    id: string;
    type: string;
    message: string;
    requestingTenant?: { name: string | null };
  }[]; // We'll pass the requests to the card
  variants: {
    id: string;
    name: string | null;
    type: string | null;
    colorHex: string | null;
    previewImageUrl: string | null;
    textureUrl: string | null;
    backTextureUrl: string | null;
    status: string | null;
  }[];
  sizes: {
    id: string;
    label: string;
    scaleX: number | null;
    scaleY: number | null;
    scaleZ: number | null;
  }[];
};

type Props = {
  garment: GarmentPreview;
  isCommunityView?: boolean;
};

export function GarmentCard({ garment, isCommunityView = false }: Props) {
  const t = useTranslations("Garments");
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(garment.isLiked || false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(garment.variants?.[0]?.id || null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(garment.sizes?.[0]?.id || null);
  const [isVariationsMenuOpen, setIsVariationsMenuOpen] = useState(true);

  // Community Request State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState("new_variant");
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Owner Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);

  const categoryLabel = garment.category || "General";

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    try {
      const { toggleGarmentLikeAction } = await import("@/app/[locale]/dashboard/garments/actions");
      const res = await toggleGarmentLikeAction(garment.id);
      if (res.success) {
        setIsLiked(res.liked);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/garments/${garment.id}/edit`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this garment?")) return;
    setIsDeleting(true);
    setIsPreviewOpen(false);
    try {
      const { deleteGarmentAction } = await import("@/app/[locale]/dashboard/garments/actions");
      const res = await deleteGarmentAction(garment.id);
      if (res?.error) {
        console.error(res.error);
        alert(res.error);
        setIsDeleting(false);
      }
      // If success, page will refresh via revalidatePath
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const submitRequest = async () => {
    if (!requestMessage.trim()) return;
    setIsSubmittingRequest(true);
    try {
      const { createChangeRequestAction } = await import("@/app/[locale]/dashboard/garments/requests-actions");
      const res = await createChangeRequestAction(garment.id, requestType, requestMessage);
      if (res.error) {
        alert(res.error);
      } else {
        alert("¡Solicitud enviada correctamente al dueño del modelo!");
        setIsRequestModalOpen(false);
        setRequestMessage("");
      }
    } catch (e) {
      console.error(e);
      alert("Hubo un error al enviar la solicitud.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleResolveRequest = async (id: string, status: "resolved" | "rejected") => {
    setResolvingRequestId(id);
    try {
      const { updateChangeRequestStatusAction } = await import("@/app/[locale]/dashboard/garments/requests-actions");
      await updateChangeRequestStatusAction(id, status);
      // Wait for revalidatePath to update data
    } catch (e) {
      console.error(e);
    } finally {
      setResolvingRequestId(null);
    }
  };

  const hasNotifications = !isCommunityView && garment.pendingRequests && garment.pendingRequests.length > 0;

  return (
    <>
      <div
        onClick={() => setIsPreviewOpen(true)}
        className="group bg-background/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 hover:border-primary/30 transition-all duration-500 shadow-lg relative overflow-hidden flex flex-col cursor-pointer"
      >
        {/* Glow de fondo */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>

        {hasNotifications && (
          <div
            onClick={(e) => { e.stopPropagation(); setIsNotificationsOpen(true); }}
            className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 bg-red-500/20 text-red-500 rounded-full border border-red-500/30 hover:scale-110 transition-transform cursor-pointer shadow-[0_0_15px_-3px_rgba(239,68,68,0.5)]"
            title="Ver solicitudes de la comunidad"
          >
            <Bell className="w-5 h-5 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                {garment.pendingRequests?.length}
              </span>
            </span>
          </div>
        )}

        <div className="flex justify-between items-start mb-4 relative z-40">
          <div className="relative h-16 w-16 rounded-2xl bg-muted/50 dark:bg-white/5 flex items-center justify-center shadow-inner border border-border/50 dark:border-white/10 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
            {garment.previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getAssetUrl(garment.previewUrl)} alt={garment.name} className="w-full h-full object-cover" />
              </>
            ) : (
              <Shirt className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
          <div className="relative flex items-center gap-2">
            {isCommunityView ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsRequestModalOpen(true); }}
                  title="Pedir Cambios al Creador"
                  className="p-2.5 rounded-full hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 transition-all duration-300 border border-transparent hover:border-blue-500/20"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLikeToggle}
                  disabled={isLiking}
                  title={isLiked ? t("card.unlike") : t("card.like")}
                  className={cn(
                    "p-2.5 rounded-full transition-all duration-300 shadow-sm border",
                    isLiked
                      ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                      : "bg-muted/50 dark:bg-white/5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border-border/50 dark:border-white/10"
                  )}
                >
                  {isLiking ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className={cn("w-5 h-5 transition-transform duration-300", isLiked && "fill-current scale-110")} />
                  )}
                </button>
              </>
            ) : (
              <>
                {!hasNotifications && (
                  <>
                    <button
                      onClick={handleEdit}
                      title={t("card.edit")}
                      className="p-2.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      title={t("card.delete")}
                      className="p-2.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-transparent hover:border-destructive/20 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mb-6 relative z-10 flex-1">
          <div className="flex gap-2 mb-3 flex-wrap">
            <div className="text-[10px] font-black tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 inline-block">
              {categoryLabel}
            </div>
            {garment.isPublic && (
              <div className="text-[10px] font-black tracking-wider uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 inline-block">
                {t("card.statusPublic")}
              </div>
            )}
          </div>

          {garment.brand && (
            <p className="text-xs font-semibold text-primary/80 mb-1 uppercase tracking-wider">{garment.brand}</p>
          )}
          <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-1">{garment.name || t("card.untitled", { fallback: "Untitled Garment" })}</h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{garment.sku}</p>
        </div>

        {/* Footer Info */}
        <div className="mt-auto relative z-10 border-t border-white/5 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span>{garment.variantsCount} {t("card.variants")}</span>
          </div>

          <div>
            {garment.status === "active" ? (
              <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                {t("card.statusActive")}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
                {t("card.statusPending")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3D Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/80 backdrop-blur-2xl border-white/10 rounded-[2rem]">
          <DialogTitle className="sr-only">Preview of {garment.name}</DialogTitle>
          <div className="w-full h-[70vh] flex items-center justify-center bg-muted/20 relative">
            {/* Actions in Modal */}
            {!isCommunityView && (
              <div className="absolute top-4 right-12 flex gap-2 z-50">
                <button
                  onClick={handleEdit}
                  title={t("card.edit")}
                  className="p-2.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border border-white/10 hover:border-primary/20 shadow-lg"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  title={t("card.delete")}
                  className="p-2.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-white/10 hover:border-destructive/20 shadow-lg disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            )}

            {/* Floating UI Panel for 3D Customization */}
            {garment.baseModelUrl && (garment.variants?.length > 0 || garment.sizes?.length > 0) && (
              <div className={cn(
                "absolute top-6 left-6 z-50 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col transition-all duration-300",
                isVariationsMenuOpen ? "min-w-[200px] gap-4" : "min-w-[140px] gap-0 cursor-pointer hover:bg-background/90"
              )}>
                <div
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setIsVariationsMenuOpen(!isVariationsMenuOpen)}
                >
                  <div className="flex items-center gap-2 text-foreground">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm tracking-wide">{t("preview.options", { fallback: "Opciones" })}</span>
                  </div>
                  <div className="p-1 rounded-full hover:bg-white/10 text-muted-foreground transition-colors">
                    {isVariationsMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isVariationsMenuOpen && (
                  <div className="flex flex-col gap-4 mt-2 animate-in fade-in slide-in-from-top-2">
                    {garment.variants?.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t("preview.variant", { fallback: "Variante" })}</label>
                        <div className="flex flex-wrap gap-2">
                          {garment.variants.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => {
                                if (v.status !== "processing") setSelectedVariantId(v.id);
                              }}
                              title={v.status === "processing" ? t("preview.processing", { fallback: "Procesando textura..." }) : v.name || t("preview.noName", { fallback: "Sin nombre" })}
                              disabled={v.status === "processing"}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden relative",
                                selectedVariantId === v.id ? "border-primary scale-110 shadow-lg shadow-primary/30" : "border-transparent opacity-70 hover:opacity-100",
                                v.status === "processing" && "opacity-50 grayscale cursor-not-allowed border-dashed border-muted-foreground"
                              )}
                              style={v.type === "solid" && v.colorHex ? { backgroundColor: v.colorHex as string } : {}}
                            >
                              {v.type === "texture" && v.previewImageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getAssetUrl(v.previewImageUrl)} alt={v.name || "Preview"} className="w-full h-full object-cover" />
                              )}
                              {v.status === "processing" && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
                                  <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {garment.sizes?.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t("preview.size", { fallback: "Talle" })}</label>
                        <div className="flex flex-wrap gap-2">
                          {garment.sizes.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => setSelectedSizeId(s.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-bold border transition-all",
                                selectedSizeId === s.id ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30" : "bg-muted/50 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                              )}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(() => {
              const selectedVariant = garment.variants?.find(v => v.id === selectedVariantId) || garment.variants?.[0];
              const selectedSize = garment.sizes?.find(s => s.id === selectedSizeId) || garment.sizes?.[0];

              let scaleCalc: [number, number, number] = [1, 1, 1];
              if (selectedSize) {
                if (selectedSize.scaleX && selectedSize.scaleY && selectedSize.scaleZ) {
                  scaleCalc = [selectedSize.scaleX, selectedSize.scaleY, selectedSize.scaleZ];
                } else {
                  const label = (selectedSize.label || "").toUpperCase();
                  if (label === 'S' || label === '38') scaleCalc = [0.95, 0.95, 0.95];
                  else if (label === 'M' || label === '40') scaleCalc = [1, 1, 1];
                  else if (label === 'L' || label === '42') scaleCalc = [1.05, 1.05, 1.05];
                  else if (label === 'XL' || label === '44') scaleCalc = [1.1, 1.1, 1.1];
                  else if (label === 'XXL' || label === '46') scaleCalc = [1.15, 1.15, 1.15];
                }
              }

              return garment.baseModelUrl ? (
                <GarmentViewer
                  url={garment.baseModelUrl}
                  className="min-h-[60vh] sm:min-h-[500px] border-none"
                  colorHex={selectedVariant?.type === 'solid' ? (selectedVariant.colorHex || undefined) : undefined}
                  textureUrl={selectedVariant?.type === 'texture' ? (selectedVariant.textureUrl || selectedVariant.previewImageUrl || undefined) : undefined}
                  backTextureUrl={selectedVariant?.type === 'texture' ? (selectedVariant.backTextureUrl || undefined) : undefined}
                  scale={scaleCalc}
                />
              ) : garment.previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getAssetUrl(garment.previewUrl)} alt={garment.name} className="object-contain p-8 w-full h-full max-h-[70vh]" />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground gap-4 w-full h-[500px]">
                  <Shirt className="w-16 h-16 opacity-50" />
                  <p>{t("preview.noPreview", { fallback: "No preview available" })}</p>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Change Modal (Community View) */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-md bg-background/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquarePlus className="w-6 h-6 text-primary" />
              Pedir Cambios al Creador
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Pídele al creador de <strong>{garment.name}</strong> que agregue una variante o talle que necesites.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <label className="text-sm font-semibold ml-1">¿Qué tipo de cambio necesitas?</label>
              <Select value={requestType} onValueChange={(v) => setRequestType(v || "other")}>
                <SelectTrigger className="w-full h-12 bg-muted/50 border-border/50 rounded-xl focus:ring-primary/50">
                  <SelectValue placeholder="Selecciona el tipo de cambio" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="new_variant" className="rounded-lg">Nueva Variante (Color / Textura)</SelectItem>
                  <SelectItem value="new_size" className="rounded-lg">Nuevo Talle o Medida</SelectItem>
                  <SelectItem value="fix_issue" className="rounded-lg">Corregir Problema Visual</SelectItem>
                  <SelectItem value="other" className="rounded-lg">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold ml-1">Mensaje para el creador</label>
              <Textarea
                placeholder="Ej: Hola, ¿podrías agregar una variante en color rojo (#FF0000) o un talle XXL? ¡Gracias!"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                className="min-h-[120px] bg-muted/50 border-border/50 rounded-xl resize-none focus:ring-primary/50 p-4"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-border/50 hover:bg-muted/50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitRequest}
                disabled={isSubmittingRequest || !requestMessage.trim()}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              >
                {isSubmittingRequest ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Enviar Solicitud
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Modal (Owner View) */}
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="sm:max-w-lg bg-background/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6 text-red-500" />
              Solicitudes de la Comunidad
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Otras tiendas han solicitado cambios para <strong>{garment.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {garment.pendingRequests?.map((req) => (
              <div key={req.id} className="p-4 rounded-2xl bg-muted/30 border border-border/50 shadow-sm relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50 group-hover:bg-red-500 transition-colors"></div>

                <div className="flex justify-between items-start mb-2 pl-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {req.type === 'new_variant' ? 'Nueva Variante' :
                          req.type === 'new_size' ? 'Nuevo Talle' :
                            req.type === 'fix_issue' ? 'Corregir Problema' : 'Otro'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        de {req.requestingTenant?.name || "Tienda Anónima"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveRequest(req.id, "resolved")}
                      disabled={resolvingRequestId === req.id}
                      title="Marcar como Resuelto (Aceptar)"
                      className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      {resolvingRequestId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleResolveRequest(req.id, "rejected")}
                      disabled={resolvingRequestId === req.id}
                      title="Rechazar"
                      className="p-1.5 rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-foreground/90 pl-2 whitespace-pre-wrap">{req.message}</p>
              </div>
            ))}

            {(!garment.pendingRequests || garment.pendingRequests.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                <p>¡Todo al día! No hay solicitudes pendientes.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
