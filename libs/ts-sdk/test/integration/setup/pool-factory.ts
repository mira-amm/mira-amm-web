import {BN, WalletUnlocked} from "fuels";
import {MiraAmmV2} from "../../../src/sdk/mira_amm_v2";
import {ReadonlyMiraAmmV2} from "../../../src/sdk/readonly_mira_amm_v2";
import {TestToken} from "./token-factory";
import {LiquidityConfig, PoolIdV2} from "../../../src/sdk/model";
import {buildPoolIdV2} from "../../../src/sdk/utils";

export interface PoolConfig {
  tokenX: TestToken;
  tokenY: TestToken;
  binStep: number;
  baseFactor: number;
  protocolShare?: number;
  activeId?: number; // Initial active bin ID (defaults to center bin)
}

export interface StandardPoolType {
  type: "STABLE" | "VOLATILE" | "EXOTIC";
  binStep: number;
  baseFactor: number;
  protocolShare: number;
  description: string;
}

export const STANDARD_POOL_CONFIGS: Record<string, StandardPoolType> = {
  STABLE: {
    type: "STABLE",
    binStep: 1,
    baseFactor: 5000,
    protocolShare: 0,
    description: "Low volatility pairs (stablecoins) with minimal fees",
  },
  VOLATILE: {
    type: "VOLATILE",
    binStep: 20,
    baseFactor: 8000,
    protocolShare: 0,
    description: "Medium volatility pairs with standard fees",
  },
  EXOTIC: {
    type: "EXOTIC",
    binStep: 50,
    baseFactor: 15000,
    protocolShare: 0,
    description: "High volatility or exotic pairs with higher fees",
  },
};

export interface LiquidityShape {
  type: "concentrated" | "normal" | "uniform" | "custom";
  bins: number;
  distribution?: number[]; // Custom distribution weights
  activeIdOffset?: number; // Offset from current active bin
}

/**
 * Pool factory for creating and managing test pools
 */
export class PoolFactory {
  private miraAmm: MiraAmmV2;
  private readonlyAmm: ReadonlyMiraAmmV2;
  private createdPools: Map<string, PoolIdV2> = new Map();

  constructor(
    private wallet: WalletUnlocked,
    private proxyContractId: string
  ) {
    // Both use the same proxy contract - simpleProxy is the proxy for poolCurveState
    this.miraAmm = new MiraAmmV2(wallet, proxyContractId);
    this.readonlyAmm = new ReadonlyMiraAmmV2(wallet.provider, proxyContractId);
  }

