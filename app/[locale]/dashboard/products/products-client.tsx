"use client";

import { useState } from "react";
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
  Code2, 
  Box, 
  Search,
  CheckCircle2,
  AlertCircle
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

const MOCK_PRODUCTS: MockProduct[] = [
  { id: "p1", sku: "TSH-BLK-01", name: "Remera Básica Negra", category: "Remeras", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60", status: "unmapped" },
  { id: "p2", sku: "HOOD-GRY-01", name: "Buzo Hoodie Gris", category: "Buzos", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60", status: "mapped", mappedGarmentId: "g1" },
  { id: "p3", sku: "PANT-DNM-01", name: "Pantalón Denim Clásico", category: "Pantalones", image: "https://images.unsplash.com/photo-1542272604-7804473e6580?w=500&auto=format&fit=crop&q=60", status: "unmapped" },
];

interface Props {
  baseGarments: { id: string, name: string | null, baseModelUrl: string | null }[];
  initialProducts: MockProduct[];
}

export function ProductsClient({ baseGarments, initialProducts }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [products, setProducts] = useState<MockProduct[]>(initialProducts);
  
  // Feedback visual state
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error" | "info", title: string, text: string } | null>(null);

  // Modals state
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);

  const [widgetModalOpen, setWidgetModalOpen] = useState(false);

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

  const openWidgetModal = (product: MockProduct) => {
    setSelectedProduct(product);
    setWidgetModalOpen(true);
  };

  const handleMapGarment = (garmentId: string) => {
    if (!selectedProduct) return;
    
    // Update local state for mock UI
    setProducts(prev => prev.map(p => 
      p.id === selectedProduct.id 
        ? { ...p, status: "mapped", mappedGarmentId: garmentId } 
        : p
    ));
    setMappingModalOpen(false);
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
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-white/10">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
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
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon-sm" 
                        variant="outline" 
                        className="rounded-xl border-white/10 hover:bg-white/10 transition-colors"
                        title="Obtener Widget"
                        onClick={() => openWidgetModal(product)}
                      >
                        <Code2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon-sm" 
                        variant="ghost" 
                        className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Desvincular"
                        onClick={() => {
                          setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: "unmapped", mappedGarmentId: undefined } : p))
                        }}
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
        <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-3xl border-white/10 rounded-[2rem] shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Link2 className="w-6 h-6 text-primary" />
              Mapeo Inteligente (Binding)
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Selecciona a qué modelo 3D base corresponde el producto <strong className="text-foreground">{selectedProduct?.name}</strong> ({selectedProduct?.sku}).
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {baseGarments.map((garment) => (
              <div 
                key={garment.id}
                onClick={() => handleMapGarment(garment.id)}
                className="group cursor-pointer rounded-2xl border border-white/10 bg-background/50 p-4 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl bg-muted border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Box className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{garment.name || "Sin nombre"}</h4>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{garment.id.split('-')[0]}</p>
                </div>
              </div>
            ))}
            {baseGarments.length === 0 && (
              <div className="col-span-2 text-center p-8 text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                No tenés modelos 3D listos para mapear.
                <br />
                Asegurate de que estén en estado "Completado".
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: FACTORY DE WIDGETS */}
      <Dialog open={widgetModalOpen} onOpenChange={setWidgetModalOpen}>
        <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-3xl border-white/10 rounded-[2rem] shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" />
              Factory de Widgets
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Copiá y pegá este fragmento en la página de tu producto en Shopify/Custom para inyectar el probador virtual.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto relative group">
            <pre>
{`<!-- Eidyn 3D Widget para ${selectedProduct?.sku} -->
<div id="eidyn-viewer-container" data-sku="${selectedProduct?.sku}"></div>
<script src="https://eidyn.vercel.app/sdk/viewer.js" async></script>`}
            </pre>
            <Button 
              size="sm" 
              variant="secondary" 
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
              onClick={() => {
                navigator.clipboard.writeText(`<div id="eidyn-viewer-container" data-sku="${selectedProduct?.sku}"></div>\n<script src="https://eidyn.vercel.app/sdk/viewer.js" async></script>`);
                alert("Copiado al portapapeles!");
              }}
            >
              Copiar
            </Button>
          </div>

          <div className="mt-6">
            <Button onClick={() => setWidgetModalOpen(false)} className="w-full h-12 rounded-xl bg-foreground text-background font-bold hover:scale-[1.02] transition-transform">
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
