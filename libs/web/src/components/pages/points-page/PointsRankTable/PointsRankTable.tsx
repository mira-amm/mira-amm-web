"use client";

import {useState} from "react";
import {useIsRebrandEnabled} from "@/src/hooks/useIsRebrandEnabled";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {usePointsRanks} from "@/src/hooks";
import {PointsIconSimple} from "@/meshwave-ui/icons";
import {DefaultLocale} from "@/src/utils/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/meshwave-ui/table";
import {LoaderCircle} from "lucide-react";

const truncateAddress = (address: string) => {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function PointsRankTable() {
  const isRebrandEnabled = useIsRebrandEnabled();
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
            <span className="hidden lg:block">{address}</span>
            <span className="block lg:hidden">{truncateAddress(address)}</span>
          </>
        );
      },
    }),
    columnHelper.accessor("points", {
      header: "Points",
      cell: (info) => (
        <div className="flex items-center">
          <span className="text-[var(--accent-primary)] flex items-center">
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
    manualPagination: true,
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
      <div className="flex flex-col items-center gap-4 p-7 rounded-2xl bg-background-grey-dark">
        <LoaderCircle className="animate-spin size-7" />
        <p>Loading points leaderboard...</p>
      </div>
    );
  }

  return (
    <Table tableParentClassName="p-4 dark:p-0">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={`p-4 text-left font-normal text-base text-content-tertiary ${!isRebrandEnabled ? "border-b border-background-grey-light dark:border-background-grey-darker" : ""}`}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className="transition-colors">
            {row.getVisibleCells().map((cell, idx) => (
              <TableCell
                key={cell.id}
                className={`p-4 text-base ${!isRebrandEnabled ? "border-b border-background-grey-light dark:border-background-grey-darker" : ""} ${
                  idx === 1
                    ? "overflow-hidden text-ellipsis whitespace-nowrap"
                    : ""
                } ${idx === 2 ? "text-nowrap" : ""}`}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
