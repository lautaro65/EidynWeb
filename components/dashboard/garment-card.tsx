"use client";

import { useState } from "react";
import Image from "next/image";
import { Shirt, Heart, Edit, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type GarmentPreview = {
  id: string;
  name: string;
  sku: string;
  category: string;
  isPublic: boolean;
  status: string;
  isOwner: boolean;
  previewUrl?: string;
  variantsCount: number;
  isLiked?: boolean; // We'll add this from the page
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
    try {
      const { deleteGarmentAction } = await import("@/app/[locale]/dashboard/garments/actions");
      await deleteGarmentAction(garment.id);
      // Wait for page to refresh via revalidatePath
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  return (
    <div className="group bg-background/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 hover:border-primary/30 transition-all duration-500 shadow-lg relative overflow-hidden flex flex-col">
      {/* Glow de fondo */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>

      <div className="flex justify-between items-start mb-4 relative z-50">
        <div className="relative h-16 w-16 rounded-2xl bg-muted/50 dark:bg-white/5 flex items-center justify-center shadow-inner border border-border/50 dark:border-white/10 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
          {garment.previewUrl ? (
            <Image src={garment.previewUrl} alt={garment.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
          ) : (
            <Shirt className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
        <div className="relative flex items-center gap-2">
          {isCommunityView ? (
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
          ) : (
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
        
        <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-1">{garment.name || "Untitled Garment"}</h3>
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
  );
}
