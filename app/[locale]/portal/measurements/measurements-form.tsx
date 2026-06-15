"use client";

import { useState } from "react";
import { updateAvatarMeasurements } from "../actions";
import { toast } from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [gender, setGender] = useState(initialData?.gender || "unisex");
  const [height, setHeight] = useState<string>(initialData?.height?.toString() || "");
  const [weight, setWeight] = useState<string>(initialData?.weight?.toString() || "");
  
  const initialMeasurements = (initialData?.measurements as Record<string, number | null>) || {};
  const [measurements, setMeasurements] = useState<Record<string, string>>({
    chest: initialMeasurements.chest?.toString() || "",
    waist: initialMeasurements.waist?.toString() || "",
    hips: initialMeasurements.hips?.toString() || "",
    inseam: initialMeasurements.inseam?.toString() || "",
    shoulders: initialMeasurements.shoulders?.toString() || "",
  });

  const handleMeasurementChange = (key: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Parse to numbers
      const parsedMeasurements: Record<string, number | null> = {};
      Object.keys(measurements).forEach(k => {
        const val = measurements[k];
        parsedMeasurements[k] = val && val.trim() !== "" ? Number(val) : null;
      });

      const res = await updateAvatarMeasurements({
        gender,
        height: height && height.trim() !== "" ? Number(height) : undefined,
        weight: weight && weight.trim() !== "" ? Number(weight) : undefined,
        measurements: parsedMeasurements
      });

      if (res.success) {
        toast.success("Medidas actualizadas correctamente");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar medidas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
      
      {/* Datos Básicos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-white/10 pb-2">Información Básica</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Género Biológico</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="unisex">Prefiero no decirlo</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Altura (cm)</label>
            <input
              type="number"
              placeholder="Ej: 175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Peso (kg)</label>
            <input
              type="number"
              placeholder="Ej: 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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
              type="number"
              placeholder="Ej: 95"
              value={measurements.chest}
              onChange={(e) => handleMeasurementChange("chest", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contorno de Cintura</label>
            <input
              type="number"
              placeholder="Ej: 80"
              value={measurements.waist}
              onChange={(e) => handleMeasurementChange("waist", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contorno de Caderas</label>
            <input
              type="number"
              placeholder="Ej: 100"
              value={measurements.hips}
              onChange={(e) => handleMeasurementChange("hips", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Ancho de Hombros</label>
            <input
              type="number"
              placeholder="Ej: 45"
              value={measurements.shoulders}
              onChange={(e) => handleMeasurementChange("shoulders", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Largo de Entrepierna</label>
            <input
              type="number"
              placeholder="Ej: 82"
              value={measurements.inseam}
              onChange={(e) => handleMeasurementChange("inseam", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Perfil
        </button>
      </div>

    </form>
  );
}
