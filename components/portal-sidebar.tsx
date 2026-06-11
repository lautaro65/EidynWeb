"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { 
  User, 
  Ruler, 
  Store, 
  Settings, 
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";
import { BrandLogo } from "@/components/brand-logo";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  disabled?: boolean;
};

type NavSection = {
  key: string;
  label: string;
  items: NavItem[];
};

export function PortalSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const navSections: NavSection[] = [
    {
      key: "identity",
      label: "Mi Identidad 3D",
      items: [
        { icon: User, label: "Mi Avatar", href: "/portal" },
        { icon: Ruler, label: "Mis Medidas", href: "/portal/measurements" },
      ],
    },
    {
      key: "connections",
      label: "Privacidad",
      items: [
        { icon: Store, label: "Tiendas Conectadas", href: "/portal/shops" },
      ],
    },
  ];

  return (
    <aside className="w-72 hidden lg:flex flex-col h-fit sticky top-24 pr-6">
      <div className="bg-background/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none" />

        {/* Brand */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div>
              <BrandLogo className="w-[120px]" />
              <p className="text-xs text-muted-foreground font-medium">Portal de Usuario</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Navegación del Portal" className="flex-1 overflow-y-auto py-4 px-4">
          {navSections.map((section, sectionIndex) => (
            <div key={section.key}>
              {sectionIndex > 0 && (
                <div className="my-3 border-t border-white/5" />
              )}

              <div aria-hidden="true" className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest px-4 mb-2 mt-1">
                {section.label}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isParentActive =
                    item.href === "/portal"
                      ? pathname === "/portal" ||
                        pathname === "/es/portal" ||
                        pathname === "/en/portal"
                      : pathname.includes(item.href);

                  const itemClasses = cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium text-sm group",
                    isParentActive
                      ? "bg-white/10 text-foreground shadow-sm border border-white/5"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    item.disabled &&
                      "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                  );

                  return (
                    <div key={item.label} className="space-y-1">
                      {item.disabled ? (
                        <div className={itemClasses} aria-disabled="true">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                          {item.label}
                        </div>
                      ) : (
                        <Link href={item.href} aria-current={isParentActive ? "page" : undefined} className={itemClasses}>
                          <item.icon
                            className={cn(
                              "h-5 w-5 transition-transform duration-300",
                              isParentActive
                                ? "text-blue-400"
                                : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
                            )}
                          />
                          {item.label}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 bg-muted/40 dark:border-white/5 dark:bg-black/10">
          <Link
            href="/portal/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground group mb-1"
          >
            <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Configuración
          </Link>

          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 group"
          >
            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
