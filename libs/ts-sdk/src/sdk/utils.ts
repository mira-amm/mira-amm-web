import {
  Address,
  arrayify,
  AssetId,
  BN,
  concat,
  sha256,
  type BigNumberish,
} from "fuels";
import {
  PoolId,
  PoolMetadata,
  PoolIdV2,
  PoolMetadataV2,
  PoolInput,
  BinIdDelta,
  LiquidityConfig,
  Amounts,
} from "./model";
import {
  ContractIdInput,
  IdentityInput,
  AssetIdInput,
} from "./typegen/scripts/SwapExactOutputScriptLoader";

export function contractIdInput(contractId: string): ContractIdInput {
  return {bits: contractId};
}

export function addressInput(address: Address): IdentityInput {
  const addressInstance =
    address instanceof Address ? address : new Address(address);
  return {Address: {bits: addressInstance.toB256()}};
}

export function assetInput(asset: AssetId): AssetIdInput {
  return asset;
}

export function poolIdInput(
  poolId: PoolId
): [AssetIdInput, AssetIdInput, boolean] {
  poolId = reorderPoolId(poolId);
  return [assetInput(poolId[0]), assetInput(poolId[1]), poolId[2]];
}

export function buildPoolId(
  assetA: AssetId | string,
  assetB: AssetId | string,
  isStable: boolean
): PoolId {
  if (typeof assetA === "string") {
    assetA = {bits: assetA};
  }
  if (typeof assetB === "string") {
    assetB = {bits: assetB};
  }
  return reorderPoolId([assetA, assetB, isStable]);
}

export function reorderPoolId(poolId: PoolId): PoolId {
  if (assetLessThan(poolId[0], poolId[1])) {
    return poolId;
  } else {
    return [poolId[1], poolId[0], poolId[2]];
  }
}

function assetLessThan(assetA: AssetId, assetB: AssetId): boolean {
  let assetAInt = parseInt(assetA.bits, 16);
  let assetBInt = parseInt(assetB.bits, 16);
  return assetAInt < assetBInt;
}

export function getAssetId(contractId: string, subId: string): AssetId {
  const contractIdBytes = arrayify(contractId);
  const subIdBytes = arrayify(subId);
  const assetId = sha256(concat([contractIdBytes, subIdBytes]));
  return {bits: assetId};
}

export function getLPAssetId(contractId: string, poolId: PoolId): AssetId {
  const poolSubId = sha256(
    concat([
      arrayify(poolId[0].bits),
      arrayify(poolId[1].bits),
      poolId[2] ? Uint8Array.of(1) : Uint8Array.of(0),
    ])
  );
  return getAssetId(contractId, poolSubId);
}

export function arrangePoolParams(
  pool: PoolMetadata,
  firstAsset: AssetId
): [AssetId, BN, BN, number, number] {
  if (firstAsset.bits === pool.poolId[0].bits) {
    return [
      pool.poolId[1],
      pool.reserve0,
      pool.reserve1,
      pool.decimals0,
      pool.decimals1,
    ];
  }
  if (firstAsset.bits === pool.poolId[1].bits) {
    return [
      pool.poolId[0],
      pool.reserve1,
      pool.reserve0,
      pool.decimals1,
      pool.decimals0,
    ];
  }
  throw new Error(
    `AssetId ${firstAsset.bits} not in pool (${pool.poolId[0].bits}, ${pool.poolId[1].bits}, ${pool.poolId[2]})`
  );
}

export function reorderAssetContracts(
  tokenAContract: string,
  tokenASubId: string,
  tokenBContract: string,
  tokenBSubId: string,
  isStable: boolean
): [string, string, string, string] {
  const assetA = getAssetId(tokenAContract, tokenASubId);
  const assetB = getAssetId(tokenBContract, tokenBSubId);
  const poolId = buildPoolId(assetA, assetB, isStable);
  const [token0Contract, token0SubId, token1Contract, token1SubId] =
    poolId[0].bits === assetA.bits
      ? [tokenAContract, tokenASubId, tokenBContract, tokenBSubId]
      : [tokenBContract, tokenBSubId, tokenAContract, tokenASubId];
  return [token0Contract, token0SubId, token1Contract, token1SubId];
}

export function poolContainsAsset(poolId: PoolId, asset: AssetId): boolean {
  return poolId[0].bits === asset.bits || poolId[1].bits === asset.bits;
}

// v2 utility functions
export function poolIdV2Input(poolId: PoolIdV2): BigNumberish {
  return poolId;
}

