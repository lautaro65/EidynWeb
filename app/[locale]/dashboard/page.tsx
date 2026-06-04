import { Shirt, Link as LinkIcon, Users, Ruler, ArrowUpRight, CheckCircle2, AlertCircle, BarChart3, Clock, Plus, Smartphone, Eye } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");
  
  // Datos mockeados para la interfaz inicial
  const metrics = {
    models3d: 24,
    productsLinked: 18,
    productsUnlinked: 6,
    authorizedStores: 12,
    sizeGuides: 8
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Modelos 3D */}
        <div className="bg-background/40 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-xl">
          <div className="absolute -right-6 -top-6 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
            <Shirt className="w-32 h-32 text-primary" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner border border-primary/20">
            <Shirt className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground uppercase tracking-wider text-xs mb-2">{t("models3d")}</h3>
          <p className="text-5xl font-black tracking-tighter text-foreground">{metrics.models3d}</p>
          <div className="flex items-center gap-2 mt-4 text-xs">
            <span className="flex items-center font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +3
            </span>
            <span className="text-muted-foreground font-light">{t("thisWeek")}</span>
          </div>
        </div>

        {/* Productos Vinculados */}
        <div className="bg-background/40 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 shadow-xl">
          <div className="absolute -right-6 -top-6 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
            <LinkIcon className="w-32 h-32 text-blue-500" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 shadow-inner border border-blue-500/20">
            <LinkIcon className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="font-medium text-muted-foreground uppercase tracking-wider text-xs mb-2">{t("productsStatus")}</h3>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-black tracking-tighter text-foreground">{metrics.productsLinked + metrics.productsUnlinked}</p>
            <span className="text-sm font-medium text-muted-foreground mb-1.5 border-b border-white/10 pb-0.5">{t("total")}</span>
          </div>
          <div className="flex flex-col gap-2 mt-4 text-xs font-medium">
            <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl">
              <span className="flex items-center text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-500" /> {t("linked")}</span>
              <span className="text-foreground">{metrics.productsLinked}</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl">
              <span className="flex items-center text-muted-foreground"><AlertCircle className="w-3.5 h-3.5 mr-1.5 text-yellow-500" /> {t("unlinked")}</span>
              <span className="text-foreground">{metrics.productsUnlinked}</span>
            </div>
          </div>
        </div>

        {/* Tiendas Autorizadas */}
        <div className="bg-background/40 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500 shadow-xl">
          <div className="absolute -right-6 -top-6 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
            <Users className="w-32 h-32 text-purple-500" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 shadow-inner border border-purple-500/20">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="font-medium text-muted-foreground uppercase tracking-wider text-xs mb-2">{t("authorizedStores")}</h3>
          <p className="text-5xl font-black tracking-tighter text-foreground">{metrics.authorizedStores}</p>
          <div className="w-full bg-muted/30 rounded-full h-1.5 mt-5 overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-1.5 rounded-full w-[60%] relative">
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] font-medium text-muted-foreground">
            <span>{t("licensesUsage")}</span>
            <span>{metrics.authorizedStores} / 20</span>
          </div>
        </div>

        {/* Guías de Talles */}
        <div className="bg-background/40 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500 shadow-xl">
          <div className="absolute -right-6 -top-6 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
            <Ruler className="w-32 h-32 text-amber-500" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 shadow-inner border border-amber-500/20">
            <Ruler className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="font-medium text-muted-foreground uppercase tracking-wider text-xs mb-2">{t("sizeGuides")}</h3>
          <p className="text-5xl font-black tracking-tighter text-foreground">{metrics.sizeGuides}</p>
          <div className="flex items-center gap-2 mt-4 text-xs">
            <span className="flex items-center font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
              {t("activeInStores")}
            </span>
          </div>
        </div>

      </div>

      {/* Main Content Grid: Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Activity Chart Area */}
        <div className="lg:col-span-2 bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> {t("views3d")}</h3>
              <p className="text-sm text-muted-foreground font-light mt-1">{t("viewsDesc")}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-foreground">14.2k</p>
              <p className="text-xs text-green-500 font-medium">+12% vs anterior</p>
            </div>
          </div>
          
          {/* CSS Mock Chart */}
          <div className="flex-1 flex items-end gap-2 sm:gap-4 mt-auto pt-10 h-64 border-b border-white/5 pb-2">
            {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex-1 flex items-end">
                  <div 
                    className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-lg transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {height * 142} {t("views")}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium uppercase">{t("day")} {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Try-On History List */}
        <div className="bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><Smartphone className="w-5 h-5 text-primary" /> {t("tryOnHistory")}</h3>
            <Link href="#" className="text-xs font-medium text-primary hover:text-primary/80">{t("live")}</Link>
          </div>
          
          <div className="space-y-4 flex-1">
            {[
              { title: "Prueba de Remera", desc: "Remera Oversize Negra", time: "Hace 2 min", icon: Eye, color: "text-green-500", bg: "bg-green-500/10" },
              { title: "Prueba Completa", desc: "Outfit Urbano Verano", time: "Hace 15 min", icon: Eye, color: "text-green-500", bg: "bg-green-500/10" },
              { title: "Prueba de Pantalón", desc: "Cargo Beige (Talle M)", time: "Hace 1 hora", icon: Eye, color: "text-green-500", bg: "bg-green-500/10" },
              { title: "Prueba de Buzo", desc: "Hoodie Eidyn Essential", time: "Hace 3 horas", icon: Eye, color: "text-green-500", bg: "bg-green-500/10" },
              { title: "Prueba de Remera", desc: "T-Shirt Classic Blanca", time: "Hace 4 horas", icon: Eye, color: "text-green-500", bg: "bg-green-500/10" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-default border border-transparent hover:border-white/5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium whitespace-nowrap bg-white/5 px-2 py-1 rounded-md">
                  {item.time}
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-white/5 flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" /> {t("fullAnalytics")}
          </button>
        </div>

      </div>

    </div>
  );
}
