import { Ruler } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getOrCreateActiveAvatar } from "../actions";
import { MeasurementsForm } from "./measurements-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await getTranslations({ locale, namespace: "PortalMeasurements" });
  return {
    title: `Mis Medidas - Eidyn`,
  };
}

export default async function PortalMeasurementsPage() {
  const activeAvatar = await getOrCreateActiveAvatar();

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm font-semibold mb-4 border border-purple-500/20">
          <Ruler className="w-4 h-4" />
          Perfil de Tallas
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Tus Medidas Corporales
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Al mantener estas medidas actualizadas, nuestro sistema podrá recomendarte la talla exacta en cualquier tienda asociada y moldear tu Avatar 3D con mayor precisión.
        </p>
      </div>

      {/* Formulario Interactivo */}
      <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        
        <MeasurementsForm 
          initialData={activeAvatar ? {
            gender: activeAvatar.gender,
            height: activeAvatar.height ? Number(activeAvatar.height) : null,
            weight: activeAvatar.weight ? Number(activeAvatar.weight) : null,
            measurements: activeAvatar.measurements as Record<string, number | null> | null
          } : null} 
        />
      </div>

    </div>
  );
}
