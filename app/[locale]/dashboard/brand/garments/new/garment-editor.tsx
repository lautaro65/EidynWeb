"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Shirt, Check, ChevronRight, ChevronLeft, Upload, Loader2, AlertCircle, Ghost, Columns2, AlignEndVertical, Shield, Hourglass, SportShoe, Plus, Info } from "lucide-react";
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
const LoaderComponent = () => {
  const t = useTranslations("GarmentsNew");
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-3" aria-live="polite" aria-busy="true">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-sm font-medium">{t("loading3D")}</span>
    </div>
  );
};

const GarmentViewer = dynamic(() => import("@/components/3d/GarmentViewer").then(mod => mod.GarmentViewer), {
  ssr: false,
  loading: LoaderComponent
});

// Mock Base Models
const BASE_MODELS = [
  { id: "tshirt", labelKey: "categoryTshirt", url: "/models/remera.glb", icon: Shirt },
  { id: "hoodie", labelKey: "categoryHoodie", url: "/models/hoodie.glb", icon: Ghost },
  { id: "pants", labelKey: "categoryPants", url: "/models/pants.glb", icon: Columns2 },
  { id: "shorts", labelKey: "categoryShorts", url: "/models/shorts.glb", icon: AlignEndVertical },
  { id: "jacket", labelKey: "categoryJacket", url: "/models/jacket.glb", icon: Shield },
  { id: "dress", labelKey: "categoryDress", url: "/models/dress.glb", icon: Hourglass },
  { id: "shoes", labelKey: "categoryShoes", url: "/models/shoes.glb", icon: SportShoe },
];

const COMPONENT_CATEGORIES = [
  { id: "collarType", labelKey: "collarType" },
  { id: "pocketType", labelKey: "pocketType" },
  { id: "sleevesType", labelKey: "sleevesType" },
  { id: "closureType", labelKey: "closureType" },
  { id: "hemType", labelKey: "hemType" },
  { id: "hoodType", labelKey: "hoodType" },
  { id: "cuffType", labelKey: "cuffType" },
] as const;

const COMPONENT_OPTIONS = {
  collarType: [
    { id: "crew", labelKey: "collarCrew" },
    { id: "vneck", labelKey: "collarVneck" },
    { id: "turtleneck", labelKey: "collarTurtleneck" },
  ],
  pocketType: [
    { id: "none", labelKey: "pocketNone" },
    { id: "chest_left", labelKey: "pocketChestLeft" },
    { id: "chest_right", labelKey: "pocketChestRight" },
    { id: "kangaroo", labelKey: "pocketKangaroo" },
  ],
  sleevesType: [
    { id: "sleeveSleeveless", labelKey: "sleeveSleeveless" },
    { id: "sleeveShort", labelKey: "sleeveShort" },
    { id: "sleeve34", labelKey: "sleeve34" },
    { id: "sleeveLong", labelKey: "sleeveLong" },
    { id: "sleeveRaglan", labelKey: "sleeveRaglan" },
  ],
  closureType: [
    { id: "closureNone", labelKey: "closureNone" },
    { id: "closureFullZip", labelKey: "closureFullZip" },
    { id: "closureHalfZip", labelKey: "closureHalfZip" },
    { id: "closureButtons", labelKey: "closureButtons" },
  ],
  hemType: [
    { id: "hemStraight", labelKey: "hemStraight" },
    { id: "hemCurved", labelKey: "hemCurved" },
    { id: "hemCropped", labelKey: "hemCropped" },
    { id: "hemRibbed", labelKey: "hemRibbed" },
  ],
  hoodType: [
    { id: "hoodNone", labelKey: "hoodNone" },
    { id: "hoodStandard", labelKey: "hoodStandard" },
    { id: "hoodOversize", labelKey: "hoodOversize" },
    { id: "hoodDrawstrings", labelKey: "hoodDrawstrings" },
  ],
  cuffType: [
    { id: "cuffSimple", labelKey: "cuffSimple" },
    { id: "cuffRibbed", labelKey: "cuffRibbed" },
    { id: "cuffThumbhole", labelKey: "cuffThumbhole" },
  ],
} as const;

