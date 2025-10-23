"use client";

import Link from "next/link";
import {ChevronLeft} from "lucide-react";
import {PoolId} from "mira-dex-ts";
import {BN, formatUnits} from "fuels";

import {getPoolNavigationUrl} from "@/src/utils/poolNavigation";

import {
  useAssetMetadata,
  usePoolAPR,
  UnifiedPoolId,
  useUserBinPositionsV2,
  useUnifiedPoolsMetadata,
} from "@/src/hooks";

import {getUiPoolTypeFromPoolId} from "@/src/utils/poolTypeDetection";
import {V2DesktopPositionView} from "./v2-desktop-position-view";
import {V2MobilePositionView} from "./v2-mobile-position-view";
import {useUnifiedPoolAssets} from "@/src/hooks/useUnifiedPoolAssets";
import type {V2BinPosition} from "@/src/hooks/useUserBinPositionsV2";

// Convert bin positions to LiquidityData format for SimulatedDistribution
function convertBinPositionsToLiquidityData(
  positions: V2BinPosition[],
  asset0Decimals: number,
  asset1Decimals: number,
  currentPrice: number
) {
  if (!positions || positions.length === 0) return undefined;

  // Sort by binId for display
  const sorted = [...positions].sort(
    (a, b) => Number(a.binId.toString()) - Number(b.binId.toString())
  );

  // Find max amounts for height normalization
  const maxAmount0 = Math.max(
    ...sorted.map((p) =>
      parseFloat(formatUnits(p.underlyingAmounts.x, asset0Decimals))
    )
  );
  const maxAmount1 = Math.max(
    ...sorted.map((p) =>
      parseFloat(formatUnits(p.underlyingAmounts.y, asset1Decimals))
    )
  );
  const maxAmount = Math.max(maxAmount0, maxAmount1);
  const maxHeight = 120;

  return sorted.map((position, index) => {
    const amount0 = parseFloat(
      formatUnits(position.underlyingAmounts.x, asset0Decimals)
    );
    const amount1 = parseFloat(
      formatUnits(position.underlyingAmounts.y, asset1Decimals)
    );

    // Calculate heights based on amounts (normalized to max height)
    const assetAHeight = maxAmount > 0 ? (amount0 / maxAmount) * maxHeight : 0;
    const assetBHeight = maxAmount > 0 ? (amount1 / maxAmount) * maxHeight : 0;

    return {
      binId: Number(position.binId.toString()),
      price: position.price.toFixed(4),
      asset0Value: amount0,
      asset1Value: amount1,
      assetAHeight,
      assetBHeight,
      showPrice: index === 0 || index === sorted.length - 1, // Show first and last
    };
  });
}

