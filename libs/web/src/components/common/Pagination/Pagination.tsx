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
    "px-[12px] py-[8px]  text-sm font-medium rounded cursor-pointer transition-colors duration-200 bg-none border border-black bg-background-grey-dark text-black hover:bg-black dark:hover:bg-background-grey-dark hover:text-white dark:text-white";
  const disabledClasses = "opacity-50 cursor-not-allowed text-content-tertiary";
  const navButtonResponsive =
    "h-[32px] p-0 justify-center items-center sm:w-auto sm:h-auto sm:px-[12px] sm:py-[8px]";

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
        <span className={clsx(buttonBaseClasses)}>Previous</span>
      </button>

      {generatePages().map((page, index) => (
        <button
          key={index}
          className={cn(
            buttonBaseClasses,
            typeof page === "number" &&
              page === currentPage &&
              "dark:bg-accent-dimmed dark:text-accent-primary font-bold bg-black text-white",
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
        <span className={clsx(buttonBaseClasses)}>Next</span>
      </button>
    </div>
  );
}
