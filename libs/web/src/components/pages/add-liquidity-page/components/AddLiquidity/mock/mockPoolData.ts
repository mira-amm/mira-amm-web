import {MockPoolScenario} from "./mockPoolScenarios";
import {ConcentratedLiquidityMetrics} from "@/src/components/common/ConcentratedLiquidityMetrics";
import {V2Position} from "../PositionManagementDashboard";

export interface BinConfiguration {
  binId: number;
  price: number;
  liquidityX: string;
  liquidityY: string;
  isActive: boolean;
  utilization: number; // Percentage of total pool liquidity
}

export interface PoolConfiguration {
  id: string;
  name: string;
  description: string;
  binStep: number;
  activeBin: number;
  currentPrice: number;
  feeRate: number;
  bins: BinConfiguration[];
}

// Configuration 1: Tight Concentration (3 bins around active price)
const tightConcentrationConfig: PoolConfiguration = {
  id: "tight-concentration",
  name: "Tight Concentration",
  description: "Liquidity concentrated in 3 bins around current price",
  binStep: 10,
  activeBin: 100,
  currentPrice: 2000.0,
  feeRate: 25,
  bins: [
    {
      binId: 99,
      price: 1980.0,
      liquidityX: "5.0",
      liquidityY: "0.0",
      isActive: false,
      utilization: 20,
    },
    {
      binId: 100,
      price: 2000.0,
      liquidityX: "2.5",
      liquidityY: "5000.0",
      isActive: true,
      utilization: 60,
    },
    {
      binId: 101,
      price: 2020.0,
      liquidityX: "0.0",
      liquidityY: "2000.0",
      isActive: false,
      utilization: 20,
    },
  ],
};

// Configuration 2: Wide Distribution (10 bins)
const wideDistributionConfig: PoolConfiguration = {
  id: "wide-distribution",
  name: "Wide Distribution",
  description: "Liquidity spread across 10 bins with varying amounts",
  binStep: 25,
  activeBin: 50,
  currentPrice: 1500.0,
  feeRate: 30,
  bins: [
    {
      binId: 45,
      price: 1200.0,
      liquidityX: "8.0",
      liquidityY: "0.0",
      isActive: false,
      utilization: 15,
    },
    {
      binId: 46,
      price: 1230.0,
      liquidityX: "7.5",
      liquidityY: "0.0",
      isActive: false,
      utilization: 14,
    },
    {
      binId: 47,
      price: 1260.0,
      liquidityX: "7.0",
      liquidityY: "0.0",
      isActive: false,
      utilization: 13,
    },
    {
      binId: 48,
      price: 1290.0,
      liquidityX: "6.0",
      liquidityY: "1000.0",
      isActive: false,
      utilization: 12,
    },
    {
      binId: 49,
      price: 1320.0,
      liquidityX: "5.0",
      liquidityY: "2000.0",
      isActive: false,
      utilization: 11,
    },
    {
      binId: 50,
      price: 1500.0,
      liquidityX: "3.0",
      liquidityY: "4500.0",
      isActive: true,
      utilization: 10,
    },
    {
      binId: 51,
      price: 1530.0,
      liquidityX: "0.0",
      liquidityY: "3000.0",
      isActive: false,
      utilization: 9,
    },
    {
      binId: 52,
      price: 1560.0,
      liquidityX: "0.0",
      liquidityY: "2500.0",
      isActive: false,
      utilization: 8,
    },
    {
      binId: 53,
      price: 1590.0,
      liquidityX: "0.0",
      liquidityY: "2000.0",
      isActive: false,
      utilization: 4,
    },
    {
      binId: 54,
      price: 1620.0,
      liquidityX: "0.0",
      liquidityY: "1500.0",
      isActive: false,
      utilization: 4,
    },
  ],
};

// Configuration 3: Asymmetric Distribution (more liquidity on one side)
const asymmetricConfig: PoolConfiguration = {
  id: "asymmetric",
  name: "Asymmetric Distribution",
  description: "More liquidity below current price (bullish setup)",
  binStep: 50,
  activeBin: 25,
  currentPrice: 50000.0,
  feeRate: 50,
  bins: [
    {
      binId: 20,
      price: 40000.0,
      liquidityX: "2.0",
      liquidityY: "0.0",
      isActive: false,
      utilization: 25,
    },
    {
      binId: 21,
      price: 42000.0,
      liquidityX: "1.8",
      liquidityY: "0.0",
      isActive: false,
      utilization: 22,
    },
    {
      binId: 22,
      price: 44000.0,
      liquidityX: "1.6",
      liquidityY: "0.0",
      isActive: false,
      utilization: 20,
    },
    {
      binId: 23,
      price: 46000.0,
      liquidityX: "1.4",
      liquidityY: "0.0",
      isActive: false,
      utilization: 18,
    },
    {
      binId: 24,
      price: 48000.0,
      liquidityX: "1.2",
      y: "10000.0",
      isActive: false,
      utilization: 15,
    },
    {
      binId: 25,
      price: 50000.0,
      liquidityX: "0.5",
      liquidityY: "25000.0",
      isActive: true,
      utilization: 0,
    },
  ],
};

