"use client";

import { usePathname } from "next/navigation";
import { BrandSidebar } from "./brand-sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";

export function SidebarSwitcher({ tenantType }: { tenantType: string }) {
  const pathname = usePathname();

  if (tenantType === "brand") {
    // Si la marca navega a su panel de ventas, mostramos el sidebar de tienda
    if (pathname.includes("/dashboard/shop")) {
      return <DashboardSidebar tenantType={tenantType} />;
    }
    // Por defecto las marcas ven su estudio 3D
    return <BrandSidebar />;
  }

  // Si la cuenta es puramente una tienda, siempre ven el sidebar de tienda
  return <DashboardSidebar tenantType={tenantType} />;
}
