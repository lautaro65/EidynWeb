"use client";

import { useState } from "react";
import { Integration, ApiKey } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingBag, Box, Key, Trash2, CheckCircle2, XCircle, Plus, Copy, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { createIntegrationAction, deleteIntegrationAction, createApiKeyAction, revokeApiKeyAction } from "./actions";

type Props = {
  integrations: Integration[];
  apiKeys: ApiKey[];
};

const PROVIDERS = [
  { id: "shopify", name: "Shopify", icon: ShoppingBag, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  { id: "woocommerce", name: "WooCommerce", icon: Box, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "tiendanube", name: "Tiendanube", icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
];

export function ConnectionsClient({ integrations, apiKeys }: Props) {
  const [activeTab, setActiveTab] = useState("native");

  // Integration Modal
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("shopify");
  const [storeUrl, setStoreUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // API Key Modal
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  const handleConnectIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    
    const formData = new FormData();
    formData.append("provider", selectedProvider);
    formData.append("storeUrl", storeUrl);
    formData.append("accessToken", accessToken);

    const res = await createIntegrationAction(formData);
    setIsConnecting(false);

    if (res.error) {
      alert(res.error);
    } else {
      setIsIntegrationModalOpen(false);
      setStoreUrl("");
      setAccessToken("");
    }
  };

  const handleDisconnect = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas desconectar esta integración?")) {
      const res = await deleteIntegrationAction(id);
      if (res.error) alert(res.error);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingKey(true);

    const formData = new FormData();
    formData.append("name", keyName);

    const res = await createApiKeyAction(formData);
    setIsGeneratingKey(false);

    if (res.error) {
      alert(res.error);
    } else if (res.secretKey) {
      setGeneratedSecret(res.secretKey);
      setKeyName("");
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (confirm("¿Revocar esta API Key de forma permanente? Las apps que la usen dejarán de funcionar inmediatamente.")) {
      const res = await revokeApiKeyAction(id);
      if (res.error) alert(res.error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("¡Copiado al portapapeles!");
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 w-full max-w-md bg-background/50 border border-white/10 p-1 rounded-2xl h-14">
          <TabsTrigger value="native" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-semibold h-full transition-all">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Integraciones Nativas
          </TabsTrigger>
          <TabsTrigger value="api" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-semibold h-full transition-all">
            <Key className="w-4 h-4 mr-2" />
            Gestión de Acceso (API)
          </TabsTrigger>
        </TabsList>

        {/* NATIVE INTEGRATIONS */}
        <TabsContent value="native" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROVIDERS.map((provider) => {
              const existing = integrations.find(i => i.provider === provider.id);
              const isConnected = !!existing && existing.status === "connected";
              const ProviderIcon = provider.icon;

              return (
                <Card key={provider.id} className={`bg-background/40 backdrop-blur-xl border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden ${isConnected ? 'ring-1 ring-primary/30' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-4 rounded-2xl ${provider.bg} ${provider.color} ${provider.border} border`}>
                        <ProviderIcon className="w-8 h-8" />
                      </div>
                      {isConnected ? (
                        <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Conectado
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-border/50">
                          <XCircle className="w-3.5 h-3.5" />
                          Desconectado
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-2xl mt-4">{provider.name}</CardTitle>
                    <CardDescription>
                      {isConnected ? `Sincronizado con: ${existing.storeUrl}` : `Conecta tu tienda de ${provider.name} para sincronizar modelos.`}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-4 border-t border-white/5 bg-muted/20">
                    {isConnected ? (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Último sync: {existing.lastSyncAt ? new Date(existing.lastSyncAt).toLocaleDateString() : 'Nunca'}</span>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleDisconnect(existing.id)}>
                          Desconectar
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full rounded-xl bg-foreground text-background hover:scale-[1.02] transition-transform font-bold shadow-lg"
                        onClick={() => {
                          setSelectedProvider(provider.id);
                          setIsIntegrationModalOpen(true);
                        }}
                      >
                        Configurar Conexión
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* API KEYS */}
        <TabsContent value="api" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-background/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Claves de API</CardTitle>
                <CardDescription>Genera credenciales de acceso para desarrollos a medida o CMS externos.</CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setGeneratedSecret(null);
                  setIsApiKeyModalOpen(true);
                }}
                className="rounded-xl bg-primary text-primary-foreground font-bold shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-primary/30 hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4 mr-2" /> Nueva API Key
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {apiKeys.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No tienes claves de API activas.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {apiKeys.map(key => (
                    <div key={key.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{key.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">ID: {key.id.split('-')[0]}...</span>
                            <span className="text-xs text-muted-foreground">Creada: {new Date(key.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl" onClick={() => handleRevokeKey(key.id)} title="Revocar llave">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SETUP WIZARD MODAL */}
      <Dialog open={isIntegrationModalOpen} onOpenChange={setIsIntegrationModalOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-3xl border-white/10 rounded-[2rem] shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" />
              Setup de {PROVIDERS.find(p => p.id === selectedProvider)?.name}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Ingresa los detalles de tu tienda para autorizar el "handshake".
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConnectIntegration} className="space-y-6 mt-4">
            <div className="space-y-3">
              <Label htmlFor="storeUrl" className="text-sm font-semibold ml-1">URL de la Tienda</Label>
              <Input 
                id="storeUrl" 
                value={storeUrl} 
                onChange={e => setStoreUrl(e.target.value)} 
                placeholder="ej: mi-tienda.myshopify.com" 
                required 
                className="h-12 bg-background/50 rounded-xl border-white/10"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="accessToken" className="text-sm font-semibold ml-1">Token de Acceso (Admin API)</Label>
              <Input 
                id="accessToken" 
                type="password" 
                value={accessToken} 
                onChange={e => setAccessToken(e.target.value)} 
                placeholder="shpat_xxxxxxxxxxxxxxxx" 
                required 
                className="h-12 bg-background/50 rounded-xl border-white/10"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm text-blue-200">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p>Esta conexión habilitará la sincronización bidireccional del catálogo 3D de Eidyn con tu tienda en tiempo real.</p>
            </div>

            <DialogFooter className="mt-8">
              <Button type="submit" disabled={isConnecting} className="w-full h-12 rounded-xl bg-foreground text-background font-bold hover:scale-[1.02] transition-transform shadow-lg">
                {isConnecting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Conectando...</> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Autorizar Conexión</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* GENERATE API KEY MODAL */}
      <Dialog open={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-3xl border-white/10 rounded-[2rem] shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              Generar API Key
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {generatedSecret ? "¡Clave generada con éxito!" : "Ingresa un nombre para identificar esta clave."}
            </DialogDescription>
          </DialogHeader>

          {!generatedSecret ? (
            <form onSubmit={handleGenerateKey} className="space-y-6 mt-4">
              <div className="space-y-3">
                <Label htmlFor="keyName" className="text-sm font-semibold ml-1">Nombre de la Clave</Label>
                <Input 
                  id="keyName" 
                  value={keyName} 
                  onChange={e => setKeyName(e.target.value)} 
                  placeholder="ej: Wordpress Producción" 
                  required 
                  className="h-12 bg-background/50 rounded-xl border-white/10"
                  autoComplete="off"
                />
              </div>

              <DialogFooter className="mt-8">
                <Button type="submit" disabled={isGeneratingKey} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.02] transition-transform shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-primary/30">
                  {isGeneratingKey ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Generando...</> : <><Key className="w-5 h-5 mr-2" /> Generar Clave</>}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-sm text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p>Copia tu clave secreta ahora. <strong>No volverá a mostrarse por seguridad.</strong></p>
              </div>

              <div className="relative">
                <Input 
                  readOnly 
                  value={generatedSecret} 
                  className="h-14 font-mono text-primary bg-primary/5 border-primary/20 rounded-xl pr-14"
                />
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-primary/20 hover:text-primary rounded-lg text-muted-foreground"
                  onClick={() => copyToClipboard(generatedSecret)}
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>

              <Button type="button" onClick={() => setIsApiKeyModalOpen(false)} className="w-full h-12 rounded-xl bg-foreground text-background font-bold hover:scale-[1.02] transition-transform">
                Entendido, cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