// Configuration 4: Ladder Distribution (decreasing amounts)
const ladderConfig: PoolConfiguration = {
  id: "ladder",
  name: "Ladder Distribution",
  description: "Decreasing liquidity amounts moving away from active bin",
  binStep: 20,
  activeBin: 75,
  currentPrice: 0.001,
  feeRate: 20,
  bins: [
    {
      binId: 70,
      price: 0.0008,
      liquidityX: "1000.0",
      liquidityY: "0.0",
      isActive: false,
      utilization: 5,
    },
    {
      binId: 71,
      price: 0.00085,
      liquidityX: "2000.0",
      liquidityY: "0.0",
      isActive: false,
      utilization: 10,
    },
    {
      binId: 72,
      price: 0.0009,
      liquidityX: "3000.0",
      liquidityY: "0.0",
      isActive: false,
      utilization: 15,
    },
    {
      binId: 73,
      price: 0.00095,
      liquidityX: "4000.0",
      liquidityY: "0.5",
      isActive: false,
      utilization: 20,
    },
    {
      binId: 74,
      price: 0.00098,
      liquidityX: "5000.0",
      liquidityY: "1.0",
      isActive: false,
      utilization: 25,
    },
    {
      binId: 75,
      price: 0.001,
      liquidityX: "3000.0",
      liquidityY: "3.0",
      isActive: true,
      utilization: 25,
    },
    {
      binId: 76,
      price: 0.00102,
      liquidityX: "0.0",
      liquidityY: "2.0",
      isActive: false,
      utilization: 0,
    },
    {
      binId: 77,
      price: 0.00105,
      liquidityX: "0.0",
      liquidityY: "1.5",
      isActive: false,
      utilization: 0,
    },
    {
      binId: 78,
      price: 0.0011,
      liquidityX: "0.0",
      liquidityY: "1.0",
      isActive: false,
      utilization: 0,
    },
    {
      binId: 79,
      price: 0.0012,
      liquidityX: "0.0",
      liquidityY: "0.5",
      isActive: false,
      utilization: 0,
    },
  ],
};

// Configuration 5: Sparse Distribution (gaps between bins)
const sparseConfig: PoolConfiguration = {
  id: "sparse",
  name: "Sparse Distribution",
  description: "Liquidity with gaps between active bins",
  binStep: 100,
  activeBin: 15,
  currentPrice: 0.5,
  feeRate: 100,
  bins: [
    {
      binId: 10,
      price: 0.3,
      liquidityX: "10000.0",
      liquidityY: "0.0",
      isActive: false,
      utilization: 30,
    },
    {
      binId: 13,
      price: 0.42,
      liquidityX: "5000.0",
      liquidityY: "0.0",
      isActive: false,
      utilization: 15,
    },
    {
      binId: 15,
      price: 0.5,
      liquidityX: "2500.0",
      liquidityY: "1250.0",
      isActive: true,
      utilization: 25,
    },
    {
      binId: 18,
      price: 0.65,
      liquidityX: "0.0",
      liquidityY: "2000.0",
      isActive: false,
      utilization: 20,
    },
    {
      binId: 22,
      price: 0.85,
      liquidityX: "0.0",
      liquidityY: "1000.0",
      isActive: false,
      utilization: 10,
    },
  ],
};

// Configuration 6: High Frequency (many small bins)
const highFrequencyConfig: PoolConfiguration = {
  id: "high-frequency",
  name: "High Frequency",
  description: "Many bins with small amounts each",
  binStep: 5,
  activeBin: 200,
  currentPrice: 3000.0,
  feeRate: 15,
  bins: Array.from({length: 20}, (_, i) => {
    const binId = 190 + i;
    const price = 2900 + i * 10;
    const isActive = binId === 200;
    const baseAmount = isActive ? 500 : 100 + Math.random() * 200;

    return {
      binId,
      price,
      liquidityX: binId < 200 ? baseAmount.toFixed(1) : "0.0",
      liquidityY:
        binId >= 200 ? ((baseAmount * price) / 1000).toFixed(1) : "0.0",
      isActive,
      utilization: isActive ? 15 : Math.random() * 8,
    };
  }),
};

// All configurations
export const poolConfigurations: PoolConfiguration[] = [
  tightConcentrationConfig,
  wideDistributionConfig,
  asymmetricConfig,
  ladderConfig,
  sparseConfig,
  highFrequencyConfig,
];

/**
 * Convert pool configuration to mock pool scenario
 */
