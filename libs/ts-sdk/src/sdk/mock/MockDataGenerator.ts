import {BN, AssetId} from "fuels";
import {
  MockPoolState,
  MockBinState,
  MockPoolScenario,
  MockSDKConfig,
} from "./types";
import {PoolMetadataV2, Amounts} from "../model";
import {MockDataFactory} from "./MockDataFactory";

/**
 * Configuration for generating pool scenarios
 */
export interface PoolScenarioConfig {
  /** Pool name/identifier */
  name: string;
  /** Pool description */
  description: string;
  /** Asset A (typically the base asset) */
  assetA: AssetId;
  /** Asset B (typically the quote asset) */
  assetB: AssetId;
  /** Bin step for the pool */
  binStep: number;
  /** Active bin ID */
  activeBinId: number;
  /** Base price for calculations */
  basePrice: BN;
  /** Total liquidity to distribute */
  totalLiquidity: {
    assetA: BN;
    assetB: BN;
  };
  /** Number of bins to create around active bin */
  binCount: number;
  /** Liquidity distribution type */
  distributionType: "uniform" | "concentrated" | "wide" | "asymmetric";
  /** 24-hour volume for the pool */
  volume24h?: BN;
}

/**
 * Volume data point for realistic metrics
 */
export interface VolumeDataPoint {
  /** Timestamp */
  timestamp: Date;
  /** Volume amount */
  volume: BN;
  /** Number of transactions */
  txCount: number;
}

/**
 * Generator for realistic mock pool data and scenarios
 */
export class MockDataGenerator {
  private static readonly FUEL_ETH_ASSET_ID =
    "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07";
  private static readonly FUEL_USDC_ASSET_ID =
    "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b";

  /**
   * Generate a realistic pool scenario based on configuration
   * @param config - Pool scenario configuration
   * @returns Complete mock pool scenario
   */
  static generatePoolScenario(config: PoolScenarioConfig): MockPoolScenario {
    const bins = this.generateBinDistribution(
      config.activeBinId,
      config.binCount,
      config.totalLiquidity,
      config.distributionType,
      config.basePrice,
      config.binStep
    );

    const poolMetadata: PoolMetadataV2 = {
      assetA: config.assetA,
      assetB: config.assetB,
      binStep: config.binStep,
      baseFactor: new BN(10000),
      filterPeriod: 30,
      decayPeriod: 600,
      reductionFactor: 5000,
      variableFeeControl: 40000,
      protocolShare: 1000, // 10%
      maxVolatilityAccumulator: new BN(350000),
      isOpen: true,
    };

    return {
      name: config.name,
      description: config.description,
      poolConfig: {
        poolId: `${config.assetA}-${config.assetB}-${config.binStep}`,
        metadata: poolMetadata,
        activeBinId: config.activeBinId,
      },
      bins: bins.map((bin) => ({
        binId: bin.binId,
        reserves: bin.reserves,
        lpTokens: bin.totalLpTokens,
      })),
    };
  }

  /**
   * Generate bin distribution around active bin
   * @param activeBin - Active bin ID
   * @param binCount - Total number of bins to create
   * @param totalLiquidity - Total liquidity to distribute
   * @param distributionType - Type of distribution
   * @param basePrice - Base price for calculations
   * @param binStep - Bin step for price calculations
   * @returns Array of bin states
   */
  static generateBinDistribution(
    activeBin: number,
    binCount: number,
    totalLiquidity: Amounts,
    distributionType: "uniform" | "concentrated" | "wide" | "asymmetric",
    basePrice: BN,
    binStep: number
  ): MockBinState[] {
    const bins: MockBinState[] = [];
    const halfBins = Math.floor(binCount / 2);

    for (let i = -halfBins; i <= halfBins; i++) {
      const binId = activeBin + i;
      const isActive = binId === activeBin;

      // Calculate price for this bin
      const binPrice = this.calculateBinPrice(basePrice, i, binStep);

      // Calculate liquidity distribution based on type
      const liquidityFactor = this.getLiquidityDistributionFactor(
        i,
        distributionType,
        binCount
      );

      // Distribute liquidity based on bin position and type
      const reserves = this.calculateBinReserves(
        totalLiquidity,
        liquidityFactor,
        i,
        isActive,
        distributionType
      );

      // Calculate LP tokens (simplified calculation)
      const lpTokens = this.calculateLpTokens(reserves, binPrice);

      bins.push({
        binId,
        reserves,
        totalLpTokens: lpTokens,
        price: binPrice,
        isActive,
        lastSwapTime: isActive
          ? new Date(Date.now() - Math.random() * 3600000)
          : undefined,
      });
    }

    return bins;
  }

