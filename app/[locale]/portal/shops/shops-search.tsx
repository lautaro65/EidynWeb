"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ShopsSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") || "";
  const [value, setValue] = useState(currentQuery);
  const [prevQuery, setPrevQuery] = useState(currentQuery);

  // Sync state when URL query changes (e.g., via browser Back button)
  if (currentQuery !== prevQuery) {
    setPrevQuery(currentQuery);
    setValue(currentQuery);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== currentQuery) {
        const params = new URLSearchParams(searchParams);
        if (value) {
          params.set("q", value);
        } else {
          params.delete("q");
        }
        params.set("page", "1"); // reset page on search

        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [value, currentQuery, pathname, router, searchParams]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar tiendas..."
        className="pl-9 bg-muted/50 border-border/50"
        disabled={isPending}
      />
    </div>
  );
}
