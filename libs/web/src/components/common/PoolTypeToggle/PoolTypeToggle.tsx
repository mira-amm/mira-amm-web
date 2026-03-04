import {memo} from "react";
import {cn} from "@/src/utils/cn";

export type PoolTypeOption = "v1" | "v2";

interface PoolTypeToggleProps {
  selectedType: PoolTypeOption;
  onTypeChange: (type: PoolTypeOption) => void;
  disabled?: boolean;
  className?: string;
}

export const PoolTypeToggle = memo<PoolTypeToggleProps>(
  function PoolTypeToggle({
    selectedType,
    onTypeChange,
    disabled = false,
    className,
  }) {
    return (
      <div
        className={cn(
          "flex rounded-md overflow-hidden",
          className
        )}
      >
        <button
          className={cn(
            "px-3 py-2 text-sm cursor-pointer transition-colors duration-200 flex-1",
            selectedType === "v1"
              ? "bg-accent-primary-1 text-white dark:bg-accent-primary-1 dark:text-black"
              : "text-content-secondary hover:bg-background-secondary bg-background-secondary dark:text-content-tertiary dark:hover:bg-background-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && onTypeChange("v1")}
          disabled={disabled}
          type="button"
        >
          Regular Pools
        </button>
        <button
          className={cn(
            "px-3 py-2 text-sm cursor-pointer transition-colors duration-200 flex-1",
            selectedType === "v2"
              ? "bg-accent-primary-1 text-white dark:bg-accent-primary-1 dark:text-black"
              : "text-content-secondary hover:bg-background-secondary bg-background-secondary dark:text-content-tertiary dark:hover:bg-background-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && onTypeChange("v2")}
          disabled={disabled}
          type="button"
        >
          Concentrated Liquidity
        </button>
      </div>
    );
  }
);

PoolTypeToggle.displayName = "PoolTypeToggle";
