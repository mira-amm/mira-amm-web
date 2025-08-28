import {AssetId, BigNumberish, BN, Provider} from "fuels";

import {
  Asset,
  PoolIdV2,
  PoolMetadataV2,
  Amounts,
  BinLiquidityInfo,
} from "../model";

import {MockStateManager} from "./MockStateManager";
import {MockSDKConfig, DEFAULT_MOCK_CONFIG} from "./types";

/**
 * Mock provider interface for compatibility
 */
export interface MockProvider {
  getBaseAssetId(): Promise<string>;
}

/**
 * MockReadonlyMiraAmmV2 - Mock implementation of read-only operations for Mira v2 binned liquidity pools
 *
 * This class provides a mock implementation that matches the real ReadonlyMiraAmmV2 interface
 * for testing and development without requiring blockchain interactions. It reads from the
 * mock state manager to provide realistic pool data.
 *
 * Key features:
 * - Full interface compatibility with real ReadonlyMiraAmmV2
 * - Reads from persistent mock state
 * - Bin-specific liquidity queries
 * - Swap preview calculations using mock data
 * - Batch operations for efficient testing
 *
 * @example
 * ```typescript
 * import { MockProvider, MockReadonlyMiraAmmV2 } from "mira-dex-ts";
 *
 * const provider = new MockProvider();
 * const readonlyAmm = new MockReadonlyMiraAmmV2(provider);
 *
 * // Query pool metadata
 * const poolId = new BN("12345");
 * const metadata = await readonlyAmm.poolMetadata(poolId);
 * console.log(`Active bin: ${metadata?.activeId}`);
 *
 * // Get bin liquidity
 * const liquidity = await readonlyAmm.getBinLiquidity(poolId, 8388608);
 * console.log(`Bin liquidity: ${liquidity?.assetA} A, ${liquidity?.assetB} B`);
 * ```
 */
export class MockReadonlyMiraAmmV2 {
  private provider: MockProvider;
  private stateManager: MockStateManager;
  private config: MockSDKConfig;

  /**
   * Creates a new MockReadonlyMiraAmmV2 instance for querying mock v2 pool data
   *
   * @param provider - Mock provider for compatibility
   * @param contractId - Optional contract ID (ignored in mock)
   * @param config - Optional configuration for mock behavior
   */
  constructor(
    provider: MockProvider | Provider,
    contractId?: string,
    config?: Partial<MockSDKConfig>
  ) {
    this.provider = provider as MockProvider;
    this.config = {...DEFAULT_MOCK_CONFIG, ...config};
    this.stateManager = new MockStateManager(this.config);
  }

  /**
   * Gets the mock contract ID (for interface compatibility)
   *
   * @returns A mock contract ID as a B256 string
   */
  id(): string {
    return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  }

  /**
   * Get comprehensive metadata for a single v2 pool
   *
   * @param poolId - The v2 pool identifier (BN)
   * @returns Pool metadata or null if pool doesn't exist
   */
  async poolMetadata(poolId: PoolIdV2): Promise<PoolMetadataV2 | null> {
    const pool = this.stateManager.getPool(poolId);
    if (!pool) {
      return null;
    }

    return pool.metadata;
  }

  /**
   * Get metadata for multiple v2 pools efficiently in a single batch operation
   *
   * @param poolIds - Array of v2 pool identifiers to query
   * @returns Array of pool metadata (null for non-existent pools)
   */
  async poolMetadataBatch(
    poolIds: PoolIdV2[]
  ): Promise<(PoolMetadataV2 | null)[]> {
    const results: (PoolMetadataV2 | null)[] = [];

    for (const poolId of poolIds) {
      const metadata = await this.poolMetadata(poolId);
      results.push(metadata);
    }

    return results;
  }

  /**
   * Get the base fee rate for a specific v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @returns Base fee rate as a BN (typically in basis points)
   */
  async fees(poolId: PoolIdV2): Promise<BN> {
    const pool = this.stateManager.getPool(poolId);
    if (!pool) {
      throw new Error(`Pool with ID ${poolId.toString()} not found`);
    }

    // Return a mock fee rate (30 basis points = 0.3%)
    return new BN(30);
  }

