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
import {usePointsRanks} from "@/src/hooks";
import LoaderV2 from "@/src/components/common/LoaderV2/LoaderV2";
import { PointsIconSimple } from "@/meshwave-ui/icons";
import {DefaultLocale} from "@/src/utils/constants";

const truncateAddress = (address: string) => {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function PointsRankTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;

  const {data: response, isLoading, error} = usePointsRanks(page, pageSize);

  const columnHelper = createColumnHelper<{
  rank: number;
  address: string;
  points: number;
  }>();

  const columns = [
    columnHelper.accessor("rank", {
      header: "Rank",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("address", {
      header: "Address",
      cell: (info) => {
        const address = info.getValue();
        return (
          <>
            <span className={styles.desktopAddress}>{address}</span>
            <span className={styles.mobileAddress}>
              {truncateAddress(address)}
            </span>
          </>
        );
      },
    }),
    columnHelper.accessor("points", {
      header: "Points",
      cell: (info) => (
        <div className={styles.pointsCell}>
          <span className={styles.pointsIcon}>
            <PointsIconSimple />
          </span>
          {info.getValue().toLocaleString(DefaultLocale, {
            maximumFractionDigits: 0,
          })}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: response?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true, // We're handling pagination on the server
    pageCount: response?.totalCount
      ? Math.ceil(response.totalCount / pageSize)
      : 10,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading) {
    return (
      <div className={styles.loadingFallback}>
        <LoaderV2 />
        <p>Loading points leaderboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={styles.tableRow}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={styles.tableCell}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
