"use client";

import { useState, useTransition, useMemo } from "react";
import { ArrowLeft, Info, Save, X, LayoutGrid, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { createSizeGuide, updateSizeGuide } from "@/app/[locale]/dashboard/size-guides/actions";
import { useTranslations } from "next-intl";

const CATEGORY_MEASUREMENTS: Record<string, { id: string }[]> = {
  remeras: [
    { id: "chest" },
    { id: "shoulders" },
    { id: "length" }
  ],
  pantalones: [
    { id: "waist" },
    { id: "hips" },
    { id: "inseam" },
    { id: "length" }
  ],
  abrigos: [
    { id: "chest" },
    { id: "shoulders" },
    { id: "length" },
    { id: "sleeve" }
  ]
};


const CATEGORY_DEFAULT_SIZES: Record<string, string[]> = {
  remeras: ["S", "M", "L"],
  abrigos: ["S", "M", "L"],
  pantalones: ["38", "40", "42"]
};

interface Preset {
  id: string;
  values: Record<string, Record<string, string>>;
}

const CATEGORY_PRESETS: Record<string, Preset[]> = {
  remeras: [
    {
      id: "remera_regular",
      values: {
        "S": { chest: "50", shoulders: "42", length: "70" },
        "M": { chest: "53", shoulders: "44", length: "72" },
        "L": { chest: "56", shoulders: "46", length: "74" },
        "XL": { chest: "59", shoulders: "48", length: "76" },
        "XXL": { chest: "62", shoulders: "50", length: "78" }
      }
    },
    {
      id: "remera_boxy",
      values: {
        "S": { chest: "58", shoulders: "50", length: "66" },
        "M": { chest: "60", shoulders: "52", length: "68" },
        "L": { chest: "62", shoulders: "54", length: "70" },
        "XL": { chest: "64", shoulders: "56", length: "72" },
        "XXL": { chest: "66", shoulders: "58", length: "74" }
      }
    },
    {
      id: "remera_oversize",
      values: {
        "S": { chest: "60", shoulders: "56", length: "74" },
        "M": { chest: "62", shoulders: "58", length: "76" },
        "L": { chest: "64", shoulders: "60", length: "78" },
        "XL": { chest: "66", shoulders: "62", length: "80" },
        "XXL": { chest: "68", shoulders: "64", length: "82" }
      }
    },
    {
      id: "remera_slim",
      values: {
        "S": { chest: "48", shoulders: "40", length: "68" },
        "M": { chest: "50", shoulders: "42", length: "70" },
        "L": { chest: "52", shoulders: "44", length: "72" },
        "XL": { chest: "54", shoulders: "46", length: "74" },
        "XXL": { chest: "56", shoulders: "48", length: "76" }
      }
    },
    {
      id: "remera_muscle",
      values: {
        "S": { chest: "46", shoulders: "44", length: "66" },
        "M": { chest: "48", shoulders: "46", length: "68" },
        "L": { chest: "50", shoulders: "48", length: "70" },
        "XL": { chest: "52", shoulders: "50", length: "72" },
        "XXL": { chest: "54", shoulders: "52", length: "74" }
      }
    },
    {
      id: "remera_cropped",
      values: {
        "S": { chest: "52", shoulders: "44", length: "50" },
        "M": { chest: "54", shoulders: "46", length: "52" },
        "L": { chest: "56", shoulders: "48", length: "54" },
        "XL": { chest: "58", shoulders: "50", length: "56" },
        "XXL": { chest: "60", shoulders: "52", length: "58" }
      }
    }
  ],
  pantalones: [
    {
      id: "pant_regular",
      values: {
        "38": { waist: "38", hips: "48", inseam: "78", length: "102" },
        "40": { waist: "40", hips: "50", inseam: "79", length: "104" },
        "42": { waist: "42", hips: "52", inseam: "80", length: "106" },
        "44": { waist: "44", hips: "54", inseam: "81", length: "108" },
        "46": { waist: "46", hips: "56", inseam: "82", length: "110" }
      }
    },
    {
      id: "pant_wide",
      values: {
        "38": { waist: "38", hips: "52", inseam: "78", length: "104" },
        "40": { waist: "40", hips: "54", inseam: "79", length: "106" },
        "42": { waist: "42", hips: "56", inseam: "80", length: "108" },
        "44": { waist: "44", hips: "58", inseam: "81", length: "110" },
        "46": { waist: "46", hips: "60", inseam: "82", length: "112" }
      }
    },
    {
      id: "pant_slim",
      values: {
        "38": { waist: "38", hips: "46", inseam: "78", length: "100" },
        "40": { waist: "40", hips: "48", inseam: "79", length: "102" },
        "42": { waist: "42", hips: "50", inseam: "80", length: "104" },
        "44": { waist: "44", hips: "52", inseam: "81", length: "106" },
        "46": { waist: "46", hips: "54", inseam: "82", length: "108" }
      }
    },
    {
      id: "pant_skinny",
      values: {
        "38": { waist: "38", hips: "44", inseam: "78", length: "98" },
        "40": { waist: "40", hips: "46", inseam: "79", length: "100" },
        "42": { waist: "42", hips: "48", inseam: "80", length: "102" },
        "44": { waist: "44", hips: "50", inseam: "81", length: "104" },
        "46": { waist: "46", hips: "52", inseam: "82", length: "106" }
      }
    },
    {
      id: "pant_cargo",
      values: {
        "38": { waist: "38", hips: "50", inseam: "77", length: "102" },
        "40": { waist: "40", hips: "52", inseam: "78", length: "104" },
        "42": { waist: "42", hips: "54", inseam: "79", length: "106" },
        "44": { waist: "44", hips: "56", inseam: "80", length: "108" },
        "46": { waist: "46", hips: "58", inseam: "81", length: "110" }
      }
    },
    {
      id: "pant_baggy",
      values: {
        "38": { waist: "38", hips: "54", inseam: "76", length: "104" },
        "40": { waist: "40", hips: "56", inseam: "77", length: "106" },
        "42": { waist: "42", hips: "58", inseam: "78", length: "108" },
        "44": { waist: "44", hips: "60", inseam: "79", length: "110" },
        "46": { waist: "46", hips: "62", inseam: "80", length: "112" }
      }
    }
  ],
  abrigos: [
    {
      id: "abrigo_regular",
      values: {
        "S": { chest: "54", shoulders: "46", length: "72", sleeve: "62" },
        "M": { chest: "56", shoulders: "48", length: "74", sleeve: "64" },
        "L": { chest: "58", shoulders: "50", length: "76", sleeve: "66" },
        "XL": { chest: "60", shoulders: "52", length: "78", sleeve: "68" },
        "XXL": { chest: "62", shoulders: "54", length: "80", sleeve: "70" }
      }
    },
    {
      id: "abrigo_puffer",
      values: {
        "S": { chest: "58", shoulders: "48", length: "70", sleeve: "64" },
        "M": { chest: "60", shoulders: "50", length: "72", sleeve: "66" },
        "L": { chest: "62", shoulders: "52", length: "74", sleeve: "68" },
        "XL": { chest: "64", shoulders: "54", length: "76", sleeve: "70" },
        "XXL": { chest: "66", shoulders: "56", length: "78", sleeve: "72" }
      }
    },
    {
      id: "abrigo_hoodie",
      values: {
        "S": { chest: "56", shoulders: "50", length: "68", sleeve: "60" },
        "M": { chest: "58", shoulders: "52", length: "70", sleeve: "62" },
        "L": { chest: "60", shoulders: "54", length: "72", sleeve: "64" },
        "XL": { chest: "62", shoulders: "56", length: "74", sleeve: "66" },
        "XXL": { chest: "64", shoulders: "58", length: "76", sleeve: "68" }
      }
    },
    {
      id: "abrigo_trench",
      values: {
        "S": { chest: "52", shoulders: "44", length: "100", sleeve: "63" },
        "M": { chest: "54", shoulders: "46", length: "102", sleeve: "65" },
        "L": { chest: "56", shoulders: "48", length: "104", sleeve: "67" },
        "XL": { chest: "58", shoulders: "50", length: "106", sleeve: "69" },
        "XXL": { chest: "60", shoulders: "52", length: "108", sleeve: "71" }
      }
    }
  ]
};

export type SizeGuideInitialData = {
  id: string;
  name: string;
  category: string;
  sizes: { id: string; name: string }[];
  matrixValues: Record<string, string>;
  status: string;
};

interface SizeGuideFormProps {
  isEditing?: boolean;
  initialData?: SizeGuideInitialData;
}

function normalizeCategory(category?: string) {
  if (!category) return "";

  const value = category.toLowerCase();
  if (["remeras", "remera", "t-shirts", "tshirt", "shirt"].includes(value)) return "remeras";
  if (["pantalones", "pantalon", "pants", "trousers"].includes(value)) return "pantalones";
  if (["abrigos", "abrigo", "coats", "coat"].includes(value)) return "abrigos";

  return value;
}

export function SizeGuideForm({ isEditing = false, initialData }: SizeGuideFormProps) {
  const t = useTranslations("SizeGuides");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [guideName, setGuideName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(normalizeCategory(initialData?.category));

  // Estado para los talles (Filas)
  const [sizes, setSizes] = useState(initialData?.sizes || [
    { id: "s1", name: "S" },
    { id: "s2", name: "M" },
    { id: "s3", name: "L" }
  ]);

  // Estado para los valores de la matriz { [sizeId_measurementId]: value }
  const [values, setValues] = useState<Record<string, string>>(initialData?.matrixValues || {});
  const [activePreset, setActivePreset] = useState<string>("");
  
  // Detectar sistema inicial
  const initialIsNumeric = initialData?.sizes.some(s => !isNaN(Number(s.name)));
  const [sizingSystem, setSizingSystem] = useState<"alpha" | "numeric">(initialIsNumeric ? "numeric" : "alpha");

  const isDirty = useMemo(() => {
    if (!isEditing || !initialData) {
      return true;
    }

    const currentData = {
      name: guideName,
      category,
      sizes,
      matrixValues: values,
    };

    const initial = {
      name: initialData.name,
      category: normalizeCategory(initialData.category),
      sizes: initialData.sizes,
      matrixValues: initialData.matrixValues,
    };

    return JSON.stringify(currentData) !== JSON.stringify(initial);
  }, [guideName, category, sizes, values, isEditing, initialData]);

  const applyPreset = (cat: string, presetId: string, forceOverrideSystem: boolean = false) => {
    const preset = CATEGORY_PRESETS[cat]?.find(p => p.id === presetId);
    if (!preset) return;
    
    setActivePreset(preset.id);
    
    const presetRows = Object.values(preset.values);
    
    if (forceOverrideSystem || sizes.length === 0) {
      // Obtener los nombres de los talles del preset (ej: ["S", "M"] o ["38", "40"])
      const presetSizeNames = Object.keys(preset.values);
      
      // Auto-detect sizingSystem
      const isNumeric = presetSizeNames.some(s => !isNaN(Number(s)));
      setSizingSystem(isNumeric ? "numeric" : "alpha");
      
      // Crear la nueva lista de talles
      const newSizes = presetSizeNames.map((sizeName, index) => ({
        id: `s_${Date.now()}_${index}`,
        name: sizeName
      }));
      
      setSizes(newSizes);
      
      // Asignar los valores a los nuevos IDs
      setValues(() => {
        const newValues: Record<string, string> = {};
        newSizes.forEach((sizeObj, index) => {
          const row = presetRows[index];
          if (row) {
            Object.entries(row).forEach(([measurementId, val]) => {
              newValues[`${sizeObj.id}_${measurementId}`] = val;
            });
          }
        });
        return newValues;
      });
    } else {
      // Mantener los talles actuales y solo aplicar los valores secuencialmente
      setValues(() => {
        const newValues: Record<string, string> = {};
        sizes.forEach((sizeObj, index) => {
          // Si hay más talles seleccionados que en el preset, repite la última fila del preset
          const row = presetRows[Math.min(index, presetRows.length - 1)];
          if (row) {
            Object.entries(row).forEach(([measurementId, val]) => {
              newValues[`${sizeObj.id}_${measurementId}`] = val;
            });
          }
        });
        return newValues;
      });
    }
  };

  const handleCategoryChange = (val: string | null) => {
    const newCat = val || "";
    setCategory(newCat);
    
    if (newCat) {
      const presets = CATEGORY_PRESETS[newCat];
      if (presets && presets.length > 0) {
        applyPreset(newCat, presets[0].id, true);
      } else {
        setActivePreset("");
        const defaultSizes = CATEGORY_DEFAULT_SIZES[newCat] || ["S", "M", "L"];
        const isNumeric = defaultSizes.some(s => !isNaN(Number(s)));
        setSizingSystem(isNumeric ? "numeric" : "alpha");
        setSizes([
          { id: `s${Date.now()}_1`, name: defaultSizes[0] || "" },
          { id: `s${Date.now()}_2`, name: defaultSizes[1] || "" },
          { id: `s${Date.now()}_3`, name: defaultSizes[2] || "" }
        ]);
        setValues({});
      }
    } else {
      setActivePreset("");
      setSizingSystem("alpha");
      setSizes([
        { id: "s1", name: "S" },
        { id: "s2", name: "M" },
        { id: "s3", name: "L" }
      ]);
      setValues({});
    }
  };

  const handleValueChange = (sizeId: string, measurementId: string, val: string) => {
    setValues(prev => ({ ...prev, [`${sizeId}_${measurementId}`]: val }));
  };

  const toggleSize = (name: string) => {
    setSizes(current => {
      const exists = current.find(s => s.name === name);
      if (exists) return current.filter(s => s.name !== name);
      return [...current, { id: `s${Date.now()}`, name }];
    });
  };

  const removeSize = (id: string) => {
    setSizes(sizes.filter(s => s.id !== id));
  };

  const currentMeasurements = category ? CATEGORY_MEASUREMENTS[category] : [];

  const isMatrixComplete = currentMeasurements.length > 0 && sizes.every(size => 
    currentMeasurements.every(m => {
      const val = values[`${size.id}_${m.id}`];
      return val && parseFloat(val) > 0;
    })
  );

  const canCreate = guideName && category && isMatrixComplete;
  const canSaveDraft = guideName && category; // Sólo requiere nombre y categoría

  const handleCreate = (isDraft: boolean = false) => {
    if (isDraft ? !canSaveDraft : !canCreate) return;

    startTransition(async () => {
      try {
        const payload = {
          name: guideName,
          category,
          sizes,
          matrixValues: values,
          status: isDraft ? "Draft" : "Active"
        };
        
        let result;
        if (isEditing && initialData) {
          result = await updateSizeGuide(initialData.id, payload);
        } else {
          result = await createSizeGuide(payload);
        }

        if (result.success) {
          toast.success(isDraft ? t("form.successDraft") : (isEditing ? t("form.successUpdate") : t("form.successCreate")));
          router.push("/dashboard/size-guides");
          router.refresh();
        } else {
          toast.error(t("form.error"));
        }
      } catch {
        toast.error(t("form.errorServer"));
      }
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-100px)] pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header (Back nav) */}
      <div className="mb-8">
        <Link href="/dashboard/size-guides" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t("form.backToGuides")}
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {isEditing ? t("form.editTitle") : t("form.newTitle")}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              {isEditing ? t("form.editDesc") : t("form.newDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Info Section */}
        <section className="bg-background/70 backdrop-blur-2xl border border-border/50 dark:border-white/10 rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{t("form.basicInfo")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">{t("form.guideName")}</label>
              <input
                type="text"
                value={guideName}
                onChange={(e) => setGuideName(e.target.value)}
                placeholder={t("form.guideNamePlaceholder")}
                className="w-full bg-muted/50 dark:bg-black/20 border border-border/60 dark:border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">{t("form.category")}</label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full bg-muted/50 dark:bg-black/20 border border-border/60 dark:border-white/10 focus:border-primary/50 rounded-xl px-4 py-6 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all">
                  <SelectValue placeholder={t("form.selectCategory")} />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-3xl border border-border/60 dark:border-white/10 rounded-xl shadow-2xl p-1.5 max-h-[300px] overflow-hidden">
                  <SelectItem value="remeras" className="py-3 px-4 text-sm font-medium hover:bg-muted/60 dark:hover:bg-white/5 cursor-pointer rounded-lg focus:bg-muted/70 dark:focus:bg-white/10 focus:text-primary transition-colors">{t("form.categories.remeras")}</SelectItem>
                  <SelectItem value="pantalones" className="py-3 px-4 text-sm font-medium hover:bg-muted/60 dark:hover:bg-white/5 cursor-pointer rounded-lg focus:bg-muted/70 dark:focus:bg-white/10 focus:text-primary transition-colors">{t("form.categories.pantalones")}</SelectItem>
                  <SelectItem value="abrigos" className="py-3 px-4 text-sm font-medium hover:bg-muted/60 dark:hover:bg-white/5 cursor-pointer rounded-lg focus:bg-muted/70 dark:focus:bg-white/10 focus:text-primary transition-colors">{t("form.categories.abrigos")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Matrix Section */}
        <section className="bg-background/70 backdrop-blur-2xl border border-border/50 dark:border-white/10 rounded-[2rem] p-8 shadow-xl overflow-hidden relative">

          {/* Subtle Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <LayoutGrid className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("form.matrix")}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t("form.matrixDesc")}</p>
              </div>
            </div>

            {category && CATEGORY_PRESETS[category] && (
              <div className="flex gap-2">
                {CATEGORY_PRESETS[category].map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(category, preset.id, false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      activePreset === preset.id 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-muted/60 dark:bg-white/5 text-muted-foreground border-border/60 dark:border-white/10 hover:bg-muted dark:hover:bg-white/10"
                    }`}
                  >
                    {t(`presets.${preset.id}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!category ? (
            <div className="relative z-10 flex flex-col items-center justify-center py-16 border border-border/50 dark:border-white/5 border-dashed rounded-[2rem] bg-muted/30 dark:bg-black/20 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/60 dark:bg-white/5 flex items-center justify-center mb-4 ring-1 ring-border/50 dark:ring-white/10">
                <LayoutGrid className="h-8 w-8 text-muted-foreground opacity-40" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("form.selectCategoryFirst")}</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm font-light">
                {t("form.selectCategoryDesc")}
              </p>
            </div>
          ) : (
            <div className="w-full relative z-10 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-background/50 border border-border/50 p-6 rounded-2xl shadow-sm mb-8">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Sistema de Talles</label>
                  <Select 
                    value={sizingSystem} 
                    onValueChange={(val) => {
                      setSizingSystem(val as "alpha" | "numeric" || "alpha");
                      setSizes([]);
                    }}
                  >
                    <SelectTrigger className="w-full bg-muted/50 dark:bg-black/20 border border-border/60 dark:border-white/10 focus:border-primary/50 rounded-xl px-4 py-6 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all">
                      <SelectValue placeholder="Sistema de Talles">
                        {sizingSystem === "alpha" ? "Alfanumérico (S, M, L, XL)" : "Numérico (38, 40, 42, 44)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-3xl border border-border/60 rounded-xl shadow-2xl p-1">
                      <SelectItem value="alpha" className="py-2.5 px-4 font-bold">Alfanumérico (S, M, L, XL)</SelectItem>
                      <SelectItem value="numeric" className="py-2.5 px-4 font-bold">Numérico (38, 40, 42, 44)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Talles Disponibles</label>
                  <div className="flex flex-wrap gap-3">
                    {sizingSystem === "alpha" 
                      ? ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"].map(label => (
                          <button
                            key={label}
                            onClick={() => toggleSize(label)}
                            className={`w-12 h-12 rounded-xl font-bold border-2 transition-all ${sizes.some(s => s.name === label) ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/50"}`}
                          >
                            {label}
                          </button>
                        ))
                      : ["34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58", "60"].map(label => (
                          <button
                            key={label}
                            onClick={() => toggleSize(label)}
                            className={`w-12 h-12 rounded-xl font-bold border-2 transition-all ${sizes.some(s => s.name === label) ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/50"}`}
                          >
                            {label}
                          </button>
                        ))
                    }
                  </div>
                </div>
              </div>

              {sizes.length > 0 && (
              <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="p-4 text-left border-b border-border/60 dark:border-white/10 font-bold text-muted-foreground w-32">
                      {t("form.size")}
                    </th>
                    {currentMeasurements.map(m => (
                      <th key={m.id} className="p-4 text-left border-b border-border/60 dark:border-white/10 font-semibold text-sm text-foreground">
                        {t(`measurements.${m.id}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizes.map((size) => (
                    <tr key={size.id} className="group hover:bg-muted/40 dark:hover:bg-white/5 transition-colors border-b border-border/40 dark:border-white/5 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-primary/10 border border-primary/20 rounded-lg px-2 py-2 text-sm font-bold text-center text-primary uppercase">
                            {size.name}
                          </div>
                          {sizes.length > 1 && (
                            <button onClick={() => removeSize(size.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {currentMeasurements.map(m => (
                        <td key={m.id} className="p-4">
                          <div className="relative group/input">
                            <input
                              type="number"
                              placeholder="0"
                              value={values[`${size.id}_${m.id}`] || ""}
                              onChange={(e) => handleValueChange(size.id, m.id, e.target.value)}
                              className="w-full bg-muted/50 dark:bg-black/20 group-hover:bg-muted dark:group-hover:bg-black/40 border border-border/50 dark:border-white/5 group-hover/input:border-border dark:group-hover/input:border-white/20 focus:border-primary focus:bg-primary/5 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none transition-all shadow-inner"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 pointer-events-none">cm</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Floating Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-72 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-[1600px] mx-auto flex justify-end pointer-events-auto">
          <div className="flex items-center gap-4 bg-background/90 backdrop-blur-3xl border border-border/60 dark:border-white/10 p-3 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
            <button 
              onClick={() => handleCreate(true)}
              disabled={isPending || !canSaveDraft || (isEditing && !isDirty && initialData?.status === "Draft")}
              className="px-6 py-3 rounded-2xl font-semibold text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing && initialData?.status === "Active" ? t("form.convertToDraft") : t("form.saveDraft")}
            </button>
            <button
              onClick={() => handleCreate(false)}
              disabled={isPending || !canCreate || (isEditing && !isDirty && initialData?.status === "Active")}
              className="disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-2xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] transition-all duration-300"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isPending ? t("form.saving") : (isEditing ? (initialData?.status === "Draft" ? t("form.activateGuide") : t("form.saveChanges")) : t("form.createGuide"))}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
