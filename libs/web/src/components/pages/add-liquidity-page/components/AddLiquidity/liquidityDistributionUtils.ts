import type {LiquidityShape} from "./V2LiquidityConfig";

export function computeIdSlippageFromBps(
  binStepBps: number,
  slippageBps?: number
): number {
  if (binStepBps > 0 && typeof slippageBps === "number") {
    return Math.floor(slippageBps / binStepBps);
  }
  return 0;
}

function roundAndNormalizePercent(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.every((v) => v === 0)) return values.map(() => 0);
  const rounded = values.map((v) => Math.round(v));
  const sum = rounded.reduce((a, b) => a + b, 0);
  if (sum === 100) return rounded;
  const diff = 100 - sum;
  const idx = rounded.reduce(
    (bestIdx, val, i, arr) => (val > arr[bestIdx] ? i : bestIdx),
    0
  );
  rounded[idx] = Math.max(0, rounded[idx] + diff);
  return rounded;
}

function percentArrayToBps(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.every((v) => v === 0)) return values.map(() => 0);
  let bps = values.map((v) => Math.max(0, Math.min(100, v)) * 100);
  const sum = bps.reduce((a, b) => a + b, 0);
  if (sum !== 10000) {
    const diff = 10000 - sum;
    const idx = bps.reduce(
      (bestIdx, val, i, arrVals) => (val > arrVals[bestIdx] ? i : bestIdx),
      0
    );
    bps[idx] = Math.max(0, Math.min(10000, bps[idx] + diff));
  }
  return bps;
}

export function computeDistributionBpsForRaw(
  rawValues: number[],
  total: number
): number[] {
  if (rawValues.length === 0) return [];
  const percentages = rawValues.map((v) => (total > 0 ? (v / total) * 100 : 0));
  const normalizedPercent = roundAndNormalizePercent(percentages);
  return percentArrayToBps(normalizedPercent);
}

export function computeUtilizationRate(
  totalLiquidityX: number,
  totalLiquidityY: number,
  activeLiquidityX: number,
  activeLiquidityY: number
): number {
  const denom = totalLiquidityX + totalLiquidityY;
  if (denom === 0) return 0;
  return ((activeLiquidityX + activeLiquidityY) / denom) * 100;
}

function calculateTotalNormalWeight(numBins: number, sigma: number): number {
  let totalWeight = 0;
  const center = Math.floor(numBins / 2);
  for (let i = 0; i < numBins; i++) {
    const distance = Math.abs(i - center);
    totalWeight += Math.exp(-0.5 * Math.pow(distance / sigma, 2));
  }
  return totalWeight;
}

/**
 * Calculate liquidity amounts for a specific bin based on distribution shape
 */
export function calculateBinLiquidity(
  binId: number,
  activeBinId: number,
  binPrice: number,
  currentPrice: number,
  shape: LiquidityShape,
  totalLiquidity: number,
  numBins: number
): {liquidityX: number; liquidityY: number} {
  const distanceFromActive = Math.abs(binId - activeBinId);
  const isActive = binId === activeBinId;
  const isBelow = binId < activeBinId;

  let liquidityX = 0;
  let liquidityY = 0;
  let weight = 0;

  switch (shape) {
    case "spot":
      if (isActive) {
        weight = 0.7;
        liquidityX = (totalLiquidity * weight * 0.5) / currentPrice;
        liquidityY = totalLiquidity * weight * 0.5;
      } else if (distanceFromActive === 1) {
        weight = 0.15;
        if (isBelow) {
          liquidityX = (totalLiquidity * weight) / binPrice;
          liquidityY = 0;
        } else {
          liquidityX = 0;
          liquidityY = totalLiquidity * weight;
        }
      } else {
        weight = 0.15 / Math.max(1, numBins - 3);
        if (isBelow) {
          liquidityX = (totalLiquidity * weight) / binPrice;
          liquidityY = 0;
        } else {
          liquidityX = 0;
          liquidityY = totalLiquidity * weight;
        }
      }
      break;

    case "curve": {
      const sigma = numBins / 4;
      const normalWeight = Math.exp(
        -0.5 * Math.pow(distanceFromActive / sigma, 2)
      );
      const totalWeight = calculateTotalNormalWeight(numBins, sigma);
      weight = normalWeight / totalWeight;

      if (isActive) {
        liquidityX = (totalLiquidity * weight * 0.5) / currentPrice;
        liquidityY = totalLiquidity * weight * 0.5;
      } else if (isBelow) {
        liquidityX = (totalLiquidity * weight) / binPrice;
        liquidityY = 0;
      } else {
        liquidityX = 0;
        liquidityY = totalLiquidity * weight;
      }
      break;
    }

    case "bidask":
      if (isActive) {
        weight = 0.1;
        liquidityX = (totalLiquidity * weight * 0.5) / currentPrice;
        liquidityY = totalLiquidity * weight * 0.5;
      } else {
        const sideWeight = 0.45 / Math.floor(numBins / 2);
        weight = sideWeight;
        if (isBelow) {
          liquidityX = (totalLiquidity * weight) / binPrice;
          liquidityY = 0;
        } else {
          liquidityX = 0;
          liquidityY = totalLiquidity * weight;
        }
      }
      break;

    default:
      weight = 1 / numBins;
      if (isActive) {
        liquidityX = (totalLiquidity * weight * 0.5) / currentPrice;
        liquidityY = totalLiquidity * weight * 0.5;
      } else if (isBelow) {
        liquidityX = (totalLiquidity * weight) / binPrice;
        liquidityY = 0;
      } else {
        liquidityX = 0;
        liquidityY = totalLiquidity * weight;
      }
  }

  return {liquidityX, liquidityY};
}
