"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Box, CheckCircle2, Shirt, Save, Undo } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateGarmentSkuAction, getBrandsAction, createGarmentTemplateAction } from "@/app/[locale]/dashboard/garments/new/actions";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";

// --- Subcomponente del visor 3D ---
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

// --- Componente Principal ---
export function NewGarmentFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"metadata" | "editor">("metadata");
  const [isLoading, setIsLoading] = useState(false);
  const [brandsList, setBrandsList] = useState<{id: string, name: string}[]>([]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    brandName: "",
    sku: "",
    category: "remera", // Por defecto y único disponible por ahora
  });

  // Cargar marcas al montar
  useEffect(() => {
    const fetchBrands = async () => {
      const res = await getBrandsAction();
      if (res.brands) {
        setBrandsList(res.brands);
      }
    };
    fetchBrands();
  }, []);

  const handleMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brandName || !formData.sku) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    setIsLoading(true);
    try {
      // Formatear marca (Primera mayúscula, resto minúscula)
      const formattedBrand = formData.brandName.trim().charAt(0).toUpperCase() + formData.brandName.trim().slice(1).toLowerCase();
      setFormData(prev => ({ ...prev, brandName: formattedBrand }));

      // Validar SKU
      const res = await validateGarmentSkuAction(formData.sku);
      if (res.error) throw new Error(res.error);
      if (res.inUse) {
        toast.error("Este SKU ya está en uso. Por favor elige otro.");
        return;
      }

      // Si todo está OK, pasamos al paso 2
      setStep("editor");
      toast.success("Información validada.");
    } catch (err: any) {
      toast.error(err.message || "Error al validar la información.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGarment = async () => {
    setIsLoading(true);
    try {
      const res = await createGarmentTemplateAction(formData);
      if (res.error) throw new Error(res.error);
      
      toast.success("¡Prenda guardada con éxito!");
      router.push("/dashboard/garments"); // Redirigir al listado
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la prenda en la base de datos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      {/* Indicador de Pasos */}
      <div className="flex items-center justify-center mb-12">
        <div className={cn("flex items-center gap-2 transition-colors", step === "metadata" ? "text-primary" : "text-emerald-500")}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-current text-white">
            {step === "editor" ? <CheckCircle2 className="w-5 h-5" /> : "1"}
          </div>
          <span className="font-semibold text-sm">Información Comercial</span>
        </div>
        <div className="w-16 h-px mx-4 bg-white/20 relative">
          <div className={cn("absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-500", step === "editor" ? "w-full" : "w-0")} />
        </div>
        <div className={cn("flex items-center gap-2 transition-colors", step === "editor" ? "text-primary" : "text-muted-foreground")}>
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", step === "editor" ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground")}>
            2
          </div>
          <span className="font-semibold text-sm">Editor 3D</span>
        </div>
      </div>

      {/* PASO 1: METADATA */}
      {step === "metadata" && (
        <form onSubmit={handleMetadataSubmit} className="bg-background/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Identificación de Prenda</h2>
            <p className="text-muted-foreground text-sm">Establece los datos base de tu prenda. El SKU es tu código único para sincronización.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground/80">Nombre Comercial</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Remera Oversize Classic"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground/80">Marca</label>
              <input 
                type="text" 
                required
                list="brands-datalist"
                value={formData.brandName}
                onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                placeholder="Ej: Nike, Adidas, Eidyn..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <datalist id="brands-datalist">
                {brandsList.map(b => (
                  <option key={b.id} value={b.name} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground mt-2">Puedes escribir una marca nueva o elegir una de la lista.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground/80">SKU (Código Único)</label>
              <input 
                type="text" 
                required
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                placeholder="Ej: SHIRT-001"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Validar y Continuar"}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      )}

      {/* PASO 2: EDITOR 3D */}
      {step === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-right-8 duration-700">
          
          {/* Panel Lateral: Controles */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-background/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Box className="w-5 h-5 text-primary" /> Configuración</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Categoría Base</label>
                  <div className="flex items-center gap-3 p-3 bg-white/5 border border-primary/30 rounded-xl text-sm font-medium">
                    <Shirt className="w-5 h-5 text-primary" />
                    Remera (T-Shirt)
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">*Por el momento, solo la categoría Remera está disponible en el editor.</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Resumen</label>
                  <ul className="text-sm space-y-2">
                    <li className="flex justify-between"><span className="text-muted-foreground">Nombre:</span> <b>{formData.name}</b></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">Marca:</span> <b>{formData.brandName}</b></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">SKU:</span> <b>{formData.sku}</b></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep("metadata")} 
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-foreground border border-white/10 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Undo className="w-4 h-4" /> Volver
              </button>
              <button 
                onClick={handleSaveGarment}
                disabled={isLoading}
                className="flex-[2] py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>

          {/* Lienzo 3D */}
          <div className="lg:col-span-3 bg-gradient-to-br from-white/5 to-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden relative min-h-[500px] lg:min-h-[600px] flex items-center justify-center">
            {/* Overlay grid */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Editor 3D Activo
            </div>

            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 45 }}>
              <color attach="background" args={['transparent']} />
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              
              <Stage environment="city" intensity={0.5}>
                <Model url="/models/remera.glb" />
              </Stage>
              
              <OrbitControls makeDefault minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} />
            </Canvas>
          </div>

        </div>
      )}

    </div>
  );
}
