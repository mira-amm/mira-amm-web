"use client";
import BackLink from "@/src/components/common/BackLink/BackLink";

import {bn, formatUnits} from "fuels";

import usePositionData from "@/src/hooks/usePositionData";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";

import {createPoolKey} from "@/src/utils/common";
import {PoolId} from "mira-dex-ts";

import DesktopPositionView from "./DesktopPositionView/DesktopPositionView";
import MobilePositionView from "./MobilePositionView/MobilePositionView";

type Props = {
  pool: PoolId;
};

const PositionView = ({pool}: Props): JSX.Element => {
  const assetAMetadata = useAssetMetadata(pool[0].bits);
  const assetBMetadata = useAssetMetadata(pool[1].bits);

  const isStablePool = pool[2];

  const {assets} = usePositionData({pool});
  const {apr} = usePoolAPR(pool);

  const tvlValue = apr?.tvlUSD;
  const poolKey = createPoolKey(pool);
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

  const positionPath = `/liquidity/add?pool=${poolKey}`;
  const removeLiquidityPath = `/liquidity/remove?pool=${poolKey}`;

  return (
    <>
      <BackLink showOnDesktop href="/liquidity" chevron title="Back" />
      <MobilePositionView
        pool={pool}
        isStablePool={isStablePool}
        formattedTvlValue={formattedTvlValue}
        positionPath={positionPath}
        removeLiquidityPath={removeLiquidityPath}
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
        removeLiquidityPath={removeLiquidityPath}
      />
    </>
  );
};

export default PositionView;
