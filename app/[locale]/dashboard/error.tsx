"use client";

import { useLocale } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const locale = useLocale();
	const isEs = locale === "es";

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex flex-col items-center justify-center py-20 border border-destructive/30 border-dashed rounded-[2rem] bg-background/40 backdrop-blur-md text-center shadow-sm px-6">
				<div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 ring-1 ring-destructive/30">
					<AlertTriangle className="h-10 w-10 text-destructive/70" />
				</div>

				<h2 className="text-2xl font-bold text-foreground">
					{isEs ? "Algo salio mal en el dashboard" : "Something went wrong in the dashboard"}
				</h2>
				<p className="text-muted-foreground max-w-md mx-auto mt-2 font-light">
					{isEs
						? "Intenta nuevamente. Si persiste, recarga la pagina o revisa la conexion del servidor."
						: "Try again. If it persists, reload the page or check your server connection."}
				</p>

				<div className="mt-7">
					<Button onClick={reset} className="rounded-xl">
						<RefreshCw className="mr-2 h-4 w-4" />
						{isEs ? "Reintentar" : "Try again"}
					</Button>
				</div>

				{error?.digest ? (
					<p className="mt-5 text-xs text-muted-foreground/70">Digest: {error.digest}</p>
				) : null}
			</div>
		</div>
	);
}
