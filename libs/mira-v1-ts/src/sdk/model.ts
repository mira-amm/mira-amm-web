import {AssetId, type BN} from "fuels";

export type PoolId = [AssetId, AssetId, boolean];

export type Asset = [AssetId, BN];

export type PoolMetadata = {
  poolId: PoolId,
  reserve0: BN,
  reserve1: BN,
  liquidity: Asset,
  decimals0: number,
  decimals1: number,
}

export type AmmMetadata = {
  id: string,
  fees: AmmFees,
  hook: string | null,
  totalAssets: BN,
  owner: string | null,
}

export type AmmFees = {
  lpFeeVolatile: BN,
  lpFeeStable: BN,
  protocolFeeVolatile: BN,
  protocolFeeStable: BN,
}

export type LpAssetInfo = {
  assetId: AssetId,
  name: String,
  symbol: String,
  decimals: number,
  totalSupply: BN,
}
