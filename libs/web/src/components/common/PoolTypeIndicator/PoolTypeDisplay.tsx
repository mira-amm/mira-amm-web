import {cn} from "@/src/utils/cn";
import {
  TrendingUp,
  Shield,
  Target,
  Zap,
  BarChart3,
  Info,
  DollarSign,
} from "lucide-react";

interface PoolTypeDisplayProps {
  poolType: "v1-volatile" | "v1-stable" | "v2-concentrated";
  variant?: "compact" | "detailed" | "comparison";
  showMetrics?: boolean;
  metrics?: {
    tvl?: string;
    volume24h?: string;
    apr?: string;
    activeBins?: number;
    priceRange?: string;
  };
  className?: string;
}

export const PoolTypeDisplay: React.FC<PoolTypeDisplayProps> = ({
  poolType,
  variant = "compact",
  showMetrics = false,
  metrics,
  className,
}) => {
  const config = {
    "v1-volatile": {
      label: "Volatile Pool",
      version: "V1",
      icon: TrendingUp,
      primaryColor: "blue",
      fee: "0.30%",
      description: "Traditional AMM with constant product formula (x * y = k)",
      features: [
        "Constant product formula",
        "Full price range liquidity",
        "0.30% trading fee",
        "Suitable for uncorrelated assets",
      ],
      pros: [
        "Simple and proven",
        "Always provides liquidity",
        "Lower gas costs",
      ],
      cons: ["Capital inefficiency", "Higher slippage", "Fixed fee structure"],
    },
    "v1-stable": {
      label: "Stable Pool",
      version: "V1",
      icon: Shield,
      primaryColor: "green",
      fee: "0.05%",
      description: "Optimized AMM for stable asset pairs with reduced slippage",
      features: [
        "Stable swap formula",
        "Low slippage for similar assets",
        "0.05% trading fee",
        "Ideal for stablecoins and pegged assets",
      ],
      pros: ["Very low slippage", "Lower fees", "Stable asset optimized"],
      cons: ["Limited to stable pairs", "Less flexibility", "Fixed parameters"],
    },
    "v2-concentrated": {
      label: "Concentrated Liquidity",
      version: "V2",
      icon: Target,
      primaryColor: "purple",
      fee: "Variable",
      description:
        "Advanced AMM with concentrated liquidity and custom price ranges",
      features: [
        "Concentrated liquidity bins",
        "Custom price range selection",
        "Variable fee structure",
        "Capital efficient liquidity provision",
      ],
      pros: [
        "Higher capital efficiency",
        "Customizable strategies",
        "Better price discovery",
        "Flexible fee tiers",
      ],
      cons: [
        "More complex management",
        "Impermanent loss risk",
        "Requires active management",
      ],
    },
  };

  const currentConfig = config[poolType];
  const IconComponent = currentConfig.icon;

  const getColorClasses = (
    color: string,
    intensity: "light" | "medium" | "dark" = "medium"
  ) => {
    const colorMap = {
      blue: {
        light:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:text-blue-300 dark:border-blue-800",
        medium:
          "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-700",
        dark: "bg-blue-600 text-white border-blue-700",
      },
      green: {
        light:
          "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-300 dark:border-green-800",
        medium:
          "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-200 dark:border-green-700",
        dark: "bg-green-600 text-white border-green-700",
      },
      purple: {
        light:
          "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/10 dark:text-purple-300 dark:border-purple-800",
        medium:
          "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-200 dark:border-purple-700",
        dark: "bg-purple-600 text-white border-purple-700",
      },
    };
    return colorMap[color as keyof typeof colorMap][intensity];
  };

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center px-3 py-2 rounded-lg border",
          getColorClasses(currentConfig.primaryColor, "light"),
          className
        )}
      >
        <IconComponent className="w-4 h-4 mr-2" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{currentConfig.label}</span>
          <span className="text-xs opacity-75">Fee: {currentConfig.fee}</span>
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "p-4 rounded-lg border",
          getColorClasses(currentConfig.primaryColor, "light"),
          className
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <IconComponent className="w-5 h-5 mr-2" />
            <div>
              <h3 className="font-semibold text-base">{currentConfig.label}</h3>
              <p className="text-sm opacity-75">{currentConfig.version}</p>
            </div>
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              getColorClasses(currentConfig.primaryColor, "dark")
            )}
          >
            {currentConfig.fee}
          </div>
        </div>

        <p className="text-sm opacity-80 mb-3">{currentConfig.description}</p>

        {showMetrics && metrics && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {metrics.tvl && (
              <div className="flex items-center text-sm">
                <DollarSign className="w-3 h-3 mr-1 opacity-60" />
                <span className="opacity-75">TVL:</span>
                <span className="ml-1 font-medium">{metrics.tvl}</span>
              </div>
            )}
            {metrics.volume24h && (
              <div className="flex items-center text-sm">
                <BarChart3 className="w-3 h-3 mr-1 opacity-60" />
                <span className="opacity-75">24h Vol:</span>
                <span className="ml-1 font-medium">{metrics.volume24h}</span>
              </div>
            )}
            {metrics.apr && (
              <div className="flex items-center text-sm">
                <TrendingUp className="w-3 h-3 mr-1 opacity-60" />
                <span className="opacity-75">APR:</span>
                <span className="ml-1 font-medium">{metrics.apr}</span>
              </div>
            )}
            {poolType === "v2-concentrated" && metrics.activeBins && (
              <div className="flex items-center text-sm">
                <Target className="w-3 h-3 mr-1 opacity-60" />
                <span className="opacity-75">Active Bins:</span>
                <span className="ml-1 font-medium">{metrics.activeBins}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center">
            <Zap className="w-3 h-3 mr-1" />
            Key Features
          </h4>
          <ul className="text-xs space-y-1 opacity-80">
            {currentConfig.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="w-1 h-1 bg-current rounded-full mt-1.5 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (variant === "comparison") {
    return (
      <div
        className={cn(
          "p-4 rounded-lg border",
          getColorClasses(currentConfig.primaryColor, "light"),
          className
        )}
      >
        <div className="flex items-center mb-3">
          <IconComponent className="w-5 h-5 mr-2" />
          <div>
            <h3 className="font-semibold">{currentConfig.label}</h3>
            <p className="text-sm opacity-75">{currentConfig.fee} fee</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
              Advantages
            </h4>
            <ul className="text-xs space-y-1">
              {currentConfig.pros.map((pro, index) => (
                <li key={index} className="flex items-start opacity-80">
                  <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
              Considerations
            </h4>
            <ul className="text-xs space-y-1">
              {currentConfig.cons.map((con, index) => (
                <li key={index} className="flex items-start opacity-80">
                  <span className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
