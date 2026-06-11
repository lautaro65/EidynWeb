"use client";

import { useState, useEffect } from "react";
import { GarmentViewer } from "@/components/3d/GarmentViewer";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { checkWidgetAuthAction, grantConsentAction } from "@/app/[locale]/widget/actions";

type Variant = {
  id: string;
  name: string | null;
  colorHex: string | null;
  textureUrl: string | null;
  backTextureUrl: string | null;
};

type WidgetViewerClientProps = {
  apiKey: string;
  tenantName: string;
  garment: {
    id: string;
    name: string;
    baseModelUrl: string | null;
    variants: Variant[];
  };
  brandColor: string;
  theme: string;
  showWatermark: boolean;
};

type AuthState = "checking" | "unauthenticated" | "needs_consent" | "authorized" | "error";

export function WidgetViewerClient({
  apiKey,
  tenantName,
  garment,
  brandColor,
  theme,
  showWatermark,
}: WidgetViewerClientProps) {
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    garment.variants.length > 0 ? garment.variants[0].id : null
  );
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const checkAuth = async () => {
    setAuthState("checking");
    const res = await checkWidgetAuthAction(apiKey);
    if (res.status === "authorized") {
      setUserAvatarUrl(res.avatarUrl || null);
      setAuthState("authorized");
    } else {
      setAuthState(res.status as AuthState);
    }
  };

  useEffect(() => {
    checkAuth();

    // Escuchar mensajes del popup de login
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "eidyn-login-success") {
        checkAuth();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [apiKey]);

  const handleLogin = () => {
    // Abrir un popup centrado en la pantalla
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Redirect a nuestra página /sign-in, que luego redirigirá a una página especial que hace window.postMessage("eidyn-login-success")
    window.open(
      "/sign-in?redirect_url=/widget/close",
      "EidynLogin",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleGrantConsent = async () => {
    setAuthState("checking");
    const res = await grantConsentAction(apiKey);
    if (res.success) {
      checkAuth();
    } else {
      setAuthState("needs_consent");
    }
  };

  const activeVariant = garment.variants.find((v) => v.id === activeVariantId);
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className={cn(
      "w-full h-full flex flex-col md:flex-row relative",
      isDark ? "bg-black text-white" : "bg-[#f8f9fa] text-black"
    )}>
      {/* 3D Viewer Area */}
      <div className="flex-1 h-[60vh] md:h-full relative p-2 md:p-6">
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative border border-white/10 bg-gradient-to-br from-background/50 to-background/5 backdrop-blur-3xl">
           
           {/* Si el usuario NO está logueado o le falta dar consentimiento, bloqueamos interacciones 3D con un overlay */}
           {authState !== "authorized" && authState !== "checking" && (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md p-6 text-center">
               
               {authState === "unauthenticated" && (
                 <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border border-white/10 max-w-sm animate-in fade-in zoom-in duration-300">
                    <h3 className="text-xl font-bold mb-2">Pruébatelo en tu cuerpo</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Inicia sesión en Eidyn para cargar tu Avatar 3D y ver cómo te queda esta prenda.
                    </p>
                    <button 
                      onClick={handleLogin}
                      className="w-full py-3 px-6 rounded-full font-semibold text-white transition-transform hover:scale-105"
                      style={{ backgroundColor: brandColor }}
                    >
                      Iniciar Sesión
                    </button>
                 </div>
               )}

               {authState === "needs_consent" && (
                 <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border border-white/10 max-w-md animate-in fade-in zoom-in duration-300">
                    <h3 className="text-xl font-bold mb-2">Permiso requerido</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      ¿Autorizas a <strong>{tenantName}</strong> a acceder a las medidas de tu Avatar para el probador virtual?
                      Puedes revocar este permiso en cualquier momento desde tu cuenta de Eidyn.
                    </p>
                    <button 
                      onClick={handleGrantConsent}
                      className="w-full py-3 px-6 rounded-full font-semibold text-white transition-transform hover:scale-105"
                      style={{ backgroundColor: brandColor }}
                    >
                      Autorizar y Ver
                    </button>
                    <p className="mt-4 text-xs text-muted-foreground/60">Tus datos biométricos nunca son compartidos directamente con la tienda.</p>
                 </div>
               )}
             </div>
           )}

           {/* Generic Viewer / Personal Viewer */}
           {/* Muestra la prenda sola, o con el avatar si userAvatarUrl existe */}
           <div className={cn("w-full h-full", authState !== "authorized" && "opacity-40 blur-sm pointer-events-none")}>
             <GarmentViewer 
               url={garment.baseModelUrl || ""} 
               colorHex={activeVariant?.colorHex || undefined}
               textureUrl={activeVariant?.textureUrl || undefined}
               backTextureUrl={activeVariant?.backTextureUrl || undefined}
               avatarUrl={userAvatarUrl || undefined}
               className="w-full h-full rounded-none border-none"
             />
           </div>

           {showWatermark && (
             <div className="absolute bottom-4 left-6 pointer-events-none opacity-40 z-10">
               <span className="text-xl font-black tracking-tighter">EIDYN</span>
             </div>
           )}
        </div>
      </div>

      {/* Controls Sidebar */}
      <div className="w-full md:w-80 h-[40vh] md:h-full overflow-y-auto border-t md:border-t-0 md:border-l border-border/10 p-6 flex flex-col bg-background/50 backdrop-blur-xl relative z-30">
        <h1 className="text-2xl font-bold mb-1">{garment.name || "Producto 3D"}</h1>
        <p className="text-sm text-muted-foreground mb-8">Interactúa con el modelo 3D</p>

        {garment.variants.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Variantes</h3>
            <div className="grid grid-cols-4 gap-3">
              {garment.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setActiveVariantId(variant.id)}
                  title={variant.name || "Variante"}
                  className={cn(
                    "w-12 h-12 rounded-full border-2 overflow-hidden flex items-center justify-center relative transition-all",
                    activeVariantId === variant.id ? "scale-110 shadow-lg" : "scale-100 hover:scale-105 opacity-80"
                  )}
                  style={{ 
                    borderColor: activeVariantId === variant.id ? brandColor : 'transparent',
                    backgroundColor: variant.colorHex || '#ddd'
                  }}
                >
                  {variant.textureUrl && (
                    <img 
                      src={variant.textureUrl} 
                      alt={variant.name || ""} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto space-y-3 pt-6 border-t border-border/10">
           <div className="flex items-center gap-3 text-xs text-muted-foreground">
             <div className="p-2 rounded-full bg-foreground/5">🖐️</div>
             <span>Usa un dedo para rotar</span>
           </div>
           <div className="flex items-center gap-3 text-xs text-muted-foreground">
             <div className="p-2 rounded-full bg-foreground/5">🔍</div>
             <span>Usa dos dedos para zoom</span>
           </div>
        </div>
      </div>
    </div>
  );
}
