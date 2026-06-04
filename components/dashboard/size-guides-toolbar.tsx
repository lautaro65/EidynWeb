"use client";

import { useState } from "react";
import { Search, Settings2, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function SizeGuidesToolbar() {
  const t = useTranslations("SizeGuides");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeStatus = searchParams.get("status") || "all";
  const activeCategory = searchParams.get("category") || "all";

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-20">
      <div className="relative w-full sm:max-w-md group">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div className="relative flex items-center w-full bg-background/70 backdrop-blur-2xl border border-border/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg hover:border-border dark:hover:border-white/20 focus-within:border-primary/50 transition-all duration-300">
          <Search className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder={t("searchPlaceholder")}
            onChange={(e) => setFilter("search", e.target.value)}
            defaultValue={searchParams.get("search") || ""}
            className="w-full bg-transparent border-none py-3.5 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
          />
        </div>
      </div>
      
      <div className="relative w-full sm:w-auto">
        <button 
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 shadow-lg px-5 py-3.5 rounded-2xl border ${
            isFiltersOpen 
              ? "bg-primary/10 border-primary text-primary shadow-primary/20" 
                : "bg-background/70 backdrop-blur-2xl border-border/60 dark:border-white/10 text-muted-foreground hover:border-border dark:hover:border-white/20 hover:bg-muted/50 dark:hover:bg-background/70 hover:text-foreground"
          }`}
        >
          <Settings2 className={`w-4 h-4 transition-transform duration-300 ${isFiltersOpen ? "rotate-90" : ""}`} /> 
          {t("filters")}
        </button>

        {/* Dropdown Menu */}
        {isFiltersOpen && (
          <div className="absolute right-0 top-full mt-3 w-56 bg-background/90 backdrop-blur-3xl border border-border/60 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">{t("toolbar.status")}</div>
            
            <button 
              onClick={() => setFilter("status", "all")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/70 dark:hover:bg-white/5 transition-colors text-sm font-medium text-left text-foreground"
            >
              {t("toolbar.statusAll")}
              {activeStatus === "all" && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button 
              onClick={() => setFilter("status", "Active")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/70 dark:hover:bg-white/5 transition-colors text-sm font-medium text-left text-foreground"
            >
              {t("toolbar.statusActive")}
              {activeStatus === "Active" && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button 
              onClick={() => setFilter("status", "Draft")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/70 dark:hover:bg-white/5 transition-colors text-sm font-medium text-left text-foreground"
            >
              {t("toolbar.statusDraft")}
              {activeStatus === "Draft" && <Check className="w-4 h-4 text-primary" />}
            </button>

            <div className="my-1 border-t border-border/60 dark:border-white/10"></div>
            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">{t("toolbar.category")}</div>
            
            <button 
              onClick={() => setFilter("category", "all")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/70 dark:hover:bg-white/5 transition-colors text-sm font-medium text-left text-foreground"
            >
              {t("toolbar.categoryAll")}
              {activeCategory === "all" && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button 
              onClick={() => setFilter("category", "remeras")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/70 dark:hover:bg-white/5 transition-colors text-sm font-medium text-left text-foreground"
            >
              {t("form.categories.remeras")}
              {activeCategory === "remeras" && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button 
              onClick={() => setFilter("category", "pantalones")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/70 dark:hover:bg-white/5 transition-colors text-sm font-medium text-left text-foreground"
            >
              {t("form.categories.pantalones")}
              {activeCategory === "pantalones" && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button 
              onClick={() => setFilter("category", "abrigos")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/70 dark:hover:bg-white/5 transition-colors text-sm font-medium text-left text-foreground"
            >
              {t("form.categories.abrigos")}
              {activeCategory === "abrigos" && <Check className="w-4 h-4 text-primary" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
