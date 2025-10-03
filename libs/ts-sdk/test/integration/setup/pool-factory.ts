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
    private ammContractId: string
  ) {
    this.miraAmm = new MiraAmmV2(wallet, ammContractId);
    this.readonlyAmm = new ReadonlyMiraAmmV2(wallet.provider, ammContractId);
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
          hookContract: undefined,
          protocolShare: config.protocolShare || 0,
        },
        activeId
      );

      // Submit the transaction and wait for completion
      const transaction = await this.wallet.sendTransaction(
        transactionWithGas.transactionRequest
      );
      const result = await transaction.waitForResult();

      console.log(`✅ Pool created with ID: ${poolId.toHex()}`);
    } catch (error: any) {
      if (error.message?.includes("PoolAlreadyExists")) {
        console.log(`♻️ Pool ${poolKey} already exists with ID ${poolId}`);
      } else {
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

    await this.miraAmm.addLiquidity(
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

    console.log("✅ Liquidity added successfully");
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
   * Create standard test pools
   */
  async createStandardPools(tokens: {
    usdc: TestToken;
    usdt: TestToken;
    eth: TestToken;
    fuel: TestToken;
  }): Promise<Map<string, PoolIdV2>> {
    const pools = new Map<string, PoolIdV2>();

    // Stable pool (USDC/USDT) - low fees, small bin step
    const stablePool = await this.createPool({
      tokenX: tokens.usdc,
      tokenY: tokens.usdt,
      binStep: 1,
      baseFactor: 5000,
    });
    pools.set("STABLE", stablePool);

    // Volatile pool (ETH/USDC) - medium fees, medium bin step
    const volatilePool = await this.createPool({
      tokenX: tokens.eth,
      tokenY: tokens.usdc,
      binStep: 20,
      baseFactor: 8000,
    });
    pools.set("VOLATILE", volatilePool);

    // Native pool (FUEL/USDC) - medium fees, medium bin step
    const nativePool = await this.createPool({
      tokenX: tokens.fuel,
      tokenY: tokens.usdc,
      binStep: 25,
      baseFactor: 10000,
    });
    pools.set("NATIVE", nativePool);

    return pools;
  }

  /**
   * Get pool metadata
   */
  async getPoolInfo(poolId: PoolIdV2) {
    return await this.readonlyAmm.poolMetadata(poolId);
  }

  /**
   * Get all created pools
   */
  getCreatedPools(): Map<string, PoolIdV2> {
    return this.createdPools;
  }

  /**
   * Reset factory state
   */
  reset(): void {
    this.createdPools.clear();
  }
}
