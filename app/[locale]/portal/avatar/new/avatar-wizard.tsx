"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, UploadCloud, CheckCircle2, User, Ruler, Weight, Camera, Info, Loader2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { startAvatarGeneration } from "../../actions"; // We need to create this action

interface AvatarWizardProps {
  initialData: {
    gender: string;
    height: number;
    weight: number;
  };
}

export function AvatarWizard({ initialData }: AvatarWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 State
  const [physicalData, setPhysicalData] = useState({
    gender: initialData.gender,
    height: initialData.height.toString(),
    weight: initialData.weight.toString(),
  });

  // Step 2 State
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [sideImage, setSideImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [sidePreview, setSidePreview] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (file: File | null, type: "front" | "side") => {
    if (!file) return;
    
    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 10MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    
    if (type === "front") {
      setFrontImage(file);
      setFrontPreview(previewUrl);
    } else {
      setSideImage(file);
      setSidePreview(previewUrl);
    }
  };

  const handleNext = () => {
    if (!physicalData.height || !physicalData.weight) {
      toast.error("Por favor ingresa tu altura y peso");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!frontImage || !sideImage) {
      toast.error("Por favor sube ambas fotografías");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("gender", physicalData.gender);
      formData.append("height", physicalData.height);
      formData.append("weight", physicalData.weight);
      formData.append("frontImage", frontImage);
      formData.append("sideImage", sideImage);

      const res = await startAvatarGeneration(formData);
      
      if (res.success) {
        toast.success("¡Fotografías enviadas!");
        router.push("/portal");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al iniciar la generación.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40" />

      {/* Header */}
      <div className="mb-10 relative z-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2 flex items-center gap-3">
            <Camera className="w-8 h-8 text-blue-500" />
            Asistente de Creación 3D
          </h1>
          <p className="text-muted-foreground">
            {step === 1 ? "Paso 1: Confirma tus medidas base." : "Paso 2: Sube tus fotografías."}
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex gap-2">
          <div className={`h-2 rounded-full transition-all duration-500 ${step >= 1 ? "w-12 bg-blue-500" : "w-4 bg-white/10"}`} />
          <div className={`h-2 rounded-full transition-all duration-500 ${step >= 2 ? "w-12 bg-blue-500" : "w-4 bg-white/10"}`} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 relative z-10"
          >
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex gap-4">
              <Info className="w-6 h-6 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-200">
                La Inteligencia Artificial necesita conocer tu complexión básica antes de analizar las fotografías para evitar distorsiones en el modelo 3D resultante.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" /> Género Biológico
                </label>
                <select
                  value={physicalData.gender}
                  onChange={(e) => setPhysicalData({ ...physicalData, gender: e.target.value })}
                  className="w-full h-14 px-4 rounded-xl border border-white/10 bg-white/5 text-foreground outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="unisex">Prefiero no decirlo</option>
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Altura (cm)
                </label>
                <input
                  type="number"
                  value={physicalData.height}
                  onChange={(e) => setPhysicalData({ ...physicalData, height: e.target.value })}
                  placeholder="Ej: 175"
                  className="w-full h-14 px-4 rounded-xl border border-white/10 bg-white/5 text-foreground outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Weight className="w-4 h-4" /> Peso Estimado (kg)
                </label>
                <input
                  type="number"
                  value={physicalData.weight}
                  onChange={(e) => setPhysicalData({ ...physicalData, weight: e.target.value })}
                  placeholder="Ej: 70"
                  className="w-full h-14 px-4 rounded-xl border border-white/10 bg-white/5 text-foreground outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
              >
                Siguiente
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 relative z-10"
          >
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Front Image */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs">1</span>
                  Fotografía Frontal
                </h3>
                <p className="text-sm text-muted-foreground h-10">Párate derecho mirando a la cámara, con los brazos ligeramente separados.</p>
                
                <div 
                  onClick={() => frontInputRef.current?.click()}
                  className={`
                    w-full aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 cursor-pointer transition-all overflow-hidden relative
                    ${frontPreview ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/20 bg-white/5 hover:border-blue-500/50 hover:bg-white/10'}
                  `}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={frontInputRef}
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null, "front")}
                  />
                  
                  {frontPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={frontPreview} alt="Frontal" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium flex items-center gap-2"><UploadCloud className="w-5 h-5" /> Cambiar foto</p>
                      </div>
                      <CheckCircle2 className="absolute top-4 right-4 text-emerald-400 w-8 h-8 drop-shadow-md" />
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-center font-medium">Subir foto frontal</p>
                      <p className="text-center text-xs text-muted-foreground mt-2">JPG o PNG (Max 10MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Side Image */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs">2</span>
                  Fotografía de Perfil
                </h3>
                <p className="text-sm text-muted-foreground h-10">Párate de costado hacia la cámara, manteniendo la misma postura recta.</p>
                
                <div 
                  onClick={() => sideInputRef.current?.click()}
                  className={`
                    w-full aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 cursor-pointer transition-all overflow-hidden relative
                    ${sidePreview ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/20 bg-white/5 hover:border-blue-500/50 hover:bg-white/10'}
                  `}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={sideInputRef}
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null, "side")}
                  />
                  
                  {sidePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sidePreview} alt="Perfil" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium flex items-center gap-2"><UploadCloud className="w-5 h-5" /> Cambiar foto</p>
                      </div>
                      <CheckCircle2 className="absolute top-4 right-4 text-emerald-400 w-8 h-8 drop-shadow-md" />
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-center font-medium">Subir foto de perfil</p>
                      <p className="text-center text-xs text-muted-foreground mt-2">JPG o PNG (Max 10MB)</p>
                    </>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <button
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-4 bg-white/5 text-foreground font-medium rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-5 h-5" />
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !frontImage || !sideImage}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                Generar Avatar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
