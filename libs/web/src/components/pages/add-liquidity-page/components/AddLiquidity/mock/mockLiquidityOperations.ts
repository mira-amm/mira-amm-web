import {V2Position, V2BinPosition} from "../PositionManagementDashboard";
import {ConcentratedLiquidityMetrics} from "@/src/components/common/ConcentratedLiquidityMetrics";
import {
  mockTransactionSimulator,
  MockTransactionResult,
} from "./mockTransactionSimulator";
import {MockPoolScenario} from "./mockPoolScenarios";

export interface AddLiquidityParams {
  poolId: string;
  binId: number;
  amountX: string;
  amountY: string;
  minAmountX?: string;
  minAmountY?: string;
}

export interface RemoveLiquidityParams {
  poolId: string;
  binId: number;
  lpTokenAmount: string;
  minAmountX?: string;
  minAmountY?: string;
}

export interface LiquidityOperationResult {
  transaction: MockTransactionResult;
  updatedPosition?: V2Position;
  updatedMetrics?: ConcentratedLiquidityMetrics;
}

class MockLiquidityOperations {
  private poolStates = new Map<string, MockPoolScenario>();
  private userPositions = new Map<string, V2Position>();

  /**
   * Initialize pool state
   */
  initializePool(scenario: MockPoolScenario) {
    this.poolStates.set(scenario.poolId, {...scenario});
    if (scenario.position) {
      this.userPositions.set(scenario.poolId, {...scenario.position});
    }
  }

  /**
   * Add liquidity to a specific bin
   */
  async addLiquidity(
    params: AddLiquidityParams
  ): Promise<LiquidityOperationResult> {
    const transaction =
      await mockTransactionSimulator.simulateV2LiquidityOperation("add", 1);

    if (!transaction.success) {
      return {transaction};
    }

    // Update position state
    const updatedPosition = this.updatePositionAfterAdd(params);
    const updatedMetrics = this.updateMetricsAfterAdd(params);

    return {
      transaction,
      updatedPosition,
      updatedMetrics,
    };
  }

  /**
   * Remove liquidity from a specific bin
   */
  async removeLiquidity(
    params: RemoveLiquidityParams
  ): Promise<LiquidityOperationResult> {
    const transaction =
      await mockTransactionSimulator.simulateV2LiquidityOperation("remove", 1);

    if (!transaction.success) {
      return {transaction};
    }

    // Update position state
    const updatedPosition = this.updatePositionAfterRemove(params);
    const updatedMetrics = this.updateMetricsAfterRemove(params);

    return {
      transaction,
      updatedPosition,
      updatedMetrics,
    };
  }

  /**
   * Add liquidity to multiple bins
   */
  async addLiquidityMultipleBins(
    operations: AddLiquidityParams[]
  ): Promise<LiquidityOperationResult> {
    const transaction =
      await mockTransactionSimulator.simulateV2LiquidityOperation(
        "add",
        operations.length
      );

    if (!transaction.success) {
      return {transaction};
    }

    // Update position state for all operations
    let updatedPosition = this.userPositions.get(operations[0].poolId);
    let updatedMetrics = this.poolStates.get(operations[0].poolId)?.metrics;

    for (const params of operations) {
      updatedPosition = this.updatePositionAfterAdd(params, updatedPosition);
      updatedMetrics = this.updateMetricsAfterAdd(params, updatedMetrics);
    }

    return {
      transaction,
      updatedPosition,
      updatedMetrics,
    };
  }

  /**
   * Remove liquidity from multiple bins
   */
  async removeLiquidityMultipleBins(
    operations: RemoveLiquidityParams[]
  ): Promise<LiquidityOperationResult> {
    const transaction =
      await mockTransactionSimulator.simulateV2LiquidityOperation(
        "remove",
        operations.length
      );

    if (!transaction.success) {
      return {transaction};
    }

    // Update position state for all operations
    let updatedPosition = this.userPositions.get(operations[0].poolId);
    let updatedMetrics = this.poolStates.get(operations[0].poolId)?.metrics;

    for (const params of operations) {
      updatedPosition = this.updatePositionAfterRemove(params, updatedPosition);
      updatedMetrics = this.updateMetricsAfterRemove(params, updatedMetrics);
    }

    return {
      transaction,
      updatedPosition,
      updatedMetrics,
    };
  }

  /**
   * Get current position for a pool
   */
  getPosition(poolId: string): V2Position | undefined {
    return this.userPositions.get(poolId);
  }

  /**
   * Get current metrics for a pool
   */
  getMetrics(poolId: string): ConcentratedLiquidityMetrics | undefined {
    return this.poolStates.get(poolId)?.metrics;
  }

