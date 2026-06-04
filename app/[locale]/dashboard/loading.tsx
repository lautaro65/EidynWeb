import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			<div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-5 py-4">
				<Loader2 className="h-5 w-5 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Cargando dashboard...</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={index}
						className="h-44 rounded-3xl border border-border/50 bg-background/60 p-4"
					>
						<div className="h-full w-full animate-pulse rounded-2xl bg-muted/60" />
					</div>
				))}
			</div>
		</div>
	);
}
