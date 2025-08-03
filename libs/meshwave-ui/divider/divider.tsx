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
    sm: "border-t-[1px]",
    md: "border-t-[2px]",
    lg: "border-t-[3px]",
  };

  const variantClasses = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };

  const orientationClasses = {
    horizontal:
      "w-full border-t border-background-grey-light dark:border-background-grey-darker",
    vertical:
      "h-full border-l border-background-grey-light dark:border-background-grey-darker",
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
