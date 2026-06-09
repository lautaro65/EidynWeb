"use client";

import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Cpu,
  Server,
  AlertCircle,
  Clock,
  Shirt,
  Eye,
  ShoppingCart,
  CheckCircle2,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Cell
} from "recharts";
import { Progress } from "@/components/ui/progress";

// Mock Data
const funnelData = [
  { name: "Vistas del Widget", count: 125000 },
  { name: "Try-On Iniciados", count: 45000 },
  { name: "Agregados al Carrito", count: 18000 },
  { name: "Compras Finalizadas", count: 9500 },
];

const latencyData = [
  { time: "00:00", ms: 120 },
  { time: "04:00", ms: 95 },
  { time: "08:00", ms: 150 },
  { time: "12:00", ms: 210 },
  { time: "16:00", ms: 180 },
  { time: "20:00", ms: 140 },
  { time: "24:00", ms: 110 },
];

const communityData = [
  { day: "Lun", active: 2400 },
  { day: "Mar", active: 1398 },
  { day: "Mie", active: 9800 },
  { day: "Jue", active: 3908 },
  { day: "Vie", active: 4800 },
  { day: "Sab", active: 3800 },
  { day: "Dom", active: 4300 },
];

export function AnalyticsClient() {
  const [activeTab, setActiveTab] = useState<"conversion" | "ecosystem" | "health">("conversion");

  const renderTabButton = (id: "conversion" | "ecosystem" | "health", label: string, Icon: LucideIcon) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300",
        activeTab === id 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
      )}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Encabezado */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
          <BarChart3 className="w-4 h-4" />
          Análisis e Insights
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Business Intelligence</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Monitorea el rendimiento de tus prendas 3D, el comportamiento de los usuarios y la salud de nuestra infraestructura en tiempo real.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-white/10 pb-6">
        {renderTabButton("conversion", "Métricas de Conversión", TrendingUp)}
        {renderTabButton("ecosystem", "Ecosistema y Comunidad", Users)}
        {renderTabButton("health", "Salud Operativa", Activity)}
      </div>

      {/* SECCIÓN 1: MÉTRICAS DE CONVERSIÓN */}
      {activeTab === "conversion" && (
        <section className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-muted-foreground font-medium mb-1">Vistas del Widget</h3>
              <p className="text-3xl font-bold">125k</p>
              <div className="flex items-center gap-1 text-emerald-500 text-sm mt-2 font-medium">
                <TrendingUp className="w-4 h-4" /> +12.5%
              </div>
            </div>
            
            <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-primary/20" />
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Shirt className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-muted-foreground font-medium mb-1">Try-On Iniciados</h3>
              <p className="text-3xl font-bold">45k</p>
              <div className="flex items-center gap-1 text-emerald-500 text-sm mt-2 font-medium">
                <TrendingUp className="w-4 h-4" /> +36.0% (Alto Impacto)
              </div>
            </div>

            <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-muted-foreground font-medium mb-1">Agregados al Carrito</h3>
              <p className="text-3xl font-bold">18k</p>
              <div className="flex items-center gap-1 text-emerald-500 text-sm mt-2 font-medium">
                <TrendingUp className="w-4 h-4" /> +8.2%
              </div>
            </div>

            <div className="bg-background/40 backdrop-blur-xl border border-primary/30 p-6 rounded-2xl shadow-[0_0_30px_-10px_rgba(var(--primary),0.2)] flex flex-col justify-between">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-muted-foreground font-medium mb-1">Compras Finalizadas</h3>
              <p className="text-3xl font-bold text-foreground">9.5k</p>
              <div className="flex items-center gap-1 text-emerald-500 text-sm mt-2 font-medium">
                <TrendingUp className="w-4 h-4" /> +15.3%
              </div>
            </div>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Embudo de Conversión (Funnel)</h2>
              <p className="text-muted-foreground">Análisis de abandono desde la visualización del widget 3D hasta la compra final.</p>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} width={140} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 14, 12, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === funnelData.length - 1 ? 'rgb(var(--primary))' : `rgba(var(--primary), ${1 - index * 0.2})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* SECCIÓN 2: ECOSISTEMA Y COMUNIDAD */}
      {activeTab === "ecosystem" && (
        <section className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Adopción y Usuarios Activos</h2>
                <p className="text-muted-foreground">Evolución de usuarios únicos interactuando con los modelos 3D esta semana.</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-muted-foreground">Total Usuarios</p>
                <p className="text-3xl font-bold text-primary">30,406</p>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={communityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 14, 12, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="active" stroke="rgb(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Shirt className="w-5 h-5 text-primary" /> Modelos con más Engagement
              </h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center font-bold text-muted-foreground">
                      #{i}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Remera Oversize Vintage</p>
                      <p className="text-xs text-muted-foreground">SKU: REM-OVS-00{i}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{(15 / i).toFixed(1)}k</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Interacciones</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Demografía y Dispositivos
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium text-muted-foreground">Dispositivos Móviles (iOS/Android)</span>
                    <span className="font-bold">78%</span>
                  </div>
                  <Progress value={78} className="h-2 bg-white/5" />
                </div>
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium text-muted-foreground">Escritorio (Windows/Mac)</span>
                    <span className="font-bold">22%</span>
                  </div>
                  <Progress value={22} className="h-2 bg-white/5" />
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-sm text-muted-foreground italic">
                    El rendimiento de WebGL en móviles se mantiene estable en un promedio de 45 FPS, garantizando una excelente experiencia para la mayoría de tus compradores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECCIÓN 3: SALUD OPERATIVA */}
      {activeTab === "health" && (
        <section className="space-y-8 animate-in fade-in duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl flex flex-col">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                <Server className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-muted-foreground font-medium mb-1">Estado de la API</h3>
              <p className="text-3xl font-bold text-foreground">100% Online</p>
              <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Operación Normal</p>
            </div>
            
            <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-muted-foreground font-medium mb-1">Latencia Promedio</h3>
              <p className="text-3xl font-bold text-foreground">142 ms</p>
              <p className="text-xs text-muted-foreground mt-2">Respuesta en la CDN de modelos 3D</p>
            </div>

            <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-muted-foreground font-medium mb-1">Cola de Inngest (AiJobs)</h3>
              <p className="text-3xl font-bold text-foreground">2 / 50</p>
              <p className="text-xs text-muted-foreground mt-2">Trabajos de generación de mallas pendientes</p>
            </div>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold mb-2">Latencia de Procesamiento (Últimas 24h)</h2>
                <p className="text-muted-foreground">Monitoreo de tiempos de respuesta del CDN que despacha los .GLB.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-semibold">Live</span>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)' }} unit="ms" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 14, 12, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Line type="monotone" dataKey="ms" stroke="rgb(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'rgb(var(--primary))' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-500 mb-1">Alerta Predictiva del Sistema</h3>
              <p className="text-sm text-muted-foreground">
                Basado en el crecimiento del tráfico, recomendamos configurar <strong>Cloudflare R2 Tier 2</strong> para el próximo mes. El volumen de descargas simultáneas de modelos 3D podría experimentar latencias superiores a 500ms durante picos de ventas de fin de semana.
              </p>
            </div>
          </div>

        </section>
      )}

    </div>
  );
}