  /**
   * Get liquidity reserves for a specific bin in a v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @param binId - The specific bin identifier to query
   * @returns Token amounts in the bin, or null if bin is empty/doesn't exist
   */
  async getBinLiquidity(
    poolId: PoolIdV2,
    binId: BigNumberish
  ): Promise<Amounts | null> {
    const pool = this.stateManager.getPool(poolId);
    if (!pool) {
      return null;
    }

    const binIdNum = Number(binId.toString());
    const binState = pool.bins.get(binIdNum);
    if (!binState) {
      return null;
    }

    return {
      x: binState.reserves.assetA,
      y: binState.reserves.assetB,
    };
  }

  /**
   * Get the currently active bin ID for a v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @returns Active bin ID, or null if pool is not initialized
   */
  async getActiveBin(poolId: PoolIdV2): Promise<number | null> {
    const pool = this.stateManager.getPool(poolId);
    if (!pool) {
      return null;
    }

    return pool.activeBinId;
  }

  /**
   * Get liquidity information for a range of consecutive bins
   *
   * @param poolId - The v2 pool identifier
   * @param startBinId - First bin ID in the range (inclusive)
   * @param endBinId - Last bin ID in the range (inclusive)
   * @returns Array of bin liquidity information
   */
  async getBinRange(
    poolId: PoolIdV2,
    startBinId: BigNumberish,
    endBinId: BigNumberish
  ): Promise<BinLiquidityInfo[]> {
    const pool = this.stateManager.getPool(poolId);
    if (!pool) {
      throw new Error(`Pool with ID ${poolId.toString()} not found`);
    }

    const startId = Number(startBinId.toString());
    const endId = Number(endBinId.toString());

    if (startId > endId) {
      throw new Error("Start bin ID must be less than or equal to end bin ID");
    }

    const binInfos: BinLiquidityInfo[] = [];

    for (let binId = startId; binId <= endId; binId++) {
      const binState = pool.bins.get(binId);

      if (binState) {
        binInfos.push({
          binId,
          liquidity: {
            x: binState.reserves.assetA,
            y: binState.reserves.assetB,
          },
          price: binState.price,
        });
      } else {
        // Include empty bins with zero liquidity
        binInfos.push({
          binId,
          liquidity: {
            x: new BN(0),
            y: new BN(0),
          },
          price: this.calculateBinPrice(binId, pool.metadata.pool.bin_step),
        });
      }
    }

    return binInfos;
  }

  /**
   * Preview swap exact input for v2 pools with binned liquidity
   *
   * @param assetIdIn - Input asset ID
   * @param assetAmountIn - Input amount
   * @param pools - Array of pool IDs for routing
   * @returns Expected output asset and amount
   */
  async previewSwapExactInput(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolIdV2[]
  ): Promise<Asset> {
    const amountsOut = await this.getAmountsOut(
      assetIdIn,
      assetAmountIn,
      pools
    );
    return amountsOut[amountsOut.length - 1];
  }

  /**
   * Preview swap exact output for v2 pools with binned liquidity
   *
   * @param assetIdOut - Output asset ID
   * @param assetAmountOut - Output amount
   * @param pools - Array of pool IDs for routing
   * @returns Required input asset and amount
   */
  async previewSwapExactOutput(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolIdV2[]
  ): Promise<Asset> {
    const amountsIn = await this.getAmountsIn(
      assetIdOut,
      assetAmountOut,
      pools
    );
    return amountsIn[0];
  }

