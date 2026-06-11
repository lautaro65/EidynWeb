"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { deleteAccount } from "@/app/[locale]/dashboard/account-actions";
import { Loader2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export function DangerZone() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { signOut } = useClerk();
  const t = useTranslations("Account");

  const requiredConfirmationText = t("deleteConfirmWord") || "ELIMINAR";

  const handleDelete = async () => {
    if (confirmText !== requiredConfirmationText) return;
    
    setIsDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-destructive/5 backdrop-blur-2xl border border-destructive/20 rounded-[2rem] p-8 relative overflow-hidden mt-8">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-destructive/10 rounded-full blur-[100px] pointer-events-none -mt-40 -ml-40" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-4 text-destructive">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-semibold">
            {t("dangerZoneTitle") || "Zona de Peligro"}
          </h2>
        </div>

        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          {t("dangerZoneDesc") || "Una vez que elimines tu cuenta, no hay vuelta atrás. Esto borrará permanentemente todos tus datos personales, configuraciones y la vinculación con tu tienda o marca."}
        </p>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-medium text-destructive mb-2 block uppercase tracking-wider">
              {t("typeToDelete", { word: requiredConfirmationText }) || `Escribe "${requiredConfirmationText}" para confirmar`}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={requiredConfirmationText}
              className="w-full h-12 px-4 rounded-xl border border-destructive/30 bg-destructive/5 text-foreground placeholder:text-destructive/30 outline-none focus:border-destructive transition-colors"
            />
          </div>

          <button
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== requiredConfirmationText}
            className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground py-3 rounded-xl font-medium transition-all hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("deleteAccountBtn") || "Eliminar mi cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
