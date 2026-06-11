import { getTranslations } from "next-intl/server";
import { User, Ruler, Store, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function PortalPage({ params }: { params: Promise<{ locale: string }> }) {
  // Placeholder para futuras traducciones
  // const t = await getTranslations({ locale: (await params).locale, namespace: "Portal" });

  return (
    <div className="max-w-5xl space-y-12">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-semibold mb-4 border border-blue-500/20">
          <User className="w-4 h-4" />
          Panel de Usuario
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
          Tu Identidad 3D
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Gestiona tu avatar personal, tus medidas corporales exactas y controla qué tiendas pueden acceder a tu probador virtual.
        </p>
      </div>

      {/* Grid de Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card: Avatar */}
        <Link href="/portal" className="group">
          <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full transition-all duration-300 hover:border-blue-500/50 hover:bg-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-blue-500/20" />
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 border border-blue-500/20">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 flex items-center justify-between">
              Mi Avatar 3D
              <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-blue-500" />
            </h3>
            <p className="text-muted-foreground text-sm">
              Visualiza y actualiza tu modelo 3D corporal generado a partir de tus fotos o medidas.
            </p>
          </div>
        </Link>

        {/* Card: Medidas */}
        <Link href="/portal/measurements" className="group">
          <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full transition-all duration-300 hover:border-purple-500/50 hover:bg-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-purple-500/20" />
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 border border-purple-500/20">
              <Ruler className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 flex items-center justify-between">
              Mis Medidas
              <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-purple-500" />
            </h3>
            <p className="text-muted-foreground text-sm">
              Revisa tu perfil de tallas, altura, peso y dimensiones exactas para recomendaciones precisas.
            </p>
          </div>
        </Link>

        {/* Card: Tiendas */}
        <Link href="/portal/shops" className="group">
          <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full transition-all duration-300 hover:border-emerald-500/50 hover:bg-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20" />
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 border border-emerald-500/20">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 flex items-center justify-between">
              Privacidad y Tiendas
              <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-emerald-500" />
            </h3>
            <p className="text-muted-foreground text-sm">
              Administra qué marcas de ropa tienen permiso para cargar tu avatar en su probador virtual.
            </p>
          </div>
        </Link>

      </div>

      {/* Hero Visual Placeholder */}
      <div className="mt-12 w-full h-[400px] rounded-[2rem] border border-white/10 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-purple-500/20 opacity-50 transition-opacity duration-700 group-hover:opacity-100" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
          <div className="w-20 h-20 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <User className="w-10 h-10 text-white/50" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Tu Avatar 3D aparecerá aquí</h2>
          <p className="text-muted-foreground max-w-md">
            Pronto podrás visualizar tu clon digital en 360 grados y ajustar sus características directamente desde este panel.
          </p>
        </div>
      </div>

    </div>
  );
}
