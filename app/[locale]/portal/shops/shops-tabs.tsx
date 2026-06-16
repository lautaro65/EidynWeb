"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransition } from "react";

export function ShopsTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentTab = searchParams.get("tab") || "connected";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    params.set("page", "1"); // reset page on tab change

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full sm:w-[400px]">
      <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
        <TabsTrigger value="connected" disabled={isPending} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          Conectadas
        </TabsTrigger>
        <TabsTrigger value="discover" disabled={isPending} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          Descubrir
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
