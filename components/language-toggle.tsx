"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const LOCALE_SYNC_KEY = "eidyn:locale-sync";
const LOCALE_SWITCH_TOAST_ID = "locale-switch";
const LOCALE_SWITCH_DELAY_MS = 220;

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const [isSwitching, setIsSwitching] = useState(false);

  const switchingLabel = t("switchingLanguage");

  const buildLocalizedUrl = useCallback((targetLocale: string) => {
    const searchParams = window.location.search;
    const hash = window.location.hash;
    return `/${targetLocale}${pathname === "/" ? "" : pathname}${searchParams}${hash}`;
  }, [pathname]);

  const startSwitchFeedback = useCallback(() => {
    toast.loading(switchingLabel, {
      id: LOCALE_SWITCH_TOAST_ID,
      duration: 2500,
      position: "top-center",
    });
  }, [switchingLabel]);

  const navigateWithDelay = useCallback((targetLocale: string) => {
    window.setTimeout(() => {
      window.location.href = buildLocalizedUrl(targetLocale);
    }, LOCALE_SWITCH_DELAY_MS);
  }, [buildLocalizedUrl]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_SYNC_KEY || !event.newValue) return;

      try {
        const payload = JSON.parse(event.newValue) as { locale?: string };
        const nextLocale = payload.locale;

        if (!nextLocale || nextLocale === locale) return;

        startSwitchFeedback();
        navigateWithDelay(nextLocale);
      } catch {
        // Ignore malformed payloads.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [locale, navigateWithDelay, startSwitchFeedback]);

  const toggleLocale = () => {
    if (isSwitching) return;

    const nextLocale = locale === "es" ? "en" : "es";
    setIsSwitching(true);
    startSwitchFeedback();

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

    navigateWithDelay(nextLocale);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      disabled={isSwitching}
      aria-label={t("toggleLanguage")}
      className="font-semibold text-primary hover:text-primary/80 disabled:opacity-70"
    >
      {locale === "es" ? "EN" : "ES"}
    </Button>
  );
}
