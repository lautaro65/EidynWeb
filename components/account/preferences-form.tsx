"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "@/i18n/routing";
import { updatePreferences } from "@/app/[locale]/dashboard/account-actions";
import { Loader2, Moon, Sun, Monitor, Languages } from "lucide-react";
import { useTranslations } from "next-intl";

export function PreferencesForm({ 
  initialTheme, 
  initialLocale 
}: { 
  initialTheme: string;
  initialLocale: string;
}) {
  const { setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Account");

  const [theme, setLocalTheme] = useState(initialTheme);
  const [locale, setLocalLocale] = useState(initialLocale);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Apply locally immediately
      setTheme(theme);
      
      // Save to database
      await updatePreferences(theme, locale);

      // Change locale routing if needed
      if (locale !== initialLocale) {
        router.replace(pathname, { locale });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40" />
      
      <div className="relative">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          {t("preferencesTitle") || "Preferencias de la Aplicación"}
        </h2>

        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4" /> {t("themeLabel") || "Apariencia"}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { 
                  id: "light", 
                  icon: Sun, 
                  label: t("themeLight") || "Claro",
                  activeClass: "bg-zinc-100 text-zinc-900 border-zinc-300 shadow-[0_0_15px_rgba(255,255,255,0.5)] dark:bg-zinc-200",
                  inactiveClass: "border-border bg-background hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-300 text-muted-foreground"
                },
                { 
                  id: "dark", 
                  icon: Moon, 
                  label: t("themeDark") || "Oscuro",
                  activeClass: "bg-zinc-950 text-zinc-100 border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                  inactiveClass: "border-border bg-background hover:bg-zinc-950 hover:text-zinc-100 hover:border-zinc-800 text-muted-foreground"
                },
                { 
                  id: "system", 
                  icon: Monitor, 
                  label: t("themeSystem") || "Sistema",
                  activeClass: "bg-primary/10 text-primary border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]",
                  inactiveClass: "border-border bg-background hover:bg-primary/5 hover:text-primary hover:border-primary/50 text-muted-foreground"
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocalTheme(opt.id)}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                    ${theme === opt.id ? opt.activeClass : opt.inactiveClass}
                  `}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Languages className="w-4 h-4" /> {t("languageLabel") || "Idioma"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "en", label: "English" },
                { id: "es", label: "Español" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocalLocale(opt.id)}
                  className={`
                    p-4 rounded-xl border transition-all text-sm font-medium
                    ${locale === opt.id 
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" 
                      : "border-border bg-background hover:bg-muted/50 hover:border-primary/50 text-muted-foreground"}
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || (theme === initialTheme && locale === initialLocale)}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-xl font-medium transition-all hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("savePreferences") || "Guardar Preferencias"}
          </button>
        </div>
      </div>
    </div>
  );
}
