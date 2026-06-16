"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, UploadCloud, CheckCircle2, User, Ruler, Weight, Camera, Info, Loader2, Minus, Plus, Box } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { startAvatarGeneration } from "../../actions";
import { useTranslations } from "next-intl";
import { validatePose } from "./pose-validator";

interface AvatarWizardProps {
  initialData: {
    gender: string;
    height: number;
    weight: number;
  };
}

export function AvatarWizard({ initialData }: AvatarWizardProps) {
  const router = useRouter();
  const t = useTranslations("AvatarWizard");
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const [isValidatingFront, setIsValidatingFront] = useState(false);
  const [isValidatingSide, setIsValidatingSide] = useState(false);

  // Step 1 State
  const [physicalData, setPhysicalData] = useState({
    gender: initialData.gender || "unisex",
    height: initialData.height || 170,
    weight: initialData.weight || 70,
  });

  // Step 2 State
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [sideImage, setSideImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [sidePreview, setSidePreview] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (file: File | null, type: "front" | "side") => {
    if (!file) return;
    
    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("toastSizeLimit"));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    
    if (type === "front") setIsValidatingFront(true);
    else setIsValidatingSide(true);

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => { 
        img.onload = () => {
          img.width = img.naturalWidth;
          img.height = img.naturalHeight;
          resolve(null);
        }; 
      });

      const validation = await validatePose(img, type);

      if (!validation.isValid) {
        toast.error(validation.errorKey ? t(validation.errorKey) : t("toastError"), { duration: 5000 });
        if (type === "front") setIsValidatingFront(false);
        else setIsValidatingSide(false);
        
        // Reset input value so they can select the same file again if they want
        if (type === "front" && frontInputRef.current) frontInputRef.current.value = "";
        if (type === "side" && sideInputRef.current) sideInputRef.current.value = "";
        
        return;
      }
      
      if (type === "front") {
        setFrontImage(file);
        setFrontPreview(previewUrl);
      } else {
        setSideImage(file);
        setSidePreview(previewUrl);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      if (type === "front") {
        setFrontImage(file);
        setFrontPreview(previewUrl);
      } else {
        setSideImage(file);
        setSidePreview(previewUrl);
      }
    } finally {
      if (type === "front") setIsValidatingFront(false);
      else setIsValidatingSide(false);
    }
  };

  const handleNext = () => {
    if (!physicalData.height || !physicalData.weight) {
      toast.error(t("toastMissingData"));
      return;
    }
    setStep(2);
    setShowInstructions(true);
  };

  const handleSubmit = async () => {
    if (!frontImage || !sideImage) {
      toast.error(t("toastMissingPhotos"));
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("gender", physicalData.gender);
      formData.append("height", physicalData.height.toString());
      formData.append("weight", physicalData.weight.toString());
      formData.append("frontImage", frontImage);
      formData.append("sideImage", sideImage);

      const res = await startAvatarGeneration(formData);
      
      if (res.success) {
        toast.success(t("toastSuccess"));
        router.push("/portal");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toastError"));
      setIsSubmitting(false);
    }
  };

  // UI Helpers
  const adjustValue = (field: 'height' | 'weight', amount: number) => {
    setPhysicalData(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + amount)
    }));
  };

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40" />

      {/* Header */}
      <div className="mb-10 relative z-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2 flex items-center gap-3">
            <Camera className="w-8 h-8 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {step === 1 ? t("step1Subtitle") : t("step2Subtitle")}
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex gap-2">
          <div className={`h-2 rounded-full transition-all duration-500 ${step >= 1 ? "w-12 bg-primary" : "w-4 bg-primary/20"}`} />
          <div className={`h-2 rounded-full transition-all duration-500 ${step >= 2 ? "w-12 bg-primary" : "w-4 bg-primary/20"}`} />
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
            className="space-y-10 relative z-10"
          >
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex gap-4">
              <Info className="w-6 h-6 text-primary shrink-0" />
              <p className="text-sm text-foreground/80 font-medium">
                {t("infoBox")}
              </p>
            </div>

            {/* Género (Cards) */}
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" /> {t("genderLabel")}
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "female", label: t("genderFemale") },
                  { id: "male", label: t("genderMale") },
                  { id: "unisex", label: t("genderUnisex") }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPhysicalData({ ...physicalData, gender: option.id })}
                    className={`
                      relative flex flex-col items-center justify-center gap-2 p-6 rounded-[1.5rem] border-[1.5px] transition-all duration-300
                      ${physicalData.gender === option.id 
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                        : 'border-border/60 bg-card hover:border-primary/40'
                      }
                    `}
                  >
                    {physicalData.gender === option.id && (
                      <span className="absolute top-3 right-3 text-primary">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    )}
                    <span className={`font-medium text-center ${physicalData.gender === option.id ? 'text-primary' : 'text-foreground'}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Altura Stepper */}
              <div className="space-y-4">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> {t("heightLabel")}
                </label>
                <div className="flex items-center justify-between p-4 bg-card border-[1.5px] border-border/60 rounded-[1.5rem]">
                  <button 
                    onClick={() => adjustValue('height', -1)}
                    className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-4xl font-serif font-light text-foreground">{physicalData.height}</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{t("heightUnit")}</span>
                  </div>
                  <button 
                    onClick={() => adjustValue('height', 1)}
                    className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Peso Stepper */}
              <div className="space-y-4">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Weight className="w-4 h-4" /> {t("weightLabel")}
                </label>
                <div className="flex items-center justify-between p-4 bg-card border-[1.5px] border-border/60 rounded-[1.5rem]">
                  <button 
                    onClick={() => adjustValue('weight', -1)}
                    className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-4xl font-serif font-light text-foreground">{physicalData.weight}</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{t("weightUnit")}</span>
                  </div>
                  <button 
                    onClick={() => adjustValue('weight', 1)}
                    className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/10">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                {t("btnNext")}
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
            {/* Instructions Modal Overlay */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-50 bg-background/95 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-6 md:p-8 flex flex-col shadow-2xl overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <h2 className="text-2xl font-serif font-bold text-foreground mb-4">{t("instructionsTitle")}</h2>
                    <p className="text-muted-foreground mb-6">
                      {t("instructionsDesc")}
                    </p>

                    <div className="space-y-8">
                      {/* Front Photo */}
                      <div>
                        <h3 className="text-lg font-semibold text-primary mb-3">{t("frontPhotoInstTitle")}</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80 mb-4">
                          <li>{t("frontPhotoInst1")}</li>
                          <li>{t("frontPhotoInst2")}</li>
                          <li>{t("frontPhotoInst3")}</li>
                        </ul>
                      </div>

                      {/* Side Photo */}
                      <div>
                        <h3 className="text-lg font-semibold text-primary mb-3">{t("sidePhotoInstTitle")}</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80 mb-4">
                          <li>{t("sidePhotoInst1")}</li>
                          <li>{t("sidePhotoInst2")}</li>
                          <li>{t("sidePhotoInst3")}</li>
                        </ul>
                      </div>

                      {/* Examples */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">{t("examplesTitle")}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/model3dpose/front.jpg" alt="Ejemplo Frontal" className="w-full rounded-xl border border-white/10 object-cover aspect-[1/2]" />
                            <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("exampleFront")}</p>
                          </div>
                          <div className="space-y-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/model3dpose/right.jpg" alt="Ejemplo Perfil" className="w-full rounded-xl border border-white/10 object-cover aspect-[1/2]" />
                            <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("exampleSide")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-white/10 flex justify-end">
                    <button 
                      onClick={() => setShowInstructions(false)}
                      className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                    >
                      {t("btnUnderstood")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Front Image */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">1</span>
                  {t("frontPhotoTitle")}
                </h3>
                <p className="text-sm text-muted-foreground h-10">{t("frontPhotoDesc")}</p>
                
                <div 
                  onClick={() => frontInputRef.current?.click()}
                  className={`
                    w-full aspect-[3/4] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 cursor-pointer transition-all overflow-hidden relative
                    ${frontPreview ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-card hover:border-primary/40 hover:bg-white/5'}
                  `}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={frontInputRef}
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null, "front")}
                  />
                  
                  {isValidatingFront ? (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                      <p className="font-medium animate-pulse">{t("analyzingPose")}</p>
                    </div>
                  ) : frontPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={frontPreview} alt="Frontal" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium flex items-center gap-2"><UploadCloud className="w-5 h-5" /> {t("changePhoto")}</p>
                      </div>
                      <CheckCircle2 className="absolute top-4 right-4 text-emerald-500 bg-white rounded-full w-8 h-8 drop-shadow-md" />
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-center font-medium">{t("uploadFrontPhoto")}</p>
                      <p className="text-center text-xs text-muted-foreground mt-2">{t("fileReqs")}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Side Image */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">2</span>
                  {t("sidePhotoTitle")}
                </h3>
                <p className="text-sm text-muted-foreground h-10">{t("sidePhotoDesc")}</p>
                
                <div 
                  onClick={() => sideInputRef.current?.click()}
                  className={`
                    w-full aspect-[3/4] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 cursor-pointer transition-all overflow-hidden relative
                    ${sidePreview ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-card hover:border-primary/40 hover:bg-white/5'}
                  `}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={sideInputRef}
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null, "side")}
                  />
                  
                  {isValidatingSide ? (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                      <p className="font-medium animate-pulse">{t("analyzingPose")}</p>
                    </div>
                  ) : sidePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sidePreview} alt="Perfil" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium flex items-center gap-2"><UploadCloud className="w-5 h-5" /> {t("changePhoto")}</p>
                      </div>
                      <CheckCircle2 className="absolute top-4 right-4 text-emerald-500 bg-white rounded-full w-8 h-8 drop-shadow-md" />
                    </>
                  ) : (
                    <>
                       <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-center font-medium">{t("uploadSidePhoto")}</p>
                      <p className="text-center text-xs text-muted-foreground mt-2">{t("fileReqs")}</p>
                    </>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <button
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-4 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-5 h-5" />
                {t("btnBack")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !frontImage || !sideImage}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Box className="w-5 h-5" />}
                {t("btnSubmit")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
