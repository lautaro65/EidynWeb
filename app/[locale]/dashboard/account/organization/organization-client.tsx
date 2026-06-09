"use client";

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
  
  const [formData, setFormData] = useState<ConfigData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

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
          Widget Configuration
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Customize the look, feel, and behavior of the 3D Try-On widget on your store.
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
            <h2 className="text-xl font-bold">Styles (Branding & UX)</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Widget Theme</label>
              <select
                name="theme"
                value={formData.widgetConfig.theme}
                onChange={handleWidgetConfigChange}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none"
              >
                <option value="system">System (Auto)</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="brandColor"
                  value={formData.brandColor}
                  onChange={handleChange}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
                <input
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
                <label className="text-sm font-medium text-foreground block mb-1">Enable 3D Zoom</label>
                <p className="text-[11px] text-muted-foreground">Allow users to zoom in/out of the 3D model using scroll/pinch.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input type="checkbox" name="allowZoom" checked={formData.widgetConfig.allowZoom} onChange={handleWidgetConfigChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/5 relative overflow-hidden">
              <div className="relative z-10">
                <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                  Eidyn Watermark
                  {isFreePlan && <Lock className="w-3 h-3 text-muted-foreground" />}
                </label>
                <p className="text-[11px] text-muted-foreground">Show &quot;Powered by Eidyn&quot; overlay on the 3D canvas.</p>
              </div>
              <label className={`relative inline-flex items-center shrink-0 mt-1 z-10 ${isFreePlan ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input 
                  type="checkbox" 
                  name="watermark" 
                  checked={isFreePlan ? true : formData.widgetConfig.watermark} 
                  onChange={handleWidgetConfigChange} 
                  disabled={isFreePlan}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              {isFreePlan && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-white bg-black/80 px-3 py-1 rounded-full">Pro Plan Required</span>
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
                <label className="text-sm font-medium text-foreground">Rate Limiting Monitor</label>
                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-wider">Optimal</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">12 <span className="text-xs text-muted-foreground font-normal">req / min</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">Last 60 minutes average</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Max 100 rpm</p>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="bg-green-500 w-[12%] h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Session TTL (Minutes)</label>
              <input
                type="number"
                name="sessionTtlMinutes"
                min="10"
                max="120"
                value={formData.widgetConfig.sessionTtlMinutes}
                onChange={handleWidgetConfigChange}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Time until temporary 3D asset URLs expire to protect your models.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">GDPR Consent Disclaimer</label>
              <textarea
                name="consentText"
                rows={3}
                value={formData.widgetConfig.consentText}
                onChange={handleWidgetConfigChange}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground resize-none"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Text shown to users in the `needs_consent` state before generating their avatar.</p>
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
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