export function configurationToScenario(
  config: PoolConfiguration,
  asset0Symbol: string = "ETH",
  asset1Symbol: string = "USDC"
): MockPoolScenario {
  const metrics: ConcentratedLiquidityMetrics = {
    activeBin: config.activeBin,
    binStep: config.binStep,
    totalBins: config.bins.length,
    liquidityDistribution: config.bins.map((bin) => ({
      binId: bin.binId,
      price: bin.price,
      liquidityX: bin.liquidityX,
      liquidityY: bin.liquidityY,
      isActive: bin.isActive,
    })),
    concentrationRange: {
      minPrice: Math.min(...config.bins.map((b) => b.price)),
      maxPrice: Math.max(...config.bins.map((b) => b.price)),
      currentPrice: config.currentPrice,
    },
    utilizationRate: config.bins.find((b) => b.isActive)?.utilization || 0,
    feeRate: config.feeRate,
  };

  // Create user position based on configuration
  const position: V2Position = {
    poolId: config.id,
    bins: config.bins.map((bin) => ({
      binId: bin.binId,
      lpToken: `0x${Math.random().toString(16).substr(2, 40)}`,
      lpTokenAmount: (
        parseFloat(bin.liquidityX) + parseFloat(bin.liquidityY)
      ).toString(),
      underlyingAmounts: {x: bin.liquidityX, y: bin.liquidityY},
      price: bin.price,
      feesEarned: {
        x: (parseFloat(bin.liquidityX) * 0.01).toString(), // 1% fees
        y: (parseFloat(bin.liquidityY) * 0.01).toString(),
      },
      isActive: bin.isActive,
    })),
    totalValue: {
      x: config.bins
        .reduce((sum, bin) => sum + parseFloat(bin.liquidityX), 0)
        .toString(),
      y: config.bins
        .reduce((sum, bin) => sum + parseFloat(bin.liquidityY), 0)
        .toString(),
    },
    totalFeesEarned: {
      x: config.bins
        .reduce((sum, bin) => sum + parseFloat(bin.liquidityX) * 0.01, 0)
        .toString(),
      y: config.bins
        .reduce((sum, bin) => sum + parseFloat(bin.liquidityY) * 0.01, 0)
        .toString(),
    },
  };

  const totalValue =
    parseFloat(position.totalValue.x) * config.currentPrice +
    parseFloat(position.totalValue.y);

  return {
    id: config.id,
    name: config.name,
    description: config.description,
    poolId: config.id,
    asset0Symbol,
    asset1Symbol,
    poolType: "v2-concentrated",
    position,
    metrics,
    tvl: totalValue.toFixed(2),
    volume24h: (totalValue * 0.5).toFixed(2),
    apr: `${(5 + Math.random() * 15).toFixed(1)}%`,
  };
}

/**
 * Generate random pool configuration
 */
export function generateRandomPoolConfiguration(
  binCount: number = 5,
  currentPrice: number = 1000,
  binStep: number = 25
): PoolConfiguration {
  const activeBin = Math.floor(Math.random() * 100) + 50;
  const startBin = activeBin - Math.floor(binCount / 2);

  const bins: BinConfiguration[] = [];

  for (let i = 0; i < binCount; i++) {
    const binId = startBin + i;
    const price =
      currentPrice * Math.pow(1 + binStep / 10000, binId - activeBin);
    const isActive = binId === activeBin;

    // Generate random liquidity amounts
    const totalLiquidity = 1000 + Math.random() * 5000;
    const ratio = Math.random();

    bins.push({
      binId,
      price,
      liquidityX:
        binId <= activeBin ? (totalLiquidity * ratio).toFixed(1) : "0.0",
      liquidityY:
        binId >= activeBin ? (totalLiquidity * (1 - ratio)).toFixed(1) : "0.0",
      isActive,
      utilization: isActive ? 50 + Math.random() * 30 : Math.random() * 20,
    });
  }

  return {
    id: `random-${Date.now()}`,
    name: "Random Configuration",
    description: `Randomly generated pool with ${binCount} bins`,
    binStep,
    activeBin,
    currentPrice,
    feeRate: 25 + Math.floor(Math.random() * 75), // 0.25% to 1.0%
    bins,
  };
}

/**
 * Get configuration by ID
 */
export function getPoolConfiguration(
  id: string
): PoolConfiguration | undefined {
  return poolConfigurations.find((config) => config.id === id);
}

/**
 * Get all available configurations
 */
export function getAllPoolConfigurations(): PoolConfiguration[] {
  return [...poolConfigurations];
}

/**
 * Create mock scenarios from all configurations
 */
export function createMockScenariosFromConfigurations(): MockPoolScenario[] {
  const assetPairs = [
    ["ETH", "USDC"],
    ["BTC", "USDT"],
    ["FUEL", "ETH"],
    ["MEME", "USDC"],
    ["DAI", "USDC"],
  ];

  return poolConfigurations.map((config, index) => {
    const [asset0, asset1] = assetPairs[index % assetPairs.length];
    return configurationToScenario(config, asset0, asset1);
  });
}
