"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Props = {
  defaultTab: string;
  mineContent: React.ReactNode;
  globalContent: React.ReactNode;
  mineTabLabel: string;
  globalTabLabel: string;
  toolbar: React.ReactNode;
};

export function GarmentsTabsWrapper({ defaultTab, mineContent, globalContent, mineTabLabel, globalTabLabel, toolbar }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    // When switching tabs, we could reset pagination or keep it independent
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs defaultValue={defaultTab} value={defaultTab} onValueChange={handleTabChange} className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 relative z-30">
        <TabsList className="bg-muted/50 p-1 rounded-xl shadow-inner border border-border/50">
          <TabsTrigger value="mine" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">
            {mineTabLabel}
          </TabsTrigger>
          <TabsTrigger value="global" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">
            {globalTabLabel}
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 sm:ml-auto flex justify-end">
           {toolbar}
        </div>
      </div>

      <TabsContent value="mine" className="mt-0 focus-visible:outline-none focus-visible:ring-0 relative z-10">
        {mineContent}
      </TabsContent>

      <TabsContent value="global" className="mt-0 focus-visible:outline-none focus-visible:ring-0 relative z-10">
        {globalContent}
      </TabsContent>
    </Tabs>
  );
}
