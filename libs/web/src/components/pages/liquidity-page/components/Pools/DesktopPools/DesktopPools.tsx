import {PoolData} from "@/src/hooks/usePoolsData";
import {DesktopPoolRow} from "./DesktopPoolRow";
import {useIsConnected} from "@fuels/react";
import Link from "next/link";
import SortableColumn from "@/src/components/common/SortableColumn/SortableColumn";
import {Button} from "@/meshwave-ui/Button";
import {Table} from "../../Table";
import {cn} from "@/src/utils/cn";

export function DesktopPools({poolsData}: {poolsData: PoolData[] | undefined}) {
  const {isConnected} = useIsConnected();

  if (!poolsData) return null;

  return (
    <Table
      headers={["Pools", "APR", "24H Volume", "$ TVL", ""]}
      LastHeaderCellAction={
        isConnected && (
          <Link href="/liquidity/create-pool">
            <Button>Create Pool</Button>
          </Link>
        )
      }
      rows={poolsData.map((poolData) => (
        <DesktopPoolRow key={poolData.id} poolData={poolData} />
      ))}
      isLoading={false}
      leaveLastHeaderCellEmpty={false}
      title=""
    />
  );
}
