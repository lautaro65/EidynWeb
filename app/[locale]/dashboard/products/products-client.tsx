"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Link2, 
  Eye, 
  Box, 
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  User,
  Heart,
  Loader2,
  ChevronUp,
  ChevronDown,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GarmentViewer } from "@/components/3d/GarmentViewer";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Tipos mockeados para esta vista previa visual
interface MockProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  image: string;
  status: "mapped" | "unmapped";
  mappedGarmentId?: string;
}



interface Props {
  initialProducts: MockProduct[];
}

export function ProductsClient({ initialProducts }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [products, setProducts] = useState<MockProduct[]>(initialProducts);
  
  // Feedback visual state
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error" | "info", title: string, text: string } | null>(null);

  // Modals state
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);

  // 3D Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewGarmentData, setPreviewGarmentData] = useState<Record<string, unknown> | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [isVariationsMenuOpen, setIsVariationsMenuOpen] = useState(true);

  // Unmap Modal State
  const [unmapModalOpen, setUnmapModalOpen] = useState(false);
  const [productToUnmap, setProductToUnmap] = useState<MockProduct | null>(null);

  // Mapping Explorer State
  const [mappingTab, setMappingTab] = useState<"own" | "community">("own");
  const [mappingSearch, setMappingSearch] = useState("");
  const [mappingPage, setMappingPage] = useState(1);
  const [mappingLikedOnly, setMappingLikedOnly] = useState(false);
  const [mappingGarments, setMappingGarments] = useState<{ id: string, name: string | null, sku: string, baseModelUrl: string | null }[]>([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingHasMore, setMappingHasMore] = useState(false);

  // Fetch garments dynamically
  useEffect(() => {
    if (!mappingModalOpen) return;
    
    let isMounted = true;
    const fetchGarments = async () => {
      setMappingLoading(true);
      try {
        const { getGarmentsForMappingAction } = await import("./actions");
        const res = await getGarmentsForMappingAction({
          tab: mappingTab,
          search: mappingSearch,
          page: mappingPage,
          limit: 10,
          likedOnly: mappingLikedOnly
        });
        if (res.success && isMounted) {
          if (mappingPage === 1) {
            setMappingGarments(res.data || []);
          } else {
            setMappingGarments(prev => {
              // Avoid duplicates
              const newGarments = (res.data || []).filter(ng => !prev.some(pg => pg.id === ng.id));
              return [...prev, ...newGarments];
            });
          }
          setMappingHasMore(res.hasMore || false);
        }
      } catch(e) {
        console.error(e);
      } finally {
        if (isMounted) setMappingLoading(false);
      }
    };
    
    const timeoutId = setTimeout(fetchGarments, 300); // debounce search
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, [mappingModalOpen, mappingTab, mappingSearch, mappingPage, mappingLikedOnly]);

  // Reset page when filters change
  useEffect(() => {
    // eslint-disable-next-line
    setMappingPage(1);
  }, [mappingTab, mappingSearch, mappingLikedOnly]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      // Import dynamic to avoid top-level issues, or standard server action import
      const { syncCatalogAction } = await import("./actions");
      const res = await syncCatalogAction();
      if (res.error) {
        setSyncMessage({ type: "error", title: "Error de Sincronización", text: res.error });
      } else {
        const count = res.count || 0;
        if (count === 0) {
          setSyncMessage({ type: "info", title: "Sin novedades", text: "No se encontraron productos nuevos en tus tiendas conectadas para sincronizar." });
        } else {
          setSyncMessage({ type: "success", title: "¡Sincronización Exitosa!", text: `Se han importado o actualizado ${count} productos en tu catálogo. La página se actualizará enseguida...` });
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      }
    } catch (error) {
      console.error(error);
      setSyncMessage({ type: "error", title: "Ocurrió un problema", text: "Hubo un error de conexión al intentar sincronizar el catálogo." });
    } finally {
      setIsSyncing(false);
    }
  };

  const openMappingModal = (product: MockProduct) => {
    setSelectedProduct(product);
    setMappingModalOpen(true);
  };

  const handleOpenPreview = async (garmentId?: string) => {
    if (!garmentId) return;
    setIsPreviewLoading(true);
    setPreviewGarmentData(null);
    setPreviewModalOpen(true); // Open modal early showing loader
    
    try {
      const { getGarmentPreviewAction } = await import("./actions");
      const res = await getGarmentPreviewAction(garmentId);
      if (res.success && res.data) {
        setPreviewGarmentData(res.data);
        setSelectedVariantId(res.data.variants?.[0]?.id || null);
        setSelectedSizeId(res.data.sizes?.[0]?.id || null);
      } else {
        setPreviewModalOpen(false);
        setSyncMessage({ type: "error", title: "Error", text: res.error || "No se pudo cargar el modelo 3D." });
      }
    } catch (error) {
      console.error(error);
      setPreviewModalOpen(false);
      setSyncMessage({ type: "error", title: "Error", text: "Problema de conexión al cargar la vista previa." });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleMapGarment = async (garmentId: string) => {
    if (!selectedProduct) return;
    
    setMappingModalOpen(false); // Close immediately for optimistic UI feel
    
    // Optimistic local update
    setProducts(prev => prev.map(p => 
      p.id === selectedProduct.id 
        ? { ...p, status: "mapped", mappedGarmentId: garmentId } 
        : p
    ));

    try {
      const { mapProductToGarmentAction } = await import("./actions");
      const res = await mapProductToGarmentAction(selectedProduct.id, garmentId);
      if (res.error) {
        setSyncMessage({ type: "error", title: "Error al mapear", text: res.error });
        // Revert on error
        setProducts(prev => prev.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, status: "unmapped", mappedGarmentId: undefined } 
            : p
        ));
      }
    } catch (e) {
      console.error(e);
      setSyncMessage({ type: "error", title: "Error de red", text: "Hubo un problema al guardar el mapeo." });
    }
  };

  const handleUnmap = async (productId: string) => {
    // Optimistic local update
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, status: "unmapped", mappedGarmentId: undefined } 
        : p
    ));

    try {
      const { unmapProductFromGarmentAction } = await import("./actions");
      const res = await unmapProductFromGarmentAction(productId);
      if (res.error) {
        setSyncMessage({ type: "error", title: "Error al desvincular", text: res.error });
      }
    } catch (e) {
      console.error(e);
      setSyncMessage({ type: "error", title: "Error de red", text: "Hubo un problema al desvincular el producto." });
    }
  };

  const confirmUnmap = (product: MockProduct) => {
    setProductToUnmap(product);
    setUnmapModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/50 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por SKU o nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus-visible:ring-primary/30"
          />
        </div>

        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
          className="h-12 px-6 rounded-xl font-semibold w-full sm:w-auto shadow-lg hover:scale-[1.02] transition-transform"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Sincronizar Catálogo"}
        </Button>
      </div>

      {/* Sync Message Alert */}
      {syncMessage && (
        <Alert 
          variant={syncMessage.type === "error" ? "destructive" : "default"}
          className={`rounded-2xl border ${
            syncMessage.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
            syncMessage.type === "info" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
            "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {syncMessage.type === "success" && <CheckCircle2 className="h-5 w-5 !text-emerald-500" />}
          {syncMessage.type === "info" && <AlertCircle className="h-5 w-5 !text-blue-500" />}
          {syncMessage.type === "error" && <AlertCircle className="h-5 w-5 !text-destructive" />}
          <AlertTitle className="font-bold ml-2">{syncMessage.title}</AlertTitle>
          <AlertDescription className="ml-2 mt-1 opacity-90">{syncMessage.text}</AlertDescription>
        </Alert>
      )}

      {/* Data Table */}
      <div className="rounded-[2rem] border border-white/10 bg-background/40 backdrop-blur-2xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-[80px] text-center">Img</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-center">Estado de Mapeo</TableHead>
              <TableHead className="text-right pr-6">Acciones 3D</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell className="p-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-white/10 relative">
                    <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-base text-foreground">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-background/50 border-white/10 text-xs">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {product.status === "mapped" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mapeado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> Sin Mapear
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right pr-6">
                  {product.status === "unmapped" ? (
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="rounded-xl font-semibold shadow-md shadow-primary/20 hover:scale-105 transition-transform"
                      onClick={() => openMappingModal(product)}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Vincular a 3D
                    </Button>
                  ) : (
                    <div className="flex justify-end items-center gap-2">
                      <Button 
                        size="icon-sm" 
                        variant="secondary" 
                        className="rounded-xl hover:bg-primary/20 hover:text-primary transition-colors"
                        title="Previsualizar Paramétricamente"
                        onClick={() => handleOpenPreview(product.mappedGarmentId)}
                      >
                        {isPreviewLoading && previewModalOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button 
                        size="icon-sm" 
                        variant="ghost" 
                        className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Desvincular"
                        onClick={() => confirmUnmap(product)}
                      >
                        <Link2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No se encontraron productos con ese filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL: MAPEO INTELIGENTE */}
      <Dialog open={mappingModalOpen} onOpenChange={setMappingModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-background/95 backdrop-blur-3xl border-white/10 rounded-[2rem] shadow-2xl p-0 overflow-hidden flex flex-col h-[80vh]">
          <div className="p-8 pb-4 shrink-0 border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Link2 className="w-6 h-6 text-primary" />
                Mapeo Inteligente (Binding)
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Selecciona a qué modelo 3D base corresponde el producto <strong className="text-foreground">{selectedProduct?.name}</strong> ({selectedProduct?.sku}).
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              {/* Tabs */}
              <div className="flex bg-white/5 p-1 rounded-xl w-fit border border-white/10">
                <button 
                  onClick={() => setMappingTab("own")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mappingTab === "own" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <User className="w-4 h-4" /> Mis Modelos
                </button>
                <button 
                  onClick={() => setMappingTab("community")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mappingTab === "community" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Users className="w-4 h-4" /> Comunidad
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por SKU o nombre..." 
                    value={mappingSearch}
                    onChange={(e) => setMappingSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl bg-background/50 border-white/10"
                  />
                </div>
                
                {mappingTab === "community" && (
                  <Button 
                    variant={mappingLikedOnly ? "default" : "outline"} 
                    onClick={() => setMappingLikedOnly(!mappingLikedOnly)}
                    className={`h-10 rounded-xl border-white/10 transition-colors ${mappingLikedOnly ? "bg-rose-500 text-white hover:bg-rose-600 border-transparent shadow-md shadow-rose-500/20" : "hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20"}`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${mappingLikedOnly ? "fill-current" : ""}`} />
                    Solo mis favoritos
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
            {mappingLoading && mappingPage === 1 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p>Cargando modelos 3D...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mappingGarments.map((garment) => (
                    <div 
                      key={garment.id}
                      onClick={() => handleMapGarment(garment.id as string)}
                      className="group cursor-pointer rounded-2xl border border-white/10 bg-background/50 p-4 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-4 shadow-sm"
                    >
                      <div className="w-16 h-16 rounded-xl bg-muted border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden relative">
                        {garment.baseModelUrl ? (
                          <Box className="w-8 h-8 text-primary" />
                        ) : (
                          <Box className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{garment.name || "Sin nombre"}</h4>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{garment.sku}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {mappingGarments.length === 0 && !mappingLoading && (
                  <div className="text-center p-8 text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10 mt-4">
                    <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    No se encontraron modelos 3D que coincidan con la búsqueda.
                  </div>
                )}

                {mappingHasMore && (
                  <div className="mt-8 flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setMappingPage(p => p + 1)}
                      disabled={mappingLoading}
                      className="rounded-xl border-white/10"
                    >
                      {mappingLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Cargar más
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: PREVISUALIZACION PARAMETRICA */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] bg-background border-border/50 rounded-[2rem] shadow-2xl p-0 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-white/5 bg-background/80 backdrop-blur-xl shrink-0 absolute top-0 left-0 w-full z-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Previsualización Paramétrica 3D
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setPreviewModalOpen(false)} className="rounded-xl">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 relative w-full h-full bg-black/20">
            {isPreviewLoading || !previewGarmentData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Cargando modelo 3D y texturas...</p>
              </div>
            ) : (
              <>
                <GarmentViewer 
                  url={previewGarmentData.baseModelUrl as string}
                  colorHex={(previewGarmentData.variants as {id: string, colorHex: string, textureUrl: string, backTextureUrl: string}[])?.find(v => v.id === selectedVariantId)?.colorHex}
                  textureUrl={(previewGarmentData.variants as {id: string, colorHex: string, textureUrl: string, backTextureUrl: string}[])?.find(v => v.id === selectedVariantId)?.textureUrl}
                  backTextureUrl={(previewGarmentData.variants as {id: string, colorHex: string, textureUrl: string, backTextureUrl: string}[])?.find(v => v.id === selectedVariantId)?.backTextureUrl}
                  scale={[
                    (previewGarmentData.sizes as {id: string, scaleX: number, scaleY: number, scaleZ: number}[])?.find(s => s.id === selectedSizeId)?.scaleX || 1,
                    (previewGarmentData.sizes as {id: string, scaleX: number, scaleY: number, scaleZ: number}[])?.find(s => s.id === selectedSizeId)?.scaleY || 1,
                    (previewGarmentData.sizes as {id: string, scaleX: number, scaleY: number, scaleZ: number}[])?.find(s => s.id === selectedSizeId)?.scaleZ || 1
                  ]}
                />
                
                {/* Selector Overlay */}
                <div 
                  className={cn(
                    "absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[500px] z-10 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl rounded-3xl",
                    isVariationsMenuOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-[120%] opacity-0 scale-95 pointer-events-none"
                  )}
                >
                  <div className="bg-background/80 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="p-5 flex items-center justify-between border-b border-white/5 bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                          <Eye className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground leading-tight">Test Paramétrico</h3>
                          <p className="text-xs text-muted-foreground font-medium">Validá combinaciones</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-white/10 h-8 w-8 transition-colors"
                        onClick={() => setIsVariationsMenuOpen(false)}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      </Button>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Variants Section */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Variante</span>
                          <span className="text-xs font-medium text-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                            {(previewGarmentData.variants as {id: string, name: string}[])?.find(v => v.id === selectedVariantId)?.name || 'Ninguna'}
                          </span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x">
                          {(previewGarmentData.variants as {id: string, name: string, type: string, colorHex?: string, previewImageUrl?: string, textureUrl?: string}[])?.map(v => (
                            <button
                              key={v.id}
                              className={cn(
                                "relative w-14 h-14 rounded-2xl flex-shrink-0 transition-all duration-300 snap-center overflow-hidden group outline-none",
                                selectedVariantId === v.id 
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-[0_0_20px_rgba(var(--primary),0.4)]" 
                                  : "hover:scale-105 border border-white/10 opacity-70 hover:opacity-100"
                              )}
                              onClick={() => setSelectedVariantId(v.id)}
                            >
                              {v.type === 'solid' ? (
                                <div className="absolute inset-0 transition-transform group-hover:scale-110" style={{ backgroundColor: v.colorHex || '#ffffff' }} />
                              ) : (
                                  <Image src={(v.previewImageUrl || v.textureUrl) as string} alt={v.name} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                              )}
                              {selectedVariantId === v.id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                                  <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      {/* Sizes Section */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Talle</span>
                          <span className="text-xs font-medium text-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                            {(previewGarmentData.sizes as {id: string, label: string}[])?.find(s => s.id === selectedSizeId)?.label || 'Ninguno'}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {(previewGarmentData.sizes as {id: string, label: string}[])?.map(s => (
                            <button
                              key={s.id}
                              className={cn(
                                "h-10 px-4 rounded-xl text-sm font-bold transition-all duration-300 outline-none",
                                selectedSizeId === s.id 
                                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)] scale-105" 
                                  : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-foreground"
                              )}
                              onClick={() => setSelectedSizeId(s.id)}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Show Menu Button */}
                {!isVariationsMenuOpen && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-background/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-white/10 hover:scale-110 transition-all duration-300 group z-10"
                    onClick={() => setIsVariationsMenuOpen(true)}
                  >
                    <ChevronUp className="w-6 h-6 text-foreground group-hover:-translate-y-1 transition-transform" />
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMACION DE DESVINCULACION */}
      <AlertDialog open={unmapModalOpen} onOpenChange={setUnmapModalOpen}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-3xl border-white/10 rounded-[2rem] shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Link2 className="w-5 h-5 text-destructive" />
              ¿Estás seguro que querés desvincular?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2">
              Se eliminará el modelo 3D asignado para el producto <span className="font-bold text-foreground">{productToUnmap?.name}</span>. Los clientes en la tienda ya no podrán usar el probador virtual para este artículo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
            <AlertDialogCancel className="rounded-xl h-12 bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="rounded-xl h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              onClick={() => {
                if (productToUnmap) {
                  handleUnmap(productToUnmap.id);
                }
              }}
            >
              Desvincular Prenda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