export function buildPoolIdV2(
  assetA: AssetId | string,
  assetB: AssetId | string,
  binStep: number,
  baseFactor: number
): PoolIdV2 {
  if (typeof assetA === "string") {
    assetA = {bits: assetA};
  }
  if (typeof assetB === "string") {
    assetB = {bits: assetB};
  }

  // Reorder assets to ensure consistent pool ID generation
  const [orderedAssetA, orderedAssetB] = assetLessThan(assetA, assetB)
    ? [assetA, assetB]
    : [assetB, assetA];

  // Generate pool ID by hashing the pool parameters
  const poolData = concat([
    arrayify(orderedAssetA.bits),
    arrayify(orderedAssetB.bits),
    new BN(binStep).toBytes(),
    new BN(baseFactor).toBytes(),
  ]);

  const poolIdHash = sha256(poolData);
  return new BN(poolIdHash);
}

export function reorderPoolIdV2(poolId: PoolIdV2): PoolIdV2 {
  // v2 pool IDs are already ordered by construction since they're generated
  // from ordered assets, but we keep this function for API consistency
  return poolId;
}

export function extractAssetsFromPoolIdV2(
  poolMetadata: PoolMetadataV2
): [AssetId, AssetId] {
  return [poolMetadata.pool.assetX, poolMetadata.pool.assetY];
}

export function arrangePoolParamsV2(
  poolMetadata: PoolMetadataV2,
  firstAsset: AssetId
): [AssetId, BN, BN] {
  if (firstAsset.bits === poolMetadata.pool.assetX.bits) {
    return [
      poolMetadata.pool.assetY,
      poolMetadata.reserves.x,
      poolMetadata.reserves.y,
    ];
  }
  if (firstAsset.bits === poolMetadata.pool.assetY.bits) {
    return [
      poolMetadata.pool.assetX,
      poolMetadata.reserves.y,
      poolMetadata.reserves.x,
    ];
  }
  throw new Error(
    `AssetId ${firstAsset.bits} not in pool (${poolMetadata.pool.assetX.bits}, ${poolMetadata.pool.assetY.bits})`
  );
}

export function poolInputFromAssets(
  assetA: AssetId | string,
  assetB: AssetId | string,
  binStep: number,
  baseFactor: number
): PoolInput {
  if (typeof assetA === "string") {
    assetA = {bits: assetA};
  }
  if (typeof assetB === "string") {
    assetB = {bits: assetB};
  }

  // Reorder assets to ensure consistent ordering
  const [orderedAssetA, orderedAssetB] = assetLessThan(assetA, assetB)
    ? [assetA, assetB]
    : [assetB, assetA];

  return {
    assetX: orderedAssetA,
    assetY: orderedAssetB,
    binStep,
    baseFactor,
  };
}

export function getLPAssetIdV2(contractId: string, poolId: PoolIdV2): AssetId {
  const poolSubId = sha256(arrayify(poolId.toHex()));
  return getAssetId(contractId, poolSubId);
}

export function poolContainsAssetV2(
  poolMetadata: PoolMetadataV2,
  asset: AssetId
): boolean {
  return (
    poolMetadata.pool.assetX.bits === asset.bits ||
    poolMetadata.pool.assetY.bits === asset.bits
  );
}

// Bin-related utility functions
export function binIdToDelta(binId: number): BinIdDelta {
  if (binId >= 0) {
    return {Positive: binId};
  } else {
    return {Negative: Math.abs(binId)};
  }
}

export function deltaToBinId(delta: BinIdDelta): number {
  if (delta.Positive !== undefined) {
    return delta.Positive;
  } else if (delta.Negative !== undefined) {
    return -delta.Negative;
  }
  throw new Error("Invalid BinIdDelta");
}

export function binIdToPrice(binId: number, binStep: number): BN {
  // Price calculation: price = (1 + binStep / 10000) ^ binId
  // Using more precise calculation with scaling
  const SCALE = new BN(10).pow(18); // 18 decimal precision
  const binStepBN = new BN(binStep);
  const base = SCALE.add(binStepBN.mul(SCALE).div(new BN(10000)));

  if (binId === 0) {
    return SCALE; // Price = 1.0 scaled
  }

  let result = SCALE;
  const absBinId = Math.abs(binId);

  // Use exponentiation by squaring for efficiency
  let basePower = base;
  let exp = absBinId;

  while (exp > 0) {
    if (exp % 2 === 1) {
      result = result.mul(basePower).div(SCALE);
    }
    basePower = basePower.mul(basePower).div(SCALE);
    exp = Math.floor(exp / 2);
  }

  // If binId is negative, take reciprocal
  if (binId < 0) {
    result = SCALE.mul(SCALE).div(result);
  }

  return result;
}

