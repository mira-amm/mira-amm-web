"use client";

import {useIsConnected} from "@fuels/react";
import usePositions from "@/src/hooks/usePositions";
import {useAssetMetadata} from "@/src/hooks";
import {formatUnits} from "fuels";
import {buildPoolId} from "mira-dex-ts";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";
import {createPoolKey} from "@/src/utils/common";
import {DefaultLocale, POSITIONS_SKELTON_COUNT} from "@/src/utils/constants";
import Link from "next/link";

import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import {ActionButton} from "@/src/components/common";
import {DocumentIcon} from "@/meshwave-ui/icons";
import {PositionsLoader} from "./PositionsLoader";

export function Positions() {
  const {isConnected} = useIsConnected();
  const {data, isLoading} = usePositions();

  if (!isConnected || data?.length === 0) {
    return (
      <section className="flex flex-col gap-6">
        <p className="text-[20px] leading-6">Your Positions</p>
        <div className="flex flex-col items-center gap-2 rounded-2xl px-4 py-7 bg-background-grey-dark">
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-11 w-11 flex items-center justify-center rounded-full text-content-primary"
              style={{
                background:
                  "linear-gradient(96.75deg, #befa15 -106.79%, #5872fc 48.13%, #c41cff 168.79%)",
              }}
            >
              <DocumentIcon />
            </div>
            <p>Your liquidity will appear here</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <p className="text-[20px] leading-6">Your Positions</p>
      {!data || isLoading ? (
        <PositionsLoader count={POSITIONS_SKELTON_COUNT} />
      ) : (
        <div className="flex flex-col gap-4 bg-background-grey-dark rounded-[24px] p-4">
          {/* Headers */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 px-2 pb-4 border-b border-background-grey-darkertext-content-tertiary text-sm font-normal">
            <div className="text-left">Pools</div>
            <div className="text-center">APR</div>
            <div className="text-center">Position size</div>
            <div className="text-right" />
          </div>

          {/* Rows */}
          {data.map((position) => {
            const assetIdA = position.token0Item.token0Position[0].bits;
            const assetIdB = position.token1Item.token1Position[0].bits;
            const amountA = position.token0Item.token0Position[1].toString();
            const amountB = position.token1Item.token1Position[1].toString();
            const isStablePool = position.isStable;
            const priceA = position.token0Item.price;
            const priceB = position.token1Item.price;

            return (
              <PositionRow
                key={createPoolKey(position.poolId)}
                assetIdA={assetIdA}
                assetIdB={assetIdB}
                amountA={amountA}
                amountB={amountB}
                isStablePool={isStablePool}
                priceA={priceA}
                priceB={priceB}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function PositionRow({
  assetIdA,
  assetIdB,
  amountA,
  amountB,
  isStablePool,
  priceA,
  priceB,
}: {
  assetIdA: string;
  assetIdB: string;
  amountA: string;
  amountB: string;
  isStablePool: boolean;
  priceA: number;
  priceB: number;
}) {
  const assetAMetadata = useAssetMetadata(assetIdA);
  const assetBMetadata = useAssetMetadata(assetIdB);

  const poolId = buildPoolId(assetIdA, assetIdB, isStablePool);
  const poolKey = createPoolKey(poolId);
  const path = `/liquidity/position?pool=${poolKey}`;

  const coinAAmount = formatUnits(amountA, assetAMetadata.decimals);
  const coinBAmount = formatUnits(amountB, assetBMetadata.decimals);
  const size =
    parseFloat(coinAAmount) * priceA + parseFloat(coinBAmount) * priceB;

  const {apr} = usePoolAPR(poolId);
  const {isMatching} = usePoolNameAndMatch(poolKey);
  const aprValue = apr
    ? `${apr.apr.toLocaleString(DefaultLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
    : null;
  const tvlValue = apr?.tvlUSD;

  const poolTypeText = isStablePool ? "Stable" : "Volatile";
  const feeText = isStablePool ? "0.05%" : "0.3%";

  return (
    <Link href={path} className="block">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 items-center py-4 hover:bg-background-grey-darkertransition rounded-lg px-2">
        <div className="flex flex-col gap-1 min-w-[150px]">
          <CoinPair
            firstCoin={assetIdA}
            secondCoin={assetIdB}
            isStablePool={isStablePool}
            withPoolDescription={true}
          />
        </div>

        <div className="text-center text-[14px] text-content-positive">
          {isMatching ? (
            <AprBadge
              aprValue={aprValue}
              poolKey={poolKey}
              tvlValue={tvlValue}
              small={true}
            />
          ) : (
            aprValue
          )}
        </div>

        <div className="text-center text-[14px] text-content-tertiary">
          {size ? `$${size.toFixed(2)}` : "checking..."}
        </div>

        <div className="col-span-3 md:col-span-1 flex lg:justify-end">
          <ActionButton
            variant="secondary"
            className="w-full lg:max-w-[165px] text-accent-primary text-xs text-nowrap font-medium leading-[19px]"
          >
            Manage position
          </ActionButton>
        </div>
      </div>
    </Link>
  );
}
