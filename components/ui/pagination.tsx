"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface PaginationProps {
  totalPages: number;
}

export function Pagination({ totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("BrandGarments");

  const currentPage = Number(searchParams.get("page")) || 1;

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      router.push(createPageURL(page));
    }
  };

  // Generate page numbers
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, current, and adjacent pages
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (
      (i === currentPage - 2 && i > 1) ||
      (i === currentPage + 2 && i < totalPages)
    ) {
      pages.push("...");
    }
  }

  // Remove duplicate "..."
  const uniquePages = pages.filter((val, index, arr) => 
    val !== "..." || arr[index - 1] !== "..."
  );

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        aria-label={t("previous")}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {uniquePages.map((page, i) => (
        <button
          key={i}
          onClick={() => typeof page === "number" && handlePageChange(page)}
          disabled={page === "..."}
          className={`
            w-10 h-10 rounded-xl font-medium transition-all
            ${page === currentPage 
              ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
              : "hover:bg-white/5 border border-transparent"}
            ${page === "..." ? "cursor-default hover:bg-transparent" : ""}
          `}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        aria-label={t("next")}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
