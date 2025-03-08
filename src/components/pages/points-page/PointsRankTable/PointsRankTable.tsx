"use client";

import {useState} from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import styles from "./PointsRankTable.module.css";
import {usePointsRanks} from "@/src/hooks/usePoints/usePoints";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Define the data type for our table
type PointsRankData = {
  rank: number;
  address: string;
  points: number;
};

export default function PointsRankTable() {
  // State for pagination
  const [pagination, setPagination] = useState({
    pageIndex: 0, // 0-based index
    pageSize: 10,
  });

  // Calculate API parameters from pagination state
  const page = pagination.pageIndex + 1; // Convert to 1-based index for API
  const pageSize = pagination.pageSize;

  // Fetch data with pagination parameters
  const {data: response, isLoading, error} = usePointsRanks(page, pageSize);

  console.log(response);

  // Column definitions
  const columnHelper = createColumnHelper<PointsRankData>();

  const columns = [
    columnHelper.accessor("rank", {
      header: "Rank",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("address", {
      header: "Address",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("points", {
      header: "Points",
      cell: (info) => (
        <div className={styles.pointsCell}>
          <span className={styles.pointsIcon}>♦</span>
          {info.getValue().toFixed(0).toLocaleString()}
        </div>
      ),
    }),
  ];

  // Create the table instance
  const table = useReactTable({
    data: response?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true, // We're handling pagination on the server
    pageCount: response?.totalCount || 10, // You might want to get this from the API response
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  // Create skeleton rows when loading
  const renderSkeletonRows = () => {
    return Array(pageSize)
      .fill(0)
      .map((_, index) => (
        <tr key={`skeleton-${index}`} className={styles.tableRow}>
          <td className={styles.tableCell}>
            <Skeleton width={20} />
          </td>
          <td className={styles.tableCell}>
            <Skeleton width="100%" />
          </td>
          <td className={styles.tableCell}>
            <Skeleton width={80} />
          </td>
        </tr>
      ));
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className={styles.tableHeader}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? renderSkeletonRows()
              : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className={styles.tableRow}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={styles.tableCell}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </SkeletonTheme>

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <button
          className={styles.paginationButton}
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className={styles.paginationButton}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <span className={styles.paginationText}>
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <button
          className={styles.paginationButton}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className={styles.paginationButton}
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
      </div>
    </div>
  );
}
