import React from "react";
import {cn} from "../../../utils/cn";
import fiatValueFormatter from "../../../utils/abbreviateNumber";
import type {StatCardProps} from "../../../types/protocol-stats";

/**
 * Individual stat card component for displaying protocol metrics
 * Supports currency formatting, custom styling, and loading states
 */
export function StatCard({
  title,
  value,
  formatAsCurrency = true,
  className,
  isLoading = false,
}: StatCardProps) {
  const formattedValue = React.useMemo(() => {
    // Return empty string during loading or when value is undefined
    if (isLoading || value === undefined) {
      return "";
    }

    if (formatAsCurrency) {
      return fiatValueFormatter(value);
    }

    // For non-currency values, use compact notation for large numbers
    if (value >= 1e6) {
      return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);
    }

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(value);
  }, [value, formatAsCurrency, isLoading]);

  return (
    <div className={cn("flex flex-col gap-4 md:w-[206px]", className)}>
      <h3 className="text-gray-500 font-regular text-[17.72px] leading-none">
        {title}
      </h3>
      <div className="text-black text-[25.23px] leading-none font-alt">
        {isLoading ? (
          <div className="animate-pulse bg-gray-200 h-[25.23px] w-20 rounded"></div>
        ) : (
          formattedValue
        )}
      </div>
    </div>
  );
}
