"use client";

import Link from "next/link";
import {useIsConnected} from "@fuels/react";
import {buildPoolId} from "mira-dex-ts";
import {FileText} from "lucide-react";
import {Button} from "@/meshwave-ui/Button";
import {DataTable, DataTableColumn} from "@/meshwave-ui/table";
import {usePositions} from "@/src/hooks";
import {createPoolKey} from "@/src/utils/common";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionSizeCell from "./PositionSizeCell";
import AprCell from "./AprCell";

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
      render: (position) => <AprCell position={position} />,
    },
    {
      key: "positionSize",
      header: "Position size",
      align: "center",
      render: (position) => <PositionSizeCell position={position} />,
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
        const path = getPoolNavigationUrl(poolId, "view");

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
