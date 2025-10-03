"use client";

import {useMemo} from "react";
import {DEFAULT_BIN_STEP} from "mira-dex-ts";
import {
  DEFAULT_ASSET0_SYMBOL,
  DEFAULT_ASSET1_SYMBOL,
  DEFAULT_ASSET_PRICE,
  DEFAULT_CURRENT_PRICE,
  DEFAULT_LIQUIDITY_SHAPE,
  DEFAULT_PRICE_RANGE,
  DEFAULT_TOTAL_ASSET_AMOUNT,
} from "@/src/utils/v2Defaults";
import {useUserBinPositionsV2} from "./useUserBinPositionsV2";
import {usePositionSummaryV2} from "./usePositionSummaryV2";
import {useAssetMetadata} from "./useAssetMetadata";
import {useAssetPrice} from "./useAssetPrice";
import {PoolType} from "@/src/components/common/PoolTypeIndicator";
import {isV2PoolId, UnifiedPoolId} from "@/src/utils/poolTypeDetection";

export type LiquidityShape = "spot" | "curve" | "bidask";

export interface SimulatedDistributionData {
  liquidityShape: LiquidityShape;
  minPrice: number;
  maxPrice: number;
  currentPrice: number;
  binStepBasisPoints: number;
  asset0Symbol: string;
  asset1Symbol: string;
  asset0Price?: number;
  asset1Price?: number;
  totalAsset0Amount?: number;
  totalAsset1Amount?: number;
}

interface UseSimulatedDistributionDataParams {
  poolId: UnifiedPoolId;
  poolType?: PoolType;
  assetXId?: string;
  assetYId?: string;
  useMockData?: boolean;
}

export function useSimulatedDistributionData({
  poolId,
  poolType = "v2-concentrated",
  assetXId,
  assetYId,
  useMockData = true,
}: UseSimulatedDistributionDataParams) {
  const liquidityShape: LiquidityShape = DEFAULT_LIQUIDITY_SHAPE;
  // Only fetch data for v2 pools
  const shouldFetch = poolType === "v2-concentrated";

  const v2PoolId = useMemo(() => {
    if (!shouldFetch) return undefined;
    if (isV2PoolId(poolId)) {
      return poolId;
    }
    return undefined;
  }, [poolId, shouldFetch]);

  // Get v2 position data - skip fetching when using mock data
  const {data: positions, isLoading: positionsLoading} = useUserBinPositionsV2(
    useMockData ? undefined : v2PoolId
  );
  const summary = usePositionSummaryV2(positions || []);

  // Get asset metadata
  const assetXMetadata = useAssetMetadata(assetXId ?? null);
  const assetYMetadata = useAssetMetadata(assetYId ?? null);
  const {price: assetXPrice} = useAssetPrice(
    useMockData ? null : (assetXId ?? null)
  );
  const {price: assetYPrice} = useAssetPrice(
    useMockData ? null : (assetYId ?? null)
  );

  // Use current price from position data
  const currentPrice = summary.averagePrice || DEFAULT_CURRENT_PRICE;

  // Generate distribution data
  const distributionData = useMemo((): SimulatedDistributionData | null => {
    // if (!shouldFetch) return null;

    if (useMockData) {
      return {
        liquidityShape,
        minPrice: DEFAULT_PRICE_RANGE[0],
        maxPrice: DEFAULT_PRICE_RANGE[1],
        currentPrice: DEFAULT_CURRENT_PRICE,
        binStepBasisPoints: DEFAULT_BIN_STEP,
        asset0Symbol: assetXMetadata.symbol || DEFAULT_ASSET0_SYMBOL,
        asset1Symbol: assetYMetadata.symbol || DEFAULT_ASSET1_SYMBOL,
        asset0Price: DEFAULT_ASSET_PRICE,
        asset1Price: DEFAULT_ASSET_PRICE,
        totalAsset0Amount: DEFAULT_TOTAL_ASSET_AMOUNT,
        totalAsset1Amount: DEFAULT_TOTAL_ASSET_AMOUNT,
      };
    }

    return {
      liquidityShape,
      minPrice: summary.priceRange.min,
      maxPrice: summary.priceRange.max,
      currentPrice,
      binStepBasisPoints: DEFAULT_BIN_STEP,
      asset0Symbol: assetXMetadata.symbol || DEFAULT_ASSET0_SYMBOL,
      asset1Symbol: assetYMetadata.symbol || DEFAULT_ASSET1_SYMBOL,
      asset0Price: assetXPrice ?? undefined,
      asset1Price: assetYPrice ?? undefined,
      totalAsset0Amount: summary.totalLiquidity.x.toNumber(),
      totalAsset1Amount: summary.totalLiquidity.y.toNumber(),
    };
  }, [
    shouldFetch,
    useMockData,
    liquidityShape,
    summary.priceRange.min,
    summary.priceRange.max,
    currentPrice,
    assetXMetadata.symbol,
    assetYMetadata.symbol,
    assetXPrice,
    assetYPrice,
    summary.totalLiquidity.x,
    summary.totalLiquidity.y,
  ]);

  return {
    data: distributionData,
    isLoading: shouldFetch && positionsLoading,
    // NOTE update when test pool is ready
    isV2Pool: true,
    positions,
    summary,
  };
}
