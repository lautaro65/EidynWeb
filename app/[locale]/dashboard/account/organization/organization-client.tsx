"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Building2, Globe, Palette, Upload } from "lucide-react";
import { updateOrganizationConfigAction } from "./actions";

type ConfigData = {
  tenantName: string;
  tenantSlug: string;
  logoUrl: string;
  brandColor: string;
  storeName: string;
  currency: string;
  timezone: string;
  country: string;
};

export function OrganizationClient({ initialData }: { initialData: ConfigData }) {
  const t = useTranslations();
  const router = useRouter();
  
  const [formData, setFormData] = useState<ConfigData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    const res = await updateOrganizationConfigAction(formData);
    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Organization settings saved successfully");
      router.refresh();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Organization Profile
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Manage your brand identity and regional settings across your Eidyn workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Branding Column */}
        <div className="space-y-8">
          <div className="bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none -mt-10 -mr-10 transition-opacity opacity-50 group-hover:opacity-100" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Corporate Branding</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Organization Name</label>
                <input
                  type="text"
                  name="tenantName"
                  value={formData.tenantName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">URL Slug</label>
                <input
                  type="text"
                  name="tenantSlug"
                  value={formData.tenantSlug}
                  onChange={handleChange}
                  placeholder="e.g. acme-corp"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Logo URL</label>
                <div className="relative">
                  <input
                    type="url"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                  />
                  <Upload className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Image uploads coming soon. Please use a public URL.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Widget Brand Color</label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg border border-white/20 shadow-inner" 
                    style={{ backgroundColor: formData.brandColor }}
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
              </div>
            </div>
          </div>
        </div>

        {/* Regional Settings Column */}
        <div className="space-y-8">
          <div className="bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none -mt-10 -mr-10 transition-opacity opacity-50 group-hover:opacity-100" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold">Regional Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Country / Region</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-foreground appearance-none"
                >
                  <option value="US">United States (US)</option>
                  <option value="ES">Spain (ES)</option>
                  <option value="AR">Argentina (AR)</option>
                  <option value="MX">Mexico (MX)</option>
                  <option value="UK">United Kingdom (UK)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Default Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-foreground appearance-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="ARS">ARS ($)</option>
                  <option value="MXN">MXN ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-foreground appearance-none"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Argentina/Buenos_Aires">Buenos Aires (ART)</option>
                  <option value="Europe/Madrid">Central European Time (CET)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
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
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
