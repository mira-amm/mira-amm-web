import {PoolData} from "@/src/hooks/usePoolsData";
import {useIsConnected} from "@fuels/react";
import Link from "next/link";
import SortableColumn from "@/src/components/common/SortableColumn/SortableColumn";
import {Button} from "@/meshwave-ui/Button";
import {DataTable, DataTableColumn} from "@/meshwave-ui/table";
import {cn} from "@/src/utils/cn";
import {usePoolDetails} from "../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";
import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";

const tableBase = "md:table table-fixed desktopOnly p-4";
const thBase =
  "text-base leading-[19px] text-content-tertiary whitespace-nowrap overflow-hidden text-ellipsis";
const tdBase = "";
const trBase = "px-2 py-4 mb-2";
const tableHeaderBase = "";

export function DesktopPools({
  poolsData,
  orderBy,
  handleSort,
  className,
}: {
  poolsData: PoolData[] | undefined;
  orderBy: string;
  handleSort: (key: string) => void;
  className?: string;
}) {
  const {isConnected} = useIsConnected();

  console.log("DesktopPools render:", {poolsData, isConnected});

  if (!poolsData) return <div>No pools data</div>;

  const columns: DataTableColumn<PoolData>[] = [
    {
      key: "pools",
      header: "Pools",
      align: "left",
      render: (poolData) => {
        const {poolKey, isStablePool, poolId} = usePoolDetails(poolData);
        return (
          <div className="text-left w-[230px] truncate">
            <CoinPair
              firstCoin={poolId[0].bits}
              secondCoin={poolId[1].bits}
              isStablePool={isStablePool}
              withPoolDescription
            />
          </div>
        );
      },
    },
    {
      key: "apr",
      header: "APR",
      align: "center",
      render: (poolData) => {
        const {poolKey, aprValue, tvlValue} = usePoolDetails(poolData);
        const {isMatching} = usePoolNameAndMatch(poolKey);
        const tvlActual = parseInt(
          tvlValue?.replace(/[^0-9]+/g, "") || "0",
          10
        );

        return (
          <div className="overflow-visible font-alt">
            {isMatching ? (
              <div className="flex justify-center">
                <AprBadge
                  aprValue={aprValue}
                  poolKey={poolKey}
                  tvlValue={tvlActual}
                  background="black"
                />
              </div>
            ) : (
              aprValue
            )}
          </div>
        );
      },
    },
    {
      key: "volume",
      header: "24H Volume",
      align: "center",
      render: (poolData) => {
        const {volumeValue} = usePoolDetails(poolData);
        return <div className="font-alt">{volumeValue}</div>;
      },
    },
    {
      key: "tvl",
      header: "$ TVL",
      align: "center",
      render: (poolData) => {
        const {tvlValue} = usePoolDetails(poolData);
        return <div className="font-alt">{tvlValue}</div>;
      },
    },
    {
      key: "actions",
      header: isConnected ? (
        <Link href="/liquidity/create-pool">
          <Button>Create Pool</Button>
        </Link>
      ) : (
        ""
      ),
      align: "center",
      render: (poolData) => {
        const {poolKey} = usePoolDetails(poolData);
        return (
          <Link href={`/liquidity/add?pool=${poolKey}`}>
            <Button variant="outline">Add Liquidity</Button>
          </Link>
        );
      },
    },
  ];

  return (
    <div>
      <DataTable
        data={poolsData}
        columns={columns}
        emptyMessage="No pools available"
      />
    </div>
  );
}
