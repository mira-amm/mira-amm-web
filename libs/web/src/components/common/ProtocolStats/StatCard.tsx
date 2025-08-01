import React from "react";
import {cn} from "../../../utils/cn";
import fiatValueFormatter from "../../../utils/abbreviateNumber";
import type {StatCardProps} from "../../../types/protocol-stats";

/**
 * Individual stat card component for displaying protocol metrics
 * Supports currency formatting and custom styling
 */
export function StatCard({
  title,
  value,
  formatAsCurrency = true,
  className,
}: StatCardProps) {
  const formattedValue = React.useMemo(() => {
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
  }, [value, formatAsCurrency]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 rounded-lg bg-surface-secondary border border-border-primary",
        "hover:bg-surface-tertiary transition-colors duration-200",
        className
      )}
    >
      <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wide">
        {title}
      </h3>
      <div className="text-2xl font-bold text-content-primary font-alt">
        {formattedValue}
      </div>
    </div>
  );
}
