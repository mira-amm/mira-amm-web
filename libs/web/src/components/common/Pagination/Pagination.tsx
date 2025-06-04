import {ArrowLeft, ArrowRight} from "lucide-react";
import {clsx} from "clsx";
import {cn} from "@/src/utils/cn";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const generatePages = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      if (startPage > 2) {
        pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const buttonBaseClasses =
    "px-[12px] py-[8px] text-white text-sm font-medium rounded cursor-pointer transition-colors duration-200 bg-[#2a2a3c] hover:bg-[#3b3b4e]";
  const activeClasses = "bg-accent-dimmed text-accent-primary font-bold";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  const navButtonResponsive =
    "w-[32px] h-[32px] p-0 justify-center items-center sm:w-auto sm:h-auto sm:px-[12px] sm:py-[8px]";

  return (
    <div className="flex flex-wrap items-center justify-center gap-[8px] sm:gap-[4px] p-[8px]">
      <button
        className={clsx(
          buttonBaseClasses,
          navButtonResponsive,
          "flex gap-2 items-center",
          currentPage === 1 && disabledClasses,
        )}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ArrowLeft className="sm:hidden" />
        <span className={clsx(buttonBaseClasses)}>Previous</span>
      </button>

      {generatePages().map((page, index) => (
        <button
          key={index}
          className={cn(
            buttonBaseClasses,
            typeof page === "number" && page === currentPage && activeClasses,
            typeof page !== "number" && disabledClasses,
          )}
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={page === "..."}
        >
          {page}
        </button>
      ))}

      <button
        className={clsx(
          buttonBaseClasses,
          navButtonResponsive,
          "flex gap-2 items-center",
          currentPage === totalPages && disabledClasses,
        )}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ArrowRight className="sm:hidden" />
        <span className={clsx(buttonBaseClasses)}>Next</span>
      </button>
    </div>
  );
}
