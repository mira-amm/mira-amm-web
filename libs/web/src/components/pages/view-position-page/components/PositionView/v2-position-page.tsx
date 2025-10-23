"use client";

import Link from "next/link";
import {ChevronLeft} from "lucide-react";
import {PoolId} from "mira-dex-ts";
import {BN, bn, formatUnits} from "fuels";

import {getPoolNavigationUrl} from "@/src/utils/poolNavigation";

import {
  usePositionData,
  useAssetMetadata,
  usePoolAPR,
  UnifiedPoolId,
  useUserBinPositionsV2,
} from "@/src/hooks";

import {getUiPoolTypeFromPoolId} from "@/src/utils/poolTypeDetection";
import {V2DesktopPositionView} from "./v2-desktop-position-view";
import {V2MobilePositionView} from "./v2-mobile-position-view";
import {useUnifiedPoolAssets} from "@/src/hooks/useUnifiedPoolAssets";
import {useMemo} from "react";

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

  const {data: binPositions, isLoading} = useUserBinPositionsV2(poolIdBN);

  // Calculate totals across all bins
  const totals = useMemo(() => {
    if (!binPositions || binPositions.length === 0) {
      return {
        totalX: bn(0),
        totalY: bn(0),
        feesX: bn(0),
        feesY: bn(0),
        numBins: 0,
        minPrice: 0,
        maxPrice: 0,
      };
    }

    let totalX = bn(0);
    let totalY = bn(0);
    let feesX = bn(0);
    let feesY = bn(0);
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    binPositions.forEach((position) => {
      totalX = totalX.add(position.underlyingAmounts.x);
      totalY = totalY.add(position.underlyingAmounts.y);
      feesX = feesX.add(position.feesEarned.x);
      feesY = feesY.add(position.feesEarned.y);

      if (position.price < minPrice) minPrice = position.price;
      if (position.price > maxPrice) maxPrice = position.price;
    });

    return {
      totalX,
      totalY,
      feesX,
      feesY,
      numBins: binPositions.length,
      minPrice,
      maxPrice,
    };
  }, [binPositions]);

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

  console.log("v2-data", {
    assetAMetadata,
    assetBMetadata,
    binPositions,
    totals,
    coinAAmount,
    coinBAmount,
    nftAssetId,
  });

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
        }}
      />
      <V2DesktopPositionView
        pool={pool}
        isStablePool={false}
        poolType={uiPoolType}
        formattedTvlValue={formattedTvlValue}
        positionPath={positionPath}
        nftAssetId={nftAssetId}
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
        }}
      />
    </>
  );
}
