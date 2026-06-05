import { GarmentWizard } from "@/components/dashboard/garment-wizard";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

export default async function NewGarmentPage() {

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/garments"
          className="p-2.5 rounded-xl bg-background/50 hover:bg-background border border-border/50 text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Crear Prenda 3D</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sigue los pasos para procesar tu prenda</p>
        </div>
      </div>

      <div className="py-6">
        <GarmentWizard />
      </div>
    </div>
  );
}