export function V2PositionView({
  poolKey,
  unifiedPoolId,
}: {
  poolKey?: string;
  unifiedPoolId: UnifiedPoolId;
}) {
  const {firstAssetId, secondAssetId} = useUnifiedPoolAssets(poolKey ?? "");

  const assetAMetadata = useAssetMetadata(firstAssetId);
  const assetBMetadata = useAssetMetadata(secondAssetId);

  // Ensure poolId is a BN instance for v2 pools
  const poolIdBN =
    unifiedPoolId instanceof BN ? unifiedPoolId : new BN(unifiedPoolId as any);

  const {
    data: binPositions,
    isLoading,
    totals,
  } = useUserBinPositionsV2(poolIdBN);

  const {unifiedPoolsMetadata} = useUnifiedPoolsMetadata(
    poolIdBN ? [poolIdBN] : undefined
  );
  const poolMetadata = unifiedPoolsMetadata?.[0];
  const binStep = poolMetadata?.binStep; // Don't default - only show distribution if we have real data

  // Format amounts for display
  const coinAAmount = formatUnits(totals.totalX, assetAMetadata.decimals || 9);
  const coinBAmount = formatUnits(totals.totalY, assetBMetadata.decimals || 9);

  const feesAAmount = formatUnits(totals.feesX, assetAMetadata.decimals || 9);
  const feesBAmount = formatUnits(totals.feesY, assetBMetadata.decimals || 9);

  // Get the NFT asset ID (all bins in a position share the same NFT ID)
  const nftAssetId =
    binPositions && binPositions.length > 0
      ? binPositions[0].lpToken
      : undefined;

  // Convert bin positions to chart data
  const chartData = binPositions
    ? convertBinPositionsToLiquidityData(
        binPositions,
        assetAMetadata.decimals || 9,
        assetBMetadata.decimals || 9,
        (totals.minPrice + totals.maxPrice) / 2
      )
    : undefined;

  // Create a PoolId-like structure for compatibility with existing components
  // For V2 pools, we default to volatile (false) since V2 doesn't use the stable concept
  const pool: PoolId = [
    {bits: firstAssetId},
    {bits: secondAssetId},
    false, // isStable - V2 pools don't have this concept, default to false
  ] as PoolId;

  const uiPoolType = getUiPoolTypeFromPoolId(unifiedPoolId);
  const positionPath = getPoolNavigationUrl(pool, "add");

  // Get pool APR data for TVL
  const {apr} = usePoolAPR(pool);
  const tvlValue = apr?.tvlUSD;
  const formattedTvlValue = tvlValue
    ? parseFloat(tvlValue?.toFixed(2)).toLocaleString()
    : "";

  if (isLoading) {
    return (
      <>
        <Link
          href="/liquidity"
          className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
        >
          <ChevronLeft className="size-5" />
          Back
        </Link>
        <div className="flex items-center justify-center p-8">
          <p className="text-content-tertiary">Loading position data...</p>
        </div>
      </>
    );
  }

  if (!binPositions || binPositions.length === 0) {
    return (
      <>
        <Link
          href="/liquidity"
          className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
        >
          <ChevronLeft className="size-5" />
          Back
        </Link>
        <div className="flex items-center justify-center p-8">
          <p className="text-content-tertiary">
            No positions found for this pool
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Link
        href="/liquidity"
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back
      </Link>
      <V2MobilePositionView
        pool={pool}
        isStablePool={false}
        poolType={uiPoolType}
        formattedTvlValue={formattedTvlValue}
        positionPath={positionPath}
        nftAssetId={nftAssetId}
        binStep={binStep ?? undefined}
        chartData={chartData}
        assetA={{
          amount: coinAAmount,
          metadata: assetAMetadata,
          reserve: apr?.reserve0,
        }}
        assetB={{
          amount: coinBAmount,
          metadata: assetBMetadata,
          reserve: apr?.reserve1,
        }}
        feesA={{
          amount: feesAAmount,
          metadata: assetAMetadata,
        }}
        feesB={{
          amount: feesBAmount,
          metadata: assetBMetadata,
        }}
        positionStats={{
          numBins: totals.numBins,
          minPrice: totals.minPrice,
          maxPrice: totals.maxPrice,
          liquidityShape: totals.liquidityShape,
        }}
      />
      <V2DesktopPositionView
        pool={pool}
        isStablePool={false}
        poolType={uiPoolType}
        formattedTvlValue={formattedTvlValue}
        positionPath={positionPath}
        nftAssetId={nftAssetId}
        binStep={binStep ?? undefined}
        chartData={chartData}
        assetA={{
          amount: coinAAmount,
          metadata: assetAMetadata,
          reserve: apr?.reserve0,
        }}
        assetB={{
          amount: coinBAmount,
          metadata: assetBMetadata,
          reserve: apr?.reserve1,
        }}
        feesA={{
          amount: feesAAmount,
          metadata: assetAMetadata,
        }}
        feesB={{
          amount: feesBAmount,
          metadata: assetBMetadata,
        }}
        positionStats={{
          numBins: totals.numBins,
          minPrice: totals.minPrice,
          maxPrice: totals.maxPrice,
          liquidityShape: totals.liquidityShape,
        }}
      />
    </>
  );
}
