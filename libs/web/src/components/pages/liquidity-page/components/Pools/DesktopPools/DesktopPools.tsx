import {PoolData} from "@/src/hooks/usePoolsData";
import {useIsConnected} from "@fuels/react";
import Link from "next/link";
import {Button} from "@/meshwave-ui/Button";
import {DataTable, DataTableColumn} from "@/meshwave-ui/table";
import {usePoolDetails} from "../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";
import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";

const AprCell = ({poolData}: {poolData: PoolData}) => {
  const {poolKey, aprValue, tvlValue} = usePoolDetails(poolData);
  const {isMatching} = usePoolNameAndMatch(poolKey);
  const tvlActual = parseInt(tvlValue?.replace(/[^0-9]+/g, "") || "0", 10);

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
};

const PoolCell = ({poolData}: {poolData: PoolData}) => {
  const {isStablePool, poolId} = usePoolDetails(poolData);
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
};

const VolumeCell = ({poolData}: {poolData: PoolData}) => {
  const {volumeValue} = usePoolDetails(poolData);
  return <div className="font-alt">{volumeValue}</div>;
};

const TvlCell = ({poolData}: {poolData: PoolData}) => {
  const {tvlValue} = usePoolDetails(poolData);
  return <div className="font-alt">{tvlValue}</div>;
};

const ActionCell = ({poolData}: {poolData: PoolData}) => {
  const {poolKey} = usePoolDetails(poolData);
  return (
    <Link href={`/liquidity/add?pool=${poolKey}&binned=true`}>
      <Button variant="outline">Add Liquidity</Button>
    </Link>
  );
};

export function DesktopPools({
  poolsData,
}: {
  poolsData: PoolData[] | undefined;
  orderBy: string;
  handleSort: (key: string) => void;
  className?: string;
}) {
  const {isConnected} = useIsConnected();

  if (!poolsData) return <div>No pools data</div>;

  const columns: DataTableColumn<PoolData>[] = [
    {
      key: "pools",
      header: "Pools",
      align: "left",
      render: (poolData) => <PoolCell poolData={poolData} />,
    },
    {
      key: "apr",
      header: "APR",
      align: "center",
      render: (poolData) => <AprCell poolData={poolData} />,
    },
    {
      key: "volume",
      header: "24H Volume",
      align: "center",
      render: (poolData) => <VolumeCell poolData={poolData} />,
    },
    {
      key: "tvl",
      header: "$ TVL",
      align: "center",
      render: (poolData) => <TvlCell poolData={poolData} />,
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
      render: (poolData) => <ActionCell poolData={poolData} />,
    },
  ];

  return (
    <div className="hidden md:flex! w-full">
      <DataTable
        data={poolsData}
        columns={columns}
        emptyMessage="No pools available"
        className="w-full"
      />
    </div>
  );
}
