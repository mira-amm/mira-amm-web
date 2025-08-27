import {cn} from "@/src/utils/cn";

export type PoolType = "v1-volatile" | "v1-stable" | "v2-concentrated";

interface PoolTypeIndicatorProps {
  poolType: PoolType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const poolTypeConfig = {
  "v1-volatile": {
    label: "Volatile",
    shortLabel: "V1",
    fee: "0.30%",
    color: "blue",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    textColor: "text-blue-800 dark:text-blue-200",
    borderColor: "border-blue-200 dark:border-blue-700",
    description: "Traditional AMM pool for volatile asset pairs",
  },
  "v1-stable": {
    label: "Stable",
    shortLabel: "V1S",
    fee: "0.05%",
    color: "green",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    textColor: "text-green-800 dark:text-green-200",
    borderColor: "border-green-200 dark:border-green-700",
    description: "Optimized for stable asset pairs with lower fees",
  },
  "v2-concentrated": {
    label: "Concentrated",
    shortLabel: "V2",
    fee: "Variable",
    color: "purple",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
    textColor: "text-purple-800 dark:text-purple-200",
    borderColor: "border-purple-200 dark:border-purple-700",
    description: "Concentrated liquidity with customizable price ranges",
  },
};

const sizeConfig = {
  sm: {
    padding: "px-2 py-1",
    text: "text-xs",
    font: "font-medium",
  },
  md: {
    padding: "px-3 py-1.5",
    text: "text-sm",
    font: "font-medium",
  },
  lg: {
    padding: "px-4 py-2",
    text: "text-base",
    font: "font-semibold",
  },
};

export default function PoolTypeIndicator({
  poolType,
  size = "md",
  className,
}: PoolTypeIndicatorProps) {
  const config = poolTypeConfig[poolType];
  const sizeStyles = sizeConfig[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border",
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeStyles.padding,
        sizeStyles.text,
        sizeStyles.font,
        className
      )}
      title={`${config.description} (${config.fee} fee)`}
    >
      {config.label}
      {size !== "sm" && <span className="ml-1 opacity-75">({config.fee})</span>}
    </span>
  );
}

// Compact version for tables and lists
export function PoolTypeIndicatorCompact({
  poolType,
  className,
}: {
  poolType: PoolType;
  className?: string;
}) {
  const config = poolTypeConfig[poolType];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold",
        config.bgColor,
        config.textColor,
        config.borderColor,
        "border",
        className
      )}
      title={`${config.description} (${config.fee} fee)`}
    >
      {config.shortLabel}
    </span>
  );
}

// Badge version with icon
export function PoolTypeIndicatorBadge({
  poolType,
  showFee = true,
  className,
}: {
  poolType: PoolType;
  showFee?: boolean;
  className?: string;
}) {
  const config = poolTypeConfig[poolType];

  return (
    <div
      className={cn(
        "inline-flex items-center space-x-2 px-3 py-2 rounded-lg border",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div
        className={cn("w-2 h-2 rounded-full", getIndicatorColor(poolType))}
      />
      <div className="flex flex-col">
        <span className={cn("text-sm font-medium", config.textColor)}>
          {config.label}
        </span>
        {showFee && (
          <span className={cn("text-xs opacity-75", config.textColor)}>
            {config.fee} fee
          </span>
        )}
      </div>
    </div>
  );
}

function getIndicatorColor(poolType: PoolType): string {
  switch (poolType) {
    case "v1-volatile":
      return "bg-blue-500";
    case "v1-stable":
      return "bg-green-500";
    case "v2-concentrated":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
}

// Export the config for use in other components
export {poolTypeConfig};
