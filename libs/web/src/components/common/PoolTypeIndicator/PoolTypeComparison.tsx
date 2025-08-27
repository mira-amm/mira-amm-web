import {PoolTypeDisplay} from "./PoolTypeDisplay";
import {cn} from "@/src/utils/cn";

interface PoolTypeComparisonProps {
  selectedType?: "v1-volatile" | "v1-stable" | "v2-concentrated";
  onTypeSelect?: (
    type: "v1-volatile" | "v1-stable" | "v2-concentrated"
  ) => void;
  showMetrics?: boolean;
  className?: string;
}

export const PoolTypeComparison: React.FC<PoolTypeComparisonProps> = ({
  selectedType,
  onTypeSelect,
  showMetrics = false,
  className,
}) => {
  const poolTypes: Array<"v1-volatile" | "v1-stable" | "v2-concentrated"> = [
    "v1-volatile",
    "v1-stable",
    "v2-concentrated",
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Pool Type Comparison
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the pool type that best fits your trading strategy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {poolTypes.map((poolType) => (
          <div
            key={poolType}
            className={cn(
              "cursor-pointer transition-all duration-200 transform hover:scale-105",
              selectedType === poolType &&
                "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800",
              onTypeSelect && "hover:shadow-lg"
            )}
            onClick={() => onTypeSelect?.(poolType)}
          >
            <PoolTypeDisplay
              poolType={poolType}
              variant="comparison"
              showMetrics={showMetrics}
            />
          </div>
        ))}
      </div>

      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center text-blue-800 dark:text-blue-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
            <span className="text-sm font-medium">
              Selected:{" "}
              {selectedType === "v1-volatile"
                ? "Volatile Pool"
                : selectedType === "v1-stable"
                  ? "Stable Pool"
                  : "Concentrated Liquidity Pool"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
