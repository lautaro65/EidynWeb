"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Shirt, Store, Link2, TrendingUp, Activity, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

type AnalyticsDashboardProps = {
  kpis: {
    totalModels: number;
    totalStores: number;
    totalProductsLinked: number;
  };
  mockData: {
    monthlyTryOns: { name: string; value: number }[];
    topSizes: { name: string; value: number }[];
    topGarments: { id: string; name: string; sku: string; tryOns: number; conversion: number }[];
  };
};

export function AnalyticsDashboard({ kpis, mockData }: AnalyticsDashboardProps) {

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Modelos Card */}
        <div className="p-6 bg-muted/50 border border-border/50 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground">Modelos Creados</h3>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shirt className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-semibold tracking-tight">{kpis.totalModels}</p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+12%</span> este mes
            </p>
          </div>
        </div>

        {/* Tiendas Card */}
        <div className="p-6 bg-muted/50 border border-border/50 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-500" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground">Tiendas Conectadas</h3>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-semibold tracking-tight">{kpis.totalStores}</p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+3 nuevas</span> esta semana
            </p>
          </div>
        </div>

        {/* Productos Vinculados Card */}
        <div className="p-6 bg-muted/50 border border-border/50 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-pink-500/20 transition-colors duration-500" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground">Productos Vinculados</h3>
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-pink-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-semibold tracking-tight">{kpis.totalProductsLinked}</p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-muted-foreground" />
              En uso activo por e-commerces
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: Try-Ons over time */}
        <div className="lg:col-span-2 p-6 bg-muted/50 border border-border/50 rounded-2xl flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-medium">Sesiones de Probador Virtual</h3>
            <p className="text-sm text-muted-foreground">Interacciones de usuarios finales a lo largo del tiempo</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData.monthlyTryOns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Top Sizes */}
        <div className="p-6 bg-muted/50 border border-border/50 rounded-2xl flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-medium">Tallas más probadas</h3>
            <p className="text-sm text-muted-foreground">Distribución de fisonomías</p>
          </div>
          <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData.topSizes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mockData.topSizes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend overlay because recharts default legend is hard to style perfectly */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="block text-2xl font-bold">{mockData.topSizes[0].name}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Top Talla</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {mockData.topSizes.map((size, index) => (
              <div key={size.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                <span className="text-xs text-muted-foreground">{size.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Garments Table */}
      <div className="bg-muted/50 border border-border/50 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Modelos con Mayor Tracción</h3>
            <p className="text-sm text-muted-foreground">Prendas 3D con mayor interacción en tiendas conectadas</p>
          </div>
          <Link href="/dashboard/brand/garments" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
            Ver catálogo <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Prenda</th>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium text-right">Sesiones de Probador</th>
                <th className="px-6 py-4 font-medium text-right">Tasa de Conversión Estimada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockData.topGarments.map((garment) => (
                <tr key={garment.id} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center border border-border/50">
                        <Shirt className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="font-medium text-foreground">{garment.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{garment.sku}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {garment.tryOns.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-emerald-400 font-medium">{garment.conversion}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
