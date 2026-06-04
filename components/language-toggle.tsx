"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const LOCALE_SYNC_KEY = "eidyn:locale-sync";

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();

  const buildLocalizedUrl = (targetLocale: string) => {
    const searchParams = window.location.search;
    const hash = window.location.hash;
    return `/${targetLocale}${pathname === "/" ? "" : pathname}${searchParams}${hash}`;
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_SYNC_KEY || !event.newValue) return;

      try {
        const payload = JSON.parse(event.newValue) as { locale?: string };
        const nextLocale = payload.locale;

        if (!nextLocale || nextLocale === locale) return;

        window.location.href = buildLocalizedUrl(nextLocale);
      } catch {
        // Ignore malformed payloads.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [locale, pathname]);

  const toggleLocale = () => {
    const nextLocale = locale === "es" ? "en" : "es";
    // Utilizamos navegación dura (window.location) para evitar el error 
    // "Encountered a script tag" de next-themes con React 19 / Next 15.
    // Al forzar un refresco completo, evitamos que React intente inyectar
    // el script dinámicamente en el cliente.
    try {
      localStorage.setItem(
        LOCALE_SYNC_KEY,
        JSON.stringify({ locale: nextLocale, timestamp: Date.now() })
      );
    } catch {
      // Ignore storage restrictions and continue with local navigation.
    }

    window.location.href = buildLocalizedUrl(nextLocale);
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleLocale} className="font-semibold text-primary hover:text-primary/80">
      {locale === "es" ? "EN" : "ES"}
    </Button>
  );
}
