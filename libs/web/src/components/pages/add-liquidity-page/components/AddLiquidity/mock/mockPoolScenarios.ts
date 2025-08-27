import {V2Position, V2BinPosition} from "../PositionManagementDashboard";
import {ConcentratedLiquidityMetrics} from "@/src/components/common/ConcentratedLiquidityMetrics";

export interface MockPoolScenario {
  id: string;
  name: string;
  description: string;
  poolId: string;
  asset0Symbol: string;
  asset1Symbol: string;
  poolType: "v1-volatile" | "v1-stable" | "v2-concentrated";
  position?: V2Position;
  metrics?: ConcentratedLiquidityMetrics;
  tvl: string;
  volume24h: string;
  apr: string;
}

// Scenario 1: New V2 Pool with No Positions
export const newV2Pool: MockPoolScenario = {
  id: "new-v2-pool",
  name: "New V2 Pool",
  description:
    "A newly created concentrated liquidity pool with no user positions",
  poolId: "1001",
  asset0Symbol: "ETH",
  asset1Symbol: "USDC",
  poolType: "v2-concentrated",
  tvl: "0.00",
  volume24h: "0.00",
  apr: "0.00%",
  metrics: {
    activeBin: 10,
    binStep: 25,
    totalBins: 0,
    liquidityDistribution: [],
    concentrationRange: {
      minPrice: 0.0,
      maxPrice: 0.0,
      currentPrice: 2000.0,
    },
    utilizationRate: 0,
    feeRate: 25, // 0.25%
  },
};

// Scenario 2: Active V2 Pool with Single Position
export const singlePositionV2Pool: MockPoolScenario = {
  id: "single-position-v2",
  name: "Single Position V2 Pool",
  description:
    "V2 pool with one concentrated liquidity position around current price",
  poolId: "1002",
  asset0Symbol: "ETH",
  asset1Symbol: "USDC",
  poolType: "v2-concentrated",
  tvl: "50,000.00",
  volume24h: "12,500.00",
  apr: "8.5%",
  position: {
    poolId: "1002",
    bins: [
      {
        binId: 10,
        lpToken: "0x123...abc",
        lpTokenAmount: "5000.0",
        underlyingAmounts: {x: "12.5", y: "25000.0"},
        price: 2000.0,
        feesEarned: {x: "0.125", y: "250.0"},
        isActive: true,
      },
    ],
    totalValue: {x: "12.5", y: "25000.0"},
    totalFeesEarned: {x: "0.125", y: "250.0"},
  },
  metrics: {
    activeBin: 10,
    binStep: 25,
    totalBins: 1,
    liquidityDistribution: [
      {
        binId: 10,
        price: 2000.0,
        liquidityX: "12.5",
        liquidityY: "25000.0",
        isActive: true,
      },
    ],
    concentrationRange: {
      minPrice: 1950.0,
      maxPrice: 2050.0,
      currentPrice: 2000.0,
    },
    utilizationRate: 100,
    feeRate: 25,
  },
};

// Scenario 3: Multi-Position V2 Pool
export const multiPositionV2Pool: MockPoolScenario = {
  id: "multi-position-v2",
  name: "Multi-Position V2 Pool",
  description: "V2 pool with multiple positions across different price ranges",
  poolId: "1003",
  asset0Symbol: "BTC",
  asset1Symbol: "USDT",
  poolType: "v2-concentrated",
  tvl: "250,000.00",
  volume24h: "75,000.00",
  apr: "12.3%",
  position: {
    poolId: "1003",
    bins: [
      {
        binId: 8,
        lpToken: "0x456...def",
        lpTokenAmount: "2000.0",
        underlyingAmounts: {x: "0.5", y: "0.0"},
        price: 45000.0,
        feesEarned: {x: "0.025", y: "0.0"},
        isActive: false,
      },
      {
        binId: 9,
        lpToken: "0x789...ghi",
        lpTokenAmount: "3000.0",
        underlyingAmounts: {x: "0.3", y: "15000.0"},
        price: 50000.0,
        feesEarned: {x: "0.015", y: "750.0"},
        isActive: true,
      },
      {
        binId: 10,
        lpToken: "0xabc...123",
        lpTokenAmount: "1500.0",
        underlyingAmounts: {x: "0.0", y: "27500.0"},
        price: 55000.0,
        feesEarned: {x: "0.0", y: "412.5"},
        isActive: false,
      },
    ],
    totalValue: {x: "0.8", y: "42500.0"},
    totalFeesEarned: {x: "0.04", y: "1162.5"},
  },
  metrics: {
    activeBin: 9,
    binStep: 50,
    totalBins: 3,
    liquidityDistribution: [
      {
        binId: 8,
        price: 45000.0,
        liquidityX: "0.5",
        liquidityY: "0.0",
        isActive: false,
      },
      {
        binId: 9,
        price: 50000.0,
        liquidityX: "0.3",
        liquidityY: "15000.0",
        isActive: true,
      },
      {
        binId: 10,
        price: 55000.0,
        liquidityX: "0.0",
        liquidityY: "27500.0",
        isActive: false,
      },
    ],
    concentrationRange: {
      minPrice: 45000.0,
      maxPrice: 55000.0,
      currentPrice: 50000.0,
    },
    utilizationRate: 35.3, // Only middle bin is active
    feeRate: 50,
  },
};

