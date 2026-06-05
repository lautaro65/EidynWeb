/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shirt, Tag, AlertCircle, ArrowRight, UploadCloud, Image as ImageIcon, Palette, Trash2, Plus, Ruler, CheckCircle2 } from "lucide-react";
import { checkSkuUnique, createGarmentTemplateAction } from "@/app/[locale]/dashboard/garments/new/actions";

interface VariantInput {
  id: string;
  name: string;
  type: "solid" | "texture";
  colorHex: string;
  fileFront: File | null;
  fileBack: File | null;
  previewFront: string | null;
  previewBack: string | null;
}

interface SizeInput {
  label: string;
  system: string;
  chest?: number;
  shoulders?: number;
  length?: number;
  waist?: number;
  hips?: number;
  inseam?: number;
  sleeve?: number;
}

const CATEGORY_MEASUREMENTS: Record<string, { id: keyof Omit<SizeInput, 'label'|'system'>, label: string }[]> = {
  remeras: [
    { id: "chest", label: "Ancho Pecho" },
    { id: "length", label: "Largo Total" },
    { id: "shoulders", label: "Ancho Hombros" }
  ],
  pantalones: [
    { id: "waist", label: "Ancho Cintura" },
    { id: "hips", label: "Ancho Cadera" },
    { id: "inseam", label: "Largo Entrepierna" },
    { id: "length", label: "Largo Total" }
  ],
  abrigos: [
    { id: "chest", label: "Ancho Pecho" },
    { id: "length", label: "Largo Total" },
    { id: "shoulders", label: "Ancho Hombros" },
    { id: "sleeve", label: "Largo Manga" }
  ]
};

interface DbVariant {
  id: string;
  name: string | null;
  colorHex?: string | null;
}

interface DbSize {
  id: string;
  label: string;
}

interface SizeGuidePreview {
  id: string;
  name: string;
  category: string;
  matrix: unknown;
}

