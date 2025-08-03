"use client";

import {cn} from "@/shadcn-ui/utils";
import * as React from "react";
import {Divider} from "../divider";

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  loadingCount?: number;
}

interface DataTableColumn<T> {
  key: string;
  header: string | React.ReactNode;
  render: (item: T) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

function DataTable<T>({
  data,
  columns,
  className,
  emptyMessage = "No data available",
  loading = false,
  loadingCount = 3,
}: DataTableProps<T>) {
  if (loading) {
    return <DataTableLoader columns={columns} count={loadingCount} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-ten px-4 py-7 bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
        <p className="text-content-tertiary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark rounded-ten p-4 overflow-hidden",
        className
      )}
    >
      {/* Headers */}
      <div
        className="hidden md:grid gap-4 px-2 text-content-tertiary text-md font-normal align-center"
        style={{
          gridTemplateColumns: `2fr repeat(${columns.length - 1}, 1fr)`,
        }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              "text-content-tertiary flex items-center justify-center min-h-[40px]",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right justify-end",
              column.align === "left" && "text-left justify-start",
              column.className
            )}
          >
            {column.header}
          </div>
        ))}
      </div>

      <Divider size="sm" className="hidden md:block" />

      {/* Desktop Rows */}
      {data.map((item, index) => (
        <div
          key={index}
          className="hidden md:grid gap-4 items-center py-1 hover:bg-background-grey-darker transition rounded-lg px-2"
          style={{
            gridTemplateColumns: `2fr repeat(${columns.length - 1}, 1fr)`,
          }}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                column.align === "center" && "text-center mx-auto",
                column.align === "right" && "text-right",
                column.align === "left" && "text-left",
                column.className
              )}
            >
              {column.render(item)}
            </div>
          ))}
        </div>
      ))}

      {/* Mobile Rows */}
      {data.map((item, index) => (
        <div
          key={`mobile-${index}`}
          className="md:hidden flex flex-col gap-2 p-4 bg-background-grey-light rounded-lg"
        >
          {columns.map((column, columnIndex) => (
            <div
              key={column.key}
              className={cn(
                "flex justify-between items-center",
                columnIndex === columns.length - 1 && "flex-col gap-2"
              )}
            >
              <span className="text-content-tertiary font-medium">
                {typeof column.header === "string" ? column.header : column.key}
              </span>
              <div
                className={cn(
                  "text-right",
                  columnIndex === columns.length - 1 && "w-full"
                )}
              >
                {column.render(item)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function DataTableLoader<T>({
  columns,
  count = 3,
}: {
  columns: DataTableColumn<T>[];
  count?: number;
}) {
  return (
    <div className="flex flex-col gap-4 border-border-secondary border-[12px] dark:border-0 bg-background-grey-dark dark:bg-gray-800 rounded-ten p-4 w-full">
      {/* Header loader */}
      <div className="hidden md:grid grid-cols-4 gap-4 px-2 pb-4 border-b border-gray-700 text-gray-400 text-sm font-normal">
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              column.align === "center" && "text-center",
              column.align === "right" && "text-right",
              column.align === "left" && "text-left"
            )}
          >
            <div className="bg-gray-300 dark:bg-gray-600 animate-pulse h-3 w-[75%] line-3" />
          </div>
        ))}
      </div>

      {/* Row loaders */}
      {Array.from({length: count}, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 items-center py-4 dark:hover:bg-gray-700 transition rounded-lg px-2"
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                column.align === "center" && "text-center",
                column.align === "right" && "text-right",
                column.align === "left" && "text-left"
              )}
            >
              <div className="bg-gray-300 dark:bg-gray-600 animate-pulse w-[75%] h-4 mx-auto" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export {DataTable};
export type {DataTableProps, DataTableColumn};
