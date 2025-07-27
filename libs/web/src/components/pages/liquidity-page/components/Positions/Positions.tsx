"use client";

import Link from "next/link";
import {formatUnits} from "fuels";
import {useIsConnected} from "@fuels/react";
import {buildPoolId} from "mira-dex-ts";
import {FileText} from "lucide-react";
import {Button} from "@/meshwave-ui/Button";

import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";
import {usePoolAPR, useAssetMetadata, usePositions} from "@/src/hooks";

import {createPoolKey} from "@/src/utils/common";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";

import {DefaultLocale} from "@/src/utils/constants";

export function Positions() {
  const {isConnected} = useIsConnected();
  const {data, isLoading} = usePositions();

  if (!isConnected || data?.length === 0) {
    return (
      <section className="flex flex-col gap-6 w-full">
        <p className="text-xl leading-6">Your Positions</p>
        <div className="flex flex-col items-center gap-2 rounded-ten px-4 py-7  bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
          <div className="flex flex-col items-center gap-4">
            <div className="h-11 w-11 flex items-center justify-center rounded-full text-white bg-[url('/images/overlay-5.jpg')] bg-cover">
              <FileText />
            </div>
            <p className="text-content-tertiary">
              Your liquidity will appear here
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 w-full">
      <p className="text-xl leading-6">Your Positions</p>
      {!data || isLoading ? (
        <PositionsLoader />
      ) : (
        <div className="flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark rounded-ten p-4">
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

        <div className="text-center mx-auto text-base font-alt">
          {isMatching ? (
            <AprBadge
              aprValue={aprValue}
              poolKey={poolKey}
              tvlValue={tvlValue}
              background="overlay-9"
            />
          ) : (
            aprValue
          )}
        </div>

        <div className="text-center text-base font-alt">
          {size ? `$${size.toFixed(2)}` : "checking..."}
        </div>

        <div className="col-span-3 md:col-span-1 flex lg:justify-end">
          <Button variant="outline">Manage Position</Button>
        </div>
      </div>
    </Link>
  );
}

function PositionsLoader({count = 3}: {count?: number}) {
  return (
    <div className="flex flex-col gap-4 border-border-secondary border-[12px] dark:border-0 bg-background-grey-dark dark:bg-gray-800 rounded-ten p-4 w-full">
      <div className="hidden md:grid grid-cols-4 gap-4 px-2 pb-4 border-b border-gray-700 text-gray-400 text-sm font-normal">
        <div className="text-left">
          <div className="bg-gray-300 dark:bg-gray-600 animate-pulse h-3 line-3" />
        </div>
        <div className="text-center">
          <div className="bg-gray-300 dark:bg-gray-600 animate-pulse h-3 w-[75%] line-3 mx-auto" />
        </div>
        <div className="text-center">
          <div className="bg-gray-300 dark:bg-gray-600 animate-pulse h-3 w-[75%] line-3 mx-auto" />
        </div>
        <div className="text-right">
          <div className="bg-gray-300 dark:bg-gray-600 animate-pulse h-3 w-[75%] line-3 ml-auto" />
        </div>
      </div>

      {Array.from({length: count}, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 items-center py-4 dark:hover:bg-gray-700 transition rounded-lg px-2"
        >
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 items-center">
              <div className="bg-gray-300 dark:bg-gray-600 animate-pulse w-8 h-8 rounded-full" />
              <div className="bg-gray-300 dark:bg-gray-600 animate-pulse w-8 h-8 rounded-full" />
              <div className="flex flex-col gap-1 ml-2">
                <div className="bg-gray-300 dark:bg-gray-600 animate-pulse w-28 h-3" />
                <div className="bg-gray-300 dark:bg-gray-600 animate-pulse w-28 h-3" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gray-300 dark:bg-gray-600 animate-pulse w-[75%] h-4 mx-auto" />
          </div>

          <div className="text-center">
            <div className="bg-gray-300 dark:bg-gray-600 animate-pulse w-[75%] h-4 mx-auto" />
          </div>

          <div className="col-span-2 sm:col-span-3 md:col-span-1 flex justify-end">
            <div className="bg-gray-300 dark:bg-gray-600 animate-pulse w-[75%] h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