export function GarmentWizard() {
  const [step, setStep] = useState(1);

  // Step 1 State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [isValidatingSku, setIsValidatingSku] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [validatedSku, setValidatedSku] = useState<string | null>(null);
  const [category, setCategory] = useState("remeras");

  // Step 2 State
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [isSubmittingStep2, setIsSubmittingStep2] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Step 3 State
  const [variants, setVariants] = useState<VariantInput[]>([
    { id: "1", name: "", type: "solid", colorHex: "#ffffff", fileFront: null, fileBack: null, previewFront: null, previewBack: null }
  ]);
  const [isSubmittingStep3, setIsSubmittingStep3] = useState(false);

  // Step 4 State
  const [sizingSystem, setSizingSystem] = useState("alpha");
  const [sizes, setSizes] = useState<SizeInput[]>([]);
  const [isSubmittingStep4, setIsSubmittingStep4] = useState(false);
  const [availableSizeGuides, setAvailableSizeGuides] = useState<SizeGuidePreview[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>("none");

  // Fetch size guides when step 4 is reached
  useEffect(() => {
    if (step === 4 && availableSizeGuides.length === 0) {
      import("@/app/[locale]/dashboard/garments/new/actions").then(({ getSizeGuidesAction }) => {
        getSizeGuidesAction().then(res => {
          if (res.success && res.data) {
            setAvailableSizeGuides(res.data);
          }
        });
      });
    }
  }, [step, availableSizeGuides.length]);

  const handleApplySizeGuide = (val: string | null) => {
    const guideId = val || "none";
    setSelectedGuideId(guideId);
    if (!guideId || guideId === "none") return;

    const guide = availableSizeGuides.find(g => g.id === guideId);
    if (!guide || !guide.matrix) return;

    const m = guide.matrix as { sizes: { id: string, name: string }[], values: Record<string, string> };
    if (!m.sizes || !m.values) return;

    // Detect if sizes are mostly numbers (numeric system) or alpha
    const isNumeric = m.sizes.some(s => !isNaN(Number(s.name)));
    setSizingSystem(isNumeric ? "numeric" : "alpha");

    const newSizes: SizeInput[] = m.sizes.map(s => {
      const sizeObj: SizeInput = {
        label: s.name,
        system: isNumeric ? "numeric" : "alpha"
      };
      
      const measurements = CATEGORY_MEASUREMENTS[guide.category] || CATEGORY_MEASUREMENTS["remeras"];
      measurements.forEach(meas => {
        const valStr = m.values[`${s.id}_${meas.id}`] || m.values[`${s.id}-${meas.id}`] || "0";
        sizeObj[meas.id] = parseFloat(valStr) || 0;
      });

      return sizeObj;
    });

    setSizes(newSizes);
  };

  // Validation function for Step 1
  const handleSkuBlur = async () => {
    if (!sku) {
      setSkuError(null);
      return;
    }
    setIsValidatingSku(true);
    setSkuError(null);
    try {
      const res = await checkSkuUnique(sku);
      if (res.error) {
        setSkuError(res.error);
        setValidatedSku(null);
      } else if (!res.isUnique) {
        setSkuError("This SKU already exists for your store. Please use a unique SKU.");
        setValidatedSku(null);
      } else {
        setValidatedSku(sku);
      }
    } catch {
      setSkuError("Error validating SKU.");
      setValidatedSku(null);
    } finally {
      setIsValidatingSku(false);
    }
  };

  const isStep1Valid = name.trim().length > 0 && sku.trim().length > 0 && sku === validatedSku && category.trim().length > 0;
  const isStep2Valid = frontImage !== null && backImage !== null;
  const isStep3Valid = variants.length > 0 && variants.every(v => v.name.trim() !== "" && (v.type === "solid" || v.fileFront !== null));
  const isStep4Valid = sizes.length > 0 && sizes.every(s => CATEGORY_MEASUREMENTS[category].every(m => (s[m.id] || 0) > 0));

  const nextStep = () => setStep(s => s + 1);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      if (side === "front") {
        setFrontImage(file);
        setFrontPreview(preview);
      } else {
        setBackImage(file);
        setBackPreview(preview);
      }
    }
  };

  const submitStep2 = async () => {
    if (!isStep2Valid || isSubmittingStep2) return;
    setIsSubmittingStep2(true);
    
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("sku", sku);
      formData.append("category", category);
      formData.append("frontImage", frontImage as Blob);
      formData.append("backImage", backImage as Blob);

      const res = await createGarmentTemplateAction(formData);
      if (res.error) {
        alert(res.error);
        setIsSubmittingStep2(false);
        return;
      }
      
      setTemplateId(res.templateId as string);
      console.log("Created templateId:", res.templateId);
      nextStep();
    } catch {
      alert("Error uploading images");
    } finally {
      setIsSubmittingStep2(false);
    }
  };

  // Step 3 Actions
  const addVariant = () => {
    setVariants(v => [...v, { id: Math.random().toString(), name: "", type: "solid", colorHex: "#ffffff", fileFront: null, fileBack: null, previewFront: null, previewBack: null }]);
  };

  const removeVariant = (id: string) => {
    setVariants(v => v.filter(va => va.id !== id));
  };

  const updateVariant = (id: string, field: keyof VariantInput, value: string | File | null) => {
    setVariants(v => v.map(va => va.id === id ? { ...va, [field]: value } : va));
  };

  const handleVariantImage = (e: React.ChangeEvent<HTMLInputElement>, id: string, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (file) {
      if (side === "front") {
        updateVariant(id, "fileFront", file);
        updateVariant(id, "previewFront", URL.createObjectURL(file));
      } else {
        updateVariant(id, "fileBack", file);
        updateVariant(id, "previewBack", URL.createObjectURL(file));
      }
    }
  };

  const submitStep3 = async () => {
    if (!isStep3Valid || isSubmittingStep3) return;
    setIsSubmittingStep3(true);
    try {
      const formData = new FormData();
      formData.append("variantsCount", variants.length.toString());
      variants.forEach((v, i) => {
        formData.append(`variant_${i}_name`, v.name);
        formData.append(`variant_${i}_type`, v.type);
        if (v.type === 'solid') formData.append(`variant_${i}_colorHex`, v.colorHex);
        if (v.type === 'texture') {
          if (v.fileFront) formData.append(`variant_${i}_fileFront`, v.fileFront);
          if (v.fileBack) formData.append(`variant_${i}_fileBack`, v.fileBack);
        }
      });

      const { createGarmentVariantsAction } = await import("@/app/[locale]/dashboard/garments/new/actions");
      const res = await createGarmentVariantsAction(templateId!, formData);
      if (res.error) {
        alert(res.error);
        return;
      }
      nextStep();
    } catch {
      alert("Error saving variants");
    } finally {
      setIsSubmittingStep3(false);
    }
  };

  // Step 4 Actions
  const toggleSize = (label: string) => {
    setSizes(current => {
      const exists = current.find(s => s.label === label);
      if (exists) return current.filter(s => s.label !== label);
      
      const newSize: SizeInput = { label, system: sizingSystem };
      CATEGORY_MEASUREMENTS[category].forEach(m => {
        newSize[m.id] = 0;
      });
      return [...current, newSize];
    });
  };

  const updateSize = (label: string, field: keyof SizeInput, value: number) => {
    setSizes(current => current.map(s => s.label === label ? { ...s, [field]: value } : s));
  };

  // Step 5 State
  const [dbVariants, setDbVariants] = useState<DbVariant[]>([]);
  const [dbSizes, setDbSizes] = useState<DbSize[]>([]);
  const [activeCombinations, setActiveCombinations] = useState<Record<string, boolean>>({});
  const [isSubmittingStep5, setIsSubmittingStep5] = useState(false);

  const submitStep4 = async () => {
    if (!isStep4Valid || isSubmittingStep4) return;
    setIsSubmittingStep4(true);
    try {
      const { createGarmentSizesAction } = await import("@/app/[locale]/dashboard/garments/new/actions");
      const res = await createGarmentSizesAction(templateId!, sizes);
      if (res.error) {
        alert(res.error);
        return;
      }
      
      // Initialize Step 5 combinations
      const initialActive: Record<string, boolean> = {};
      res.variants?.forEach((v: DbVariant) => {
        res.createdSizes?.forEach((s: DbSize) => {
          initialActive[`${v.id}_${s.id}`] = true;
        });
      });
      setDbVariants(res.variants || []);
      setDbSizes(res.createdSizes || []);
      setActiveCombinations(initialActive);
      
      nextStep();
    } catch {
      alert("Error saving sizes");
    } finally {
      setIsSubmittingStep4(false);
    }
  };

  const submitStep5 = async () => {
    if (isSubmittingStep5) return;
    setIsSubmittingStep5(true);
    try {
      const cartesianData: { variantId: string, sizeId: string, active: boolean }[] = [];
      dbVariants.forEach((v: DbVariant) => {
        dbSizes.forEach((s: DbSize) => {
          cartesianData.push({
            variantId: v.id,
            sizeId: s.id,
            active: activeCombinations[`${v.id}_${s.id}`]
          });
        });
      });

      const { createGarmentVariantSizesAction } = await import("@/app/[locale]/dashboard/garments/new/actions");
      const res = await createGarmentVariantSizesAction(templateId!, cartesianData);
      if (res.error) {
        alert(res.error);
        return;
      }
      nextStep();
    } catch {
      alert("Error saving combinations");
    } finally {
      setIsSubmittingStep5(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Steps Indicator */}
      <div className="mb-8 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${((step - 1) / 4) * 100}%` }} />
        </div>
        {[1, 2, 3, 4, 5].map((s) => (
          <div 
            key={s} 
            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
              step >= s ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_-3px_var(--tw-shadow-color)] shadow-primary" : "bg-background border-muted text-muted-foreground"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      <div className="bg-background/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2rem] overflow-hidden">
        {step === 1 && (
          <div className="p-8 sm:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Shirt className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3 text-foreground">Identidad de la prenda</h2>
              <p className="text-muted-foreground font-light text-lg">
                Ingresa el nombre de la prenda y el SKU identificador que se utilizará para mapear el producto.
              </p>
            </div>

            <div className="space-y-8 max-w-xl mx-auto">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground/80 ml-1">Nombre de la Prenda</Label>
                <div className="relative">
                  <Input 
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Camiseta Oversize Essential"
                    className="h-14 pl-5 text-lg bg-background/50 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary transition-all rounded-xl shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="sku" className="text-sm font-semibold text-foreground/80 ml-1">SKU (Identificador único)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                    <Tag className="w-5 h-5" />
                  </div>
                  <Input 
                    id="sku"
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value);
                      setValidatedSku(null); // Invalidate when typing
                      if (skuError) setSkuError(null);
                    }}
                    onBlur={handleSkuBlur}
                    placeholder="Ej: TSHIRT-OVS-001"
                    className={`h-14 pl-11 text-lg bg-background/50 border-white/10 focus-visible:ring-primary/50 transition-all rounded-xl shadow-inner ${
                      skuError ? 'border-destructive/50 focus-visible:ring-destructive/50' : 'focus-visible:border-primary'
                    }`}
                  />
                  {isValidatingSku && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                {skuError && (
                  <div className="flex items-center gap-2 text-destructive text-sm mt-2 ml-1 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    {skuError}
                  </div>
                )}
                <p className="text-sm text-muted-foreground/70 ml-1">
                  Este código debe coincidir con el SKU de tu producto en Shopify o WooCommerce.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-sm font-semibold text-foreground/80 ml-1">Categoría</Label>
                <Select value={category} onValueChange={(val) => setCategory(val || "remeras")}>
                  <SelectTrigger className="h-14 pl-5 text-lg bg-background/50 border-white/10 focus-visible:ring-primary/50 rounded-xl shadow-inner transition-all">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-3xl border border-border/60 rounded-xl shadow-2xl p-1">
                    <SelectItem value="remeras" className="py-2.5 px-4 font-bold">Remeras / T-Shirts</SelectItem>
                    <SelectItem value="pantalones" className="py-2.5 px-4 font-bold">Pantalones</SelectItem>
                    <SelectItem value="abrigos" className="py-2.5 px-4 font-bold">Abrigos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-12 flex justify-end">
              <button
                onClick={nextStep}
                disabled={!isStep1Valid}
                className="flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
              >
                Siguiente Paso <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="p-8 sm:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <ImageIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3 text-foreground">Foto base y generación del modelo 3D</h2>
              <p className="text-muted-foreground font-light text-lg">
                Sube una foto frontal y trasera de la prenda. Esto permitirá a nuestra IA entender la forma, corte y silueta para generar el modelo 3D.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Front Image */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground/80 ml-1">Foto Frontal</Label>
                <div className="relative h-64 border-2 border-dashed border-border/50 rounded-2xl bg-background/30 hover:bg-background/50 transition-colors flex flex-col items-center justify-center overflow-hidden cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "front")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {frontPreview ? (
                    <img src={frontPreview} alt="Front preview" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-muted-foreground mb-4 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium text-foreground">Haz clic para subir foto</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 5MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Back Image */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground/80 ml-1">Foto Trasera</Label>
                <div className="relative h-64 border-2 border-dashed border-border/50 rounded-2xl bg-background/30 hover:bg-background/50 transition-colors flex flex-col items-center justify-center overflow-hidden cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "back")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {backPreview ? (
                    <img src={backPreview} alt="Back preview" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-muted-foreground mb-4 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium text-foreground">Haz clic para subir foto</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-between items-center max-w-3xl mx-auto">
              <button
                onClick={() => setStep(1)}
                disabled={isSubmittingStep2}
                className="text-muted-foreground hover:text-foreground font-semibold px-4 py-2 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              
              <button
                onClick={submitStep2}
                disabled={!isStep2Valid || isSubmittingStep2}
                className="flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
              >
                {isSubmittingStep2 ? (
                  <>Procesando... <Loader2 className="w-5 h-5 animate-spin" /></>
                ) : (
                  <>Generar Modelo <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
            {isSubmittingStep2 && (
              <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse">
                Subiendo imágenes y preparando IA. Esto puede tardar unos segundos...
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="p-8 sm:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Palette className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3 text-foreground">Variantes de Color / Diseño</h2>
              <p className="text-muted-foreground font-light text-lg">
                El modelo 3D ya se está procesando. Ahora agregá los colores o estampados disponibles para esta prenda.
              </p>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto">
              {variants.map((v, index) => (
                <div key={v.id} className="relative bg-background/50 border border-border/50 p-6 rounded-2xl shadow-sm">
                  <div className="absolute top-4 right-4">
                    {variants.length > 1 && (
                      <button onClick={() => removeVariant(v.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-semibold text-lg mb-4">Variante {index + 1}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label>Nombre de Variante</Label>
                      <Input 
                        value={v.name} 
                        onChange={(e) => updateVariant(v.id, "name", e.target.value)} 
                        placeholder="Ej: Rojo Pasión, Estampado Floral" 
                        className="bg-background/80"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Tipo de Diseño</Label>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => updateVariant(v.id, "type", "solid")}
                          className={`flex-1 py-2 px-4 rounded-xl font-semibold border-2 transition-all ${v.type === "solid" ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:bg-background/80"}`}
                        >
                          Color Sólido
                        </button>
                        <button 
                          onClick={() => updateVariant(v.id, "type", "texture")}
                          className={`flex-1 py-2 px-4 rounded-xl font-semibold border-2 transition-all ${v.type === "texture" ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:bg-background/80"}`}
                        >
                          Textura/Imagen
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    {v.type === "solid" ? (
                      <div className="space-y-3">
                        <Label>Selecciona el color</Label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="color" 
                            value={v.colorHex} 
                            onChange={(e) => updateVariant(v.id, "colorHex", e.target.value)}
                            className="w-14 h-14 rounded-xl cursor-pointer bg-background/50 border-0"
                          />
                          <span className="font-mono text-muted-foreground uppercase">{v.colorHex}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label>Textura (Frente)</Label>
                          <div className="relative h-32 border-2 border-dashed border-border/50 rounded-2xl bg-background/30 hover:bg-background/50 flex flex-col items-center justify-center overflow-hidden cursor-pointer group">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleVariantImage(e, v.id, "front")}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {v.previewFront ? (
                              <img src={v.previewFront} alt="Variant front preview" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <UploadCloud className="w-6 h-6 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-[10px] text-foreground font-semibold">Frente</p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Textura (Espalda) <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></Label>
                          <div className="relative h-32 border-2 border-dashed border-border/50 rounded-2xl bg-background/30 hover:bg-background/50 flex flex-col items-center justify-center overflow-hidden cursor-pointer group">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleVariantImage(e, v.id, "back")}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {v.previewBack ? (
                              <img src={v.previewBack} alt="Variant back preview" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <UploadCloud className="w-6 h-6 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-[10px] text-foreground font-semibold">Espalda</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addVariant}
                className="w-full py-4 border-2 border-dashed border-primary/50 text-primary rounded-2xl font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Agregar otra variante
              </button>
            </div>

            <div className="mt-12 flex justify-between items-center max-w-4xl mx-auto">
              <button
                onClick={() => setStep(2)}
                disabled={isSubmittingStep3}
                className="text-muted-foreground hover:text-foreground font-semibold px-4 py-2 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              
              <button
                onClick={submitStep3}
                disabled={!isStep3Valid || isSubmittingStep3}
                className="flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
              >
                {isSubmittingStep3 ? (
                  <>Guardando... <Loader2 className="w-5 h-5 animate-spin" /></>
                ) : (
                  <>Siguiente Paso <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-8 sm:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Ruler className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3 text-foreground">Matriz de Talles y Medidas</h2>
              <p className="text-muted-foreground font-light text-lg">
                Agregá las medidas reales de la prenda para que el modelo 3D se escale automáticamente a cada talle.
              </p>
            </div>

            <div className="space-y-8 max-w-4xl mx-auto">
              {availableSizeGuides.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl shadow-sm mb-6">
                  <Label className="text-primary font-bold mb-2 block">Autocompletar con Guía de Talles</Label>
                  <Select value={selectedGuideId} onValueChange={handleApplySizeGuide}>
                    <SelectTrigger className="w-full h-12 bg-background border border-primary/30 focus:ring-2 focus:ring-primary/50 transition-all rounded-xl shadow-inner">
                      <SelectValue placeholder="Selecciona una guía guardada...">
                        {selectedGuideId === "none" ? "Ninguna (Limpiar)" : (availableSizeGuides.find(g => g.id === selectedGuideId)?.name ? `${availableSizeGuides.find(g => g.id === selectedGuideId)?.name} (${availableSizeGuides.find(g => g.id === selectedGuideId)?.category})` : "Selecciona una guía guardada...")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-3xl border border-border/60 rounded-xl shadow-2xl p-1 max-h-[250px] overflow-y-auto">
                      <SelectItem value="none" className="py-2.5 px-4 font-semibold text-muted-foreground">Ninguna (Limpiar)</SelectItem>
                      {availableSizeGuides.map(g => (
                        <SelectItem key={g.id} value={g.id} className="py-2.5 px-4 font-bold">{g.name} ({g.category})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-2">
                    Esto llenará automáticamente los talles y medidas. Puedes modificarlos luego.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-background/50 border border-border/50 p-6 rounded-2xl shadow-sm">
                <div className="space-y-3">
                  <Label>Sistema de Talles</Label>
                  <Select 
                    value={sizingSystem} 
                    onValueChange={(val: string | null) => {
                      setSizingSystem(val || "alpha");
                      setSizes([]);
                      setSelectedGuideId("none");
                    }}
                  >
                    <SelectTrigger className="w-full h-12 bg-background border border-border focus:ring-2 focus:ring-primary/50 transition-all rounded-xl shadow-inner">
                      <SelectValue placeholder="Sistema de Talles">
                        {sizingSystem === "alpha" ? "Alfanumérico (S, M, L, XL)" : sizingSystem === "numeric" ? "Numérico (38, 40, 42, 44)" : "Sistema de Talles"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-3xl border border-border/60 rounded-xl shadow-2xl p-1">
                      <SelectItem value="alpha" className="py-2.5 px-4 font-bold">Alfanumérico (S, M, L, XL)</SelectItem>
                      <SelectItem value="numeric" className="py-2.5 px-4 font-bold">Numérico (38, 40, 42, 44)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Talles Disponibles</Label>
                  <div className="flex flex-wrap gap-3">
                    {sizingSystem === "alpha" 
                      ? ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"].map(label => (
                          <button
                            key={label}
                            onClick={() => toggleSize(label)}
                            className={`w-12 h-12 rounded-xl font-bold border-2 transition-all ${sizes.some(s => s.label === label) ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/50"}`}
                          >
                            {label}
                          </button>
                        ))
                      : ["34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58", "60"].map(label => (
                          <button
                            key={label}
                            onClick={() => toggleSize(label)}
                            className={`w-12 h-12 rounded-xl font-bold border-2 transition-all ${sizes.some(s => s.label === label) ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/50"}`}
                          >
                            {label}
                          </button>
                        ))
                    }
                  </div>
                </div>
              </div>

              {sizes.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Medidas (en cm)</h3>
                  <div className="grid gap-4">
                    {sizes.map((s) => (
                      <div key={s.label} className="grid grid-cols-[100px_repeat(auto-fit,minmax(120px,1fr))] items-center gap-4 bg-background/50 border border-border/50 p-4 rounded-xl">
                        <div className="font-bold text-xl text-center text-primary">{s.label}</div>
                        {CATEGORY_MEASUREMENTS[category].map(m => (
                          <div key={m.id} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{m.label}</Label>
                            <Input 
                              type="number" 
                              placeholder="Ej: 52" 
                              value={s[m.id] || ""} 
                              onChange={(e) => updateSize(s.label, m.id, parseFloat(e.target.value))} 
                              className="bg-background"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-between items-center max-w-4xl mx-auto">
              <button
                onClick={() => setStep(3)}
                disabled={isSubmittingStep4}
                className="text-muted-foreground hover:text-foreground font-semibold px-4 py-2 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              
              <button
                onClick={submitStep4}
                disabled={!isStep4Valid || isSubmittingStep4}
                className="flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
              >
                {isSubmittingStep4 ? (
                  <>Guardando... <Loader2 className="w-5 h-5 animate-spin" /></>
                ) : (
                  <>Siguiente Paso <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="p-8 sm:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3 text-foreground">Combinaciones (SKUs)</h2>
              <p className="text-muted-foreground font-light text-lg">
                Seleccioná qué combinaciones de Variante/Talle vas a comercializar. Las desactivadas no se mostrarán en la tienda.
              </p>
            </div>

            <div className="max-w-4xl mx-auto bg-background/50 border border-border/50 p-6 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 border-b border-border/50 text-muted-foreground font-semibold">Variante \ Talle</th>
                    {dbSizes.map((s: DbSize) => (
                      <th key={s.id} className="p-4 border-b border-border/50 text-center font-bold text-foreground">
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dbVariants.map((v: DbVariant) => (
                    <tr key={v.id}>
                      <td className="p-4 border-b border-border/50 font-medium">
                        <div className="flex items-center gap-3">
                          {v.colorHex ? (
                            <div className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: v.colorHex }} />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">IMG</div>
                          )}
                          {v.name}
                        </div>
                      </td>
                      {dbSizes.map((s: DbSize) => {
                        const key = `${v.id}_${s.id}`;
                        const isActive = activeCombinations[key];
                        return (
                          <td key={s.id} className="p-4 border-b border-border/50 text-center">
                            <button
                              onClick={() => setActiveCombinations(prev => ({ ...prev, [key]: !prev[key] }))}
                              className={`w-10 h-10 rounded-xl border-2 transition-all mx-auto flex items-center justify-center ${isActive ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30" : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/50"}`}
                            >
                              {isActive ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 flex justify-between items-center max-w-4xl mx-auto">
              <button
                onClick={() => setStep(4)}
                disabled={isSubmittingStep5}
                className="text-muted-foreground hover:text-foreground font-semibold px-4 py-2 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              
              <button
                onClick={submitStep5}
                disabled={isSubmittingStep5}
                className="flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
              >
                {isSubmittingStep5 ? (
                  <>Finalizando... <Loader2 className="w-5 h-5 animate-spin" /></>
                ) : (
                  <>Completar Creación <CheckCircle2 className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {step > 5 && (
          <div className="p-16 text-center animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-foreground">¡Prenda Creada Exitosamente!</h2>
            <p className="text-muted-foreground text-lg mb-10">
              El modelo 3D base está procesándose en Inngest, y las texturas y escalas están listas para el Probador Virtual.
            </p>
            <button
              onClick={() => window.location.href = "/dashboard/garments"}
              className="bg-foreground text-background px-10 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
            >
              Ir a Mis Prendas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
