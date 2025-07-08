import {Address, arrayify, AssetId, BN, concat, sha256} from "fuels";
import {PoolId, PoolMetadata} from "./model";
import { ContractIdInput, IdentityInput, AssetIdInput } from "./typegen/scripts/SwapExactOutputScriptLoader";

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