  /**
   * Calculate price for a bin based on distance from active bin
   * @param basePrice - Base price at active bin
   * @param binOffset - Offset from active bin
   * @param binStep - Bin step in basis points
   * @returns Calculated bin price
   */
  static calculateBinPrice(
    basePrice: BN,
    binOffset: number,
    binStep: number
  ): BN {
    if (binOffset === 0) {
      return basePrice;
    }

    // Calculate price multiplier: (1 + binStep/10000)^binOffset
    const stepFactor = 1 + binStep / 10000;
    const multiplier = Math.pow(stepFactor, binOffset);

    // Convert to BN with precision
    const scaledMultiplier = Math.max(1, Math.floor(multiplier * 1000000));
    return basePrice.mul(scaledMultiplier).div(1000000);
  }

  /**
   * Get liquidity distribution factor based on distribution type
   * @param binOffset - Offset from active bin
   * @param distributionType - Type of distribution
   * @param totalBins - Total number of bins
   * @returns Liquidity factor (0-1)
   */
  private static getLiquidityDistributionFactor(
    binOffset: number,
    distributionType: "uniform" | "concentrated" | "wide" | "asymmetric",
    totalBins: number
  ): number {
    const absOffset = Math.abs(binOffset);
    const maxOffset = Math.floor(totalBins / 2);

    switch (distributionType) {
      case "uniform":
        return 1 / totalBins;

      case "concentrated":
        // Most liquidity in active bin, exponentially decreasing
        return absOffset === 0 ? 0.5 : Math.pow(0.5, absOffset + 1);

      case "wide":
        // More even distribution across bins
        return Math.max(0.1, 1 - (absOffset / maxOffset) * 0.7);

      case "asymmetric":
        // More liquidity on one side (simulating directional bias)
        if (binOffset <= 0) {
          return Math.max(0.1, 1 - (absOffset / maxOffset) * 0.5);
        } else {
          return Math.max(0.05, 1 - (absOffset / maxOffset) * 0.8);
        }

      default:
        return 1 / totalBins;
    }
  }

  /**
   * Calculate reserves for a specific bin
   * @param totalLiquidity - Total liquidity to distribute
   * @param liquidityFactor - Factor for this bin (0-1)
   * @param binOffset - Offset from active bin
   * @param isActive - Whether this is the active bin
   * @param distributionType - Distribution type
   * @returns Calculated reserves
   */
  private static calculateBinReserves(
    totalLiquidity: Amounts,
    liquidityFactor: number,
    binOffset: number,
    isActive: boolean,
    distributionType: string
  ): Amounts {
    const baseLiquidityA = totalLiquidity.assetA
      .mul(Math.floor(liquidityFactor * 1000))
      .div(1000);
    const baseLiquidityB = totalLiquidity.assetB
      .mul(Math.floor(liquidityFactor * 1000))
      .div(1000);

    if (isActive) {
      // Active bin has both assets
      return {
        assetA: baseLiquidityA,
        assetB: baseLiquidityB,
      };
    } else if (binOffset < 0) {
      // Bins below active price - primarily asset A
      return {
        assetA: baseLiquidityA.mul(2),
        assetB: new BN(0),
      };
    } else {
      // Bins above active price - primarily asset B
      return {
        assetA: new BN(0),
        assetB: baseLiquidityB.mul(2),
      };
    }
  }

