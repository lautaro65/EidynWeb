"use client";

import { useEffect } from "react";

export default function WidgetClosePage() {
  useEffect(() => {
    // Comunicarse con la ventana padre (el Iframe que abrió este popup)
    if (window.opener) {
      window.opener.postMessage("eidyn-login-success", "*");
      window.close();
    } else {
      // Si por alguna razón no hay opener, igual intentamos redirigir al dashboard o cerrar
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-medium">Completando inicio de sesión...</p>
    </div>
  );
}
