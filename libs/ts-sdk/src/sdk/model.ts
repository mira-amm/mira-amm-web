import {AssetId, type BN, type Address, type BigNumberish} from "fuels";

// v1 types (existing)
export type PoolId = [AssetId, AssetId, boolean];

export type Asset = [AssetId, BN];

export type PoolMetadata = {
  poolId: PoolId;
  reserve0: BN;
  reserve1: BN;
  liquidity: Asset;
  decimals0: number;
  decimals1: number;
};

export type AmmMetadata = {
  id: string;
  fees: AmmFees;
  hook: string | null;
  totalAssets: BN;
  owner: string | null;
};

export type AmmFees = {
  lpFeeVolatile: BN;
  lpFeeStable: BN;
  protocolFeeVolatile: BN;
  protocolFeeStable: BN;
};

export type LpAssetInfo = {
  assetId: AssetId;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: BN;
};

// v2 types (new)
export type PoolIdV2 = BN;

export type PoolMetadataV2 = {
  poolId: PoolIdV2;
  pool: PoolInfo;
  activeId: number;
  reserves: Amounts;
  protocolFees: Amounts;
};

export type PoolInfo = {
  assetX: AssetId;
  assetY: AssetId;
  binStep: number;
  baseFactor: number;
};

export type Amounts = {
  x: BN;
  y: BN;
};

export type BinLiquidityInfo = {
  binId: number;
  liquidity: Amounts;
  price: BN;
};

export type LiquidityDistribution = {
  totalLiquidity: Amounts;
  activeBinId: number;
  bins: BinLiquidityInfo[];
};

export type UserBinPosition = {
  binId: number;
  lpTokenAmount: BN;
  underlyingAmounts: Amounts;
};

export type LiquidityConfig = {
  binId: number;
  distributionX: number;
  distributionY: number;
};

export type BinIdDelta = {
  Negative?: number;
  Positive?: number;
};

export type AmmMetadataV2 = {
  id: string;
  hook: string | null;
  totalAssets: BN;
  owner: string | null;
  feeRecipient: string;
  protocolFees: number;
};

// v2 specific input types for contract calls
export type PoolInput = {
  assetX: AssetId;
  assetY: AssetId;
  binStep: BigNumberish;
  baseFactor: BigNumberish;
};

// Error types for v2
export enum PoolCurveStateError {
  PoolAlreadyExists = "PoolAlreadyExists",
  InvalidParameters = "InvalidParameters",
  PoolNotFound = "PoolNotFound",
  Unauthorized = "Unauthorized",
  InvalidBinStep = "InvalidBinStep",
  InvalidActiveId = "InvalidActiveId",
  IdenticalAssets = "IdenticalAssets",
  ZeroAddress = "ZeroAddress",
  MaxLiquidityPerBinExceeded = "MaxLiquidityPerBinExceeded",
  ZeroShares = "ZeroShares",
  CompositionFactorFlawed = "CompositionFactorFlawed",
  InvalidLPTokenBalance = "InvalidLPTokenBalance",
  UnknownLPToken = "UnknownLPToken",
  LPTokenFromWrongPool = "LPTokenFromWrongPool",
  InsufficientAmountIn = "InsufficientAmountIn",
  OutOfLiquidity = "OutOfLiquidity",
  InsufficientAmountOut = "InsufficientAmountOut",
  AlreadyInitialized = "AlreadyInitialized",
  NotInitialized = "NotInitialized",
  SwapNotPossible = "SwapNotPossible",
}

export class MiraV2Error extends Error {
  constructor(
    public readonly errorType: PoolCurveStateError,
    message: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = "MiraV2Error";
  }
}

// Cache options are defined in cache/types.ts

// Transaction parameters for v2 operations
export type TxParams = {
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  maxFee?: BigNumberish;
};

// Prepare request options for v2 operations
export type PrepareRequestOptions = {
  fundTransaction?: boolean;
  estimateGas?: boolean;
};
