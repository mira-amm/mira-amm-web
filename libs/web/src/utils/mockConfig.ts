/**
 * Mock configuration for testing v2 functionality without deployed contracts
 */

import {ACTIVE_BIN_ID} from "mira-dex-ts";

export const MOCK_CONFIG = {
  // Enable mock mode for v2 functionality
  // Only enable mocks when explicitly requested, not automatically in development
  enableV2Mock: process.env.NEXT_PUBLIC_ENABLE_V2_MOCK === "true",

  // Mock v2 pool data
  mockV2Pools: [
    {
      id: "1001",
      name: "ETH/USDC Concentrated Pool",
      assetX:
        "0x0000000000000000000000000000000000000000000000000000000000000000", // ETH
      assetY:
        "0x1111111111111111111111111111111111111111111111111111111111111111", // USDC
      binStep: 25,
      baseFactor: 10000,
      activeBinIdUint: ACTIVE_BIN_ID.CENTER, // Center bin in unsigned representation, represents price = 1.0
      totalLiquidity: "1000000000000000000", // 1 ETH equivalent
      currentPrice: 1.0,
      priceRange: {
        min: 0.8,
        max: 1.2,
      },
      totalBins: 50,
      activeBins: 12,
    },
    {
      id: "1002",
      name: "BTC/ETH Concentrated Pool",
      assetX:
        "0x2222222222222222222222222222222222222222222222222222222222222222", // BTC
      assetY:
        "0x0000000000000000000000000000000000000000000000000000000000000000", // ETH
      binStep: 50,
      baseFactor: 10000,
      activeBinIdUint: ACTIVE_BIN_ID.CENTER,
      totalLiquidity: "500000000000000000", // 0.5 ETH equivalent
      currentPrice: 15.5,
      priceRange: {
        min: 14.0,
        max: 17.0,
      },
      totalBins: 25,
      activeBins: 8,
    },
  ],

  // Mock user positions
  mockUserPositions: [
    {
      poolId: "1001",
      binIdUint: ACTIVE_BIN_ID.CENTER,
      lpTokenAmount: "500000000000000000", // 0.5 ETH equivalent
      underlyingAmounts: {
        x: "250000000000000000", // 0.25 ETH
        y: "250000000000000000", // 0.25 ETH
      },
      feesEarned: {
        x: "1000000000000000", // 0.001 ETH
        y: "1000000000000000", // 0.001 ETH
      },
      price: 1.0,
      isActive: true,
    },
    {
      poolId: "1001",
      binId: 8388609,
      lpTokenAmount: "300000000000000000", // 0.3 ETH equivalent
      underlyingAmounts: {
        x: "150000000000000000", // 0.15 ETH
        y: "150000000000000000", // 0.15 ETH
      },
      feesEarned: {
        x: "500000000000000", // 0.0005 ETH
        y: "500000000000000", // 0.0005 ETH
      },
      price: 1.0025,
      isActive: false,
    },
    {
      poolId: "1001",
      binId: 8388607,
      lpTokenAmount: "200000000000000000", // 0.2 ETH equivalent
      underlyingAmounts: {
        x: "100000000000000000", // 0.1 ETH
        y: "100000000000000000", // 0.1 ETH
      },
      feesEarned: {
        x: "750000000000000", // 0.00075 ETH
        y: "750000000000000", // 0.00075 ETH
      },
      price: 0.9975,
      isActive: false,
    },
    {
      poolId: "1002",
      binIdUint: ACTIVE_BIN_ID.CENTER,
      lpTokenAmount: "100000000000000000", // 0.1 ETH equivalent
      underlyingAmounts: {
        x: "50000000000000000", // 0.05 ETH
        y: "50000000000000000", // 0.05 ETH
      },
      feesEarned: {
        x: "2000000000000000", // 0.002 ETH
        y: "2000000000000000", // 0.002 ETH
      },
      price: 15.5,
      isActive: true,
    },
  ],

  // Mock transaction delays (in ms)
  mockDelays: {
    addLiquidity: 2000,
    removeLiquidity: 1500,
    fetchPositions: 500,
    createPool: 3000,
    swapPreview: 300,
    swap: 2500,
  },

  // Mock transaction results
  mockTransactionResults: {
    addLiquidity: {
      success: true,
      transactionId: "0xmock_add_liquidity_tx_hash",
      binIdsSigned: [ACTIVE_BIN_ID.CENTER], // Single active bin for simple mode
      liquidityAdded: "1000000000000000000", // 1 ETH equivalent
    },
    removeLiquidity: {
      success: true,
      transactionId: "0xmock_remove_liquidity_tx_hash",
      amountsRemoved: {
        x: "500000000000000000", // 0.5 ETH
        y: "500000000000000000", // 0.5 ETH
      },
    },
    createPool: {
      success: true,
      transactionId: "0xmock_create_pool_tx_hash",
      poolId: "1003",
    },
  },
};