export function priceToBinId(price: BN, binStep: number): number {
  // Inverse of binIdToPrice: binId = log(price) / log(1 + binStep / 10000)
  // Using binary search for more accurate results
  const SCALE = new BN(10).pow(18);
  const targetPrice = price;

  // Handle edge cases
  if (targetPrice.eq(SCALE)) {
    return 0; // Price = 1.0
  }

  // Binary search bounds
  let low = -1000000;
  let high = 1000000;
  let bestBinId = 0;
  let bestDiff = new BN(2).pow(256); // Max BN value

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midPrice = binIdToPrice(mid, binStep);
    const diff = midPrice.gt(targetPrice)
      ? midPrice.sub(targetPrice)
      : targetPrice.sub(midPrice);

    if (diff.lt(bestDiff)) {
      bestDiff = diff;
      bestBinId = mid;
    }

    if (midPrice.lt(targetPrice)) {
      low = mid + 1;
    } else if (midPrice.gt(targetPrice)) {
      high = mid - 1;
    } else {
      return mid; // Exact match
    }
  }

  return bestBinId;
}

export function calculateLiquidityDistribution(
  totalAmountX: BN,
  totalAmountY: BN,
  activeBinId: number,
  deltaIds: BinIdDelta[],
  distributionX: number[],
  distributionY: number[]
): LiquidityConfig[] {
  if (
    deltaIds.length !== distributionX.length ||
    deltaIds.length !== distributionY.length
  ) {
    throw new Error(
      "Delta IDs and distribution arrays must have the same length"
    );
  }

  const configs: LiquidityConfig[] = [];

  for (let i = 0; i < deltaIds.length; i++) {
    const binId = activeBinId + deltaToBinId(deltaIds[i]);
    const distX = Math.floor(distributionX[i] * 10000); // Convert to basis points
    const distY = Math.floor(distributionY[i] * 10000); // Convert to basis points

    configs.push({
      binId,
      distributionX: distX,
      distributionY: distY,
    });
  }

  return configs;
}

export function calculateBinAmounts(
  totalAmountX: BN,
  totalAmountY: BN,
  liquidityConfigs: LiquidityConfig[]
): Map<number, Amounts> {
  const binAmounts = new Map<number, Amounts>();

  // Calculate total distribution weights
  let totalDistX = 0;
  let totalDistY = 0;

  for (const config of liquidityConfigs) {
    totalDistX += config.distributionX;
    totalDistY += config.distributionY;
  }

  // Distribute amounts proportionally
  for (const config of liquidityConfigs) {
    const amountX =
      totalDistX > 0
        ? totalAmountX.mul(new BN(config.distributionX)).div(new BN(totalDistX))
        : new BN(0);

    const amountY =
      totalDistY > 0
        ? totalAmountY.mul(new BN(config.distributionY)).div(new BN(totalDistY))
        : new BN(0);

    binAmounts.set(config.binId, {x: amountX, y: amountY});
  }

  return binAmounts;
}

export function getBinRange(startBinId: number, endBinId: number): number[] {
  const range: number[] = [];
  const start = Math.min(startBinId, endBinId);
  const end = Math.max(startBinId, endBinId);

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  return range;
}

export function getActiveBinRange(
  activeBinId: number,
  rangeBefore: number = 10,
  rangeAfter: number = 10
): number[] {
  return getBinRange(activeBinId - rangeBefore, activeBinId + rangeAfter);
}

export function validateBinStep(binStep: number): boolean {
  // Common bin steps: 1, 5, 10, 25, 50, 100, 250, 500, 1000 basis points
  const validBinSteps = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
  return validBinSteps.includes(binStep);
}

export function validateBaseFactor(baseFactor: number): boolean {
  // Base factor should be between 5000 and 10000 (0.5x to 1.0x)
  return baseFactor >= 5000 && baseFactor <= 10000;
}

export function calculateBinPriceRange(
  binId: number,
  binStep: number
): {lowerPrice: BN; upperPrice: BN} {
  const currentPrice = binIdToPrice(binId, binStep);
  const nextPrice = binIdToPrice(binId + 1, binStep);

  return {
    lowerPrice: currentPrice,
    upperPrice: nextPrice,
  };
}
