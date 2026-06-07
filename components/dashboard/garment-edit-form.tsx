"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shirt, Tag, UploadCloud, Palette, Trash2, Plus, Ruler, Save, ArrowLeft, Layers } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { updateGarmentAction } from "@/app/[locale]/dashboard/garments/[id]/edit/actions";
import { Link } from "@/i18n/routing";

interface VariantInput {
  id: string;
  name: string;
  type: "solid" | "texture";
  colorHex: string | null;
  fileFront: File | null;
  previewFront: string | null;
  textureUrl: string | null;
}

interface SizeInput {
  id: string;
  label: string;
  system: string;
  chest?: number | null;
  shoulders?: number | null;
  length?: number | null;
  waist?: number | null;
  hips?: number | null;
  inseam?: number | null;
  sleeve?: number | null;
}

interface CombInput {
  variantId: string;
  sizeId: string;
  active: boolean;
}

const CATEGORY_MEASUREMENTS: Record<string, { id: keyof Omit<SizeInput, 'id'|'label'|'system'>, label: string }[]> = {
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

export function GarmentEditForm({ initialData }: { initialData: {
  id: string;
  name: string;
  sku: string;
  category: string;
  variants: {
    id: string;
    name: string | null;
    type: string | null;
    colorHex: string | null;
    textureUrl: string | null;
  }[];
  sizes: {
    id: string;
    label: string;
    system: string;
    chest: number | null;
    shoulders: number | null;
    length: number | null;
    waist: number | null;
    hips: number | null;
    inseam: number | null;
    sleeve: number | null;
  }[];
  variantSizes: {
    variantId: string;
    sizeId: string;
    active: boolean;
  }[];
} }) {
  const router = useRouter();
  
  // Step 1: Basic Info
  const [name, setName] = useState(initialData.name || "");
  const [sku, setSku] = useState(initialData.sku || "");
  const [category, setCategory] = useState(initialData.category || "remeras");

  // Step 2: Variants
  const [variants, setVariants] = useState<VariantInput[]>(
    initialData.variants.map((v) => ({
      id: v.id,
      name: v.name || "",
      type: (v.type as "solid" | "texture") || "solid",
      colorHex: v.colorHex || "#ffffff",
      textureUrl: v.textureUrl || null,
      fileFront: null,
      previewFront: v.textureUrl || null
    }))
  );

  // Step 3: Sizes
  const [sizes, setSizes] = useState<SizeInput[]>(
    initialData.sizes.map((s) => ({
      id: s.id,
      label: s.label,
      system: s.system || "alpha",
      chest: s.chest,
      shoulders: s.shoulders,
      length: s.length,
      waist: s.waist,
      hips: s.hips,
      inseam: s.inseam,
      sleeve: s.sleeve,
    }))
  );
  
  const [sizingSystem, setSizingSystem] = useState(sizes[0]?.system || "alpha");

  // Step 4: Combinations
  const [combinations, setCombinations] = useState<Record<string, boolean>>(() => {
    const acc: Record<string, boolean> = {};
    if (initialData.variantSizes) {
      initialData.variantSizes.forEach((vs) => {
        acc[`${vs.variantId}_${vs.sizeId}`] = vs.active;
      });
    } else {
      // Fallback
      variants.forEach(v => sizes.forEach(s => acc[`${v.id}_${s.id}`] = true));
    }
    return acc;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers for Variants
  const addVariant = () => {
    const newId = `new_${Math.random().toString(36).substring(7)}`;
    setVariants([...variants, { id: newId, name: "", type: "solid", colorHex: "#ffffff", fileFront: null, previewFront: null, textureUrl: null }]);
    // Default combinations to true
    setCombinations(prev => {
      const next = { ...prev };
      sizes.forEach(s => next[`${newId}_${s.id}`] = true);
      return next;
    });
  };

  const updateVariant = (id: string, field: keyof VariantInput, value: string | File | null) => {
    setVariants(v => v.map(va => va.id === id ? { ...va, [field]: value } : va));
  };

  const removeVariant = (id: string) => {
    setVariants(v => v.filter(va => va.id !== id));
  };

  const handleVariantImage = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      updateVariant(id, "fileFront", file);
      updateVariant(id, "previewFront", URL.createObjectURL(file));
    }
  };

  // Handlers for Sizes
  const addSize = () => {
    const newId = `new_${Math.random().toString(36).substring(7)}`;
    const newSize: SizeInput = { id: newId, label: "", system: sizingSystem };
    CATEGORY_MEASUREMENTS[category].forEach(m => newSize[m.id] = 0);
    setSizes([...sizes, newSize]);
    
    // Default combinations to true
    setCombinations(prev => {
      const next = { ...prev };
      variants.forEach(v => next[`${v.id}_${newId}`] = true);
      return next;
    });
  };

  const updateSize = (id: string, field: keyof SizeInput, value: string | number | null) => {
    setSizes(current => current.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSize = (id: string) => {
    setSizes(current => current.filter(s => s.id !== id));
  };

  // Handlers for Combinations
  const toggleCombination = (variantId: string, sizeId: string) => {
    setCombinations(prev => ({
      ...prev,
      [`${variantId}_${sizeId}`]: !prev[`${variantId}_${sizeId}`]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("sku", sku);
      formData.append("category", category);

      formData.append("variantsCount", variants.length.toString());
      variants.forEach((v, i) => {
        formData.append(`variant_${i}_id`, v.id);
        formData.append(`variant_${i}_name`, v.name);
        formData.append(`variant_${i}_type`, v.type);
        if (v.type === 'solid' && v.colorHex) formData.append(`variant_${i}_colorHex`, v.colorHex);
        if (v.type === 'texture') {
          if (v.fileFront) formData.append(`variant_${i}_file`, v.fileFront);
          if (v.textureUrl) formData.append(`variant_${i}_textureUrl`, v.textureUrl);
        }
      });

      formData.append("sizesCount", sizes.length.toString());
      sizes.forEach((s, i) => {
        formData.append(`size_${i}_id`, s.id);
        formData.append(`size_${i}_label`, s.label);
        formData.append(`size_${i}_system`, s.system);
        CATEGORY_MEASUREMENTS[category].forEach(m => {
          if (s[m.id] !== undefined && s[m.id] !== null) {
            formData.append(`size_${i}_${m.id}`, s[m.id]!.toString());
          }
        });
      });

      // Construct cartesian combinations
      const combData: CombInput[] = [];
      variants.forEach(v => {
        sizes.forEach(s => {
          combData.push({
            variantId: v.id,
            sizeId: s.id,
            active: !!combinations[`${v.id}_${s.id}`]
          });
        });
      });

      formData.append("combinationsCount", combData.length.toString());
      combData.forEach((c, i) => {
        formData.append(`comb_${i}_variantId`, c.variantId);
        formData.append(`comb_${i}_sizeId`, c.sizeId);
        formData.append(`comb_${i}_active`, c.active.toString());
      });

      const res = await updateGarmentAction(initialData.id, formData);
      if (res.error) {
        alert(res.error);
        setIsSubmitting(false);
      } else {
        router.push("/dashboard/garments");
      }
    } catch (e) {
      console.error(e);
      alert("Error inesperado al guardar la prenda");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/garments"
            className="p-2.5 rounded-xl bg-background/50 hover:bg-background border border-border/50 text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Editar Prenda 3D</h1>
            <p className="text-muted-foreground mt-1 text-sm">Modifica las propiedades de tu modelo sin afectar la malla 3D base.</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-foreground/30 hover:scale-[1.02] disabled:opacity-50 transition-all duration-300"
        >
          {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : <><Save className="w-5 h-5" /> Guardar Cambios</>}
        </button>
      </div>

      <div className="space-y-12 pb-20">
        
        {/* IDENTIDAD */}
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 shadow-lg rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Shirt className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Identidad</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold ml-1">Nombre</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="h-12 bg-background/50 rounded-xl" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold ml-1">SKU</Label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={sku} onChange={e => setSku(e.target.value)} className="h-12 pl-10 bg-background/50 rounded-xl" />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold ml-1">Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v || "remeras")}>
                <SelectTrigger className="h-12 bg-background/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remeras">Remeras / T-Shirts</SelectItem>
                  <SelectItem value="pantalones">Pantalones</SelectItem>
                  <SelectItem value="abrigos">Abrigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* VARIANTES */}
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 shadow-lg rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Palette className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Variantes</h2>
            </div>
            <button onClick={addVariant} className="flex items-center gap-2 text-primary hover:bg-primary/10 px-4 py-2 rounded-xl font-bold transition-colors">
              <Plus className="w-4 h-4" /> Agregar Variante
            </button>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {variants.map((v, idx) => (
              <div key={v.id} className="relative bg-background/50 border border-border/50 p-6 rounded-2xl">
                <div className="absolute top-4 right-4">
                  {variants.length > 1 && (
                    <button onClick={() => removeVariant(v.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <h4 className="font-semibold mb-4 text-primary">Variante {idx + 1}</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs mb-1 block">Nombre</Label>
                    <Input value={v.name} onChange={e => updateVariant(v.id, "name", e.target.value)} className="h-10 bg-background/80" />
                  </div>
                  
                  <div className="flex gap-4">
                    <button onClick={() => updateVariant(v.id, "type", "solid")} className={`flex-1 py-1.5 text-sm rounded-lg border-2 ${v.type === "solid" ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground"}`}>Sólido</button>
                    <button onClick={() => updateVariant(v.id, "type", "texture")} className={`flex-1 py-1.5 text-sm rounded-lg border-2 ${v.type === "texture" ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground"}`}>Textura</button>
                  </div>

                  {v.type === "solid" ? (
                    <div className="flex items-center gap-4">
                      <input type="color" value={v.colorHex || "#ffffff"} onChange={e => updateVariant(v.id, "colorHex", e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                      <span className="font-mono text-muted-foreground uppercase">{v.colorHex}</span>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-xs mb-1 block">Textura / Imagen</Label>
                      <div className="relative h-24 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:bg-background/80">
                        <input type="file" accept="image/*" onChange={e => handleVariantImage(e, v.id)} className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" />
                        {v.previewFront ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.previewFront} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-muted-foreground flex flex-col items-center">
                            <UploadCloud className="w-6 h-6 mb-1" />
                            <span className="text-[10px]">Subir imagen</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TALLES */}
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 shadow-lg rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Ruler className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Matriz de Talles</h2>
            </div>
            <div className="flex items-center gap-4">
              <Select value={sizingSystem} onValueChange={(v) => setSizingSystem(v || "alpha")}>
                <SelectTrigger className="w-[180px] h-10 bg-background/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha">Alfanumérico</SelectItem>
                  <SelectItem value="numeric">Numérico</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={addSize} className="flex items-center gap-2 text-primary hover:bg-primary/10 px-4 py-2 rounded-xl font-bold transition-colors">
                <Plus className="w-4 h-4" /> Agregar Talle
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="grid gap-4 min-w-[600px]">
              <div className="grid grid-cols-[80px_repeat(auto-fit,minmax(120px,1fr))_40px] gap-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div>Talle</div>
                {CATEGORY_MEASUREMENTS[category]?.map(m => (
                  <div key={m.id}>{m.label}</div>
                ))}
                <div></div>
              </div>
              
              {sizes.map((s) => (
                <div key={s.id} className="grid grid-cols-[80px_repeat(auto-fit,minmax(120px,1fr))_40px] items-center gap-4 bg-background/50 border border-border/50 p-2 rounded-xl hover:border-primary/30 transition-colors">
                  <Input 
                    value={s.label}
                    onChange={(e) => updateSize(s.id, "label", e.target.value)}
                    placeholder={sizingSystem === "alpha" ? "M" : "40"}
                    className="h-10 text-center font-bold uppercase bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                  
                  {CATEGORY_MEASUREMENTS[category]?.map(m => (
                    <div key={m.id} className="relative">
                      <Input
                        type="number"
                        value={s[m.id] || ""}
                        onChange={(e) => updateSize(s.id, m.id, parseFloat(e.target.value))}
                        className="h-10 pr-6 text-right font-mono bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">cm</span>
                    </div>
                  ))}
                  
                  <button onClick={() => removeSize(s.id)} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COMBINACIONES */}
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 shadow-lg rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Disponibilidad (Variante x Talle)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-4 border-b border-white/10 font-medium text-muted-foreground w-[200px]">Variante \ Talle</th>
                  {sizes.map(s => (
                    <th key={s.id} className="p-4 border-b border-white/10 font-bold text-center">
                      <div className="bg-background/80 px-3 py-1 rounded-md inline-block border border-border/50">{s.label || "?"}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map(v => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 border-b border-white/5 font-semibold">
                      <div className="flex items-center gap-2">
                        {v.type === 'solid' ? (
                          <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: v.colorHex || '#fff' }} />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {v.previewFront && <img src={v.previewFront} alt="" className="w-full h-full object-cover" />}
                          </div>
                        )}
                        {v.name || "Sin nombre"}
                      </div>
                    </td>
                    {sizes.map(s => {
                      const isActive = combinations[`${v.id}_${s.id}`];
                      return (
                        <td key={s.id} className="p-4 border-b border-white/5 text-center">
                          <button
                            onClick={() => toggleCombination(v.id, s.id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto ${
                              isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {isActive ? "✓" : ""}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
