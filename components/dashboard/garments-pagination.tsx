"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  tabKey: "minePage" | "globalPage";
};

export function GarmentsPagination({ currentPage, totalPages, tabKey }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set(tabKey, pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    router.push(createPageURL(page));
  };

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl font-semibold transition-all duration-300 ${
            currentPage === i
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
              : "bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12 mb-8 relative z-20">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2.5 rounded-xl bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-background/50 transition-all border border-border/50"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 px-4 py-2 bg-background/30 backdrop-blur-md rounded-2xl border border-border/30 shadow-inner">
        {renderPageNumbers()}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2.5 rounded-xl bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-background/50 transition-all border border-border/50"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
