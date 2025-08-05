"use client";

import {cn} from "@/shadcn-ui/utils";
import * as React from "react";

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "dashed" | "dotted";
  size?: "sm" | "md" | "lg";
}

function Divider({
  className,
  orientation = "horizontal",
  variant = "solid",
  size = "md",
  ...props
}: DividerProps) {
  const sizeClasses = {
    sm: "border-[1px]",
    md: "border-[2px]",
    lg: "border-[3px]",
  };

  const variantClasses = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };

  const orientationClasses = {
    horizontal:
      "w-full border-t-0 border-l-0 border-r-0 border-background-grey-light dark:border-background-grey-darker",
    vertical:
      "h-full border-t-0 border-b-0 border-r-0 border-background-grey-light dark:border-background-grey-darker",
  };

  return (
    <div
      data-slot="divider"
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        orientationClasses[orientation],
        className
      )}
      {...props}
    />
  );
}

export {Divider};
export type {DividerProps};
