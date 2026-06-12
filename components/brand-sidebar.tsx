"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { 
  LayoutDashboard, 
  Shirt, 
  Settings, 
  BarChart3, 
  LogOut,
  User,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand-logo";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  disabled?: boolean;
  subItems?: { label: string; href: string }[];
};

type NavSection = {
  key: string;
  label: string;
  items: NavItem[];
};

export function BrandSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const t = useTranslations("DashboardSidebar");
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => 
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const navSections: NavSection[] = [
    {
      key: "general",
      label: t("sectionGeneral"),
      items: [
        { icon: LayoutDashboard, label: t("overview"), href: "/dashboard/brand" },
      ],
    },
    {
      key: "catalog",
      label: t("sectionCatalog"),
      items: [
        { 
          icon: Shirt, 
          label: t("garments") || "Prendas", 
          href: "/dashboard/brand/garments",
          subItems: [
            { label: t("garmentsList") || "Catálogo", href: "/dashboard/brand/garments" },
            { label: t("garmentsNew") || "Nueva Prenda", href: "/dashboard/brand/garments/new" },
          ],
        },
      ],
    },
    {
      key: "insights",
      label: t("sectionInsights"),
      items: [
        { icon: BarChart3, label: t("analytics"), href: "/dashboard/brand/analytics" },
      ],
    },
    {
      key: "account",
      label: t("sectionAccount"),
      items: [
        { icon: User, label: t("accountInfo"), href: "/dashboard/brand/account" },
      ],
    },
  ];

  return (
    <aside className="w-72 hidden lg:flex flex-col h-fit sticky top-24 pr-6">
      <div className="bg-background/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none" />

        {/* Brand */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div>
              <BrandLogo className="w-[120px]" />
              <p className="text-xs text-muted-foreground font-medium">{t("proWorkspace")}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label={t("navigation")} className="flex-1 overflow-y-auto py-4 px-4">
          {navSections.map((section, sectionIndex) => (
            <div key={section.key}>
              {/* Divider between sections */}
              {sectionIndex > 0 && (
                <div className="my-3 border-t border-white/5" />
              )}

              {/* Section label */}
              <div aria-hidden="true" className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest px-4 mb-2 mt-1">
                {section.label}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isParentActive =
                    item.href === "/dashboard/brand"
                      ? pathname === "/dashboard/brand" ||
                        pathname === "/es/dashboard/brand" ||
                        pathname === "/en/dashboard/brand"
                      : item.href === "/dashboard/brand/account"
                      ? pathname.endsWith("/dashboard/brand/account")
                      : pathname.includes(item.href);

                  const itemClasses = cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium text-sm group",
                    isParentActive
                      ? "bg-white/10 text-foreground shadow-sm border border-white/5"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    item.disabled &&
                      "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                  );

                  const itemContent = (
                    <>
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-transform duration-300",
                          isParentActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
                        )}
                      />
                      {item.label}
                      {item.disabled && (
                        <span className="ml-auto text-[9px] uppercase tracking-wider font-bold bg-white/5 px-2 py-0.5 rounded-md">
                          {t("soon")}
                        </span>
                      )}
                      {item.subItems && (
                        <ChevronDown 
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform duration-300",
                            (isParentActive || expandedMenus.includes(item.label)) && "rotate-180"
                          )} 
                        />
                      )}
                    </>
                  );

                  const isExpanded = isParentActive || expandedMenus.includes(item.label);

                  return (
                    <div key={item.label} className="space-y-1">
                      {item.disabled ? (
                        <div className={itemClasses} aria-disabled="true">{itemContent}</div>
                      ) : item.subItems ? (
                        <button 
                          onClick={() => toggleMenu(item.label)} 
                          className={cn(itemClasses, "w-full cursor-pointer")}
                          aria-expanded={isExpanded}
                        >
                          {itemContent}
                        </button>
                      ) : (
                        <Link href={item.href} aria-current={isParentActive ? "page" : undefined} className={itemClasses}>
                          {itemContent}
                        </Link>
                      )}

                      {/* Sub Items */}
                      {item.subItems && isExpanded && (
                        <div className="pl-11 pr-4 py-1 space-y-1 relative animate-in slide-in-from-top-2 duration-200">
                          <div className="absolute left-6 top-0 bottom-4 w-px bg-white/10" />
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname.endsWith(subItem.href);
                            return (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                aria-current={isSubActive ? "page" : undefined}
                                className={cn(
                                  "block py-2.5 text-xs font-medium rounded-lg transition-colors relative",
                                  isSubActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 pl-2 -ml-2"
                                )}
                              >
                                <div
                                  className={cn(
                                    "absolute -left-5 top-1/2 w-3 h-px bg-white/10",
                                    isSubActive && "bg-primary/50"
                                  )}
                                />
                                <div
                                  className={cn(
                                    "absolute -left-5 top-1/2 -translate-y-1/2 -translate-x-0.5 w-1.5 h-1.5 rounded-full bg-background border border-white/10 transition-colors",
                                    isSubActive &&
                                      "border-primary bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] z-10"
                                  )}
                                />
                                {subItem.label}
                              </Link>
                            );
                          })}
                        </div>
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
            href="/dashboard/brand/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground group mb-1"
          >
            <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            {t("settings")}
          </Link>

          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 group"
          >
            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
            {t("logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}