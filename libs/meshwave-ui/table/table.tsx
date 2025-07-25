"use client";

import {cn} from "@/shadcn-ui/utils";
import * as React from "react";
import {useIsRebrandEnabled} from "@/src/hooks/useIsRebrandEnabled";

function Table({
  className,
  tableParentClassName,
  ...props
}: React.ComponentProps<"table"> & {
  tableParentClassName?: string;
}) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-x-auto rounded-2xl bg-background-grey-dark dark:bg-transparent border-border-secondary border-[12px] dark:border-0 p-5",
        tableParentClassName
      )}
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm rounded-2xl bg-background-grey-dark dark:bg-background-grey-dark",
          className
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({className, ...props}: React.ComponentProps<"thead">) {
  const isRebrandEnabled = useIsRebrandEnabled();

  return (
    <thead
      data-slot="table-header"
      className={cn(!isRebrandEnabled && "[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({className, ...props}: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({className, ...props}: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

function TableRow({className, ...props}: React.ComponentProps<"tr">) {
  const isRebrandEnabled = useIsRebrandEnabled();

  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted transition-colors",
        !isRebrandEnabled && "border-b",
        className
      )}
      {...props}
    />
  );
}

function TableHead({className, ...props}: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCell({className, ...props}: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({className, ...props}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
