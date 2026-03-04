"use client";

import Link from "next/link";
import {ChevronLeft} from "lucide-react";
import {PoolId} from "mira-dex-ts";
import {bn, formatUnits} from "fuels";

import {getPoolNavigationUrl} from "@/src/utils/poolNavigation";

import {usePositionData, useAssetMetadata, usePoolAPR} from "@/src/hooks";

import {DesktopPositionView} from "./desktop-position-view";
import {MobilePositionView} from "./mobile-position-view";
import {getUiPoolTypeFromPoolId} from "@/src/utils/poolTypeDetection";

export function PositionView({pool}: {pool: PoolId}) {
  const assetAMetadata = useAssetMetadata(pool[0].bits);
  const assetBMetadata = useAssetMetadata(pool[1].bits);

  const isStablePool = pool[2];
  const uiPoolType = getUiPoolTypeFromPoolId(pool);

  const {assets} = usePositionData({pool});
  const {apr} = usePoolAPR(pool);

  const tvlValue = apr?.tvlUSD;
  const coinReserveA = apr?.reserve0;
  const coinReserveB = apr?.reserve1;

  const [assetA, assetB] = assets || [
    [pool[0], bn(0)],
    [pool[1], bn(0)],
  ];

  const coinAAmount = formatUnits(assetA[1], assetAMetadata.decimals);

  const coinBAmount = formatUnits(assetB[1], assetBMetadata.decimals);

  const formattedTvlValue = tvlValue
    ? parseFloat(tvlValue?.toFixed(2)).toLocaleString()
    : "";

  const positionPath = getPoolNavigationUrl(pool, "add");

  return (
    <>
      <Link
        href="/liquidity"
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back
      </Link>
      <MobilePositionView
        pool={pool}
        isStablePool={isStablePool}
        poolType={uiPoolType}
        formattedTvlValue={formattedTvlValue}
        positionPath={positionPath}
        assetA={{
          amount: coinAAmount,
          metadata: assetAMetadata,
          reserve: coinReserveA,
        }}
        assetB={{
          amount: coinBAmount,
          metadata: assetBMetadata,
          reserve: coinReserveB,
        }}
      />
      <DesktopPositionView
        pool={pool}
        isStablePool={isStablePool}
        poolType={uiPoolType}
        formattedTvlValue={formattedTvlValue}
        positionPath={positionPath}
        assetA={{
          amount: coinAAmount,
          metadata: assetAMetadata,
          reserve: coinReserveA,
        }}
        assetB={{
          amount: coinBAmount,
          metadata: assetBMetadata,
          reserve: coinReserveB,
        }}
      />
    </>
  );
}
