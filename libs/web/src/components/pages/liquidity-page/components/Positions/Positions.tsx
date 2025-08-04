"use client";

import Link from "next/link";
import {formatUnits} from "fuels";
import {useIsConnected} from "@fuels/react";
import {buildPoolId} from "mira-dex-ts";
import {FileText} from "lucide-react";
import {Button} from "@/meshwave-ui/Button";
import {DataTable, DataTableColumn} from "@/meshwave-ui/table";

import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";
import {usePoolAPR, useAssetMetadata, usePositions} from "@/src/hooks";

import {createPoolKey} from "@/src/utils/common";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";

import {DefaultLocale} from "@/src/utils/constants";

export function Positions() {
  const {isConnected} = useIsConnected();
  const {data, isLoading} = usePositions();

  if (isConnected && data?.length === 0) {
    return (
      <section className="flex flex-col gap-6 w-full">
        <p className="text-xl leading-6">Your Positions</p>
        <div className="flex flex-col items-center gap-2 rounded-ten px-4 py-7  bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
          <div className="flex flex-col items-center gap-4">
            <div className="h-11 w-11 flex items-center justify-center rounded-full text-white bg-black bg-cover">
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

  const columns: DataTableColumn<NonNullable<typeof data>[0]>[] = [
    {
      key: "pools",
      header: "Pools",
      align: "left",
      render: (position) => {
        const assetIdA = position.token0Item.token0Position[0].bits;
        const assetIdB = position.token1Item.token1Position[0].bits;
        const isStablePool = position.isStable;

        return (
          <div className="flex flex-col gap-1 min-w-[150px]">
            <CoinPair
              firstCoin={assetIdA}
              secondCoin={assetIdB}
              isStablePool={isStablePool}
              withPoolDescription={true}
            />
          </div>
        );
      },
    },
    {
      key: "apr",
      header: "APR",
      align: "center",
      render: (position) => {
        const assetIdA = position.token0Item.token0Position[0].bits;
        const assetIdB = position.token1Item.token1Position[0].bits;
        const isStablePool = position.isStable;
        const poolId = buildPoolId(assetIdA, assetIdB, isStablePool);
        const poolKey = createPoolKey(poolId);
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
          <div className="text-center mx-auto text-base font-alt">
            {isMatching ? (
              <AprBadge
                aprValue={aprValue}
                poolKey={poolKey}
                tvlValue={tvlValue}
                background="black"
              />
            ) : (
              aprValue
            )}
          </div>
        );
      },
    },
    {
      key: "positionSize",
      header: "Position size",
      align: "center",
      render: (position) => {
        const assetIdA = position.token0Item.token0Position[0].bits;
        const assetIdB = position.token1Item.token1Position[0].bits;
        const amountA = position.token0Item.token0Position[1].toString();
        const amountB = position.token1Item.token1Position[1].toString();
        const isStablePool = position.isStable;
        const priceA = position.token0Item.price;
        const priceB = position.token1Item.price;

        const assetAMetadata = useAssetMetadata(assetIdA);
        const assetBMetadata = useAssetMetadata(assetIdB);

        const coinAAmount = formatUnits(amountA, assetAMetadata.decimals);
        const coinBAmount = formatUnits(amountB, assetBMetadata.decimals);
        const size =
          parseFloat(coinAAmount) * priceA + parseFloat(coinBAmount) * priceB;

        return (
          <div className="text-center text-base font-alt">
            {size ? `$${size.toFixed(2)}` : "checking..."}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (position) => {
        const assetIdA = position.token0Item.token0Position[0].bits;
        const assetIdB = position.token1Item.token1Position[0].bits;
        const isStablePool = position.isStable;
        const poolId = buildPoolId(assetIdA, assetIdB, isStablePool);
        const poolKey = createPoolKey(poolId);
        const path = `/liquidity/position?pool=${poolKey}`;

        return (
          <Link href={path} className="block w-full">
            <Button variant="outline" className="">
              Manage Position
            </Button>
          </Link>
        );
      },
    },
  ];

  return (
    <>
      {isConnected && (
        <section className="flex flex-col gap-6 w-full">
          <p className="text-xl leading-6">Your Positions</p>
          <DataTable
            data={data || []}
            columns={columns}
            loading={isLoading}
            emptyMessage="Your liquidity will appear here"
          />
        </section>
      )}
    </>
  );
}