  /**
   * Calculate LP tokens for given reserves and price
   * @param reserves - Token reserves
   * @param price - Bin price
   * @returns Calculated LP tokens
   */
  private static calculateLpTokens(reserves: Amounts, price: BN): BN {
    // Simplified LP token calculation
    // In reality, this would use the actual v2 math
    const valueA = reserves.assetA;
    const valueB = reserves.assetB.mul(1000).div(price); // Convert B to A terms
    return valueA.add(valueB);
  }

  /**
   * Generate volume data for realistic metrics
   * @param baseVolume - Base 24h volume
   * @param timeRange - Time range in hours
   * @returns Array of volume data points
   */
  static generateVolumeData(
    baseVolume: BN,
    timeRange: number = 24
  ): VolumeDataPoint[] {
    const dataPoints: VolumeDataPoint[] = [];
    const pointsCount = Math.min(timeRange, 24); // Max 24 points for 24 hours
    const intervalMs = (timeRange * 3600000) / pointsCount;

    for (let i = 0; i < pointsCount; i++) {
      const timestamp = new Date(
        Date.now() - (pointsCount - i - 1) * intervalMs
      );

      // Add some randomness to volume (±30%)
      const randomFactor = 0.7 + Math.random() * 0.6;
      const volume = baseVolume
        .mul(Math.floor(randomFactor * 1000))
        .div(1000)
        .div(pointsCount);

      // Random transaction count based on volume
      const txCount = Math.max(
        1,
        Math.floor(volume.div(1000000).toNumber() * (1 + Math.random()))
      );

      dataPoints.push({
        timestamp,
        volume,
        txCount,
      });
    }

    return dataPoints;
  }

  /**
   * Generate fee data based on volume and fee rate
   * @param volume - Trading volume
   * @param feeRate - Fee rate in basis points
   * @returns Generated fees
   */
  static generateFeeData(volume: BN, feeRate: number = 30): BN {
    // Fee rate is in basis points (30 = 0.3%)
    return volume.mul(feeRate).div(10000);
  }

  /**
   * Create predefined ETH/USDC pool scenario
   * @param distributionType - Liquidity distribution type
   * @returns ETH/USDC pool scenario
   */
  static createEthUsdcPoolScenario(
    distributionType:
      | "uniform"
      | "concentrated"
      | "wide"
      | "asymmetric" = "concentrated"
  ): MockPoolScenario {
    return this.generatePoolScenario({
      name: `ETH/USDC ${distributionType}`,
      description: `ETH/USDC pool with ${distributionType} liquidity distribution`,
      assetA: this.FUEL_ETH_ASSET_ID,
      assetB: this.FUEL_USDC_ASSET_ID,
      binStep: 25, // 0.25% bin step
      activeBinId: 8388608, // Neutral bin ID
      basePrice: new BN(2000000000), // $2000 USDC per ETH (with 6 decimals for USDC)
      totalLiquidity: {
        assetA: new BN("100000000000"), // 100 ETH (9 decimals)
        assetB: new BN("200000000000"), // 200,000 USDC (6 decimals)
      },
      binCount: 21, // 10 bins on each side + active bin
      distributionType,
      volume24h: new BN("50000000000"), // $50,000 daily volume
    });
  }

