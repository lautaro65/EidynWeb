"use client";

import { useState } from "react";
import { 
  Settings, 
  Globe, 
  ShieldCheck, 
  DatabaseBackup, 
  Bell, 
  Moon, 
  Sun, 
  Monitor,
  Smartphone,
  Laptop,
  LogOut,
  AlertOctagon,
  Key,
  ShieldAlert,
  Trash2,
  FileTerminal,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { updateStoreTimezoneAction } from "./actions";
import toast from "react-hot-toast";

const mockAuditLogs = [
  { event: "Actualización de Webhook URL", date: "Hoy, 10:42 AM", ip: "190.18.32.4", status: "Exitoso" },
  { event: "Revocación de API Key", date: "Ayer, 18:20 PM", ip: "190.18.32.4", status: "Exitoso" },
  { event: "Intento de inicio de sesión fallido", date: "05/06/2026, 03:15 AM", ip: "45.22.11.9", status: "Bloqueado" },
  { event: "Cambio de Plan a Pro", date: "01/06/2026, 12:00 PM", ip: "190.18.32.4", status: "Exitoso" },
];

export function SettingsClient({ initialTimezone = "UTC" }: { initialTimezone?: string }) {
  const [activeTab, setActiveTab] = useState<"preferences" | "security" | "privacy">("preferences");
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const [timezone, setTimezone] = useState(initialTimezone);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.replace(pathname, { locale: e.target.value as "en" | "es" });
  };

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTz = e.target.value;
    setTimezone(newTz);
    const res = await updateStoreTimezoneAction(newTz);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Timezone updated");
    }
  };

  const renderTabButton = (id: "preferences" | "security" | "privacy", label: string, Icon: LucideIcon) => (
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
          <Settings className="w-4 h-4" />
          Ajustes del Sistema
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Configuración</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Administra las preferencias globales, seguridad de la cuenta y políticas de privacidad para asegurar un cumplimiento total (GDPR).
        </p>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-white/10 pb-6">
        {renderTabButton("preferences", "Preferencias Globales", Globe)}
        {renderTabButton("security", "Seguridad y Sesiones", ShieldCheck)}
        {renderTabButton("privacy", "Auditoría y Privacidad", DatabaseBackup)}
      </div>

      {/* SECCIÓN 1: PREFERENCIAS GLOBALES */}
      {activeTab === "preferences" && (
        <section className="space-y-8 animate-in fade-in duration-500">
          
          <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Apariencia de la Interfaz</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setTheme("light")}
                className={cn("p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4", theme === "light" ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-white/5")}
              >
                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg"><Sun className="w-6 h-6" /></div>
                <span className="font-semibold">Modo Claro</span>
              </button>
              <button 
                onClick={() => setTheme("dark")}
                className={cn("p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4", theme === "dark" ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-white/5")}
              >
                <div className="w-12 h-12 rounded-full bg-[#0F0E0C] text-white border border-white/10 flex items-center justify-center shadow-lg"><Moon className="w-6 h-6" /></div>
                <span className="font-semibold">Modo Oscuro</span>
              </button>
              <button 
                onClick={() => setTheme("system")}
                className={cn("p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4", theme === "system" ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-white/5")}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-[#0F0E0C] text-white flex items-center justify-center shadow-lg"><Monitor className="w-6 h-6 text-gray-400 mix-blend-difference" /></div>
                <span className="font-semibold">Sistema</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Regionalización</h2>
                <p className="text-sm text-muted-foreground mb-6">Ajustes de idioma y formato de fechas.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="dashboardLanguage" className="text-sm font-semibold text-foreground block mb-2">Idioma del Dashboard</label>
                  <select 
                    id="dashboardLanguage" 
                    value={currentLocale}
                    onChange={handleLanguageChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  >
                    <option value="es">Español (Argentina)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dashboardTimezone" className="text-sm font-semibold text-foreground block mb-2">Zona Horaria</label>
                  <select 
                    id="dashboardTimezone" 
                    value={timezone}
                    onChange={handleTimezoneChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  >
                    <option value="ART">Buenos Aires (GMT-3)</option>
                    <option value="UTC">UTC Universal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" /> Notificaciones
                </h2>
                <p className="text-sm text-muted-foreground mb-6">Controla las alertas que recibes de Eidyn.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Alertas de Seguridad</h3>
                    <p className="text-xs text-muted-foreground">Inicios de sesión desde nuevos dispositivos.</p>
                  </div>
                  <Switch aria-label="Activar Alertas de Seguridad" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Reportes Semanales</h3>
                    <p className="text-xs text-muted-foreground">Resumen de conversiones y engagement de tu ropa 3D.</p>
                  </div>
                  <Switch aria-label="Activar Reportes Semanales" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Actualizaciones de Producto</h3>
                    <p className="text-xs text-muted-foreground">Nuevas características y releases de Eidyn.</p>
                  </div>
                  <Switch aria-label="Activar Actualizaciones de Producto" />
                </div>
              </div>
            </div>
          </div>

        </section>
      )}

      {/* SECCIÓN 2: SEGURIDAD Y SESIONES */}
      {activeTab === "security" && (
        <section className="space-y-8 animate-in fade-in duration-500">
          
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] -mr-20 -mt-20 transition-all group-hover:bg-emerald-500/20" />
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-emerald-500 mb-2">Autenticación de Dos Factores (2FA)</h2>
              <p className="text-muted-foreground">Agrega una capa adicional de seguridad a tu cuenta requiriendo un código de tu dispositivo móvil para iniciar sesión.</p>
            </div>
            <button className="bg-emerald-500 text-black font-bold py-3 px-6 rounded-xl hover:bg-emerald-400 transition-colors shrink-0">
              Activar 2FA
            </button>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Dispositivos y Sesiones Activas</h2>
              <p className="text-muted-foreground">Estas son las sesiones que actualmente tienen acceso a tu cuenta de Eidyn.</p>
            </div>

            <div className="space-y-4">
              {/* Current Session */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white/5 border border-primary/30 rounded-2xl gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">MacBook Pro (Este dispositivo)</h3>
                    <p className="text-xs text-muted-foreground mt-1">Chrome en Buenos Aires, Argentina • <span className="text-primary font-medium">Activa ahora</span></p>
                  </div>
                </div>
              </div>

              {/* Other Session */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white/5 border border-white/5 hover:border-white/10 transition-colors rounded-2xl gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-muted-foreground">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">iPhone 14 Pro</h3>
                    <p className="text-xs text-muted-foreground mt-1">Safari en Buenos Aires, Argentina • Activa hace 2 días</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-semibold px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button className="flex items-center gap-2 text-sm text-foreground hover:text-white font-semibold hover:underline">
                Cerrar todas las demás sesiones
              </button>
            </div>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Key className="w-5 h-5 text-muted-foreground" /> Claves de Acceso (Passkeys)
              </h3>
              <p className="text-sm text-muted-foreground">Inicia sesión de forma segura y rápida con Face ID, Touch ID o Windows Hello.</p>
            </div>
            <button className="bg-white/10 text-foreground font-semibold py-2 px-6 rounded-xl hover:bg-white/20 border border-white/5 transition-colors">
              Añadir
            </button>
          </div>

        </section>
      )}

      {/* SECCIÓN 3: AUDITORÍA Y PRIVACIDAD (GDPR) */}
      {activeTab === "privacy" && (
        <section className="space-y-8 animate-in fade-in duration-500">
          
          <div className="bg-background/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Logs de Actividad (Auditoría)</h2>
                <p className="text-muted-foreground">Trazabilidad de acciones importantes realizadas en tu cuenta.</p>
              </div>
              <button className="text-primary text-sm font-semibold hover:underline border border-primary/20 bg-primary/10 px-4 py-2 rounded-lg">
                Descargar CSV Completo
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Evento</th>
                    <th className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Fecha</th>
                    <th className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">IP Address</th>
                    <th className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {mockAuditLogs.map((log, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <FileTerminal className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{log.event}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{log.date}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">{log.ip}</td>
                      <td className="p-4">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", log.status === "Exitoso" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/30 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[60px] -mr-20 -mt-20 transition-all group-hover:bg-red-500/20" />
            
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="w-8 h-8 text-red-500" />
              <h2 className="text-2xl font-bold text-red-500">Zona de Peligro (Cumplimiento GDPR)</h2>
            </div>
            
            <p className="text-red-300/80 mb-8 max-w-3xl">
              De acuerdo a las regulaciones de protección de datos, tienes el derecho a eliminar permanentemente los datos biométricos asociados a los compradores de tu tienda, o eliminar tu organización completa.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-bold text-red-400">Purgar Datos Biométricos</h3>
                  <p className="text-sm text-red-300/70 mt-1 max-w-xl">
                    Revoca el consentimiento y elimina permanentemente los avatares 3D y medidas de todos tus clientes almacenados en la base de datos de Eidyn.
                  </p>
                </div>
                <button className="w-full md:w-auto bg-red-500/20 text-red-400 font-bold py-3 px-6 rounded-xl hover:bg-red-500 hover:text-white border border-red-500/30 transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Ejecutar Purga
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-bold text-red-400">Eliminar Organización</h3>
                  <p className="text-sm text-red-300/70 mt-1 max-w-xl">
                    Elimina todos tus modelos de ropa, suscripciones y configuraciones. Esta acción es inmediata e irreversible.
                  </p>
                </div>
                <button className="w-full md:w-auto bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                  <AlertOctagon className="w-4 h-4" /> Eliminar Cuenta
                </button>
              </div>
            </div>
          </div>

        </section>
      )}

    </div>
  );
}
