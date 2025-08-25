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
  // v2 pool IDs are already ordered by construction
  return poolId;
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
  const binStepBN = new BN(binStep);
  const base = new BN(10000).add(binStepBN).div(new BN(10000));

  // For simplicity, we'll use a basic approximation
  // In a real implementation, you'd want a more precise power calculation
  const exponent = new BN(Math.abs(binId));
  let result = new BN(1);

  for (let i = 0; i < Math.abs(binId); i++) {
    result = result.mul(base).div(new BN(10000));
  }

  return binId >= 0 ? result : new BN(1).div(result);
}

export function priceToBinId(price: BN, binStep: number): number {
  // Inverse of binIdToPrice: binId = log(price) / log(1 + binStep / 10000)
  // This is a simplified implementation
  const binStepBN = new BN(binStep);
  const base = new BN(10000).add(binStepBN).div(new BN(10000));

  // Simple approximation - in practice you'd want a more precise logarithm
  let binId = 0;
  let currentPrice = new BN(1);

  if (price.gte(new BN(1))) {
    while (currentPrice.lt(price) && binId < 1000000) {
      currentPrice = currentPrice.mul(base).div(new BN(10000));
      binId++;
    }
  } else {
    while (currentPrice.gt(price) && binId > -1000000) {
      currentPrice = currentPrice.mul(new BN(10000)).div(base);
      binId--;
    }
  }

  return binId;
}