/**
 * Check if v2 mock mode is enabled
 */
export const isV2MockEnabled = () => MOCK_CONFIG.enableV2Mock;

/**
 * Get mock v2 pool by ID
 */
export const getMockV2Pool = (poolId: string) =>
  MOCK_CONFIG.mockV2Pools.find((pool) => pool.id === poolId);

/**
 * Get mock user positions for a pool
 */
export const getMockUserPositions = (poolId: string) =>
  MOCK_CONFIG.mockUserPositions.filter(
    (position) => position.poolId === poolId
  );

/**
 * Simulate async operation with mock delay
 */
export const mockDelay = (operation: keyof typeof MOCK_CONFIG.mockDelays) =>
  new Promise((resolve) =>
    setTimeout(resolve, MOCK_CONFIG.mockDelays[operation])
  );

/**
 * Get mock transaction result
 */
export const getMockTransactionResult = (
  operation: keyof typeof MOCK_CONFIG.mockTransactionResults
) => MOCK_CONFIG.mockTransactionResults[operation];

/**
 * Simulate adding liquidity to a v2 pool
 */
export const mockAddLiquidityV2 = async (params: {
  poolId: string;
  amountX: string;
  amountY: string;
  binConfig?: {
    strategy: string;
    numBins?: number;
    priceRange?: [number, number];
    liquidityDistribution?: any;
  };
}) => {
  await mockDelay("addLiquidity");

  const pool = getMockV2Pool(params.poolId);
  const activeBinIdUint = pool?.activeBinIdUint || ACTIVE_BIN_ID.CENTER;

  // Handle different liquidity distribution strategies
  const binConfig = params.binConfig || {strategy: "single-active-bin"};
  const numBins = binConfig.numBins || 1;
  const strategy = binConfig.strategy;

  // Calculate bin IDs based on strategy
  let binIds: number[] = [];

  if (strategy === "single-active-bin" || numBins === 1) {
    binIds = [activeBinIdUint];
  } else {
    // Distribute across multiple bins around active bin
    const halfBins = Math.floor(numBins / 2);
    for (let i = -halfBins; i <= halfBins; i++) {
      if (binIds.length < numBins) {
        binIds.push(activeBinIdUint + i);
      }
    }
  }

  // Simulate successful transaction with enhanced result
  const result = {
    ...getMockTransactionResult("addLiquidity"),
    binIds,
    strategy,
    numBins,
    liquidityDistribution: binConfig.liquidityDistribution,
    priceRange: binConfig.priceRange,
  };

  // Create positions for each bin
  const totalAmountX = BigInt(params.amountX);
  const totalAmountY = BigInt(params.amountY);

  binIds.forEach((binId, index) => {
    // Distribute liquidity across bins (simplified distribution)
    const isActiveBin = binId === activeBinIdUint;
    let binAmountX = "0";
    let binAmountY = "0";

    if (strategy === "spot" && isActiveBin) {
      // Concentrated in active bin
      binAmountX = ((totalAmountX * BigInt(70)) / BigInt(100)).toString();
      binAmountY = ((totalAmountY * BigInt(70)) / BigInt(100)).toString();
    } else if (strategy === "curve") {
      // Distributed based on distance from active bin
      const weight = Math.max(0.1, 1 - Math.abs(binId - activeBinIdUint) * 0.2);
      binAmountX = (
        (totalAmountX * BigInt(Math.floor(weight * 100))) /
        BigInt(100 * numBins)
      ).toString();
      binAmountY = (
        (totalAmountY * BigInt(Math.floor(weight * 100))) /
        BigInt(100 * numBins)
      ).toString();
    } else if (strategy === "bidask") {
      // Higher liquidity on both sides of active bin
      const distance = Math.abs(binId - activeBinIdUint);
      const weight = distance <= 2 ? 0.8 : 0.2;
      binAmountX = (
        (totalAmountX * BigInt(Math.floor(weight * 100))) /
        BigInt(100 * numBins)
      ).toString();
      binAmountY = (
        (totalAmountY * BigInt(Math.floor(weight * 100))) /
        BigInt(100 * numBins)
      ).toString();
    } else {
      // Equal distribution
      binAmountX = (totalAmountX / BigInt(numBins)).toString();
      binAmountY = (totalAmountY / BigInt(numBins)).toString();
    }

    const newPosition = {
      poolId: params.poolId,
      binId,
      lpTokenAmount: (BigInt(binAmountX) + BigInt(binAmountY)).toString(),
      underlyingAmounts: {
        x: binAmountX,
        y: binAmountY,
      },
      feesEarned: {
        x: "0",
        y: "0",
      },
      price: pool?.currentPrice || 1.0,
      isActive: isActiveBin,
    };

    console.log(`Mock: Added liquidity position to bin ${binId}`, newPosition);
  });

  return result;
};

