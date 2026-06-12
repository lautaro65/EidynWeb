"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Shirt, Globe } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";

export function GarmentsToolbar() {
  const t = useTranslations("BrandGarments");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentTab = searchParams.get("tab") || "my-garments";
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    params.delete("page"); // Reset page when changing tabs
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    params.delete("page"); // Reset page on new search
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 relative z-10">
      
      {/* Premium Segmented Tabs */}
      <div className="flex items-center p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-[1.25rem] w-full sm:w-auto shadow-inner">
        <button
          onClick={() => handleTabChange("my-garments")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-500 ease-out ${
            currentTab === "my-garments"
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_4px_20px_-4px_rgba(var(--primary),0.5)] scale-100"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 scale-95 hover:scale-100"
          }`}
        >
          <Shirt className={`w-4 h-4 transition-transform duration-500 ${currentTab === "my-garments" ? "scale-110" : ""}`} />
          {t("tabMyGarments")}
        </button>
        <button
          onClick={() => handleTabChange("community")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-500 ease-out ${
            currentTab === "community"
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_4px_20px_-4px_rgba(var(--primary),0.5)] scale-100"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 scale-95 hover:scale-100"
          }`}
        >
          <Globe className={`w-4 h-4 transition-transform duration-500 ${currentTab === "community" ? "scale-110" : ""}`} />
          {t("tabCommunity")}
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
