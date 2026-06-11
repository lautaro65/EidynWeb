"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Palette, ShieldCheck, LayoutTemplate, Lock } from "lucide-react";
import { updateOrganizationConfigAction } from "./actions";

type WidgetConfig = {
  theme: "light" | "dark" | "system";
  watermark: boolean;
  allowZoom: boolean;
  sessionTtlMinutes: number;
  consentText: string;
  authorizedDomains: string[];
};

export type ConfigData = {
  tenantName: string;
  tenantSlug: string;
  logoUrl: string;
  brandColor: string;
  storeName: string;
  currency: string;
  timezone: string;
  country: string;
  plan: string;
  widgetConfig: WidgetConfig;
};

export function OrganizationClient({ initialData }: { initialData: ConfigData }) {
  const router = useRouter();
  const t = useTranslations("Organization");
  
  const [formData, setFormData] = useState<ConfigData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  const isFreePlan = formData.plan === "free" || !formData.plan;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleWidgetConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    
    setFormData((prev) => ({
      ...prev,
      widgetConfig: {
        ...prev.widgetConfig,
        [target.name]: value
      }
    }));
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    let cleanDomain = newDomain.trim().toLowerCase();
    
    // Quitar http:// o https://
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)/, "");
    
    // Quitar www.
    cleanDomain = cleanDomain.replace(/^www\./, "");
    
    // Quitar rutas al final
    cleanDomain = cleanDomain.split('/')[0];

    const currentDomains = formData.widgetConfig.authorizedDomains || [];
    if (!currentDomains.includes(cleanDomain)) {
      setFormData((prev) => ({
        ...prev,
        widgetConfig: {
          ...prev.widgetConfig,
          authorizedDomains: [...currentDomains, cleanDomain]
        }
      }));
    }
    setNewDomain("");
  };

  const handleRemoveDomain = (domain: string) => {
    setFormData((prev) => ({
      ...prev,
      widgetConfig: {
        ...prev.widgetConfig,
        authorizedDomains: (prev.widgetConfig.authorizedDomains || []).filter((d) => d !== domain)
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Force watermark to true if free plan, just in case
    const dataToSave = { ...formData };
    if (isFreePlan) {
      dataToSave.widgetConfig.watermark = true;
    }

    const res = await updateOrganizationConfigAction(dataToSave);
    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Widget configuration saved successfully");
      router.refresh();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("title", { fallback: "Widget Configuration" })}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t("description", { fallback: "Customize the look, feel, and behavior of the 3D Try-On widget on your store." })}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Estilos */}
        <div className="bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none -mt-10 -mr-10" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{t("configTitle", { fallback: "Styles (Branding & UX)" })}</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="widgetTheme" className="text-sm font-medium text-foreground">{t("widgetTheme", { fallback: "Widget Theme" })}</label>
              <select
                id="widgetTheme"
                name="theme"
                value={formData.widgetConfig.theme}
                onChange={handleWidgetConfigChange}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none"
              >
                <option value="system">{t("systemAuto", { fallback: "System (Auto)" })}</option>
                <option value="light">{t("lightMode", { fallback: "Light Mode" })}</option>
                <option value="dark">{t("darkMode", { fallback: "Dark Mode" })}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="brandColorText" className="text-sm font-medium text-foreground">{t("primaryColor", { fallback: "Primary Brand Color" })}</label>
              <div className="flex items-center gap-3">
                <input
                  aria-label="Seleccionar color primario"
                  type="color"
                  name="brandColor"
                  value={formData.brandColor}
                  onChange={handleChange}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  id="brandColorText"
                  type="text"
                  name="brandColor"
                  value={formData.brandColor}
                  onChange={handleChange}
                  placeholder="#FFFFFF"
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground uppercase"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Used for the &quot;Try-On&quot; button and interactive highlights to match your brand.</p>
            </div>
          </div>
        </div>

        {/* Comportamiento */}
        <div className="bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none -mt-10 -mr-10" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <LayoutTemplate className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold">Behavior & Layout</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/5">
              <div>
                <label htmlFor="allowZoom" className="text-sm font-medium text-foreground block mb-1">{t("zoom", { fallback: "Enable 3D Zoom" })}</label>
                <p className="text-[11px] text-muted-foreground">{t("zoomDesc", { fallback: "Allow users to zoom in/out of the 3D model using scroll/pinch." })}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input id="allowZoom" type="checkbox" name="allowZoom" checked={formData.widgetConfig.allowZoom} onChange={handleWidgetConfigChange} className="sr-only peer" aria-label={t("zoom", { fallback: "Enable 3D Zoom" })} />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/5 relative overflow-hidden">
              <div className="relative z-10">
                <label htmlFor="watermark" className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                  Eidyn Watermark
                  {isFreePlan && <Lock className="w-3 h-3 text-muted-foreground" />}
                </label>
                <p className="text-[11px] text-muted-foreground">Show &quot;Powered by Eidyn&quot; overlay on the 3D canvas.</p>
              </div>
              <label className={`relative inline-flex items-center shrink-0 mt-1 z-10 ${isFreePlan ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input 
                  id="watermark"
                  type="checkbox" 
                  name="watermark" 
                  aria-label="Eidyn Watermark"
                  checked={isFreePlan ? true : formData.widgetConfig.watermark} 
                  onChange={handleWidgetConfigChange} 
                  disabled={isFreePlan}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              {isFreePlan && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-white bg-black/80 px-3 py-1 rounded-full">{t("proRequired", { fallback: "Pro Plan Required" })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="xl:col-span-2 bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] pointer-events-none -mt-10 -mr-10" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">Security & Rules</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">{t("rateLimit", { fallback: "Rate Limiting Monitor" })}</label>
                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-wider">{t("optimal", { fallback: "Optimal" })}</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">12 <span className="text-xs text-muted-foreground font-normal">req / min</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t("rateDesc1", { fallback: "Last 60 minutes average" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">{t("rateDesc2", { fallback: "Max 100 rpm" })}</p>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="bg-green-500 w-[12%] h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="sessionTtlMinutes" className="text-sm font-medium text-foreground">{t("sessionTtl", { fallback: "Session TTL (Minutes)" })}</label>
              <input
                id="sessionTtlMinutes"
                type="number"
                name="sessionTtlMinutes"
                min="10"
                max="120"
                value={formData.widgetConfig.sessionTtlMinutes}
                onChange={handleWidgetConfigChange}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
              />
              <p className="text-[11px] text-muted-foreground mt-1">{t("assetDesc", { fallback: "Time until temporary 3D asset URLs expire to protect your models." })}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="consentText" className="text-sm font-medium text-foreground">{t("gdpr", { fallback: "GDPR Consent Disclaimer" })}</label>
              <textarea
                id="consentText"
                name="consentText"
                rows={3}
                value={formData.widgetConfig.consentText}
                onChange={handleWidgetConfigChange}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground resize-none"
              />
              <p className="text-[11px] text-muted-foreground mt-1">{t("gdprDesc2", { fallback: "Text shown to users in the needs_consent state before generating their avatar." })}</p>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/10">
              <div>
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  Dominios Autorizados (CORS)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Solo las tiendas web listadas aquí podrán inyectar tu Widget 3D. Esto evita que roben tu consumo de API.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="ejemplo.com"
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className="bg-green-500/20 text-green-400 font-bold px-6 rounded-xl hover:bg-green-500 hover:text-white transition-colors"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {(formData.widgetConfig.authorizedDomains || []).length === 0 ? (
                  <div className="text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    ⚠️ Peligro: Si no agregas ningún dominio, tu widget rechazará todas las conexiones.
                  </div>
                ) : (
                  (formData.widgetConfig.authorizedDomains || []).map((domain) => (
                    <div key={domain} className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl">
                      <span className="text-sm font-medium">{domain}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-w-[200px]"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            t("save", { fallback: "Save Changes" })
          )}
        </button>
      </div>
    </div>
  );
}
