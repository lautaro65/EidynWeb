"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Shirt, Image as ImageIcon, Info, Check, ChevronRight, ChevronLeft, Upload, Loader2 } from "lucide-react";
import { GarmentViewer } from "@/components/3d/GarmentViewer";
import { createGarmentTemplate } from "./actions";

// Mock Base Models
const BASE_MODELS = [
  { id: "tshirt", labelKey: "categoryTshirt", url: "/models/tshirt.glb" },
  { id: "hoodie", labelKey: "categoryHoodie", url: "/models/hoodie.glb" },
  { id: "pants", labelKey: "categoryPants", url: "/models/pants.glb" },
  { id: "jacket", labelKey: "categoryJacket", url: "/models/jacket.glb" },
];

export function GarmentEditor() {
  const t = useTranslations("GarmentsNew");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor State
  const [category, setCategory] = useState<string>("tshirt");
  const [color, setColor] = useState<string>("#ffffff");
  const [frontImage, setFrontImage] = useState<string>("");
  const [backImage, setBackImage] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [gender, setGender] = useState<string>("unisex");
  const [description, setDescription] = useState<string>("");

  const currentModelUrl = BASE_MODELS.find(m => m.id === category)?.url || "";

  // Mock File Upload (For visual purposes, a real implementation would upload to R2 here)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to R2 and get a URL. 
      // For now, we create a local object URL to preview it.
      const url = URL.createObjectURL(file);
      setUrl(url);
    }
  };

  const handleSave = async () => {
    if (!name || !sku) {
      setError("El Nombre y el SKU son obligatorios.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      await createGarmentTemplate({
        sku,
        name,
        category,
        gender,
        description,
        baseColor: color,
        frontImage,
        backImage,
      });
      router.push("/dashboard/brand/garments");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al guardar la prenda.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      
      {/* Left Panel: 3D Viewer */}
      <div className="flex-1 bg-background/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative min-h-[400px]">
        <GarmentViewer 
          url={currentModelUrl} 
          colorHex={color} 
          textureUrl={frontImage} 
          backTextureUrl={backImage} 
        />
      </div>

      {/* Right Panel: Editor Controls */}
      <div className="w-full lg:w-[450px] flex flex-col bg-background/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Steps Header */}
        <div className="flex p-2 bg-black/20 border-b border-white/5">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`flex-1 text-center py-3 text-xs font-medium uppercase tracking-wider rounded-xl transition-all duration-300 ${
                step === s 
                  ? "bg-white/10 text-primary" 
                  : step > s 
                    ? "text-foreground" 
                    : "text-muted-foreground"
              }`}
            >
              {s === 1 ? <Shirt className="w-4 h-4 mx-auto mb-1" /> : s === 2 ? <ImageIcon className="w-4 h-4 mx-auto mb-1" /> : <Info className="w-4 h-4 mx-auto mb-1" />}
              {s === 1 ? t("step1") : s === 2 ? t("step2") : t("step3")}
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Base Model */}
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <h3 className="text-xl font-medium">{t("selectBaseModel")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t("baseModelDesc")}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {BASE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setCategory(model.id)}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
                      category === model.id 
                        ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" 
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Shirt className={`w-8 h-8 mb-3 ${category === model.id ? "scale-110" : ""}`} />
                    <span className="font-medium text-sm">{t(model.labelKey as Parameters<typeof t>[0])}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Design */}
          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <h3 className="text-xl font-medium">{t("designTitle")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t("designDesc")}</p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">{t("baseColor")}</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="font-mono text-sm uppercase text-muted-foreground">{color}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">{t("frontImage")}</label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 transition-colors relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, setFrontImage)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {frontImage ? (
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={frontImage} alt="Front" className="h-20 object-contain mb-2 rounded" />
                      <span className="text-xs text-primary font-medium">Cambiar imagen</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm">{t("uploadPlaceholder")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">{t("backImage")}</label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 transition-colors relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, setBackImage)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {backImage ? (
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={backImage} alt="Back" className="h-20 object-contain mb-2 rounded" />
                      <span className="text-xs text-primary font-medium">Cambiar imagen</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm">{t("uploadPlaceholder")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <h3 className="text-xl font-medium">{t("detailsTitle")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t("detailsDesc")}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("garmentName")}</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("garmentNamePlaceholder")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("sku")}</label>
                  <input 
                    type="text" 
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder={t("skuPlaceholder")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("gender")}</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  >
                    <option value="unisex">{t("genderUnisex")}</option>
                    <option value="male">{t("genderMale")}</option>
                    <option value="female">{t("genderFemale")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("garmentDesc")}</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep((s) => s - 1 as 1|2|3)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("back")}
            </button>
          ) : (
            <button 
              onClick={() => router.push("/dashboard/brand/garments")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              {t("cancel")}
            </button>
          )}

          {step < 3 ? (
            <button 
              onClick={() => setStep((s) => s + 1 as 1|2|3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-foreground hover:bg-white/20 transition-all"
            >
              {t("next")}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isSubmitting ? t("saving") : t("saveGarment")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
