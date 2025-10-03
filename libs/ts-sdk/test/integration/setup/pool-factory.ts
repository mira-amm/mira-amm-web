import {BN, WalletUnlocked} from "fuels";
import {MiraAmmV2} from "../../../src/sdk/mira_amm_v2";
import {ReadonlyMiraAmmV2} from "../../../src/sdk/readonly_mira_amm_v2";
import {TestToken} from "./token-factory";
import {LiquidityConfig, PoolIdV2} from "../../../src/sdk/model";

export interface PoolConfig {
  tokenX: TestToken;
  tokenY: TestToken;
  binStep: number;
  baseFactor: number;
  protocolShare?: number;
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

    // Create the pool
    const poolId = await this.miraAmm.createPool({
      assetX: {bits: config.tokenX.assetId},
      assetY: {bits: config.tokenY.assetId},
      binStep: config.binStep,
      baseFactor: config.baseFactor,
      hookContract: undefined,
      protocolShare: config.protocolShare || 0,
    });

    console.log(`✅ Pool created with ID: ${poolId}`);

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

    // Get pool metadata to determine active bin
    const metadata = await this.readonlyAmm.poolMetadata(poolId);
    if (!metadata) {
      throw new Error(`Pool ${poolId} not found`);
    }

    const activeId = metadata.activeId;
    const liquidityConfig = this.createLiquidityConfig(
      activeId,
      amountX,
      amountY,
      shape
    );

    // Add liquidity
    await this.miraAmm.addLiquidity(
      poolId,
      amountX,
      amountY,
      liquidityConfig,
      new BN(Math.floor(Date.now() / 1000) + 3600) // 1 hour deadline
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
          amountX,
          amountY,
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

          configs.push({
            binId,
            amountX: amountX
              .mul(new BN(Math.floor(weight * 100)))
              .div(new BN(100)),
            amountY: amountY
              .mul(new BN(Math.floor(weight * 100)))
              .div(new BN(100)),
            distributionX: weight * 100,
            distributionY: weight * 100,
          });
        }
        break;

      case "uniform":
        // Equal distribution across all bins
        const uniformWeight = 100 / shape.bins;
        const uniformStartBin = activeId - Math.floor(shape.bins / 2);

        for (let i = 0; i < shape.bins; i++) {
          const binId = uniformStartBin + i;

          configs.push({
            binId,
            amountX: amountX.div(new BN(shape.bins)),
            amountY: amountY.div(new BN(shape.bins)),
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

          configs.push({
            binId,
            amountX: amountX
              .mul(new BN(Math.floor(weight * 10000)))
              .div(new BN(10000)),
            amountY: amountY
              .mul(new BN(Math.floor(weight * 10000)))
              .div(new BN(10000)),
            distributionX: weight * 100,
            distributionY: weight * 100,
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