/**
 * Simulate removing liquidity from v2 pool
 */
export const mockRemoveLiquidityV2 = async (params: {
  poolId: string;
  binIds: number[];
  amounts?: any;
}) => {
  await mockDelay("removeLiquidity");

  const result = getMockTransactionResult("removeLiquidity");

  console.log("Mock: Removed liquidity from bins", params.binIds);

  return result;
};

/**
 * Get all mock v2 pools
 */
export const getAllMockV2Pools = () => MOCK_CONFIG.mockV2Pools;

/**
 * Check if a pool ID is a mock v2 pool
 */
export const isMockV2Pool = (poolId: string) =>
  MOCK_CONFIG.mockV2Pools.some((pool) => pool.id === poolId);

/**
 * Update mock user position for individual bin operations
 */
export const updateMockUserPosition = (
  poolId: string,
  binId: string,
  operation: {
    type: "add" | "remove";
    amountX?: string;
    amountY?: string;
    lpTokenAmount?: string;
  }
) => {
  const binIdNum = parseInt(binId);
  const existingPositionIndex = MOCK_CONFIG.mockUserPositions.findIndex(
    (pos) => pos.poolId === poolId && pos.binId === binIdNum
  );

  if (operation.type === "add") {
    if (existingPositionIndex >= 0) {
      // Update existing position
      const existing = MOCK_CONFIG.mockUserPositions[existingPositionIndex];
      existing.lpTokenAmount = (
        BigInt(existing.lpTokenAmount) +
        BigInt(operation.amountX || "0") +
        BigInt(operation.amountY || "0")
      ).toString();
      existing.underlyingAmounts.x = (
        BigInt(existing.underlyingAmounts.x) + BigInt(operation.amountX || "0")
      ).toString();
      existing.underlyingAmounts.y = (
        BigInt(existing.underlyingAmounts.y) + BigInt(operation.amountY || "0")
      ).toString();
    } else {
      // Create new position
      const pool = getMockV2Pool(poolId);
      const isActive =
        binIdNum === (pool?.activeBinIdUint || ACTIVE_BIN_ID.CENTER);

      MOCK_CONFIG.mockUserPositions.push({
        poolId,
        binId: binIdNum,
        lpTokenAmount: (
          BigInt(operation.amountX || "0") + BigInt(operation.amountY || "0")
        ).toString(),
        underlyingAmounts: {
          x: operation.amountX || "0",
          y: operation.amountY || "0",
        },
        feesEarned: {
          x: "0",
          y: "0",
        },
        price: pool?.currentPrice || 1.0,
        isActive,
      });
    }
  } else if (operation.type === "remove") {
    if (existingPositionIndex >= 0) {
      const existing = MOCK_CONFIG.mockUserPositions[existingPositionIndex];
      const removeAmount = BigInt(operation.lpTokenAmount || "0");
      const currentAmount = BigInt(existing.lpTokenAmount);

      if (removeAmount >= currentAmount) {
        // Remove entire position
        MOCK_CONFIG.mockUserPositions.splice(existingPositionIndex, 1);
      } else {
        // Partial removal
        const remainingRatio =
          Number(
            ((currentAmount - removeAmount) * BigInt(10000)) / currentAmount
          ) / 10000;

        existing.lpTokenAmount = (currentAmount - removeAmount).toString();
        existing.underlyingAmounts.x = (
          (BigInt(existing.underlyingAmounts.x) *
            BigInt(Math.floor(remainingRatio * 10000))) /
          BigInt(10000)
        ).toString();
        existing.underlyingAmounts.y = (
          (BigInt(existing.underlyingAmounts.y) *
            BigInt(Math.floor(remainingRatio * 10000))) /
          BigInt(10000)
        ).toString();
      }
    }
  }

  console.log(
    `Mock: Updated position for pool ${poolId}, bin ${binId}:`,
    operation
  );
};