  /**
   * Update position after adding liquidity
   */
  private updatePositionAfterAdd(
    params: AddLiquidityParams,
    currentPosition?: V2Position
  ): V2Position {
    const position = currentPosition ||
      this.userPositions.get(params.poolId) || {
        poolId: params.poolId,
        bins: [],
        totalValue: {x: "0", y: "0"},
        totalFeesEarned: {x: "0", y: "0"},
      };

    // Find existing bin or create new one
    const existingBinIndex = position.bins.findIndex(
      (bin) => bin.binId === params.binId
    );

    if (existingBinIndex >= 0) {
      // Update existing bin
      const existingBin = position.bins[existingBinIndex];
      const newLpTokenAmount = (
        parseFloat(existingBin.lpTokenAmount) +
        parseFloat(params.amountX) +
        parseFloat(params.amountY)
      ).toString();
      const newAmountX = (
        parseFloat(existingBin.underlyingAmounts.x) + parseFloat(params.amountX)
      ).toString();
      const newAmountY = (
        parseFloat(existingBin.underlyingAmounts.y) + parseFloat(params.amountY)
      ).toString();

      position.bins[existingBinIndex] = {
        ...existingBin,
        lpTokenAmount: newLpTokenAmount,
        underlyingAmounts: {x: newAmountX, y: newAmountY},
      };
    } else {
      // Create new bin
      const newBin: V2BinPosition = {
        binId: params.binId,
        lpToken: this.generateLpTokenAddress(),
        lpTokenAmount: (
          parseFloat(params.amountX) + parseFloat(params.amountY)
        ).toString(),
        underlyingAmounts: {x: params.amountX, y: params.amountY},
        price: this.calculateBinPrice(params.binId),
        feesEarned: {x: "0", y: "0"},
        isActive: this.isBinActive(params.binId, params.poolId),
      };

      position.bins.push(newBin);
      position.bins.sort((a, b) => a.binId - b.binId);
    }

    // Update totals
    position.totalValue = this.calculateTotalValue(position.bins);

    // Update stored position
    this.userPositions.set(params.poolId, position);

    return position;
  }

  /**
   * Update position after removing liquidity
   */
  private updatePositionAfterRemove(
    params: RemoveLiquidityParams,
    currentPosition?: V2Position
  ): V2Position {
    const position = currentPosition || this.userPositions.get(params.poolId);

    if (!position) {
      throw new Error("No position found for pool");
    }

    const binIndex = position.bins.findIndex(
      (bin) => bin.binId === params.binId
    );

    if (binIndex === -1) {
      throw new Error("Bin not found in position");
    }

    const bin = position.bins[binIndex];
    const removePercentage =
      parseFloat(params.lpTokenAmount) / parseFloat(bin.lpTokenAmount);

    if (removePercentage >= 1) {
      // Remove entire bin
      position.bins.splice(binIndex, 1);
    } else {
      // Partial removal
      const newLpTokenAmount = (
        parseFloat(bin.lpTokenAmount) *
        (1 - removePercentage)
      ).toString();
      const newAmountX = (
        parseFloat(bin.underlyingAmounts.x) *
        (1 - removePercentage)
      ).toString();
      const newAmountY = (
        parseFloat(bin.underlyingAmounts.y) *
        (1 - removePercentage)
      ).toString();

      position.bins[binIndex] = {
        ...bin,
        lpTokenAmount: newLpTokenAmount,
        underlyingAmounts: {x: newAmountX, y: newAmountY},
      };
    }

    // Update totals
    position.totalValue = this.calculateTotalValue(position.bins);

    // Update stored position
    this.userPositions.set(params.poolId, position);

    return position;
  }

