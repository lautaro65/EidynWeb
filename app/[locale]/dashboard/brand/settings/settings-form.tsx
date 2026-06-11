"use client";

import { useState } from "react";
import { updateBrandSettings } from "./actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function BrandSettingsForm({ tenant }: { tenant: { name: string | null; websiteUrl: string | null; socialUrl: string | null; logoUrl: string | null } }) {
  const router = useRouter();
  const [name, setName] = useState(tenant.name || "");
  const [websiteUrl, setWebsiteUrl] = useState(tenant.websiteUrl || "");
  const [socialUrl, setSocialUrl] = useState(tenant.socialUrl || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("websiteUrl", websiteUrl);
      formData.append("socialUrl", socialUrl);
      if (logoFile) {
        formData.append("logoFile", logoFile);
      }

      await updateBrandSettings(formData);
      setSuccess(true);
      router.refresh();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 shadow-sm">
      <div className="space-y-2">
        <label className="block text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Nombre de la Marca
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-12 px-4 rounded-[0.875rem] border-[1.5px] border-border bg-background text-[0.95rem] text-foreground placeholder:text-muted-foreground/50 font-light outline-none transition-colors duration-200 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Página Web
        </label>
        <input
          type="url"
          required
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="w-full h-12 px-4 rounded-[0.875rem] border-[1.5px] border-border bg-background text-[0.95rem] text-foreground placeholder:text-muted-foreground/50 font-light outline-none transition-colors duration-200 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Red Social Principal
        </label>
        <input
          type="url"
          required
          value={socialUrl}
          onChange={(e) => setSocialUrl(e.target.value)}
          className="w-full h-12 px-4 rounded-[0.875rem] border-[1.5px] border-border bg-background text-[0.95rem] text-foreground placeholder:text-muted-foreground/50 font-light outline-none transition-colors duration-200 focus:border-primary"
        />
      </div>

      <div className="space-y-4">
        <label className="block text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Logo Actual
        </label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden relative">
            {logoFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={URL.createObjectURL(logoFile)} alt="New Logo Preview" className="w-full h-full object-cover" />
            ) : tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl.replace("r2://", "/api/r2?url=r2://")} alt="Current Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-muted-foreground text-xs font-medium">Sin logo</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-[0.875rem] file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
            />
            <p className="text-xs text-muted-foreground font-light">
              Recomendado: 512x512px. PNG o JPG.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 flex items-center justify-between border-t border-border/40">
        <div className="text-sm">
          {success && <span className="text-emerald-500 font-medium">¡Cambios guardados con éxito!</span>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-[0.875rem] bg-foreground text-background text-sm font-medium transition-all duration-200 hover:bg-primary hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(201,123,90,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
