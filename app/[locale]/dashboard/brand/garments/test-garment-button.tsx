"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createTestGarmentAction } from "./actions";
import { toast } from "react-hot-toast";

export function TestGarmentButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTest = async () => {
    setIsLoading(true);
    try {
      const res = await createTestGarmentAction();
      if (res.success) {
        toast.success("Modelo de prueba creado exitosamente");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al crear modelo de prueba");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreateTest}
      disabled={isLoading}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500/10 text-amber-500 font-medium rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition-all duration-300 disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
      Añadir Modelo de Prueba
    </button>
  );
}
