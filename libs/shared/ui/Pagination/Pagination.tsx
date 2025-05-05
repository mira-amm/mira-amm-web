import type { FC } from "react";

import { PaginationContent, Pagination as PaginationRoot, PaginationNext, PaginationPrevious } from "../pagination";
import { Pager } from "./Pager";

const DEFAULT_PAGE_SIZE = 50;

/**
 * @callback onChange
 * @param {number} currentPage new page number
 */

interface PaginationProps {
  /** control the current page */
  currentPage: number;
  /** called when current page is changed by the user */
  onChange: any;
  /** Total number of pages */
  totalPages: number;
  /** page size */
  pageSize?: number;
  /** number of pages to be visible */
  pageBufferSize?: number;
}

export const Pagination: FC<PaginationProps> = ({
  currentPage = 1,
  onChange,
  pageBufferSize = 5,
  totalPages = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  ...rest
}) => {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const jumpToNext = () => {
    onChange(currentPage + 1);
  };

  const jumpToPrev = () => {
    onChange(currentPage - 1);
  };

  return (
    <PaginationRoot>
      <PaginationContent>
        <li className="flex items-center justify-center">
          <PaginationPrevious variant="terminalGreen" size="sm" disabled={!hasPrev} onClick={jumpToPrev} />
        </li>
        <Pager
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageBufferSize={pageBufferSize}
          onChange={onChange}
        />
        <li className="flex items-center justify-center">
          <PaginationNext variant="terminalGreen" size="sm" disabled={!hasNext} onClick={jumpToNext} />
        </li>
      </PaginationContent>
    </PaginationRoot>
  );
};
