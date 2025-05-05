import type { FC, JSX } from "react";

import { PaginationButton, PaginationItem } from "../pagination";
import { Breaker } from "./Breaker";

/**
 * @callback onChange
 * @param {number} currentPage new page number
 */

interface PagerProps {
  pageSize: number;
  /** control the current page */
  currentPage: number;
  /** called when current page is changed by the user */
  onChange: Function;
  /** Total number of pages */
  totalPages: number;
  /** size of numbers to be visible at once */
  pageBufferSize: number;
}

export const Pager: FC<PagerProps> = ({ totalPages, currentPage, onChange, pageBufferSize }) => {
  const getNumber = (page: number) => (
    <PaginationItem key={page}>
      <PaginationButton
        size="sm"
        variant={currentPage === page ? "terminalGreenOutline" : "terminalGreen"}
        onClick={() => onChange(page)}
      >
        {page}
      </PaginationButton>
    </PaginationItem>
  );
  if (totalPages <= pageBufferSize) {
    return (
      <>
        {[...Array(totalPages)].map((_, i) => {
          return getNumber(i + 1);
        })}
      </>
    );
  }
  // First and last pages are always present
  const firstPager = getNumber(1);
  const lastPager = getNumber(totalPages);

  // Neighbours are always visible besides the current page
  const neighbourCount = Math.floor(pageBufferSize - 4);
  const neighbours = Math.floor(neighbourCount / 2);
  let left = Math.max(currentPage - neighbours, 2);
  let right = Math.min(currentPage + neighbours, totalPages - 1);

  // Current page is on a extreme, so there aren't enough neighbours to represent
  if (right - left !== 2) {
    if (currentPage < totalPages / 2) {
      right = Math.min(left + pageBufferSize - 4, totalPages - 1);
    } else {
      left = Math.max(right - (pageBufferSize - 4), 2);
    }
  }

  // Page containing the middle pages
  const middlePagers: JSX.Element[] = [];
  for (let i = left; i <= right; i += 1) {
    middlePagers.push(getNumber(i));
  }

  const leftSpillEl = (() => {
    if (left === 2) {
      return null;
    }
    if (left === 3) {
      return getNumber(2);
    }
    return <Breaker start={2} end={left - 1} onPageClick={onChange} key="l" />;
  })();

  const rightSpillEl = (() => {
    if (right === totalPages - 1) {
      return null;
    }
    if (right === totalPages - 2) {
      return getNumber(totalPages - 1);
    }
    return <Breaker start={right + 1} end={totalPages - 1} onPageClick={onChange} key="r" />;
  })();

  return <>{[firstPager, leftSpillEl, ...middlePagers, rightSpillEl, lastPager]}</>;
};
