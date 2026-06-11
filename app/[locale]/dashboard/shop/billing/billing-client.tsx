"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { 
  CreditCard, 
  BarChart3, 
  Zap, 
  HardDrive, 
  Activity, 
  CheckCircle2, 
  Download, 
  Plus,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { createCheckoutSessionAction, createCustomerPortalAction } from "./actions";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";

const mockPaymentMethods = [
  { id: 1, type: "Visa", last4: "4242", expiry: "12/26", isDefault: true },
  { id: 2, type: "Mastercard", last4: "8888", expiry: "08/25", isDefault: false },
];

const mockTransactions = [
  { id: "INV-001", date: "2026-05-01", amount: "$0.00", status: "Pagado", plan: "Starter" },
  { id: "INV-002", date: "2026-06-01", amount: "$0.00", status: "Pagado", plan: "Starter" },
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    interval: "/mes",
    description: "Ideal para explorar la plataforma y probar las generaciones 3D.",
    features: [
      "Hasta 50 prendas 3D",
      "10 GB de almacenamiento",
      "50,000 Peticiones API",
      "Marca de agua de Eidyn",
      "Soporte comunitario"
    ],
    highlight: false,
    slug: "free",
  },
  {
    name: "Pro",
    price: "$99",
    interval: "/mes",
    description: "Para tiendas en crecimiento que buscan automatizar su flujo 3D.",
    features: [
      "Hasta 500 prendas 3D",
      "100 GB de almacenamiento",
      "Acceso completo a Webhooks",
      "Sin marcas de agua",
      "Renderizado avanzado PBR",
      "Soporte prioritario 24/7"
    ],
    highlight: true,
    slug: "pro",
  },
  {
    name: "Enterprise",
    price: "A medida",
    interval: "",
    description: "Infraestructura dedicada y límites personalizados para gran escala.",
    features: [
      "Prendas ilimitadas",
      "Almacenamiento ilimitado",
      "SLAs de rendimiento",
      "Límites de colisiones y físicas a medida",
      "Ingeniero de éxito dedicado"
    ],
    highlight: false,
    slug: "enterprise",
  }
];

