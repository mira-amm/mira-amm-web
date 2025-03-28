import clsx from "clsx";
import {ArrowLeftIcon} from "../../icons/ArrowLeft/ArrowLeftIcon";
import {ArrowRightIcon} from "../../icons/ArrowRight/ArrowRightIcon";
import styles from "./Pagination.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
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

  return (
    <div className={styles.pagination}>
      <button
        className={clsx(styles.paginationButton, styles.previous, "mc-type-m")}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ArrowLeftIcon />
        <span>Previous</span>
      </button>
      {generatePages().map((page, index) => (
        <button
          key={index}
          className={clsx(
            styles.paginationButton,
            "mc-type-m",
            page === currentPage && styles.active,
          )}
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={page === "..."}
        >
          {page}
        </button>
      ))}
      <button
        className={clsx(styles.paginationButton, styles.next, "mc-type-m")}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ArrowRightIcon />
        <span>Next</span>
      </button>
    </div>
  );
};

export default Pagination;
