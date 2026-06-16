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
  const formatCm = (mmValue: number | null | undefined) => mmValue ? (mmValue / 10).toFixed(1) : "";

  // Diccionario de todas las medidas posibles que devuelve Bodygram y su traducción
  const bodygramLabels: Record<string, string> = {
    acrossBackShoulderWidth: "Ancho de Hombros",
    backNeckHeight: "Altura de la Nuca",
    backNeckPointToGroundContoured: "Nuca a Suelo (Contorno)",
    backNeckPointToWaist: "Nuca a Cintura",
    backNeckPointToWristLengthR: "Nuca a Muñeca",
    bellyWaistDepth: "Profundidad Abdominal",
    bellyWaistGirth: "Contorno Abdominal",
    bellyWaistHeight: "Altura Abdominal",
    bellyWaistWidth: "Ancho Abdominal",
    bustGirth: "Contorno de Pecho",
    bustHeight: "Altura de Pecho",
    calfGirthR: "Contorno de Pantorrilla",
    forearmGirthR: "Contorno de Antebrazo",
    hipGirth: "Contorno de Caderas",
    hipHeight: "Altura de Caderas",
    insideLegHeight: "Altura de Entrepierna (Suelo)",
    insideLegLengthR: "Largo de Entrepierna",
    kneeGirthR: "Contorno de Rodilla",
    kneeHeightR: "Altura de Rodilla",
    midThighGirthR: "Contorno Medio Muslo",
    neckBaseGirth: "Base del Cuello",
    neckGirth: "Contorno de Cuello",
    outerAnkleHeightR: "Altura Tobillo Exterior",
    outerArmLengthR: "Largo Exterior del Brazo",
    outseamR: "Costura Exterior Pierna",
    outsideLegLengthR: "Largo Total Exterior Pierna",
    shoulderToElbowR: "Hombro a Codo",
    thighGirthR: "Contorno de Muslo",
    topHipGirth: "Contorno Cadera Alta",
    topHipHeight: "Altura Cadera Alta",
    underBustGirth: "Contorno Bajo Pecho",
    upperArmGirthR: "Contorno de Bíceps",
    waistGirth: "Contorno de Cintura",
    waistHeight: "Altura de Cintura",
    wristGirthR: "Contorno de Muñeca",
  };

  // Preparamos un array con las medidas que realmente existen en el JSON de este usuario
  const availableMeasurements = Object.entries(bodygramLabels)
    .map(([key, label]) => ({
      key,
      label,
      value: initialMeasurements[key],
    }))
    .filter(m => m.value !== undefined && m.value !== null);

  const hasMeasurements = availableMeasurements.length > 0 || Object.keys(initialMeasurements).length > 0;

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

      {/* Medidas Específicas - DYNAMIC GRID */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-white/10 pb-2 flex items-center justify-between">
          Dimensiones Específicas
          <span className="text-xs font-normal text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
            {availableMeasurements.length} métricas analizadas
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableMeasurements.map((m) => (
            <div key={m.key} className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <label className="text-xs font-medium text-muted-foreground truncate block" title={m.label}>
                {m.label}
              </label>
              <div className="text-sm font-semibold text-foreground">
                {formatCm(m.value)} cm
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