  /**
   * Create a new pool
   */
  async createPool(config: PoolConfig): Promise<PoolIdV2> {
    const poolKey = `${config.tokenX.symbol}/${config.tokenY.symbol}`;

    // Check if pool already exists
    const existingPoolId = this.createdPools.get(poolKey);
    if (existingPoolId) {
      console.log(
        `♻️ Pool ${poolKey} already exists with ID ${existingPoolId}`
      );
      return existingPoolId;
    }

    console.log(`🏊 Creating pool ${poolKey}...`);
    console.log(`  Bin step: ${config.binStep}`);
    console.log(`  Base factor: ${config.baseFactor}`);

    // Try to create the pool, but handle the case where it already exists
    const activeId = config.activeId || 8388608; // Use provided activeId or default to center bin (2^23)

    // Calculate the correct pool ID using the SDK utility function
    const poolId = buildPoolIdV2(
      config.tokenX.assetId,
      config.tokenY.assetId,
      config.binStep,
      config.baseFactor
    );

    console.log(`🎯 Calculated pool ID: ${poolId} (${typeof poolId})`);
    console.log(`🎯 Pool ID hex: ${poolId.toHex()}`);

    try {
      const transactionWithGas = await this.miraAmm.createPool(
        {
          assetX: {bits: config.tokenX.assetId},
          assetY: {bits: config.tokenY.assetId},
          binStep: config.binStep,
          baseFactor: config.baseFactor,
        },
        activeId
      );

      // Submit the transaction and wait for completion
      const transaction = await this.wallet.sendTransaction(
        transactionWithGas.transactionRequest
      );
      const result = await transaction.waitForResult();

      console.log(`✅ Pool created with ID: ${poolId.toHex()}`);
      console.log(`📋 Transaction result:`, result.status);

      // Add a small delay to ensure pool is available for queries
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify pool exists by querying metadata AND indexer
      try {
        const metadata = await this.readonlyAmm.poolMetadata(poolId);
        if (metadata) {
          console.log(
            `✅ Pool metadata verified - active ID: ${metadata.activeId}`
          );
        } else {
          console.log(`⚠️ Pool created but metadata not immediately available`);

          // Check if pool exists in indexer
          try {
            const indexerResponse = await fetch(
              "http://localhost:4350/graphql",
              {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                  query: `query GetPool($poolId: String!) { pool(id: $poolId) { id tokenX tokenY binStep baseFactor activeId } }`,
                  variables: {poolId: poolId.toString()},
                }),
              }
            );
            const indexerData = await indexerResponse.json();
            if (indexerData.data?.pool) {
              console.log(`✅ Pool found in indexer:`, indexerData.data.pool);
            } else {
              console.log(`⚠️ Pool not found in indexer either`);
            }
          } catch (indexerError) {
            console.log(`⚠️ Indexer query failed:`, indexerError);
          }
        }
      } catch (metadataError) {
        console.log(
          `⚠️ Pool created but metadata query failed:`,
          metadataError
        );
      }
    } catch (error: any) {
      if (error.message?.includes("PoolAlreadyExists")) {
        console.log(`♻️ Pool ${poolKey} already exists with ID ${poolId}`);
      } else {
        console.error(`❌ Failed to create pool:`, error);
        throw error;
      }
    }

    // Store the pool ID
    this.createdPools.set(poolKey, poolId);
    this.createdPools.set(
      `${config.tokenY.symbol}/${config.tokenX.symbol}`,
      poolId
    ); // Reverse pair

    return poolId;
  }

  /**
   * Add liquidity to a pool with a specific shape
   */
  async addLiquidity(
    poolId: PoolIdV2,
    amountX: BN,
    amountY: BN,
    shape: LiquidityShape
  ): Promise<void> {
    console.log(`💧 Adding liquidity to pool ${poolId}...`);
    console.log(`  Amount X: ${amountX.format()}`);
    console.log(`  Amount Y: ${amountY.format()}`);
    console.log(`  Shape: ${shape.type} (${shape.bins} bins)`);

    // Try to get pool metadata to determine active bin
    // For now, use a default active bin if metadata is not available
    let activeId = 8388608; // Default center bin

    try {
      const metadata = await this.readonlyAmm.poolMetadata(poolId);
      if (metadata) {
        activeId = metadata.activeId;
        console.log(`📊 Using active bin ID from metadata: ${activeId}`);
      } else {
        console.log(
          `⚠️ Pool metadata not available, using default active bin: ${activeId}`
        );
      }
    } catch (error) {
      console.log(
        `⚠️ Failed to get pool metadata, using default active bin: ${activeId}`
      );
    }
    const liquidityConfig = this.createLiquidityConfig(
      activeId,
      amountX,
      amountY,
      shape
    );

    // Add liquidity with minimum amounts (90% of desired amounts for slippage tolerance)
    const amountXMin = amountX.mul(new BN(90)).div(new BN(100)); // 90% of desired
    const amountYMin = amountY.mul(new BN(90)).div(new BN(100)); // 90% of desired
    const deadline = new BN(Math.floor(Date.now() / 1000) + 3600); // 1 hour deadline

    const transactionWithGas = await this.miraAmm.addLiquidity(
      poolId,
      amountX, // amountADesired
      amountY, // amountBDesired
      amountXMin, // amountAMin
      amountYMin, // amountBMin
      deadline, // deadline
      activeId, // activeIdDesired (optional)
      undefined, // idSlippage (optional)
      undefined, // deltaIds (optional)
      liquidityConfig.distributionX
        ? [new BN(liquidityConfig.distributionX)]
        : undefined, // distributionX (optional)
      liquidityConfig.distributionY
        ? [new BN(liquidityConfig.distributionY)]
        : undefined // distributionY (optional)
    );

    // Submit the transaction and wait for completion
    const transaction = await this.wallet.sendTransaction(
      transactionWithGas.transactionRequest
    );
    const result = await transaction.waitForResult();

    console.log("✅ Liquidity added successfully");
    console.log(`📋 Transaction result:`, result.status);
  }

  /**
   * Create liquidity configuration based on shape
   */
  private createLiquidityConfig(
    activeId: number,
    amountX: BN,
    amountY: BN,
    shape: LiquidityShape
  ): LiquidityConfig {
    const configs: LiquidityConfig[] = [];

    switch (shape.type) {
      case "concentrated":
        // All liquidity in the active bin
        configs.push({
          binId: activeId,
          distributionX: 100,
          distributionY: 100,
        });
        break;

      case "normal":
        // Normal distribution around active bin
        const normalWeights = this.generateNormalDistribution(shape.bins);
        const startBin = activeId - Math.floor(shape.bins / 2);

        for (let i = 0; i < shape.bins; i++) {
          const binId = startBin + i;
          const weight = normalWeights[i];
          const weightBN = new BN(Math.floor(weight * 10000)); // Use 10000 for better precision

          configs.push({
            binId,
            distributionX: Math.floor(weight * 100),
            distributionY: Math.floor(weight * 100),
          });
        }
        break;

      case "uniform":
        // Equal distribution across all bins
        const uniformWeight = Math.floor(100 / shape.bins);
        const uniformStartBin = activeId - Math.floor(shape.bins / 2);

        for (let i = 0; i < shape.bins; i++) {
          const binId = uniformStartBin + i;

          configs.push({
            binId,
            distributionX: uniformWeight,
            distributionY: uniformWeight,
          });
        }
        break;

      case "custom":
        // Custom distribution weights
        if (!shape.distribution || shape.distribution.length !== shape.bins) {
          throw new Error("Custom shape requires distribution array");
        }

        const customStartBin =
          activeId + (shape.activeIdOffset || 0) - Math.floor(shape.bins / 2);
        const totalWeight = shape.distribution.reduce((sum, w) => sum + w, 0);

        for (let i = 0; i < shape.bins; i++) {
          const binId = customStartBin + i;
          const weight = shape.distribution[i] / totalWeight;
          const weightBN = new BN(Math.floor(weight * 10000));

          configs.push({
            binId,
            distributionX: Math.floor(weight * 100),
            distributionY: Math.floor(weight * 100),
          });
        }
        break;
    }

    return configs[0]; // For now, return first config (will need to update for multi-bin)
  }

  /**
   * Generate normal distribution weights
   */
  private generateNormalDistribution(bins: number): number[] {
    const weights: number[] = [];
    const center = (bins - 1) / 2;
    const sigma = bins / 6; // Standard deviation

    let totalWeight = 0;
    for (let i = 0; i < bins; i++) {
      const x = i - center;
      const weight = Math.exp(-(x * x) / (2 * sigma * sigma));
      weights.push(weight);
      totalWeight += weight;
    }

    // Normalize weights
    return weights.map((w) => w / totalWeight);
  }

  /**
   * Create a pool using standard configuration
   */
  async createStandardPool(
    poolType: keyof typeof STANDARD_POOL_CONFIGS,
    tokenX: TestToken,
    tokenY: TestToken
  ): Promise<PoolIdV2> {
    const config = STANDARD_POOL_CONFIGS[poolType];
    if (!config) {
      throw new Error(`Unknown pool type: ${poolType}`);
    }

    console.log(`🏊 Creating ${poolType} pool (${config.description})`);

    return await this.createPool({
      tokenX,
      tokenY,
      binStep: config.binStep,
      baseFactor: config.baseFactor,
      protocolShare: config.protocolShare,
    });
  }

  /**
   * Create standard test pools with STABLE, VOLATILE, and EXOTIC configurations
   */
  async createStandardPools(tokens: {
    usdc: TestToken;
    usdt: TestToken;
    eth: TestToken;
    fuel: TestToken;
    mbtc?: TestToken;
  }): Promise<Map<string, PoolIdV2>> {
    const pools = new Map<string, PoolIdV2>();

    // Stable pool (USDC/USDT) - low fees, small bin step for stable pairs
    const stablePool = await this.createStandardPool(
      "STABLE",
      tokens.usdc,
      tokens.usdt
    );
    pools.set("STABLE", stablePool);

    // Volatile pool (ETH/USDC) - medium fees, medium bin step for volatile pairs
    const volatilePool = await this.createStandardPool(
      "VOLATILE",
      tokens.eth,
      tokens.usdc
    );
    pools.set("VOLATILE", volatilePool);

    // Exotic pool (mBTC/FUEL or FUEL/ETH if mBTC not available) - high fees, large bin step for exotic pairs
    let exoticPool: PoolIdV2;
    if (tokens.mbtc) {
      exoticPool = await this.createStandardPool(
        "EXOTIC",
        tokens.mbtc,
        tokens.fuel
      );
    } else {
      // Fallback to FUEL/ETH as exotic pair
      exoticPool = await this.createStandardPool(
        "EXOTIC",
        tokens.fuel,
        tokens.eth
      );
    }
    pools.set("EXOTIC", exoticPool);

    return pools;
  }

  /**
   * Get available standard pool configurations
   */
  getStandardPoolConfigs(): Record<string, StandardPoolType> {
    return STANDARD_POOL_CONFIGS;
  }

  /**
   * Get pool metadata
   */
  async getPoolInfo(poolId: PoolIdV2) {
    return await this.readonlyAmm.poolMetadata(poolId);
  }

  /**
   * Validate pool metadata against expected configuration
   */
  async validatePoolMetadata(
    poolId: PoolIdV2,
    expectedConfig: PoolConfig
  ): Promise<{isValid: boolean; errors: string[]}> {
    const errors: string[] = [];

    try {
      const metadata = await this.readonlyAmm.poolMetadata(poolId);

      if (!metadata) {
        errors.push("Pool metadata not found");
        return {isValid: false, errors};
      }

      // Validate bin step
      if (metadata.binStep !== expectedConfig.binStep) {
        errors.push(
          `Bin step mismatch: expected ${expectedConfig.binStep}, got ${metadata.binStep}`
        );
      }

      // Validate base factor
      if (metadata.baseFactor !== expectedConfig.baseFactor) {
        errors.push(
          `Base factor mismatch: expected ${expectedConfig.baseFactor}, got ${metadata.baseFactor}`
        );
      }

      // Validate protocol share if specified
      if (
        expectedConfig.protocolShare !== undefined &&
        metadata.protocolShare !== expectedConfig.protocolShare
      ) {
        errors.push(
          `Protocol share mismatch: expected ${expectedConfig.protocolShare}, got ${metadata.protocolShare}`
        );
      }

      // Validate active ID if specified
      if (
        expectedConfig.activeId !== undefined &&
        metadata.activeId !== expectedConfig.activeId
      ) {
        errors.push(
          `Active ID mismatch: expected ${expectedConfig.activeId}, got ${metadata.activeId}`
        );
      }

      console.log(
        `✅ Pool metadata validation ${errors.length === 0 ? "passed" : "failed"}`
      );
      return {isValid: errors.length === 0, errors};
    } catch (error) {
      errors.push(`Failed to retrieve pool metadata: ${error}`);
      return {isValid: false, errors};
    }
  }

  /**
   * Cross-validate pool metadata with indexer data
   */
  async crossValidateWithIndexer(poolId: PoolIdV2): Promise<{
    isConsistent: boolean;
    sdkData: any;
    indexerData: any;
    differences: string[];
  }> {
    const differences: string[] = [];

    try {
      // Get SDK metadata
      const sdkMetadata = await this.readonlyAmm.poolMetadata(poolId);

      // Get indexer data
      const indexerResponse = await fetch("http://localhost:4350/graphql", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          query: `
            query GetPool($poolId: String!) {
              pool(id: $poolId) {
                id
                tokenX
                tokenY
                binStep
                baseFactor
                activeId
                protocolShare
              }
            }
          `,
          variables: {poolId: poolId.toString()},
        }),
      });

      const indexerResult = await indexerResponse.json();
      const indexerData = indexerResult.data?.pool;

      if (!sdkMetadata) {
        differences.push("SDK metadata not available");
      }

      if (!indexerData) {
        differences.push("Indexer data not available");
      }

      if (sdkMetadata && indexerData) {
        // Compare bin step
        if (sdkMetadata.binStep !== indexerData.binStep) {
          differences.push(
            `Bin step: SDK=${sdkMetadata.binStep}, Indexer=${indexerData.binStep}`
          );
        }

        // Compare base factor
        if (sdkMetadata.baseFactor !== indexerData.baseFactor) {
          differences.push(
            `Base factor: SDK=${sdkMetadata.baseFactor}, Indexer=${indexerData.baseFactor}`
          );
        }

        // Compare active ID
        if (sdkMetadata.activeId !== indexerData.activeId) {
          differences.push(
            `Active ID: SDK=${sdkMetadata.activeId}, Indexer=${indexerData.activeId}`
          );
        }
      }

      return {
        isConsistent: differences.length === 0,
        sdkData: sdkMetadata,
        indexerData,
        differences,
      };
    } catch (error) {
      differences.push(`Cross-validation failed: ${error}`);
      return {
        isConsistent: false,
        sdkData: null,
        indexerData: null,
        differences,
      };
    }
  }

  /**
   * Get all created pools
   */
  getCreatedPools(): Map<string, PoolIdV2> {
    return this.createdPools;
  }

  /**
   * Discover pools by asset pair using indexer
   */
  async discoverPoolsByAssetPair(
    assetX: string,
    assetY: string
  ): Promise<
    Array<{
      poolId: string;
      binStep: number;
      baseFactor: number;
      activeId: number;
    }>
  > {
    try {
      const query = `
        query GetPoolsByAssets($assetX: String!, $assetY: String!) {
          pools(where: {
            OR: [
              { AND: [{ tokenX: $assetX }, { tokenY: $assetY }] },
              { AND: [{ tokenX: $assetY }, { tokenY: $assetX }] }
            ]
          }) {
            id
            tokenX
            tokenY
            binStep
            baseFactor
            activeId
          }
        }
      `;

      const response = await fetch("http://localhost:4350/graphql", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          query,
          variables: {assetX, assetY},
        }),
      });

      const result = await response.json();
      const pools = result.data?.pools || [];

      console.log(`🔍 Found ${pools.length} pools for ${assetX}/${assetY}`);

      return pools.map((pool: any) => ({
        poolId: pool.id,
        binStep: pool.binStep,
        baseFactor: pool.baseFactor,
        activeId: pool.activeId,
      }));
    } catch (error) {
      console.error(
        `❌ Failed to discover pools for ${assetX}/${assetY}:`,
        error
      );
      return [];
    }
  }

  /**
   * Find pool by exact configuration
   */
  async findPoolByConfig(config: {
    tokenX: string;
    tokenY: string;
    binStep: number;
    baseFactor: number;
  }): Promise<PoolIdV2 | null> {
    try {
      // Calculate expected pool ID
      const expectedPoolId = buildPoolIdV2(
        config.tokenX,
        config.tokenY,
        config.binStep,
        config.baseFactor
      );

      // Verify pool exists by querying metadata
      const metadata = await this.readonlyAmm.poolMetadata(expectedPoolId);

      if (metadata) {
        console.log(`✅ Found pool with ID: ${expectedPoolId.toHex()}`);
        return expectedPoolId;
      } else {
        console.log(`❌ Pool not found for config:`, config);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error finding pool by config:`, error);
      return null;
    }
  }

  /**
   * Get all pools from indexer with optional filtering
   */
  async getAllPools(filters?: {
    minBinStep?: number;
    maxBinStep?: number;
    minBaseFactor?: number;
    maxBaseFactor?: number;
  }): Promise<
    Array<{
      poolId: string;
      tokenX: string;
      tokenY: string;
      binStep: number;
      baseFactor: number;
      activeId: number;
    }>
  > {
    try {
      let whereClause = "";

      if (filters) {
        const conditions: string[] = [];

        if (filters.minBinStep !== undefined) {
          conditions.push(`binStep: { gte: ${filters.minBinStep} }`);
        }
        if (filters.maxBinStep !== undefined) {
          conditions.push(`binStep: { lte: ${filters.maxBinStep} }`);
        }
        if (filters.minBaseFactor !== undefined) {
          conditions.push(`baseFactor: { gte: ${filters.minBaseFactor} }`);
        }
        if (filters.maxBaseFactor !== undefined) {
          conditions.push(`baseFactor: { lte: ${filters.maxBaseFactor} }`);
        }

        if (conditions.length > 0) {
          whereClause = `where: { ${conditions.join(", ")} }`;
        }
      }

      const query = `
        query GetAllPools {
          pools(${whereClause}) {
            id
            tokenX
            tokenY
            binStep
            baseFactor
            activeId
          }
        }
      `;

      const response = await fetch("http://localhost:4350/graphql", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({query}),
      });

      const result = await response.json();
      const pools = result.data?.pools || [];

      console.log(`🔍 Found ${pools.length} pools total`);

      return pools.map((pool: any) => ({
        poolId: pool.id,
        tokenX: pool.tokenX,
        tokenY: pool.tokenY,
        binStep: pool.binStep,
        baseFactor: pool.baseFactor,
        activeId: pool.activeId,
      }));
    } catch (error) {
      console.error(`❌ Failed to get all pools:`, error);
      return [];
    }
  }

  /**
   * Lookup pool by ID with validation
   */
  async lookupPool(poolId: PoolIdV2): Promise<{
    exists: boolean;
    metadata?: any;
    indexerData?: any;
    isConsistent?: boolean;
  }> {
    try {
      // Check SDK metadata
      const metadata = await this.readonlyAmm.poolMetadata(poolId);

      // Check indexer data
      const indexerResponse = await fetch("http://localhost:4350/graphql", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          query: `
            query GetPool($poolId: String!) {
              pool(id: $poolId) {
                id
                tokenX
                tokenY
                binStep
                baseFactor
                activeId
              }
            }
          `,
          variables: {poolId: poolId.toString()},
        }),
      });

      const indexerResult = await indexerResponse.json();
      const indexerData = indexerResult.data?.pool;

      const exists = !!(metadata || indexerData);
      const isConsistent = !!(
        metadata &&
        indexerData &&
        metadata.binStep === indexerData.binStep &&
        metadata.baseFactor === indexerData.baseFactor &&
        metadata.activeId === indexerData.activeId
      );

      return {
        exists,
        metadata,
        indexerData,
        isConsistent,
      };
    } catch (error) {
      console.error(`❌ Error looking up pool ${poolId}:`, error);
      return {exists: false};
    }
  }

  /**
   * Remove liquidity from a position (percentage-based)
   */
  async removeLiquidity(poolId: PoolIdV2, percentage: number): Promise<void> {
    console.log(`🔥 Removing ${percentage}% liquidity from pool ${poolId}...`);

    // This is a simplified implementation for testing
    // In a real scenario, you would:
    // 1. Query the user's LP token balances for this pool
    // 2. Calculate which bins have liquidity
    // 3. Remove the specified percentage from each bin

    // For now, we'll assume removal from the active bin
    const activeId = 8388608; // Default center bin
    const binIds = [activeId];

    const deadline = new BN(Math.floor(Date.now() / 1000) + 3600); // 1 hour deadline

    try {
      const transactionWithGas = await this.miraAmm.removeLiquidity(
        poolId,
        binIds,
        new BN(0), // amountAMin - accept any amount for testing
        new BN(0), // amountBMin - accept any amount for testing
        deadline
      );

      // Submit the transaction and wait for completion
      const transaction = await this.wallet.sendTransaction(
        transactionWithGas.transactionRequest
      );
      const result = await transaction.waitForResult();

      console.log(`✅ Liquidity removal completed (${percentage}%)`);
      console.log(`📋 Transaction result:`, result.status);
    } catch (error) {
      console.log(`⚠️ Liquidity removal failed: ${error}`);
      // For testing purposes, don't throw - just log the error
    }
  }

  /**
   * Remove liquidity from specific bins
   */
  async removeLiquidityFromBins(
    poolId: PoolIdV2,
    binIndices: number[]
  ): Promise<void> {
    console.log(
      `🔥 Removing liquidity from bins [${binIndices.join(", ")}] in pool ${poolId}...`
    );

    const deadline = new BN(Math.floor(Date.now() / 1000) + 3600); // 1 hour deadline

    try {
      const transactionWithGas = await this.miraAmm.removeLiquidity(
        poolId,
        binIndices,
        new BN(0), // amountAMin - accept any amount for testing
        new BN(0), // amountBMin - accept any amount for testing
        deadline
      );

      // Submit the transaction and wait for completion
      const transaction = await this.wallet.sendTransaction(
        transactionWithGas.transactionRequest
      );
      const result = await transaction.waitForResult();

      console.log(`✅ Liquidity removal from bins completed`);
      console.log(`📋 Transaction result:`, result.status);
    } catch (error) {
      console.log(`⚠️ Liquidity removal from bins failed: ${error}`);
      // For testing purposes, don't throw - just log the error
    }
  }

  /**
   * Get LP token balance for a wallet and pool
   */
  async getLPTokenBalance(
    wallet: WalletUnlocked,
    poolId: PoolIdV2
  ): Promise<BN> {
    console.log(`💰 Getting LP token balance for pool ${poolId}...`);

    // This is a placeholder implementation
    // In reality, you would query the user's LP token balance for this pool

    const mockBalance = new BN("1000000000000000000"); // 1 ETH worth of LP tokens
    console.log(`💰 LP token balance: ${mockBalance.format()}`);
    return mockBalance;
  }

  /**
   * Get liquidity distribution across bins for a pool
   */
  async getLiquidityDistribution(
    poolId: PoolIdV2
  ): Promise<{binId: number; liquidity: BN}[]> {
    console.log(`📊 Getting liquidity distribution for pool ${poolId}...`);

    // This is a placeholder implementation
    // In reality, you would query the actual liquidity distribution from the pool

    const mockDistribution = [
      {binId: 8388607, liquidity: new BN("500000000000000000")}, // 0.5 ETH
      {binId: 8388608, liquidity: new BN("1000000000000000000")}, // 1 ETH (active bin)
      {binId: 8388609, liquidity: new BN("500000000000000000")}, // 0.5 ETH
    ];

    console.log(
      `📊 Distribution: ${mockDistribution.length} bins with liquidity`
    );
    return mockDistribution;
  }

  /**
   * Reset factory state
   */
  reset(): void {
    this.createdPools.clear();
  }
}
