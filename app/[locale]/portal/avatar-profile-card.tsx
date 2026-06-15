"use client";

import { useState } from "react";
import { User, Ruler, Calendar, Edit2, Check, X, Loader2 } from "lucide-react";
import { updatePhysicalProfile } from "./actions";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AvatarProfileCardProps {
  initialData: {
    name: string;
    gender: string;
    height: number;
    age: number;
  };
}

export function AvatarProfileCard({ initialData }: AvatarProfileCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    gender: initialData.gender || "unisex",
    height: initialData.height?.toString() || "",
    age: initialData.age?.toString() || "",
  });

  const handleSave = async () => {
    if (!formData.name || !formData.height || !formData.age) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);
    try {
      const res = await updatePhysicalProfile({
        name: formData.name,
        gender: formData.gender,
        height: Number(formData.height),
        age: Number(formData.age),
      });

      if (res.success) {
        toast.success("Perfil actualizado");
        setIsEditing(false);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: initialData.name || "",
      gender: initialData.gender || "unisex",
      height: initialData.height?.toString() || "",
      age: initialData.age?.toString() || "",
    });
    setIsEditing(false);
  };

  const renderValue = (value: string | number) => value || "No especificado";
  const renderGender = (gender: string) => {
    switch (gender) {
      case "male": return "Masculino";
      case "female": return "Femenino";
      default: return "No especificado";
    }
  };

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          Datos Base
        </h3>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4 relative z-10">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            Nombre
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          ) : (
            <p className="font-medium text-foreground">{renderValue(initialData.name)}</p>
          )}
        </div>

        {/* Gender & Age */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Género
            </label>
            {isEditing ? (
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-sm outline-none focus:border-blue-500 transition-colors"
              >
                <option value="unisex">Prefiero no decirlo</option>
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
              </select>
            ) : (
              <p className="font-medium text-foreground">{renderGender(initialData.gender)}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Edad
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            ) : (
              <p className="font-medium text-foreground">{initialData.age ? `${initialData.age} años` : "No especificada"}</p>
            )}
          </div>
        </div>

        {/* Height */}
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Ruler className="w-3 h-3" />
            Altura
          </label>
          {isEditing ? (
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          ) : (
            <p className="font-medium text-foreground">{initialData.height ? `${initialData.height} cm` : "No especificada"}</p>
          )}
        </div>
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className="mt-6 flex items-center gap-2 relative z-10 pt-4 border-t border-white/10">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground font-medium rounded-xl transition-all text-sm"
          >
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
