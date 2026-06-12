"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Shirt, Check, ChevronRight, ChevronLeft, Upload, Loader2, Layers, Wind, Sparkles, Footprints, Scissors, Accessibility, AlertCircle } from "lucide-react";
import { GarmentViewer } from "@/components/3d/GarmentViewer";
import { createGarmentTemplate, checkSkuAvailability, processImageWithRemoveBg } from "./actions";
import { useDebouncedCallback } from "use-debounce";
import dynamic from "next/dynamic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TextureEditor = dynamic(() => import("@/components/2d/TextureEditor"), { ssr: false });

// Mock Base Models
const BASE_MODELS = [
  { id: "tshirt", labelKey: "categoryTshirt", url: "/models/remera.glb", icon: Shirt },
  { id: "hoodie", labelKey: "categoryHoodie", url: "/models/hoodie.glb", icon: Layers },
  { id: "pants", labelKey: "categoryPants", url: "/models/pants.glb", icon: Accessibility },
  { id: "shorts", labelKey: "categoryShorts", url: "/models/shorts.glb", icon: Scissors },
  { id: "jacket", labelKey: "categoryJacket", url: "/models/jacket.glb", icon: Wind },
  { id: "dress", labelKey: "categoryDress", url: "/models/dress.glb", icon: Sparkles },
  { id: "shoes", labelKey: "categoryShoes", url: "/models/shoes.glb", icon: Footprints },
];

