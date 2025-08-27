/**
 * Mock configuration for testing v2 functionality without deployed contracts
 */

export const MOCK_CONFIG = {
  // Enable mock mode for v2 functionality
  enableV2Mock:
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_V2_MOCK === "true",

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
      activeBinId: 8388608, // 2^23, represents price = 1.0
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
      activeBinId: 8388608,
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
      binId: 8388608,
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
      binId: 8388608,
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
      binIds: [8388608], // Single active bin for simple mode
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
  binConfig?: any;
}) => {
  await mockDelay("addLiquidity");

  // Simulate successful transaction
  const result = getMockTransactionResult("addLiquidity");

  // Add new position to mock data (in a real app, this would be handled by the backend)
  const newPosition = {
    poolId: params.poolId,
    binId: 8388608, // Active bin for simple mode
    lpTokenAmount: params.amountX, // Simplified calculation
    underlyingAmounts: {
      x: params.amountX,
      y: params.amountY,
    },
    feesEarned: {
      x: "0",
      y: "0",
    },
    price: 1.0,
    isActive: true,
  };

  // In a real implementation, this would update the backend state
  console.log("Mock: Added liquidity position", newPosition);

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
      const isActive = binIdNum === (pool?.activeBinId || 8388608);

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
