"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface MeasurementsFormProps {
  initialData: {
    gender?: string | null;
    height?: number | null;
    weight?: number | null;
    measurements?: Record<string, number | null> | null;
  } | null;
}

export function MeasurementsForm({ initialData }: MeasurementsFormProps) {
  const router = useRouter();
  const gender = initialData?.gender || "unisex";
  const height = initialData?.height?.toString() || "";
  const weight = initialData?.weight?.toString() || "";
  const initialMeasurements = (initialData?.measurements as Record<string, number | null>) || {};
  
  const measurements = {
    chest: initialMeasurements.chest?.toString() || "",
    waist: initialMeasurements.waist?.toString() || "",
    hips: initialMeasurements.hips?.toString() || "",
    inseam: initialMeasurements.inseam?.toString() || "",
    shoulders: initialMeasurements.shoulders?.toString() || "",
  };

  const hasMeasurements = Object.keys(initialMeasurements).length > 0;

  if (!hasMeasurements) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center relative z-10">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="w-10 h-10 text-primary opacity-50" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Aún no tienes medidas</h3>
        <p className="text-muted-foreground max-w-md mb-8">
          Tus medidas corporales se generarán mágicamente cuando realices tu primer escaneo 3D inteligente.
        </p>
        <button
          onClick={() => router.push("/portal/avatar/new")}
          className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
        >
          Ir al Escáner 3D
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10">
      
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6">
        <p className="text-sm text-foreground/80 font-medium">
          Estos datos fueron extraídos con precisión mediante la IA de Bodygram. Para actualizarlos, deberás realizar un nuevo escaneo inteligente en tu panel principal.
        </p>
      </div>
      
      {/* Datos Básicos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-white/10 pb-2">Información Básica</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Género Biológico</label>
            <select
              value={gender}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed"
            >
              <option value="unisex">Prefiero no decirlo</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Altura (cm)</label>
            <input
              type="text"
              readOnly
              value={height ? `${height} cm` : "N/A"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Peso (kg)</label>
            <input
              type="text"
              readOnly
              value={weight ? `${weight} kg` : "N/A"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed font-medium"
            />
          </div>
        </div>
      </div>

      {/* Medidas Específicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-white/10 pb-2">Dimensiones Específicas (cm)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contorno de Pecho</label>
            <input
              type="text"
              readOnly
              value={measurements.chest ? `${measurements.chest} mm` : "N/A"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contorno de Cintura</label>
            <input
              type="text"
              readOnly
              value={measurements.waist ? `${measurements.waist} mm` : "N/A"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contorno de Caderas</label>
            <input
              type="text"
              readOnly
              value={measurements.hips ? `${measurements.hips} mm` : "N/A"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Ancho de Hombros</label>
            <input
              type="text"
              readOnly
              value={measurements.shoulders ? `${measurements.shoulders} mm` : "N/A"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Largo de Entrepierna</label>
            <input
              type="text"
              readOnly
              value={measurements.inseam ? `${measurements.inseam} mm` : "N/A"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed font-medium"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