  /**
   * Get amounts out for multi-hop trades through v2 pools
   *
   * @param assetIdIn - Input asset ID
   * @param assetAmountIn - Input amount
   * @param pools - Array of pool IDs for routing
   * @returns Array of assets and amounts for each hop
   */
  async getAmountsOut(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolIdV2[]
  ): Promise<Asset[]> {
    const amount = new BN(assetAmountIn.toString());

    if (amount.lte(0)) {
      throw new Error("Input amount must be positive");
    }

    if (pools.length === 0) {
      throw new Error("At least one pool must be provided for routing");
    }

    const amounts: Asset[] = [[assetIdIn, amount]];
    let currentAsset = assetIdIn;
    let currentAmount = amount;

    for (const poolId of pools) {
      const pool = this.stateManager.getPool(poolId);
      if (!pool) {
        throw new Error(`Pool with ID ${poolId.toString()} not found`);
      }

      // Determine output asset for this hop
      const outputAsset =
        pool.metadata.pool.asset_x.bits === currentAsset.bits
          ? pool.metadata.pool.asset_y
          : pool.metadata.pool.asset_x;

      // Simplified swap calculation (in reality would traverse bins)
      // Apply a 0.3% fee and some slippage
      const feeAmount = currentAmount.mul(30).div(10000); // 0.3% fee
      const amountAfterFee = currentAmount.sub(feeAmount);

      // Simple price impact simulation (2% impact for demonstration)
      const priceImpact = amountAfterFee.mul(200).div(10000); // 2% impact
      const outputAmount = amountAfterFee.sub(priceImpact);

      amounts.push([outputAsset, outputAmount]);
      currentAsset = outputAsset;
      currentAmount = outputAmount;
    }

    return amounts;
  }

  /**
   * Get amounts in for multi-hop trades through v2 pools
   *
   * @param assetIdOut - Output asset ID
   * @param assetAmountOut - Output amount
   * @param pools - Array of pool IDs for routing
   * @returns Array of assets and amounts for each hop (in reverse order)
   */
  async getAmountsIn(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolIdV2[]
  ): Promise<Asset[]> {
    const amount = new BN(assetAmountOut.toString());

    if (amount.lte(0)) {
      throw new Error("Output amount must be positive");
    }

    if (pools.length === 0) {
      throw new Error("At least one pool must be provided for routing");
    }

    const amounts: Asset[] = [];
    let currentAsset = assetIdOut;
    let currentAmount = amount;
    amounts.unshift([currentAsset, currentAmount]);

    // Process pools in reverse order for amounts in calculation
    for (let i = pools.length - 1; i >= 0; i--) {
      const poolId = pools[i];
      const pool = this.stateManager.getPool(poolId);
      if (!pool) {
        throw new Error(`Pool with ID ${poolId.toString()} not found`);
      }

      // Determine input asset for this hop
      const inputAsset =
        pool.metadata.pool.asset_x.bits === currentAsset.bits
          ? pool.metadata.pool.asset_y
          : pool.metadata.pool.asset_x;

      // Simplified reverse calculation
      // Account for fees and price impact in reverse
      const priceImpact = currentAmount.mul(200).div(10000); // 2% impact
      const amountBeforeImpact = currentAmount.add(priceImpact);

      const feeAmount = amountBeforeImpact.mul(30).div(10000); // 0.3% fee
      const inputAmount = amountBeforeImpact.add(feeAmount);

      amounts.unshift([inputAsset, inputAmount]);
      currentAsset = inputAsset;
      currentAmount = inputAmount;
    }

    return amounts;
  }

  /**
   * Get the state manager instance (for testing and debugging)
   *
   * @returns The mock state manager
   */
  getStateManager(): MockStateManager {
    return this.stateManager;
  }

  /**
   * Get the current configuration
   *
   * @returns The mock SDK configuration
   */
  getConfig(): MockSDKConfig {
    return {...this.config};
  }

  /**
   * Set a new state manager (for testing)
   *
   * @param stateManager - New state manager instance
   */
  setStateManager(stateManager: MockStateManager): void {
    this.stateManager = stateManager;
  }

  // ===== Private Helper Methods =====

  /**
   * Calculate price for a given bin ID
   * This is a simplified calculation - real implementation would use bin step math
   */
  private calculateBinPrice(binId: number, binStep: number): BN {
    // Simplified price calculation
    // In reality, this would use: price = (1 + binStep/10000)^(binId - ACTIVE_BIN_ID)
    const baseFactor = 1 + binStep / 10000;
    const activeId = 8388608; // Standard active bin ID
    const exponent = binId - activeId;

    // Simplified exponential calculation
    const price = Math.pow(baseFactor, exponent) * 1000000; // Base price of 1.0 with 6 decimals
    return new BN(Math.floor(price));
  }

  /**
   * Create a mock provider for testing
   */
  static createMockProvider(): MockProvider {
    return {
      async getBaseAssetId(): Promise<string> {
        return "0x0000000000000000000000000000000000000000000000000000000000000000";
      },
    };
  }
}
