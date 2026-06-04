"use client";

import { useState } from "react";
import { Ruler, MoreHorizontal, Copy, X, Trash, Edit, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { deleteSizeGuide } from "@/app/[locale]/dashboard/size-guides/actions";
import { useRouter as useNextRouter } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type SizeGuide = {
  id: string;
  name: string;
  category: string;
  sizes: string[];
  linkedCount: number;
  status: string;
  lastUpdated: string;
  matrixValues: Record<string, string>;
  rawSizes?: { id: string; name: string }[];
};

type Props = {
  guide: SizeGuide;
};

const CATEGORY_MEASUREMENTS: Record<string, string[]> = {
  remeras: ["chest", "shoulders", "length"],
  pantalones: ["waist", "hips", "inseam", "length"],
  abrigos: ["chest", "shoulders", "length", "sleeve"]
};

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  remeras: "form.categories.remeras",
  pantalones: "form.categories.pantalones",
  abrigos: "form.categories.abrigos"
};

export function SizeGuideCard({ guide }: Props) {
  const t = useTranslations("SizeGuides");
  const nextRouter = useNextRouter();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const catKey = guide.category.toLowerCase();
  const measurements = CATEGORY_MEASUREMENTS[catKey] || [];
  const categoryLabel = CATEGORY_LABEL_KEYS[catKey] ? t(CATEGORY_LABEL_KEYS[catKey]) : guide.category;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    let matrixText = "";
    if (guide.rawSizes && guide.rawSizes.length > 0) {
      matrixText = guide.rawSizes.map((sizeObj: any) => {
        const sizeName = typeof sizeObj === 'string' ? sizeObj : (sizeObj.name || t("card.notAvailable"));
        const sizeId = typeof sizeObj === 'string' ? sizeName : sizeObj.id;
        
        const metrics = measurements.map(measurementId => {
          const val = guide.matrixValues[`${sizeId}_${measurementId}`] || "-";
          return `${t(`measurements.${measurementId}`)}: ${val}cm`;
        }).join(" | ");
        
        return `- ${sizeName}: ${metrics}`;
      }).join("\n");
    }

    const textToCopy = `${t("card.copyGuide")}: ${guide.name}\n${t("card.copyCategory")}: ${categoryLabel}\n\n${t("card.copyMeasurements")}:\n${matrixText}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success(t("card.successCopy"));
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteSizeGuide(guide.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    
    if (result.success) {
      toast.success(t("card.successDelete"));
      setIsOpen(false);
      nextRouter.refresh(); // Forzar actualización visual de la lista
    } else {
      toast.error(t("card.errorDelete"));
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="group cursor-pointer bg-background/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 hover:border-primary/30 transition-all duration-500 shadow-lg relative overflow-hidden flex flex-col"
      >
        {/* Glow de fondo */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>

        <div className="flex justify-between items-start mb-4 relative z-50">
          <div className="h-12 w-12 rounded-2xl bg-muted/50 dark:bg-white/5 flex items-center justify-center shadow-inner border border-border/50 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">
            <Ruler className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} 
              className="p-2 rounded-full hover:bg-muted/70 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MoreHorizontal className="w-5 h-5" />}
            </button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2 w-40 bg-background/95 backdrop-blur-xl border border-border/60 dark:border-white/20 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.14)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] flex flex-col p-1"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); router.push(`/dashboard/size-guides/${guide.id}/edit`); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted/70 dark:hover:bg-white/10 rounded-lg transition-colors text-left"
                    >
                      <Edit className="w-4 h-4" /> {t("card.edit")}
                    </button>
                    <button 
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all text-left"
                    >
                      <Trash className="w-4 h-4" /> {t("card.delete")}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mb-6 relative z-10">
          <div className="text-[10px] font-black tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 inline-block mb-3">
            {categoryLabel}
          </div>
          <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-1">{guide.name}</h3>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            {t("updated")} {guide.lastUpdated}
          </p>
        </div>

        {/* Talles */}
        <div className="mt-auto relative z-10 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{t("sizesIncluded")}</p>
            <div className="flex flex-wrap gap-1.5">
              {guide.sizes.map(size => (
                <span key={size} className="bg-white/5 border border-white/10 text-foreground text-xs font-medium px-2 py-1 rounded-md">
                  {size}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-4">
              {guide.status === "Draft" ? (
                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                    {t("card.draft")}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    {t("card.active")}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleCopy}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors border border-white/5" title={t("card.copyInfo")}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-background/95 backdrop-blur-3xl border border-border/60 dark:border-white/20 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Inner glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

              {/* Modal Header */}
              <div className="px-8 py-6 flex items-center justify-between relative z-10 border-b border-border/50 dark:border-white/5">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-[1.25rem] bg-muted/60 dark:bg-white/5 flex items-center justify-center border border-border/60 dark:border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                    <Ruler className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{guide.name}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-bold tracking-widest uppercase bg-muted/70 dark:bg-white/10 text-foreground px-3 py-1 rounded-full border border-border/50 dark:border-white/5">{categoryLabel}</span>
                      {guide.status === "Draft" ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span> {t("card.draft")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> {t("card.active")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-2xl bg-muted/60 dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all border border-border/50 dark:border-white/5 shadow-inner hover:rotate-90"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body: Matrix */}
              <div className="p-8 overflow-y-auto relative z-10">
                {guide.sizes.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-5 bg-muted/40 dark:bg-white/5 rounded-3xl border border-border/50 dark:border-white/5 border-dashed">
                    <div className="p-4 rounded-full bg-muted/60 dark:bg-white/5 border border-border/60 dark:border-white/10">
                      <Ruler className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <p className="font-medium tracking-wide">{t("card.emptyMatrix")}</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                    <table className="w-full border-separate border-spacing-y-3">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase text-[11px] tracking-[0.2em] bg-muted/70 dark:bg-black/40 rounded-l-2xl border border-border/50 dark:border-white/5 border-r-0">{t("form.size")}</th>
                          {measurements.map((measurementId, i) => (
                            <th key={measurementId} className={`px-6 py-3 text-left font-semibold text-muted-foreground uppercase text-[11px] tracking-[0.2em] bg-muted/70 dark:bg-black/40 border border-border/50 dark:border-white/5 border-r-0 border-l-0 ${i === measurements.length - 1 ? 'rounded-r-2xl border-r' : ''}`}>
                              {t(`measurements.${measurementId}`)} <span className="opacity-50 ml-1 lowercase">(cm)</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {guide.rawSizes ? guide.rawSizes.map((sizeObj: any, index: number) => {
                          const sizeId = typeof sizeObj === 'string' ? `fallback-${index}` : (sizeObj.id || `size-${index}`);
                          const sizeName = typeof sizeObj === 'string' ? sizeObj : (sizeObj.name || t("card.notAvailable"));
                          
                          return (
                          <tr key={sizeId} className="group transition-all">
                            <td className="px-6 py-4 bg-muted/40 dark:bg-white/5 group-hover:bg-muted/70 dark:group-hover:bg-white/10 border border-border/50 dark:border-white/5 border-r-0 rounded-l-2xl transition-colors">
                              <span className="inline-flex items-center justify-center bg-muted dark:bg-black/60 border border-border/60 dark:border-white/10 text-foreground font-bold uppercase w-12 h-12 rounded-xl shadow-inner text-lg">
                                {sizeName}
                              </span>
                            </td>
                            {measurements.map((measurementId, i) => {
                              const val = guide.matrixValues[`${typeof sizeObj === 'string' ? sizeName : sizeObj.id}_${measurementId}`];
                              return (
                                <td key={measurementId} className={`px-6 py-4 bg-muted/40 dark:bg-white/5 group-hover:bg-muted/70 dark:group-hover:bg-white/10 border border-border/50 dark:border-white/5 border-l-0 transition-colors ${i === measurements.length - 1 ? 'border-r rounded-r-2xl' : 'border-r-0'}`}>
                                  <span className={val ? "text-foreground font-mono font-bold text-base bg-muted/80 dark:bg-black/40 px-4 py-2 rounded-lg border border-border/60 dark:border-white/10 shadow-inner" : "text-muted-foreground opacity-50 px-4 py-2"}>
                                    {val || "-"}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        )}) : guide.sizes.map((sizeName, index) => (
                          <tr key={sizeName} className="group transition-all">
                            <td className="px-6 py-4 bg-muted/40 dark:bg-white/5 group-hover:bg-muted/70 dark:group-hover:bg-white/10 border border-border/50 dark:border-white/5 border-r-0 rounded-l-2xl transition-colors">
                              <span className="inline-flex items-center justify-center bg-muted dark:bg-black/60 border border-border/60 dark:border-white/10 text-foreground font-bold uppercase w-12 h-12 rounded-xl shadow-inner text-lg">
                                {sizeName}
                              </span>
                            </td>
                            {measurements.map((measurementId, i) => (
                                <td key={measurementId} className={`px-6 py-4 bg-muted/40 dark:bg-white/5 group-hover:bg-muted/70 dark:group-hover:bg-white/10 border border-border/50 dark:border-white/5 border-l-0 transition-colors ${i === measurements.length - 1 ? 'border-r rounded-r-2xl' : 'border-r-0'}`}>
                                  <span className="text-muted-foreground opacity-50 px-4 py-2">-</span>
                                </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-border/50 dark:border-white/5 flex items-center justify-between relative z-10 bg-muted/30 dark:bg-black/20">
                <div className="flex gap-3">
                  <button 
                    onClick={handleCopy}
                    className="px-4 py-2.5 rounded-xl bg-muted/60 dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all border border-border/50 dark:border-white/5 shadow-inner flex items-center gap-2 text-sm font-medium"
                  >
                    <Copy className="w-4 h-4" /> {t("card.copyInfo")}
                  </button>
                  <button 
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="px-4 py-2.5 rounded-xl bg-muted/60 dark:bg-white/5 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all border border-border/50 dark:border-white/5 shadow-inner flex items-center gap-2 text-sm font-medium"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />} {t("card.delete")}
                  </button>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/60 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {t("card.close")}
                  </button>
                  <button 
                    onClick={() => { setIsOpen(false); router.push(`/dashboard/size-guides/${guide.id}/edit`); }}
                    className="px-8 py-2.5 rounded-xl text-sm font-bold bg-foreground text-background hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_24px_rgba(0,0,0,0.12)] dark:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    <Edit className="w-4 h-4" /> {t("card.editGuide")}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setIsDeleteModalOpen(false); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-background/95 backdrop-blur-3xl border border-red-500/20 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/20 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-inner">
                <Trash className="w-8 h-8 text-red-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-2 relative z-10">{t("card.deleteConfirmTitle")}</h3>
              <p className="text-muted-foreground text-sm mb-8 relative z-10">
                {t("card.deleteConfirmDesc", { name: guide.name })}
              </p>
              
              <div className="flex gap-4 relative z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsDeleteModalOpen(false); }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors text-foreground border border-white/10"
                >
                  {t("card.cancel")}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("card.yesDelete")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