// Scenario 4: Wide Range V2 Pool
export const wideRangeV2Pool: MockPoolScenario = {
  id: "wide-range-v2",
  name: "Wide Range V2 Pool",
  description: "V2 pool with liquidity spread across a wide price range",
  poolId: "1004",
  asset0Symbol: "FUEL",
  asset1Symbol: "ETH",
  poolType: "v2-concentrated",
  tvl: "100,000.00",
  volume24h: "25,000.00",
  apr: "6.8%",
  position: {
    poolId: "1004",
    bins: [
      {
        binId: 5,
        lpToken: "0xdef...456",
        lpTokenAmount: "1000.0",
        underlyingAmounts: {x: "5000.0", y: "0.0"},
        price: 0.0008,
        feesEarned: {x: "25.0", y: "0.0"},
        isActive: false,
      },
      {
        binId: 6,
        lpToken: "0xghi...789",
        lpTokenAmount: "1500.0",
        underlyingAmounts: {x: "3000.0", y: "1.2"},
        price: 0.001,
        feesEarned: {x: "15.0", y: "0.006"},
        isActive: true,
      },
      {
        binId: 7,
        lpToken: "0xjkl...012",
        lpTokenAmount: "2000.0",
        underlyingAmounts: {x: "1000.0", y: "2.4"},
        price: 0.0012,
        feesEarned: {x: "5.0", y: "0.012"},
        isActive: false,
      },
      {
        binId: 8,
        lpToken: "0xmno...345",
        lpTokenAmount: "1200.0",
        underlyingAmounts: {x: "0.0", y: "1.8"},
        price: 0.0015,
        feesEarned: {x: "0.0", y: "0.009"},
        isActive: false,
      },
    ],
    totalValue: {x: "9000.0", y: "5.4"},
    totalFeesEarned: {x: "45.0", y: "0.027"},
  },
  metrics: {
    activeBin: 6,
    binStep: 20,
    totalBins: 4,
    liquidityDistribution: [
      {
        binId: 5,
        price: 0.0008,
        liquidityX: "5000.0",
        liquidityY: "0.0",
        isActive: false,
      },
      {
        binId: 6,
        price: 0.001,
        liquidityX: "3000.0",
        liquidityY: "1.2",
        isActive: true,
      },
      {
        binId: 7,
        price: 0.0012,
        liquidityX: "1000.0",
        liquidityY: "2.4",
        isActive: false,
      },
      {
        binId: 8,
        price: 0.0015,
        liquidityX: "0.0",
        liquidityY: "1.8",
        isActive: false,
      },
    ],
    concentrationRange: {
      minPrice: 0.0008,
      maxPrice: 0.0015,
      currentPrice: 0.001,
    },
    utilizationRate: 22.2, // 1.2 out of 5.4 total ETH
    feeRate: 20,
  },
};

// Scenario 5: High Fee V2 Pool
export const highFeeV2Pool: MockPoolScenario = {
  id: "high-fee-v2",
  name: "High Fee V2 Pool",
  description: "V2 pool with high fees and volatile assets",
  poolId: "1005",
  asset0Symbol: "MEME",
  asset1Symbol: "USDC",
  poolType: "v2-concentrated",
  tvl: "15,000.00",
  volume24h: "45,000.00",
  apr: "25.7%",
  position: {
    poolId: "1005",
    bins: [
      {
        binId: 12,
        lpToken: "0xpqr...678",
        lpTokenAmount: "500.0",
        underlyingAmounts: {x: "10000.0", y: "5000.0"},
        price: 0.5,
        feesEarned: {x: "250.0", y: "125.0"},
        isActive: true,
      },
    ],
    totalValue: {x: "10000.0", y: "5000.0"},
    totalFeesEarned: {x: "250.0", y: "125.0"},
  },
  metrics: {
    activeBin: 12,
    binStep: 100,
    totalBins: 1,
    liquidityDistribution: [
      {
        binId: 12,
        price: 0.5,
        liquidityX: "10000.0",
        liquidityY: "5000.0",
        isActive: true,
      },
    ],
    concentrationRange: {
      minPrice: 0.45,
      maxPrice: 0.55,
      currentPrice: 0.5,
    },
    utilizationRate: 100,
    feeRate: 100, // 1.0%
  },
};

// All scenarios
export const mockPoolScenarios: MockPoolScenario[] = [
  newV2Pool,
  singlePositionV2Pool,
  multiPositionV2Pool,
  wideRangeV2Pool,
  highFeeV2Pool,
];

// Helper function to get scenario by ID
export function getMockPoolScenario(id: string): MockPoolScenario | undefined {
  return mockPoolScenarios.find((scenario) => scenario.id === id);
}

// Helper function to get random scenario
export function getRandomMockPoolScenario(): MockPoolScenario {
  const randomIndex = Math.floor(Math.random() * mockPoolScenarios.length);
  return mockPoolScenarios[randomIndex];
}

// Helper function to get scenarios by pool type
export function getMockPoolScenariosByType(
  poolType: "v1-volatile" | "v1-stable" | "v2-concentrated"
): MockPoolScenario[] {
  return mockPoolScenarios.filter((scenario) => scenario.poolType === poolType);
}
