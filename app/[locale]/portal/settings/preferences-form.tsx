"use client";

import { useState } from "react";
import { updateUserPreferences } from "./actions";
import { toast } from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

interface PreferencesFormProps {
  initialTheme: string;
  initialLocale: string;
}

export function PreferencesForm({ initialTheme, initialLocale }: PreferencesFormProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [preferredTheme, setPreferredTheme] = useState(initialTheme);
  const [preferredLocale, setPreferredLocale] = useState(initialLocale);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await updateUserPreferences({
        preferredTheme,
        preferredLocale,
      });

      if (res.success) {
        setTheme(preferredTheme); // Aplicar tema instantáneamente en el cliente
        toast.success("Preferencias guardadas");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar preferencias");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tema Visual</label>
          <select
            value={preferredTheme}
            onChange={(e) => setPreferredTheme(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="system">Sincronizar con el Sistema</option>
            <option value="light">Modo Claro</option>
            <option value="dark">Modo Oscuro</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Elige cómo se verá tu panel de control y probador virtual.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Idioma Preferido</label>
          <select
            value={preferredLocale}
            onChange={(e) => setPreferredLocale(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="en">English (US)</option>
            <option value="es">Español (ES)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            El idioma principal para notificaciones y alertas.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading || (preferredTheme === initialTheme && preferredLocale === initialLocale)}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Cambios
        </button>
      </div>

    </form>
  );
}