  /**
   * Create predefined USDC/ETH pool scenario (reverse pair)
   * @param distributionType - Liquidity distribution type
   * @returns USDC/ETH pool scenario
   */
  static createUsdcEthPoolScenario(
    distributionType:
      | "uniform"
      | "concentrated"
      | "wide"
      | "asymmetric" = "wide"
  ): MockPoolScenario {
    return this.generatePoolScenario({
      name: `USDC/ETH ${distributionType}`,
      description: `USDC/ETH pool with ${distributionType} liquidity distribution`,
      assetA: this.FUEL_USDC_ASSET_ID,
      assetB: this.FUEL_ETH_ASSET_ID,
      binStep: 25, // 0.25% bin step
      activeBinId: 8388608, // Neutral bin ID
      basePrice: new BN("500000000000000"), // 0.0005 ETH per USDC (inverted price)
      totalLiquidity: {
        assetA: new BN("200000000000"), // 200,000 USDC (6 decimals)
        assetB: new BN("100000000000"), // 100 ETH (9 decimals)
      },
      binCount: 15, // 7 bins on each side + active bin
      distributionType,
      volume24h: new BN("30000000000"), // $30,000 daily volume
    });
  }

  /**
   * Get all predefined pool scenarios
   * @returns Array of all predefined scenarios
   */
  static getAllPredefinedScenarios(): MockPoolScenario[] {
    return [
      this.createEthUsdcPoolScenario("concentrated"),
      this.createEthUsdcPoolScenario("wide"),
      this.createUsdcEthPoolScenario("wide"),
      this.createUsdcEthPoolScenario("asymmetric"),
    ];
  }

  /**
   * Create a custom pool scenario with specified parameters
   * @param config - Custom pool configuration
   * @returns Custom pool scenario
   */
  static createCustomPoolScenario(
    config: Partial<PoolScenarioConfig>
  ): MockPoolScenario {
    const defaultConfig: PoolScenarioConfig = {
      name: "Custom Pool",
      description: "Custom pool scenario",
      assetA: this.FUEL_ETH_ASSET_ID,
      assetB: this.FUEL_USDC_ASSET_ID,
      binStep: 25,
      activeBinId: 8388608,
      basePrice: new BN(2000000000),
      totalLiquidity: {
        assetA: new BN("10000000000"), // 10 ETH (9 decimals)
        assetB: new BN("20000000000"), // 20,000 USDC (6 decimals)
      },
      binCount: 11,
      distributionType: "concentrated",
      volume24h: new BN("10000000000"), // $10,000 daily volume
    };

    return this.generatePoolScenario({
      ...defaultConfig,
      ...config,
    });
  }

  /**
   * Generate realistic price movement data
   * @param currentPrice - Current price
   * @param volatility - Volatility factor (0-1)
   * @param timeSteps - Number of time steps
   * @returns Array of price movements
   */
  static generatePriceMovement(
    currentPrice: BN,
    volatility: number = 0.1,
    timeSteps: number = 24
  ): BN[] {
    const prices: BN[] = [currentPrice];
    let price = currentPrice;

    for (let i = 1; i < timeSteps; i++) {
      // Random walk with mean reversion
      const randomChange = (Math.random() - 0.5) * volatility;
      const meanReversion =
        -0.1 * Math.log(price.div(currentPrice).toNumber() || 1);
      const totalChange = randomChange + meanReversion;

      const changeMultiplier = Math.max(0.5, 1 + totalChange);
      const scaledMultiplier = Math.floor(changeMultiplier * 1000000);
      price = price.mul(scaledMultiplier).div(1000000);

      prices.push(price);
    }

    return prices;
  }

  /**
   * Get asset information for Fuel network
   * @param assetId - Asset ID
   * @returns Asset information
   */
  static getAssetInfo(assetId: string): {
    symbol: string;
    name: string;
    decimals: number;
  } {
    switch (assetId) {
      case this.FUEL_ETH_ASSET_ID:
        return {
          symbol: "ETH",
          name: "Ethereum",
          decimals: 9,
        };
      case this.FUEL_USDC_ASSET_ID:
        return {
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
        };
      default:
        return {
          symbol: "UNKNOWN",
          name: "Unknown Asset",
          decimals: 18,
        };
    }
  }
}