  /**
   * Update metrics after adding liquidity
   */
  private updateMetricsAfterAdd(
    params: AddLiquidityParams,
    currentMetrics?: ConcentratedLiquidityMetrics
  ): ConcentratedLiquidityMetrics {
    const metrics =
      currentMetrics || this.poolStates.get(params.poolId)?.metrics;

    if (!metrics) {
      throw new Error("No metrics found for pool");
    }

    // Update liquidity distribution
    const existingBinIndex = metrics.liquidityDistribution.findIndex(
      (bin) => bin.binId === params.binId
    );

    if (existingBinIndex >= 0) {
      // Update existing bin
      const existingBin = metrics.liquidityDistribution[existingBinIndex];
      metrics.liquidityDistribution[existingBinIndex] = {
        ...existingBin,
        liquidityX: (
          parseFloat(existingBin.liquidityX) + parseFloat(params.amountX)
        ).toString(),
        liquidityY: (
          parseFloat(existingBin.liquidityY) + parseFloat(params.amountY)
        ).toString(),
      };
    } else {
      // Add new bin
      metrics.liquidityDistribution.push({
        binId: params.binId,
        price: this.calculateBinPrice(params.binId),
        liquidityX: params.amountX,
        liquidityY: params.amountY,
        isActive: this.isBinActive(params.binId, params.poolId),
      });

      metrics.liquidityDistribution.sort((a, b) => a.binId - b.binId);
    }

    // Update total bins
    metrics.totalBins = metrics.liquidityDistribution.length;

    // Update utilization rate
    metrics.utilizationRate = this.calculateUtilizationRate(metrics);

    // Update pool state
    const poolState = this.poolStates.get(params.poolId);
    if (poolState) {
      poolState.metrics = metrics;
    }

    return metrics;
  }

  /**
   * Update metrics after removing liquidity
   */
  private updateMetricsAfterRemove(
    params: RemoveLiquidityParams,
    currentMetrics?: ConcentratedLiquidityMetrics
  ): ConcentratedLiquidityMetrics {
    const metrics =
      currentMetrics || this.poolStates.get(params.poolId)?.metrics;

    if (!metrics) {
      throw new Error("No metrics found for pool");
    }

    const binIndex = metrics.liquidityDistribution.findIndex(
      (bin) => bin.binId === params.binId
    );

    if (binIndex >= 0) {
      const bin = metrics.liquidityDistribution[binIndex];
      const position = this.userPositions.get(params.poolId);
      const userBin = position?.bins.find((b) => b.binId === params.binId);

      if (userBin) {
        const removePercentage =
          parseFloat(params.lpTokenAmount) / parseFloat(userBin.lpTokenAmount);

        if (removePercentage >= 1) {
          // Remove entire bin if no liquidity left
          metrics.liquidityDistribution.splice(binIndex, 1);
        } else {
          // Partial removal
          metrics.liquidityDistribution[binIndex] = {
            ...bin,
            liquidityX: (
              parseFloat(bin.liquidityX) *
              (1 - removePercentage)
            ).toString(),
            liquidityY: (
              parseFloat(bin.liquidityY) *
              (1 - removePercentage)
            ).toString(),
          };
        }
      }
    }

    // Update total bins
    metrics.totalBins = metrics.liquidityDistribution.length;

    // Update utilization rate
    metrics.utilizationRate = this.calculateUtilizationRate(metrics);

    // Update pool state
    const poolState = this.poolStates.get(params.poolId);
    if (poolState) {
      poolState.metrics = metrics;
    }

    return metrics;
  }

  /**
   * Helper methods
   */
  private generateLpTokenAddress(): string {
    const chars = "0123456789abcdef";
    let result = "0x";
    for (let i = 0; i < 40; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private calculateBinPrice(binId: number): number {
    // Simple price calculation based on bin ID
    // In real implementation, this would use the actual bin step and base price
    return 1000 + (binId - 10) * 50;
  }

  private isBinActive(binId: number, poolId: string): boolean {
    const metrics = this.poolStates.get(poolId)?.metrics;
    return metrics?.activeBin === binId || false;
  }

  private calculateTotalValue(bins: V2BinPosition[]): {x: string; y: string} {
    const totalX = bins.reduce(
      (sum, bin) => sum + parseFloat(bin.underlyingAmounts.x),
      0
    );
    const totalY = bins.reduce(
      (sum, bin) => sum + parseFloat(bin.underlyingAmounts.y),
      0
    );

    return {
      x: totalX.toString(),
      y: totalY.toString(),
    };
  }

  private calculateUtilizationRate(
    metrics: ConcentratedLiquidityMetrics
  ): number {
    const activeBins = metrics.liquidityDistribution.filter(
      (bin) => bin.isActive
    );
    const totalLiquidity = metrics.liquidityDistribution.reduce(
      (sum, bin) =>
        sum + parseFloat(bin.liquidityX) + parseFloat(bin.liquidityY),
      0
    );
    const activeLiquidity = activeBins.reduce(
      (sum, bin) =>
        sum + parseFloat(bin.liquidityX) + parseFloat(bin.liquidityY),
      0
    );

    return totalLiquidity > 0 ? (activeLiquidity / totalLiquidity) * 100 : 0;
  }

  /**
   * Reset all state
   */
  reset() {
    this.poolStates.clear();
    this.userPositions.clear();
  }
}

// Export singleton instance
export const mockLiquidityOperations = new MockLiquidityOperations();