export function GarmentEditor() {
  const t = useTranslations("GarmentsNew");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("front");

  // Editor State
  const [category, setCategory] = useState<string>("tshirt");
  const [color, setColor] = useState<string>("#ffffff");
  const [frontImage, setFrontImage] = useState<string>("");
  const [backImage, setBackImage] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [gender, setGender] = useState<string>("unisex");
  const [description, setDescription] = useState<string>("");
  const [generatedTexture, setGeneratedTexture] = useState<string>("");
  const [generatedBackTexture, setGeneratedBackTexture] = useState<string>("");

  const [skuError, setSkuError] = useState<string | null>(null);
  const [isCheckingSku, setIsCheckingSku] = useState(false);

  const currentModelUrl = BASE_MODELS.find(m => m.id === category)?.url || "";

  const validateSku = useDebouncedCallback(async (value: string) => {
    if (!value) {
      setSkuError(null);
      return;
    }
    setIsCheckingSku(true);
    try {
      const res = await checkSkuAvailability(value);
      if (!res.available) {
        setSkuError(t("errorSkuInUse"));
      } else {
        setSkuError(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingSku(false);
    }
  }, 500);

  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setSku(val);
    validateSku(val);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void, setIsUploading: (val: boolean) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);

        // This server action uses remove.bg to clear the background and returns a base64 DataURL
        const res = await processImageWithRemoveBg(formData);
        if (res.success && res.dataUrl) {
          setUrl(res.dataUrl);
        } else {
          // Fallback to local URL if API fails or is not configured
          console.error("Failed to remove background:", res.error);
          setUrl(URL.createObjectURL(file));
        }
      } catch (err) {
        console.error("Upload error:", err);
        setUrl(URL.createObjectURL(file));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name || !sku) {
      setError(t("errorRequired"));
      return;
    }
    if (skuError) {
      setError(t("errorFixSku"));
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
        // Guardamos el lienzo 2D procesado (que tiene la posición, rotación, borrados) 
        // en lugar de la imagen cruda subida por el usuario
        frontImage: generatedTexture || frontImage,
        backImage: generatedBackTexture || backImage,
      });
      if (true) {
        router.push("/dashboard/brand/garments");
      } else {
        setError(t("errorSave"));
      }
    } catch (err: unknown) {
      console.error(err);
      setError(t("errorSave"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">

      {/* Left Panel: 3D Viewer */}
      <div className="w-full lg:flex-1 lg:sticky lg:top-24 h-[500px] lg:h-[calc(100vh-8rem)] bg-background/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <GarmentViewer
          url={currentModelUrl}
          colorHex={color}
          textureUrl={step >= 3 && generatedTexture ? generatedTexture : undefined}
          backTextureUrl={step >= 3 && generatedBackTexture ? generatedBackTexture : undefined}
        />
      </div>

      {/* Right Panel: Editor Controls */}
      <div className="w-full lg:w-[450px] flex flex-col bg-background/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">

        {/* Steps Header (Progress Bar) */}
        <div className="p-6 pb-4 border-b border-white/5 bg-black/20">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">
                {t("step")} {step} {t("of")} 4
              </p>
              <h2 className="text-lg font-medium text-foreground">
                {step === 1 ? t("step1") : step === 2 ? t("step2") : step === 3 ? t("step3") : t("step4")}
              </h2>
            </div>
            <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              {Math.round((step / 4) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="p-6 space-y-8 relative">
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
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${category === model.id
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <model.icon className={`w-8 h-8 mb-3 ${category === model.id ? "scale-110" : ""}`} />
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
                    onChange={(e) => handleFileUpload(e, setFrontImage, setIsUploadingFront)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isUploadingFront}
                  />
                  {frontImage ? (
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={frontImage} alt="Front" className="h-20 object-contain mb-2 rounded" />
                      <span className="text-xs text-primary font-medium">{t("changeImage")}</span>
                    </div>
                  ) : isUploadingFront ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Loader2 className="w-8 h-8 mb-2 opacity-50 animate-spin" />
                      <span className="text-sm">{t("processingAi")}</span>
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
                    onChange={(e) => handleFileUpload(e, setBackImage, setIsUploadingBack)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isUploadingBack}
                  />
                  {backImage ? (
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={backImage} alt="Back" className="h-20 object-contain mb-2 rounded" />
                      <span className="text-xs text-primary font-medium">{t("changeImage")}</span>
                    </div>
                  ) : isUploadingBack ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Loader2 className="w-8 h-8 mb-2 opacity-50 animate-spin" />
                      <span className="text-sm">{t("processingAi")}</span>
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

          {/* Step 3: Editor 2D (Hidden strictly via CSS to preserve Konva Canvas state) */}
          <div className={`flex-col ${step === 3 ? "flex animate-in slide-in-from-right-4 duration-300" : "hidden"}`}>
            <div className="mb-4">
              <h3 className="text-xl font-medium">{t("editor2DTitle")}</h3>
              <p className="text-muted-foreground text-sm mt-1">{t("editor2DDesc")}</p>
            </div>

            <div className="w-full relative aspect-[4/5]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                <TabsList className="w-full max-w-md grid grid-cols-2 bg-white/5 border border-white/10 mb-4 shrink-0">
                  <TabsTrigger value="front" className="data-[state=active]:bg-primary">{t("tabFront")}</TabsTrigger>
                  <TabsTrigger value="back" className="data-[state=active]:bg-primary">{t("tabBack")}</TabsTrigger>
                </TabsList>

                {/* We use hidden instead of TabsContent to prevent unmounting the Canvas and losing state */}
                <div className={`flex-1 min-h-0 w-full ${activeTab === "front" ? "block" : "hidden"}`}>
                  <TextureEditor
                    baseColor={color}
                    imageUrl={frontImage}
                    onTextureUpdate={setGeneratedTexture}
                  />
                </div>
                <div className={`flex-1 min-h-0 w-full ${activeTab === "back" ? "block" : "hidden"}`}>
                  <TextureEditor
                    baseColor={color}
                    imageUrl={backImage}
                    onTextureUpdate={setGeneratedBackTexture}
                  />
                </div>
              </Tabs>
            </div>
          </div>

          {/* Step 4: Details */}
          {step === 4 && (
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
                  <div className="relative">
                    <input
                      type="text"
                      value={sku}
                      onChange={handleSkuChange}
                      placeholder={t("skuPlaceholder")}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase transition-colors ${skuError ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10"
                        }`}
                    />
                    {isCheckingSku && (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin absolute right-3 top-3.5" />
                    )}
                  </div>
                  {skuError && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {skuError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("gender")}</label>
                  <Select value={gender} onValueChange={(val) => setGender(val || "unisex")}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 h-auto text-sm focus:ring-primary/50">
                      <SelectValue placeholder={t("genderUnisex")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unisex">{t("genderUnisex")}</SelectItem>
                      <SelectItem value="male">{t("genderMale")}</SelectItem>
                      <SelectItem value="female">{t("genderFemale")}</SelectItem>
                    </SelectContent>
                  </Select>
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
              onClick={() => setStep((s) => s - 1 as 1 | 2 | 3)}
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

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1 as 1 | 2 | 3 | 4)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-foreground hover:bg-white/20 transition-all"
            >
              {t("next")}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSubmitting || isCheckingSku || !!skuError}
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