export type GarmentVariant = {
  id: string;
  name: string;
  color: string;
  frontImage: string;
  backImage: string;
  generatedTexture: string;
  generatedBackTexture: string;
};

export function GarmentEditor() {
  const t = useTranslations("GarmentsNew");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("front");
  const [activeComponentTab, setActiveComponentTab] = useState<keyof typeof COMPONENT_OPTIONS>("collarType");

  // Size Grading State
  const [baseSizeName, setBaseSizeName] = useState("M");
  const [orderedSizes, setOrderedSizes] = useState<string[]>(["M"]);
  const [activeSizeTab, setActiveSizeTab] = useState<string | null>(null);
  const [sizeChart, setSizeChart] = useState<Record<string, Record<string, number>>>({});
  const [newSizeInput, setNewSizeInput] = useState("");
  const [sizingSystem, setSizingSystem] = useState<"alphanumeric" | "numeric">("alphanumeric");
  const [draggedSizeTab, setDraggedSizeTab] = useState<string | null>(null);

  // Derived arrays for UI and logic separation if needed, but we mostly rely on index logic now.
  const baseIdx = orderedSizes.indexOf(baseSizeName);
  const smallerSizes = baseIdx !== -1 ? orderedSizes.slice(0, baseIdx) : [];
  const largerSizes = baseIdx !== -1 ? orderedSizes.slice(baseIdx + 1) : [];

  const ALPHANUMERIC_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
  const NUMERIC_SIZES = Array.from({length: 15}, (_, i) => String(32 + i * 2));

  // Editor State
  const [measurements, setMeasurements] = useState({
    measureChest: 50,
    measureLength: 50,
    measureSleeve: 50,
    measureShoulder: 50,
    measureCollar: 50,
    measureHem: 50,
    measureWaist: 50,
    measureFrontLength: 50,
    measureBackLength: 50,
    measureBicep: 50,
    measureWrist: 50,
    measureArmhole: 50
  });

  const handleSizingSystemChange = (system: "alphanumeric" | "numeric") => {
    if (orderedSizes.length > 1) {
       if (!confirm("Cambiar el Sistema de Talles reiniciará tu progresión actual. ¿Continuar?")) return;
    }
    setSizingSystem(system);
    const newBase = system === "alphanumeric" ? "M" : "42";
    setBaseSizeName(newBase);
    setOrderedSizes([newBase]);
    setSizeChart({});
    setActiveSizeTab(null);
    setNewSizeInput("");
  };

  const handleBaseSizeChange = (newBase: string | null) => {
    if (!newBase) return;
    if (orderedSizes.length > 1) {
       if (!confirm("Cambiar el Talle Base reiniciará tu progresión actual. ¿Continuar?")) return;
    }
    setBaseSizeName(newBase);
    setOrderedSizes([newBase]);
    setSizeChart({});
    setActiveSizeTab(null);
  };

  const handleMeasurementChange = (key: string, value: number) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const handleAddSmallerSize = () => {
    const size = newSizeInput.trim().toUpperCase();
    if (!size || orderedSizes.includes(size)) return;
    
    const newSizes = [size, ...orderedSizes];
    const newBaseIdx = newSizes.indexOf(baseSizeName);
    const distance = newBaseIdx;
    
    const newMeasurements = { ...measurements };
    Object.keys(newMeasurements).forEach(k => {
       const key = k as keyof typeof measurements;
       newMeasurements[key] = measurements[key] - (distance * 2);
    });

    setOrderedSizes(newSizes);
    setSizeChart(prev => ({ ...prev, [size]: newMeasurements }));
    setActiveSizeTab(size);
    setNewSizeInput("");
  };

  const handleAddLargerSize = () => {
    const size = newSizeInput.trim().toUpperCase();
    if (!size || orderedSizes.includes(size)) return;
    
    const newSizes = [...orderedSizes, size];
    const newBaseIdx = newSizes.indexOf(baseSizeName);
    const distance = newSizes.length - 1 - newBaseIdx;
    
    const newMeasurements = { ...measurements };
    Object.keys(newMeasurements).forEach(k => {
       const key = k as keyof typeof measurements;
       newMeasurements[key] = measurements[key] + (distance * 2);
    });

    setOrderedSizes(newSizes);
    setSizeChart(prev => ({ ...prev, [size]: newMeasurements }));
    setActiveSizeTab(size);
    setNewSizeInput("");
  };

  const handleApplyPreset = (type: "alphanumeric" | "numeric") => {
    let allSizes: string[] = [];
    
    if (type === "alphanumeric") {
      allSizes = ["XS", "S", "M", "L", "XL", "2XL"];
    } else {
      allSizes = ["38", "40", "42", "44", "46", "48"];
    }
    
    let actualBase = baseSizeName;
    if (!allSizes.includes(actualBase)) {
      actualBase = type === "alphanumeric" ? "M" : "42";
      setBaseSizeName(actualBase);
    }
    
    setOrderedSizes(allSizes);
    
    const newChart: Record<string, Record<string, number>> = {};
    const bIdx = allSizes.indexOf(actualBase);
    
    allSizes.forEach((sz, i) => {
      if (sz === actualBase) return;
      const newMeasurements = { ...measurements };
      const distance = Math.abs(i - bIdx);
      const isSmaller = i < bIdx;
      
      Object.keys(newMeasurements).forEach(k => {
         const key = k as keyof typeof measurements;
         if (isSmaller) {
            newMeasurements[key] = measurements[key] - (distance * 2);
         } else {
            newMeasurements[key] = measurements[key] + (distance * 2);
         }
      });
      newChart[sz] = newMeasurements;
    });
    
    setSizeChart(newChart);
    setActiveSizeTab(null);
  };

  const removeSize = (sizeToRemove: string) => {
    setOrderedSizes(prev => prev.filter(s => s !== sizeToRemove));
    setSizeChart(prev => {
      const newChart = { ...prev };
      delete newChart[sizeToRemove];
      return newChart;
    });
    if (activeSizeTab === sizeToRemove) setActiveSizeTab(null);
  };

  const handleSizeMeasurementChange = (sizeName: string, key: string, value: number) => {
    setSizeChart(prev => ({
      ...prev,
      [sizeName]: { ...prev[sizeName], [key]: value }
    }));
  };

  const handleRecalibrate = () => {
    const currentBaseIdx = orderedSizes.indexOf(baseSizeName);
    if (currentBaseIdx === -1) return;

    if (!activeSizeTab || !sizeChart[activeSizeTab]) {
      // Standard recalibrate (±2 step) based on array positions
      const newChart = { ...sizeChart };
      orderedSizes.forEach((size, idx) => {
        if (size === baseSizeName) return;
        const sizeDist = Math.abs(idx - currentBaseIdx);
        const sizeIsSmaller = idx < currentBaseIdx;
        const newMeasurements = { ...measurements };
        
        Object.keys(newMeasurements).forEach(k => {
           const key = k as keyof typeof measurements;
           if (sizeIsSmaller) {
              newMeasurements[key] = measurements[key] - (sizeDist * 2);
           } else {
              newMeasurements[key] = measurements[key] + (sizeDist * 2);
           }
        });
        newChart[size] = newMeasurements;
      });
      setSizeChart(newChart);
      return;
    }

    const refChart = sizeChart[activeSizeTab];
    const newChart = { ...sizeChart };
    const activeIdx = orderedSizes.indexOf(activeSizeTab);
    
    if (currentBaseIdx === -1 || activeIdx === -1 || currentBaseIdx === activeIdx) return;
    
    const distance = Math.abs(activeIdx - currentBaseIdx);
    const isSmaller = activeIdx < currentBaseIdx;
    
    Object.keys(measurements).forEach(k => {
       const key = k as keyof typeof measurements;
       const totalDelta = refChart[key] - measurements[key];
       if (totalDelta === 0) return;
       
       const stepDelta = totalDelta / (isSmaller ? -distance : distance);
       
       orderedSizes.forEach((size, idx) => {
          if (size !== activeSizeTab && size !== baseSizeName) {
             const sizeDist = Math.abs(idx - currentBaseIdx);
             const sizeIsSmaller = idx < currentBaseIdx;
             
             if (sizeIsSmaller) {
                newChart[size][key] = Math.round(measurements[key] - (stepDelta * sizeDist));
             } else {
                newChart[size][key] = Math.round(measurements[key] + (stepDelta * sizeDist));
             }
          }
       });
    });
    setSizeChart(newChart);
  };

  const handleDragStart = (e: React.DragEvent, size: string) => {
    setDraggedSizeTab(size);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetSize: string) => {
    e.preventDefault();
    if (!draggedSizeTab || draggedSizeTab === targetSize) return;
    
    const newSizes = [...orderedSizes];
    const draggedIdx = newSizes.indexOf(draggedSizeTab);
    const targetIdx = newSizes.indexOf(targetSize);
    
    if (draggedIdx === -1 || targetIdx === -1) return;
    
    newSizes.splice(draggedIdx, 1);
    newSizes.splice(targetIdx, 0, draggedSizeTab);
    
    setOrderedSizes(newSizes);
    setDraggedSizeTab(null);
  };

  const [components, setComponents] = useState({
    collarType: "crew",
    pocketType: "none",
    sleevesType: "sleeveShort",
    closureType: "closureNone",
    hemType: "hemStraight",
    hoodType: "hoodNone",
    cuffType: "cuffSimple",
  });

  const [category, setCategory] = useState<string>("tshirt");
  const [variants, setVariants] = useState<GarmentVariant[]>([
    {
      id: "var-1",
      name: "Default",
      color: "#ffffff",
      frontImage: "",
      backImage: "",
      generatedTexture: "",
      generatedBackTexture: ""
    }
  ]);
  const [activeVariantId, setActiveVariantId] = useState<string>("var-1");
  const activeVariant = variants.find(v => v.id === activeVariantId) || variants[0];

  const updateActiveVariant = (updates: Partial<GarmentVariant>) => {
    setVariants(prev => prev.map(v => v.id === activeVariantId ? { ...v, ...updates } : v));
  };

  const [name, setName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [gender, setGender] = useState<string>("unisex");
  const [description, setDescription] = useState<string>("");

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
        baseColor: activeVariant.color,
        // We will need to update server action to accept an array of variants
        // For now we just pass the active variant so it compiles
        frontImage: activeVariant.generatedTexture || activeVariant.frontImage,
        backImage: activeVariant.generatedBackTexture || activeVariant.backImage,
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

  const renderColorwaysList = () => (
    <div className="mb-6 space-y-3 p-4 bg-black/10 rounded-2xl border border-white/5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">{t("colorways")}</label>
        <span className="text-xs text-muted-foreground">{variants.length} / 5</span>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar" role="tablist" aria-label={t("colorways")}>
        {variants.map(v => (
          <button
            key={v.id}
            role="tab"
            aria-selected={activeVariantId === v.id}
            onClick={() => setActiveVariantId(v.id)}
            className={`relative w-10 h-10 rounded-full shrink-0 border-2 transition-all ${activeVariantId === v.id ? 'border-primary scale-110 shadow-[0_0_15px_rgba(var(--primary),0.5)]' : 'border-white/10 hover:border-white/30 hover:scale-105'}`}
            style={{ backgroundColor: v.color }}
            title={v.name}
            aria-label={v.name}
          >
            {activeVariantId === v.id && (
               <div className="absolute inset-0 flex items-center justify-center mix-blend-difference" aria-hidden="true">
                 <Check className="w-4 h-4 text-white opacity-80" />
               </div>
            )}
          </button>
        ))}
        {variants.length < 5 && (
          <button
            onClick={() => {
              const newId = `var-${Date.now()}`;
              setVariants(prev => [...prev, { id: newId, name: `${t("defaultVariantName")} ${prev.length + 1}`, color: "#ffffff", frontImage: "", backImage: "", generatedTexture: "", generatedBackTexture: "" }]);
              setActiveVariantId(newId);
            }}
            className="w-10 h-10 shrink-0 rounded-full border border-dashed border-white/20 bg-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-colors"
            title={t("addVariant")}
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">

      {/* Left Panel: 3D Viewer */}
      <div className="w-full lg:flex-1 lg:sticky lg:top-24 h-[500px] lg:h-[calc(100vh-8rem)] bg-background/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <GarmentViewer
          url={currentModelUrl}
          colorHex={activeVariant.color}
          textureUrl={step >= 5 && activeVariant.generatedTexture ? activeVariant.generatedTexture : undefined}
          backTextureUrl={step >= 5 && activeVariant.generatedBackTexture ? activeVariant.generatedBackTexture : undefined}
        />
      </div>

      {/* Right Panel: Editor Controls */}
      <div className="w-full lg:w-[450px] flex flex-col bg-background/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">

        {/* Steps Header (Progress Bar) */}
        <div className="p-6 pb-4 border-b border-white/5 bg-black/20">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">
                {t("step")} {step} {t("of")} 6
              </p>
              <h2 className="text-lg font-medium text-foreground">
                {step === 1 ? t("step1") : step === 2 ? t("step2") : step === 3 ? t("step3") : step === 4 ? t("step4") : step === 5 ? t("step5") : t("step6")}
              </h2>
            </div>
            <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              {Math.round((step / 6) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="p-6 space-y-8 relative">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          {/* Step 1: Base Model */}
          {step === 1 && (
            <section className="animate-in slide-in-from-right-4 duration-300 space-y-6" aria-labelledby="step1-title">
              <div>
                <h3 id="step1-title" className="text-xl font-medium">{t("selectBaseModel")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t("baseModelDesc")}</p>
              </div>
              <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label={t("selectBaseModel")}>
                {BASE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    role="radio"
                    aria-checked={category === model.id}
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
            </section>
          )}

          {/* Step 2: Measurements */}
          {step === 2 && (
            <section className="animate-in slide-in-from-right-4 duration-300 space-y-6" aria-labelledby="step2-title">
              <div>
                <h3 id="step2-title" className="text-xl font-medium">{t("measurementsTitle")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t("measurementsDesc")}</p>
                <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-xl flex gap-3 items-start">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-primary/90">{t("measurementsNote")}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto pr-2 max-h-[50vh] custom-scrollbar">
                {(Object.keys(measurements) as Array<keyof typeof measurements>).map((key) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <label htmlFor={key} className="font-medium text-foreground">{t(key as Parameters<typeof t>[0])}</label>
                      <span className="text-muted-foreground font-mono">{measurements[key]}%</span>
                    </div>
                    <input
                      id={key}
                      type="range"
                      min="0" max="100"
                      value={measurements[key]}
                      onChange={(e) => handleMeasurementChange(key, parseInt(e.target.value))}
                      className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-medium">{t("componentsTitle")}</h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">{t("componentsDesc")}</p>

                <div className="mb-4">
                  <Select value={activeComponentTab} onValueChange={(val) => setActiveComponentTab(val as keyof typeof COMPONENT_OPTIONS)}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 h-auto text-sm focus:ring-primary/50">
                      <SelectValue>
                        {t(COMPONENT_CATEGORIES.find(c => c.id === activeComponentTab)?.labelKey as Parameters<typeof t>[0] || "collarType")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {t(cat.labelKey as Parameters<typeof t>[0])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  {COMPONENT_OPTIONS[activeComponentTab].map(option => {
                    const isSelected = components[activeComponentTab] === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setComponents(prev => ({ ...prev, [activeComponentTab]: option.id }))}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                      >
                        <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                          <Shirt className={`w-6 h-6 ${isSelected ? 'opacity-100' : 'opacity-50'}`} /> 
                        </div>
                        <span className={`text-sm text-center ${isSelected ? 'font-semibold text-primary' : 'font-medium text-foreground'}`}>
                          {t(option.labelKey as Parameters<typeof t>[0])}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Size Guide */}
          {step === 3 && (
            <section className="animate-in slide-in-from-right-4 duration-300 space-y-6" aria-labelledby="step3-title">
              <div>
                <h3 id="step3-title" className="text-xl font-medium">{t("sizeGuideTitle")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t("sizeGuideDesc")}</p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium block mb-1.5">{t("baseSizeName")}</label>
                <Select value={baseSizeName} onValueChange={handleBaseSizeChange}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 h-auto text-sm focus:ring-primary/50">
                    <SelectValue placeholder={t("sizeNamePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(sizingSystem === "alphanumeric" ? ALPHANUMERIC_SIZES : NUMERIC_SIZES).map(sz => (
                      <SelectItem key={sz} value={sz}>{sz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-medium">{t("sizeChart")}</h3>
                  <button
                    onClick={handleRecalibrate}
                    disabled={orderedSizes.length <= 1}
                    className="px-3 py-1.5 text-xs font-medium bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
                  >
                    {t("recalibrate")}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{t("recalibrateHint")}</p>
                
                {/* TABS CONTAINER */}
                <div className="flex flex-col gap-4">
                  {/* Presets Area */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("sizingSystem")}</label>
                    <div className="flex items-center gap-4 mb-2">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input
                          type="radio"
                          name="sizingSystem"
                          value="alphanumeric"
                          checked={sizingSystem === "alphanumeric"}
                          onChange={() => handleSizingSystemChange("alphanumeric")}
                          className="accent-primary"
                        />
                        {t("systemAlphanumeric")}
                      </label>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input
                          type="radio"
                          name="sizingSystem"
                          value="numeric"
                          checked={sizingSystem === "numeric"}
                          onChange={() => handleSizingSystemChange("numeric")}
                          className="accent-primary"
                        />
                        {t("systemNumeric")}
                      </label>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {sizingSystem === "alphanumeric" && (
                        <button
                          onClick={() => handleApplyPreset("alphanumeric")}
                          className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          Auto: XS - 2XL
                        </button>
                      )}
                      {sizingSystem === "numeric" && (
                        <button
                          onClick={() => handleApplyPreset("numeric")}
                          className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          Auto: 38 - 48
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Size Input Area */}
                  <div className="flex items-center gap-2">
                    <Select value={newSizeInput} onValueChange={(val) => val && setNewSizeInput(val)}>
                      <SelectTrigger className="flex-1 max-w-[150px] bg-white/5 border-white/10 rounded-xl px-3 h-[38px] text-sm focus:ring-primary/50">
                        <SelectValue placeholder={t("sizeNamePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(sizingSystem === "alphanumeric" ? ALPHANUMERIC_SIZES : NUMERIC_SIZES).map(sz => (
                          <SelectItem key={sz} value={sz}>{sz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={handleAddSmallerSize}
                      disabled={!newSizeInput.trim() || orderedSizes.includes(newSizeInput.trim().toUpperCase())}
                      className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors disabled:opacity-50 h-[38px]"
                    >
                      {t("addSmallerSize")}
                    </button>
                    <button
                      onClick={handleAddLargerSize}
                      disabled={!newSizeInput.trim() || orderedSizes.includes(newSizeInput.trim().toUpperCase())}
                      className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors disabled:opacity-50 h-[38px]"
                    >
                      {t("addLargerSize")}
                    </button>
                  </div>

                  {/* Tabs List */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar" role="tablist" aria-label={t("sizeChart")}>
                    {orderedSizes.map(size => {
                      const isBase = size === baseSizeName;
                      const isActive = activeSizeTab === size;
                      return (
                        <div
                          key={size}
                          draggable
                          onDragStart={(e) => handleDragStart(e, size)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, size)}
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => !isBase && setActiveSizeTab(size)}
                          className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all border cursor-pointer group flex flex-col items-center justify-center min-w-[80px]
                            ${draggedSizeTab === size ? 'opacity-50 scale-95 border-dashed border-primary bg-transparent' : ''}
                            ${isBase 
                              ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)] border-primary/50 cursor-grab active:cursor-grabbing font-bold' 
                              : isActive 
                                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)] cursor-grab active:cursor-grabbing' 
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground cursor-grab active:cursor-grabbing'
                            }
                          `}
                        >
                          <span>{size}</span>
                          {isBase && <span className="text-[10px] uppercase tracking-wider opacity-80">(Base)</span>}
                          {!isBase && (
                            <span 
                              onClick={(e) => { e.stopPropagation(); removeSize(size); }} 
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity text-[10px] cursor-pointer" 
                              aria-label="Remove size"
                            >
                              ×
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-x-auto mt-4 custom-scrollbar pb-4" aria-live="polite" aria-atomic="true">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 font-medium text-muted-foreground border-b border-white/10 w-1/3">{t("measureHeader")}</th>
                        <th className="px-4 py-2 font-medium text-primary border-b border-white/10 text-center bg-primary/5 rounded-tl-lg">{baseSizeName} (Base)</th>
                        {activeSizeTab && (
                          <th className="px-4 py-2 font-medium text-primary border-b border-white/10 text-center bg-primary/10 rounded-tr-lg">
                            {activeSizeTab}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.keys(measurements) as Array<keyof typeof measurements>).map(key => (
                        <tr key={key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">{t(key as Parameters<typeof t>[0])}</td>
                          <td className="px-4 py-3 text-center font-mono text-primary bg-primary/5">{measurements[key]}</td>
                          {activeSizeTab && (
                            <td className="px-4 py-3 bg-primary/5">
                              <input 
                                type="number" 
                                value={sizeChart[activeSizeTab]?.[key] || 0}
                                onChange={(e) => handleSizeMeasurementChange(activeSizeTab, key, parseInt(e.target.value) || 0)}
                                className="w-full bg-transparent border-b border-white/20 text-center font-mono focus:outline-none focus:border-primary appearance-none m-0 text-foreground"
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!activeSizeTab && (smallerSizes.length > 0 || largerSizes.length > 0) && (
                    <div className="text-center py-6 text-sm text-muted-foreground bg-white/5 rounded-b-lg border border-t-0 border-white/5">
                      Select a size tab above to edit measurements.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Step 4: Design */}
          {step === 4 && (
            <section className="animate-in slide-in-from-right-4 duration-300 space-y-6" aria-labelledby="step4-title">
              <div>
                <h3 id="step4-title" className="text-xl font-medium">{t("designTitle")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t("designDesc")}</p>
              </div>

              {renderColorwaysList()}

              <div className="space-y-4">
                <label htmlFor="variantName" className="text-sm font-medium">{t("variantName")}</label>
                <input
                  id="variantName"
                  type="text"
                  value={activeVariant.name}
                  onChange={(e) => updateActiveVariant({ name: e.target.value })}
                  placeholder={t("variantName")}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-4">
                <label htmlFor="baseColor" className="text-sm font-medium">{t("baseColor")}</label>
                <div className="flex items-center gap-4">
                  <input
                    id="baseColor"
                    type="color"
                    value={activeVariant.color}
                    aria-label={t("baseColor")}
                    onChange={(e) => updateActiveVariant({ color: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="font-mono text-sm uppercase text-muted-foreground" aria-hidden="true">{activeVariant.color}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label htmlFor="frontImage" className="text-sm font-medium">{t("frontImage")}</label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 transition-colors relative" aria-live="polite">
                  <input
                    id="frontImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, (url) => updateActiveVariant({ frontImage: url }), setIsUploadingFront)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isUploadingFront}
                    aria-label={t("frontImage")}
                  />
                  {activeVariant.frontImage ? (
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activeVariant.frontImage} alt="Front" className="h-20 object-contain mb-2 rounded" loading="lazy" width="80" height="80" />
                      <span className="text-xs text-primary font-medium">{t("changeImage")}</span>
                    </div>
                  ) : isUploadingFront ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Loader2 className="w-8 h-8 mb-2 opacity-50 animate-spin" aria-label="Uploading front image..." />
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
                <label htmlFor="backImage" className="text-sm font-medium">{t("backImage")}</label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 transition-colors relative" aria-live="polite">
                  <input
                    id="backImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, (url) => updateActiveVariant({ backImage: url }), setIsUploadingBack)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isUploadingBack}
                    aria-label={t("backImage")}
                  />
                  {activeVariant.backImage ? (
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activeVariant.backImage} alt="Back" className="h-20 object-contain mb-2 rounded" loading="lazy" width="80" height="80" />
                      <span className="text-xs text-primary font-medium">{t("changeImage")}</span>
                    </div>
                  ) : isUploadingBack ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Loader2 className="w-8 h-8 mb-2 opacity-50 animate-spin" aria-label="Uploading back image..." />
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
            </section>
          )}

          {/* Step 5: Editor 2D (Hidden strictly via CSS to preserve Konva Canvas state) */}
          <section className={`flex-col ${step === 5 ? "flex animate-in slide-in-from-right-4 duration-300" : "hidden"}`} aria-labelledby="step5-title">
            <div className="mb-4">
              <h3 id="step5-title" className="text-xl font-medium">{t("editor2DTitle")}</h3>
              <p className="text-muted-foreground text-sm mt-1">{t("editor2DDesc")}</p>
            </div>

            {renderColorwaysList()}

            <div className="w-full relative aspect-[4/5]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                <TabsList className="w-full max-w-md grid grid-cols-2 bg-white/5 border border-white/10 mb-4 shrink-0">
                  <TabsTrigger value="front" className="data-[state=active]:bg-primary">{t("tabFront")}</TabsTrigger>
                  <TabsTrigger value="back" className="data-[state=active]:bg-primary">{t("tabBack")}</TabsTrigger>
                </TabsList>

                {/* We use hidden instead of TabsContent to prevent unmounting the Canvas and losing state */}
                <div className={`flex-1 min-h-0 w-full ${activeTab === "front" ? "block" : "hidden"}`}>
                  <TextureEditor
                    key={`front-${activeVariantId}`}
                    baseColor={activeVariant.color}
                    imageUrl={activeVariant.frontImage}
                    onTextureUpdate={(url) => updateActiveVariant({ generatedTexture: url })}
                  />
                </div>
                <div className={`flex-1 min-h-0 w-full ${activeTab === "back" ? "block" : "hidden"}`}>
                  <TextureEditor
                    key={`back-${activeVariantId}`}
                    baseColor={activeVariant.color}
                    imageUrl={activeVariant.backImage}
                    onTextureUpdate={(url) => updateActiveVariant({ generatedBackTexture: url })}
                  />
                </div>
              </Tabs>
            </div>
          </section>

          {/* Step 6: Details */}
          {step === 6 && (
            <section className="animate-in slide-in-from-right-4 duration-300 space-y-6" aria-labelledby="step6-title">
              <div>
                <h3 id="step6-title" className="text-xl font-medium">{t("detailsTitle")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t("detailsDesc")}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="garmentName" className="text-sm font-medium block mb-1.5">{t("garmentName")}</label>
                  <input
                    id="garmentName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("garmentNamePlaceholder")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label htmlFor="sku" className="text-sm font-medium block mb-1.5">{t("sku")}</label>
                  <div className="relative">
                    <input
                      id="sku"
                      type="text"
                      value={sku}
                      onChange={handleSkuChange}
                      aria-invalid={!!skuError}
                      aria-describedby={skuError ? "sku-error" : undefined}
                      placeholder={t("skuPlaceholder")}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase transition-colors ${skuError ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10"
                        }`}
                    />
                    {isCheckingSku && (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin absolute right-3 top-3.5" aria-label="Checking availability..." />
                    )}
                  </div>
                  {skuError && (
                    <p id="sku-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
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
                  <label htmlFor="garmentDesc" className="text-sm font-medium block mb-1.5">{t("garmentDesc")}</label>
                  <textarea
                    id="garmentDesc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1 as 1 | 2 | 3 | 4 | 5 | 6)}
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

          {step < 6 ? (
            <button
              onClick={() => setStep((s) => s + 1 as 1 | 2 | 3 | 4 | 5 | 6)}
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