export function BillingClient({ currentPlan = "free" }: { currentPlan?: string }) {
  const t = useTranslations("Billing");
  const locale = useLocale();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const mockUsage = useMemo(() => ({
    garments: { current: 15, max: 50, label: t("garmentsProcessed", { fallback: "Prendas Procesadas" }) },
    storage: { current: 3.2, max: 10, label: t("storage", { fallback: "Almacenamiento (GB)" }) },
    apiCalls: { current: 12500, max: 50000, label: t("apiCalls", { fallback: "Peticiones API" }) },
  }), [t]);

  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  const handlePlanAction = async (planSlug: string) => {
    try {
      setLoadingPlan(planSlug);

      if (planSlug === currentPlan) {
        // Ir al portal si ya es el plan actual (y no es free)
        if (currentPlan !== "free") {
          const res = await createCustomerPortalAction(locale);
          if (res.error) throw new Error(res.error);
          if (res.url) window.location.assign(res.url);
        }
        return;
      }

      if (planSlug === "pro") {
        const res = await createCheckoutSessionAction(locale);
        if (res.error) throw new Error(res.error);
        if (res.url) window.location.assign(res.url);
      } else if (planSlug === "enterprise") {
        toast.success("Contactando a ventas...");
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Error al procesar la solicitud");
      } else {
        toast.error("Error al procesar la solicitud");
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Encabezado */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
          <CreditCard className="w-4 h-4" />
          Facturación y Planes
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Gestiona tu Suscripción</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Visualiza tu consumo en tiempo real, administra métodos de pago y selecciona el plan técnico ideal para tu tienda.
        </p>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-px">
        <button 
          onClick={() => setActiveTab("overview")}
          className={cn(
            "pb-3 text-sm font-semibold transition-colors border-b-2",
            activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Resumen y Planes
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={cn(
            "pb-3 text-sm font-semibold transition-colors border-b-2",
            activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Historial de Transacciones
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-12">
          
          {/* SECCIÓN 1: Panel de Control de Recursos */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Consumo de Recursos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Prendas */}
              <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-primary/20" />
                <div className="flex justify-between items-start mb-4 relative">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold bg-white/5 px-2 py-1 rounded-md text-muted-foreground border border-white/10">{t("starter")}</span>
                </div>
                <h3 className="text-muted-foreground font-medium mb-1">{mockUsage.garments.label}</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-3xl font-bold text-foreground">{mockUsage.garments.current}</span>
                  <span className="text-muted-foreground mb-1">/ {mockUsage.garments.max}</span>
                </div>
                <Progress value={(mockUsage.garments.current / mockUsage.garments.max) * 100} className="h-2 bg-white/5" />
              </div>

              {/* Almacenamiento */}
              <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-blue-500/20" />
                <div className="flex justify-between items-start mb-4 relative">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <HardDrive className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-muted-foreground font-medium mb-1">{mockUsage.storage.label}</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-3xl font-bold text-foreground">{mockUsage.storage.current}</span>
                  <span className="text-muted-foreground mb-1">/ {mockUsage.storage.max}</span>
                </div>
                <Progress value={(mockUsage.storage.current / mockUsage.storage.max) * 100} className="h-2 bg-white/5" />
              </div>

              {/* API Calls */}
              <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20" />
                <div className="flex justify-between items-start mb-4 relative">
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Zap className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Estado Óptimo
                  </span>
                </div>
                <h3 className="text-muted-foreground font-medium mb-1">{mockUsage.apiCalls.label}</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-3xl font-bold text-foreground">{(mockUsage.apiCalls.current / 1000).toFixed(1)}k</span>
                  <span className="text-muted-foreground mb-1">/ {(mockUsage.apiCalls.max / 1000).toFixed(0)}k</span>
                </div>
                <Progress value={(mockUsage.apiCalls.current / mockUsage.apiCalls.max) * 100} className="h-2 bg-white/5" />
              </div>

            </div>
          </section>

          {/* SECCIÓN 3: Selector de Planes Dinámico */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl font-bold mb-4">Plataforma Técnica</h2>
              <p className="text-muted-foreground">Elegí la capacidad de procesamiento y las características avanzadas que necesita el ecosistema 3D de tu marca.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div 
                  key={plan.name} 
                  className={cn(
                    "relative bg-background/50 backdrop-blur-xl border rounded-[2rem] p-8 flex flex-col transition-transform hover:scale-[1.02]",
                    plan.highlight 
                      ? "border-primary/50 shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)]" 
                      : "border-white/10 shadow-2xl"
                  )}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest py-1 px-4 rounded-full">
                      Recomendado
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm min-h-[40px]">{plan.description}</p>
                  </div>
                  
                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground font-medium">{plan.interval}</span>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handlePlanAction(plan.slug)}
                    disabled={loadingPlan !== null || (plan.slug === "free" && currentPlan === "free")}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2",
                      plan.slug === currentPlan 
                        ? (currentPlan === "free" ? "bg-white/5 text-muted-foreground border border-white/5 cursor-default" : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30") 
                        : plan.highlight 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" 
                          : "bg-white/10 text-foreground hover:bg-white/20 border border-white/10"
                    )}
                  >
                    {loadingPlan === plan.slug ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : plan.slug === currentPlan ? (
                      currentPlan === "free" ? t("currentPlanTitle", { fallback: "Plan Actual" }) : "Administrar Suscripción"
                    ) : plan.slug === "enterprise" ? (
                      "Contactar a Ventas"
                    ) : (
                      `${t("upgradeTo", { fallback: "Mejorar a " })}${plan.name}`
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SECCIÓN 2: Gestión Financiera */}
          <section className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl mt-12">
            <div className="flex flex-col md:flex-row gap-8 justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Métodos de Pago</h2>
                <p className="text-muted-foreground mb-8">Administra tus tarjetas de crédito asociadas para el cobro automático de tu suscripción.</p>
                
                <div className="space-y-4">
                  {mockPaymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center font-bold italic text-xs">
                          {method.type}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">•••• {method.last4}</p>
                          <p className="text-xs text-muted-foreground">Expira {method.expiry}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {method.isDefault && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">{t("primary")}</span>
                        )}
                        <button aria-label={`${t("edit")} ${method.type} ${method.last4}`} className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">{t("edit")}</button>
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-muted-foreground font-semibold flex items-center justify-center gap-2 hover:bg-white/5 hover:text-foreground transition-all">
                    <Plus className="w-5 h-5" /> Agregar Nuevo Método de Pago
                  </button>
                </div>
              </div>
              
              <div className="w-full md:w-80 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t("securityTitle")}</h3>
                  <p className="text-sm text-muted-foreground">Tus transacciones están encriptadas con cifrado de 256 bits y procesadas por Stripe.</p>
                </div>
                <div className="mt-6 flex justify-between items-center text-xs text-muted-foreground">
                  <span>Powered by Stripe</span>
                  <div className="flex gap-1">
                    <div className="w-6 h-4 bg-white/20 rounded-sm"></div>
                    <div className="w-6 h-4 bg-white/20 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

      {activeTab === "history" && (
        <section className="space-y-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Transparencia en Facturación</h2>
              <p className="text-muted-foreground">Descarga los comprobantes de tus pagos históricos.</p>
            </div>
            <button className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
              Exportar CSV <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground text-sm">{t("table.invoice")}</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm">{t("table.date")}</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm">{t("table.plan")}</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm">{t("table.amount")}</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm">{t("table.status")}</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.length > 0 ? (
                  mockTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-foreground">{tx.id}</td>
                      <td className="p-4 text-muted-foreground text-sm">{tx.date}</td>
                      <td className="p-4 text-muted-foreground text-sm">{tx.plan}</td>
                      <td className="p-4 font-semibold">{tx.amount}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button aria-label={`Descargar factura ${tx.id}`} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-white/5 rounded-lg hover:bg-primary/10">
                          <Download className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}
